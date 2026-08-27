'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { OrgGate, OrgHeader, isAdmin, useOrgId } from '@/components/OrgShell'
import {
  ConfirmDialog,
  Field,
  ListRow,
  Notice,
  SubmitButton,
  TextLink,
  UsageMeter,
} from '@/components/ui'
import { ApiError, toSpanish } from '@/lib/errors'
import { interiorsApi, locationsApi, type Interior, type Location, type Org } from '@/lib/api'
import { checkRequiredText } from '@/lib/validate'
import { es } from '@/lib/strings'

/**
 * The apartments, warehouse bays and zones inside a site, each with the person
 * in charge of it.
 *
 * The free plan allows ten of these across the whole organization, not ten per
 * site. Only the person's name is collected — no phone, no email, no document
 * number. That restraint is deliberate: "apartment 302 is Juan García" already
 * says where a named person lives, and anything more would say far too much.
 */
export default function InteriorsPage() {
  const orgId = useOrgId()
  return (
    <OrgGate orgId={orgId}>
      {(org) => <InteriorsScreen org={org} />}
    </OrgGate>
  )
}

type Pending = { kind: 'retire' | 'reactivate' | 'delete'; interior: Interior } | null

function InteriorsScreen({ org }: { org: Org }) {
  const admin = isAdmin(org)

  const [interiors, setInteriors] = useState<Interior[] | null>(null)
  const [locations, setLocations] = useState<Location[] | null>(null)
  const [usage, setUsage] = useState({
    used: org.counts.interiors,
    limit: org.limits.max_interiors,
  })
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  const [locationId, setLocationId] = useState('')
  const [number, setNumber] = useState('')
  const [name, setName] = useState('')
  const [responsable, setResponsable] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [pending, setPending] = useState<Pending>(null)
  const [pendingBusy, setPendingBusy] = useState(false)
  const [pendingError, setPendingError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoadError(null)
    Promise.all([interiorsApi.list(org.id), locationsApi.list(org.id)])
      .then(([interiorResult, locationResult]) => {
        setInteriors(interiorResult.interiors)
        setUsage({
          used: interiorResult.usage.interiors,
          limit: interiorResult.usage.max_interiors,
        })
        setLocations(locationResult.locations)
      })
      .catch((error) => setLoadError(toSpanish(error)))
  }, [org.id])

  useEffect(load, [load])

  const full = usage.used >= usage.limit
  const usableLocations = (locations ?? []).filter((location) => location.enabled)
  const visible = filter
    ? (interiors ?? []).filter((interior) => interior.location_id === filter)
    : interiors ?? []

  function locationName(id: string): string {
    return locations?.find((location) => location.id === id)?.name ?? ''
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault()

    const chosen = locationId || usableLocations[0]?.id || ''
    const errors = {
      locationId: chosen ? undefined : es.validation.locationRequired,
      number: checkRequiredText(number, es.validation.numberRequired, 40),
      responsable: checkRequiredText(responsable, es.validation.responsableRequired, 120),
    }
    setFieldErrors(errors)
    if (Object.values(errors).some(Boolean)) return

    setAdding(true)
    setFormError(null)
    try {
      await interiorsApi.create(org.id, {
        location_id: chosen,
        number,
        name,
        responsable_name: responsable,
      })
      setNumber('')
      setName('')
      setResponsable('')
      setShowForm(false)
      // Re-read rather than counting locally: the limit is enforced inside a
      // transaction, so the server is the only reliable source of the count.
      load()
    } catch (cause) {
      // The only conflict possible when adding is a number already used in
      // that site — the API enforces it in the same transaction as the quota.
      const taken = cause instanceof ApiError && cause.code === 'conflict'
      setFormError(taken ? es.interiors.numberTaken : toSpanish(cause))
    } finally {
      setAdding(false)
    }
  }

  async function runPending() {
    if (!pending) return
    setPendingBusy(true)
    setPendingError(null)
    try {
      if (pending.kind === 'delete') {
        await interiorsApi.remove(org.id, pending.interior.id)
      } else {
        await interiorsApi.update(org.id, pending.interior.id, {
          enabled: pending.kind === 'reactivate',
        })
      }
      setPending(null)
      load()
    } catch (cause) {
      const conflict = cause instanceof ApiError && cause.code === 'conflict'
      setPendingError(conflict ? es.interiors.deleteConflict : toSpanish(cause))
    } finally {
      setPendingBusy(false)
    }
  }

  return (
    <>
      <OrgHeader org={org} current="interiors" />

      <section className="rounded-2xl bg-[var(--color-surface)] p-6 ring-1 ring-[var(--color-line)]/60">
        <h2 className="text-base font-semibold">{es.interiors.title}</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{es.interiors.subtitle}</p>

        <div className="mt-5">
          <UsageMeter
            label={es.usage.interiorsLabel}
            used={usage.used}
            limit={usage.limit}
            note={es.usage.interiorsNote}
          />
        </div>

        {!admin ? (
          <p className="mt-4 text-sm text-[var(--color-ink-faint)]">{es.org.adminOnlyNote}</p>
        ) : null}

        {locations && locations.length > 1 ? (
          <div className="mt-5">
            <label htmlFor="filter" className="block text-sm font-medium text-[var(--color-ink)]">
              {es.interiors.location}
            </label>
            <select
              id="filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="mt-1.5 block h-11 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 text-base"
            >
              <option value="">{es.interiors.filterAll}</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="mt-5">
          {loadError ? (
            <div className="space-y-3">
              <Notice kind="error">{loadError}</Notice>
              <button
                type="button"
                onClick={load}
                className="h-11 rounded-lg border border-[var(--color-line)] bg-white px-4 text-sm font-medium"
              >
                {es.actions.retry}
              </button>
            </div>
          ) : !interiors || !locations ? (
            <p className="text-sm text-[var(--color-ink-soft)]">{es.common.loading}</p>
          ) : usableLocations.length === 0 ? (
            <div>
              <p className="text-sm text-[var(--color-ink-soft)]">{es.interiors.needsLocation}</p>
              <p className="mt-2">
                <TextLink href={`/organizaciones/${org.id}/sedes`}>
                  {es.interiors.goToLocations}
                </TextLink>
              </p>
            </div>
          ) : visible.length === 0 ? (
            <div>
              <p className="text-sm text-[var(--color-ink-soft)]">{es.interiors.empty}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-faint)]">{es.interiors.emptyHint}</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-line)]/60">
              {visible.map((interior) => (
                <ListRow
                  key={interior.id}
                  title={interior.name ? `${interior.number} · ${interior.name}` : interior.number}
                  subtitle={`${es.interiors.responsable}: ${interior.responsable_name} · ${locationName(
                    interior.location_id,
                  )}`}
                  badge={interior.enabled ? undefined : es.interiors.retired}
                  dimmed={!interior.enabled}
                  actions={
                    admin
                      ? [
                          interior.enabled
                            ? {
                                label: es.interiors.retire,
                                onSelect: () => setPending({ kind: 'retire', interior }),
                              }
                            : {
                                label: es.interiors.reactivate,
                                onSelect: () => setPending({ kind: 'reactivate', interior }),
                              },
                          {
                            label: es.actions.delete,
                            danger: true,
                            onSelect: () => setPending({ kind: 'delete', interior }),
                          },
                        ]
                      : []
                  }
                />
              ))}
            </ul>
          )}
        </div>

        {admin && interiors && usableLocations.length > 0 && !full ? (
          <div className="mt-5 border-t border-[var(--color-line)]/60 pt-5">
            {showForm ? (
              <form onSubmit={handleAdd} noValidate className="space-y-4">
                {formError ? <Notice kind="error">{formError}</Notice> : null}

                {usableLocations.length > 1 ? (
                  <div>
                    <label
                      htmlFor="interior-location"
                      className="block text-sm font-medium text-[var(--color-ink)]"
                    >
                      {es.interiors.location}
                    </label>
                    <select
                      id="interior-location"
                      value={locationId || usableLocations[0]?.id || ''}
                      disabled={adding}
                      onChange={(event) => setLocationId(event.target.value)}
                      className="mt-1.5 block h-11 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 text-base disabled:bg-[var(--color-canvas)]"
                    >
                      {usableLocations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <Field
                  label={es.interiors.number}
                  placeholder={es.interiors.numberPlaceholder}
                  autoFocus
                  value={number}
                  disabled={adding}
                  error={fieldErrors.number}
                  onChange={(event) => setNumber(event.target.value)}
                />

                <Field
                  label={es.interiors.name}
                  placeholder={es.interiors.namePlaceholder}
                  value={name}
                  disabled={adding}
                  onChange={(event) => setName(event.target.value)}
                />

                <Field
                  label={es.interiors.responsable}
                  placeholder={es.interiors.responsablePlaceholder}
                  hint={es.interiors.responsableHint}
                  // A shared front-desk computer must not build a browsing
                  // history of residents' names in its autofill suggestions.
                  autoComplete="off"
                  value={responsable}
                  disabled={adding}
                  error={fieldErrors.responsable}
                  onChange={(event) => setResponsable(event.target.value)}
                />

                <div className="flex flex-col gap-2 sm:flex-row-reverse">
                  <SubmitButton busy={adding}>
                    {adding ? es.interiors.adding : es.interiors.add}
                  </SubmitButton>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setFormError(null)
                      setFieldErrors({})
                    }}
                    disabled={adding}
                    className="h-11 rounded-lg border border-[var(--color-line)] bg-white px-4 text-sm font-medium disabled:opacity-60 sm:w-40"
                  >
                    {es.actions.cancel}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="flex h-11 w-full items-center justify-center rounded-lg bg-[var(--color-brand)] px-4 text-base font-medium text-white hover:bg-[var(--color-brand-dark)]"
              >
                {(interiors?.length ?? 0) === 0 ? es.interiors.addFirst : es.interiors.add}
              </button>
            )}
          </div>
        ) : null}
      </section>

      <ConfirmDialog
        open={pending !== null}
        title={
          pending?.kind === 'delete'
            ? es.interiors.deleteConfirmTitle
            : pending?.kind === 'reactivate'
              ? es.interiors.reactivateConfirmTitle
              : es.interiors.retireConfirmTitle
        }
        body={
          pending?.kind === 'delete'
            ? es.interiors.deleteConfirmBody
            : pending?.kind === 'reactivate'
              ? es.interiors.reactivateConfirmBody
              : es.interiors.retireConfirmBody
        }
        confirmLabel={
          pending?.kind === 'delete'
            ? es.actions.delete
            : pending?.kind === 'reactivate'
              ? es.interiors.reactivate
              : es.interiors.retire
        }
        busyLabel={pending?.kind === 'delete' ? es.actions.deleting : es.actions.saving}
        danger={pending?.kind === 'delete'}
        busy={pendingBusy}
        error={pendingError}
        onConfirm={runPending}
        onCancel={() => {
          setPending(null)
          setPendingError(null)
        }}
      />
    </>
  )
}
