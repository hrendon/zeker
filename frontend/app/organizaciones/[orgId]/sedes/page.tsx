'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { OrgGate, OrgHeader, isAdmin, useOrgId } from '@/components/OrgShell'
import { ConfirmDialog, Field, ListRow, Notice, SubmitButton, UsageMeter } from '@/components/ui'
import { ApiError, toSpanish } from '@/lib/errors'
import { locationsApi, type Location, type Org } from '@/lib/api'
import { checkRequiredText } from '@/lib/validate'
import { es } from '@/lib/strings'

/**
 * The sites an organization controls: a building, a campus, a gate.
 *
 * Two actions here look alike and are not: retiring keeps the site and its
 * history and keeps using a plan slot, deleting frees the slot and cannot be
 * undone. The confirmation wording is what separates them.
 */
export default function LocationsPage() {
  const orgId = useOrgId()
  return (
    <OrgGate orgId={orgId}>
      {(org) => <LocationsScreen org={org} />}
    </OrgGate>
  )
}

type Pending =
  | { kind: 'retire' | 'reactivate' | 'delete'; location: Location }
  | null

function LocationsScreen({ org }: { org: Org }) {
  const admin = isAdmin(org)

  const [locations, setLocations] = useState<Location[] | null>(null)
  const [usage, setUsage] = useState({ used: org.counts.locations, limit: org.limits.max_locations })
  const [loadError, setLoadError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [nameError, setNameError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [pending, setPending] = useState<Pending>(null)
  const [pendingBusy, setPendingBusy] = useState(false)
  const [pendingError, setPendingError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoadError(null)
    locationsApi
      .list(org.id)
      .then((result) => {
        setLocations(result.locations)
        setUsage({ used: result.usage.locations, limit: result.usage.max_locations })
      })
      .catch((error) => setLoadError(toSpanish(error)))
  }, [org.id])

  useEffect(load, [load])

  const full = usage.used >= usage.limit

  async function handleAdd(event: FormEvent) {
    event.preventDefault()

    const error = checkRequiredText(name, es.validation.locationNameRequired, 120)
    setNameError(error)
    if (error) return

    setAdding(true)
    setFormError(null)
    try {
      await locationsApi.create(org.id, { name, description })
      setName('')
      setDescription('')
      setShowForm(false)
      // The server is the authority on counts: two admins can act at the same
      // instant, so re-read rather than adding one to a local number.
      load()
    } catch (cause) {
      setFormError(toSpanish(cause))
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
        await locationsApi.remove(org.id, pending.location.id)
      } else {
        await locationsApi.update(org.id, pending.location.id, {
          enabled: pending.kind === 'reactivate',
        })
      }
      setPending(null)
      load()
    } catch (cause) {
      // Deleting is refused while the site still has interiors or a live
      // permit. The API says which in English, which we never show, so here —
      // where the context is known — the message names both and says what to
      // do about it. Shown in the dialog, where the person is looking.
      const conflict = cause instanceof ApiError && cause.code === 'conflict'
      setPendingError(conflict ? es.locations.deleteConflict : toSpanish(cause))
    } finally {
      setPendingBusy(false)
    }
  }

  return (
    <>
      <OrgHeader org={org} current="locations" />

      <section className="rounded-2xl bg-[var(--color-surface)] p-6 ring-1 ring-[var(--color-line)]/60">
        <h2 className="text-base font-semibold">{es.locations.title}</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{es.locations.subtitle}</p>

        <div className="mt-5">
          <UsageMeter label={es.usage.locationsLabel} used={usage.used} limit={usage.limit} />
        </div>

        {!admin ? (
          <p className="mt-4 text-sm text-[var(--color-ink-faint)]">{es.org.adminOnlyNote}</p>
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
          ) : !locations ? (
            <p className="text-sm text-[var(--color-ink-soft)]">{es.common.loading}</p>
          ) : locations.length === 0 ? (
            <div>
              <p className="text-sm text-[var(--color-ink-soft)]">{es.locations.empty}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-faint)]">{es.locations.emptyHint}</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-line)]/60">
              {locations.map((location) => (
                <ListRow
                  key={location.id}
                  title={location.name}
                  subtitle={location.description || undefined}
                  badge={location.enabled ? undefined : es.locations.retired}
                  dimmed={!location.enabled}
                  actions={
                    admin
                      ? [
                          location.enabled
                            ? {
                                label: es.locations.retire,
                                onSelect: () => setPending({ kind: 'retire', location }),
                              }
                            : {
                                label: es.locations.reactivate,
                                onSelect: () => setPending({ kind: 'reactivate', location }),
                              },
                          {
                            label: es.actions.delete,
                            danger: true,
                            onSelect: () => setPending({ kind: 'delete', location }),
                          },
                        ]
                      : []
                  }
                />
              ))}
            </ul>
          )}
        </div>

        {admin && locations && !full ? (
          <div className="mt-5 border-t border-[var(--color-line)]/60 pt-5">
            {showForm ? (
              <form onSubmit={handleAdd} noValidate className="space-y-4">
                {formError ? <Notice kind="error">{formError}</Notice> : null}

                <Field
                  label={es.locations.name}
                  placeholder={es.locations.namePlaceholder}
                  autoFocus
                  value={name}
                  disabled={adding}
                  error={nameError}
                  onChange={(event) => setName(event.target.value)}
                />

                <Field
                  label={es.locations.description}
                  value={description}
                  disabled={adding}
                  onChange={(event) => setDescription(event.target.value)}
                />

                <div className="flex flex-col gap-2 sm:flex-row-reverse">
                  <SubmitButton busy={adding}>
                    {adding ? es.locations.adding : es.locations.add}
                  </SubmitButton>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setFormError(null)
                      setNameError(undefined)
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
                {locations.length === 0 ? es.locations.addFirst : es.locations.add}
              </button>
            )}
          </div>
        ) : null}
      </section>

      <ConfirmDialog
        open={pending !== null}
        title={
          pending?.kind === 'delete'
            ? es.locations.deleteConfirmTitle
            : pending?.kind === 'reactivate'
              ? es.locations.reactivateConfirmTitle
              : es.locations.retireConfirmTitle
        }
        body={
          pending?.kind === 'delete'
            ? es.locations.deleteConfirmBody
            : pending?.kind === 'reactivate'
              ? es.locations.reactivateConfirmBody
              : es.locations.retireConfirmBody
        }
        confirmLabel={
          pending?.kind === 'delete'
            ? es.actions.delete
            : pending?.kind === 'reactivate'
              ? es.locations.reactivate
              : es.locations.retire
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
