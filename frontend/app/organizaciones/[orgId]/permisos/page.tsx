'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { OrgGate, OrgHeader, useOrgId } from '@/components/OrgShell'
import { Field, ListRow, Notice, SubmitButton } from '@/components/ui'
import { ApiError, toSpanish } from '@/lib/errors'
import {
  interiorsApi,
  permitsApi,
  type Interior,
  type Org,
  type Permit,
  type PermitEntryMode,
} from '@/lib/api'
import {
  ENTRY_MODE_OPTIONS,
  PURPOSE_OPTIONS,
  WEEK_DAYS,
  checkSchedule,
  checkWindow,
  defaultWindow,
  formatWindow,
  stateLabel,
  toIsoInstant,
} from '@/lib/permits'
import { checkRequiredText } from '@/lib/validate'
import { es } from '@/lib/strings'

/**
 * Entry permits: the list, and the form that creates one.
 *
 * Who sees what is decided by the API, not here — an administrator gets the
 * whole organization, a responsable gets only the interiors they are in charge
 * of, and security staff are refused. The screen mirrors that rather than
 * deciding it, so there is one rule and it lives on the server.
 */
export default function PermitsPage() {
  const orgId = useOrgId()
  return <OrgGate orgId={orgId}>{(org) => <PermitsScreen org={org} />}</OrgGate>
}

function PermitsScreen({ org }: { org: Org }) {
  const router = useRouter()
  const { user } = useAuth()

  const [permits, setPermits] = useState<Permit[] | null>(null)
  const [interiors, setInteriors] = useState<Interior[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  /** Set when the API refuses the whole screen — security staff, today. */
  const [denied, setDenied] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [interiorId, setInteriorId] = useState('')
  const [visitorName, setVisitorName] = useState('')
  const [purpose, setPurpose] = useState<(typeof PURPOSE_OPTIONS)[number]['value']>('visitor')
  // A permit is for a visit unless the resident says otherwise (Decision 014).
  const [entryMode, setEntryMode] = useState<PermitEntryMode>('single')
  const [validFrom, setValidFrom] = useState(() => defaultWindow().from)
  const [validTo, setValidTo] = useState(() => defaultWindow().to)
  /**
   * Decision 016. Off by default: most permits are for one visit, and a
   * question nobody needs is a question everybody has to read.
   */
  const [hasSchedule, setHasSchedule] = useState(false)
  const [scheduleDays, setScheduleDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [scheduleFrom, setScheduleFrom] = useState('07:00')
  const [scheduleTo, setScheduleTo] = useState('16:00')

  const [nameError, setNameError] = useState<string | undefined>()
  const [interiorError, setInteriorError] = useState<string | undefined>()
  const [windowError, setWindowError] = useState<string | undefined>()
  const [scheduleError, setScheduleError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(() => {
    setLoadError(null)
    setDenied(false)

    permitsApi
      .list(org.id)
      .then((result) => setPermits(result.authorizations))
      .catch((cause) => {
        if (cause instanceof ApiError && cause.status === 403) setDenied(true)
        else setLoadError(toSpanish(cause))
      })

    interiorsApi
      .list(org.id)
      .then((result) => setInteriors(result.interiors))
      // The list of permits is the point of this screen. If the interiors
      // cannot be read, the form is unavailable but the list still works.
      .catch(() => setInteriors([]))
  }, [org.id])

  useEffect(load, [load])

  /**
   * The interiors this person may issue for. An administrator may use any; a
   * responsable only their own. Matching the server's rule here means the
   * dropdown never offers a choice that will be refused.
   */
  const mine = useMemo(() => {
    if (!interiors) return []
    if (org.role === 'admin') return interiors
    return interiors.filter((interior) => interior.responsable_user_id === user?.uid)
  }, [interiors, org.role, user?.uid])

  useEffect(() => {
    if (mine.length === 1 && interiorId === '') setInteriorId(mine[0]!.id)
  }, [mine, interiorId])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()

    const nameProblem = checkRequiredText(visitorName, es.validation.visitorNameRequired, 120)
    const interiorProblem = interiorId === '' ? es.validation.interiorRequired : undefined
    const windowProblem = checkWindow(validFrom, validTo)
    const scheduleProblem = hasSchedule
      ? checkSchedule(scheduleDays, scheduleFrom, scheduleTo)
      : undefined

    setNameError(nameProblem)
    setInteriorError(interiorProblem)
    setWindowError(windowProblem)
    setScheduleError(scheduleProblem)
    if (nameProblem || interiorProblem || windowProblem || scheduleProblem) return

    const from = toIsoInstant(validFrom)
    const to = toIsoInstant(validTo)
    if (!from || !to) return

    setCreating(true)
    setFormError(null)
    try {
      const created = await permitsApi.create(org.id, {
        interior_id: interiorId,
        visitor_name: visitorName,
        purpose,
        entry_mode: entryMode,
        valid_from: from,
        valid_to: to,
        // Left out entirely when the permit works at any hour, so the request
        // says nothing rather than saying "no restriction" in a second way.
        ...(hasSchedule
          ? { schedule: { days: scheduleDays, from: scheduleFrom, to: scheduleTo } }
          : {}),
      })
      // Straight to the code: the reason someone creates a permit is to send
      // it to the person who is coming. Making them find it in a list first
      // would be an extra step on the one path everybody takes.
      router.push(`/organizaciones/${org.id}/permisos/${created.id}`)
    } catch (cause) {
      setFormError(toSpanish(cause))
      setCreating(false)
    }
  }

  function resetForm() {
    setShowForm(false)
    setFormError(null)
    setNameError(undefined)
    setInteriorError(undefined)
    setWindowError(undefined)
    setScheduleError(undefined)
    setHasSchedule(false)
    setVisitorName('')
    const fresh = defaultWindow()
    setValidFrom(fresh.from)
    setValidTo(fresh.to)
  }

  return (
    <>
      <OrgHeader org={org} current="permits" />

      <section className="rounded-2xl bg-[var(--color-surface)] p-6 ring-1 ring-[var(--color-line)]/60">
        <h2 className="text-base font-semibold">{es.permits.title}</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{es.permits.subtitle}</p>

        <div className="mt-5">
          {denied ? (
            <p className="text-sm text-[var(--color-ink-faint)]">{es.errors.notAllowed}</p>
          ) : loadError ? (
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
          ) : !permits ? (
            <p className="text-sm text-[var(--color-ink-soft)]">{es.common.loading}</p>
          ) : permits.length === 0 ? (
            <div>
              <p className="text-sm text-[var(--color-ink-soft)]">{es.permits.empty}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-faint)]">{es.permits.emptyHint}</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-line)]/60">
              {permits.map((permit) => (
                <ListRow
                  key={permit.id}
                  title={permit.visitor_name}
                  subtitle={`${es.permits.forInterior} ${permit.interior_number} · ${formatWindow(
                    permit.valid_from,
                    permit.valid_to,
                  )}`}
                  badge={stateLabel(permit.state)}
                  dimmed={
                    permit.state === 'expired' ||
                    permit.state === 'revoked' ||
                    permit.state === 'used'
                  }
                  actions={[
                    {
                      label: es.permits.open,
                      onSelect: () =>
                        router.push(`/organizaciones/${org.id}/permisos/${permit.id}`),
                    },
                  ]}
                />
              ))}
            </ul>
          )}
        </div>

        {!denied && permits && interiors ? (
          <div className="mt-5 border-t border-[var(--color-line)]/60 pt-5">
            {mine.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-faint)]">
                {org.role === 'admin' ? es.permits.needsInterior : es.permits.emptyNoInterior}
              </p>
            ) : showForm ? (
              <form onSubmit={handleCreate} noValidate className="space-y-4">
                {formError ? <Notice kind="error">{formError}</Notice> : null}

                <Field
                  label={es.permits.visitorName}
                  placeholder={es.permits.visitorNamePlaceholder}
                  autoFocus
                  value={visitorName}
                  disabled={creating}
                  error={nameError}
                  hint={es.permits.visitorNameHint}
                  onChange={(event) => setVisitorName(event.target.value)}
                />

                <Select
                  label={es.permits.interior}
                  value={interiorId}
                  disabled={creating}
                  error={interiorError}
                  onChange={(value) => setInteriorId(value)}
                  options={[
                    { value: '', label: es.permits.interior },
                    ...mine.map((interior) => ({
                      value: interior.id,
                      label: interior.name
                        ? `${interior.number} · ${interior.name}`
                        : interior.number,
                    })),
                  ]}
                />

                <Select
                  label={es.permits.purpose}
                  value={purpose}
                  disabled={creating}
                  onChange={(value) =>
                    setPurpose(value as (typeof PURPOSE_OPTIONS)[number]['value'])
                  }
                  options={PURPOSE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                />

                {/*
                  The first question on this form that changes what a permit
                  *is*, so the consequence of each answer is spelled out under
                  it rather than left to the label — the same shape the people
                  screen uses for choosing somebody's role.
                */}
                <div>
                  <Select
                    label={es.permits.entryMode}
                    value={entryMode}
                    disabled={creating}
                    onChange={(value) => setEntryMode(value as PermitEntryMode)}
                    options={ENTRY_MODE_OPTIONS.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                  />
                  <p className="mt-1.5 text-sm text-[var(--color-ink-faint)]">
                    {ENTRY_MODE_OPTIONS.find((option) => option.value === entryMode)?.hint}
                  </p>
                </div>

                {/*
                  Decision 016. Asked after "how many times" and before the
                  dates, because the answer changes what the dates mean: a
                  year-long permit is a year-long open door until this says
                  otherwise.
                */}
                <div>
                  <Select
                    label={es.permits.schedule}
                    value={hasSchedule ? 'fixed' : 'any'}
                    disabled={creating}
                    onChange={(value) => {
                      setHasSchedule(value === 'fixed')
                      setScheduleError(undefined)
                    }}
                    options={[
                      { value: 'any', label: es.permits.scheduleAny },
                      { value: 'fixed', label: es.permits.scheduleFixed },
                    ]}
                  />
                  <p className="mt-1.5 text-sm text-[var(--color-ink-faint)]">
                    {hasSchedule ? es.permits.scheduleFixedHint : es.permits.scheduleAnyHint}
                  </p>
                </div>

                {hasSchedule ? (
                  <div className="rounded-lg border border-[var(--color-line)] p-4">
                    <fieldset>
                      <legend className="text-sm font-medium text-[var(--color-ink)]">
                        {es.permits.scheduleDays}
                      </legend>
                      {/*
                        Buttons rather than a multi-select: a guard's building
                        is chosen by a resident on a phone, with a thumb. Each
                        is a real toggle, so a screen reader says whether the
                        day is on.
                      */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {WEEK_DAYS.map((day) => {
                          const on = scheduleDays.includes(day.value)
                          return (
                            <button
                              key={day.value}
                              type="button"
                              disabled={creating}
                              aria-pressed={on}
                              aria-label={day.long}
                              onClick={() => {
                                setScheduleError(undefined)
                                setScheduleDays((current) =>
                                  current.includes(day.value)
                                    ? current.filter((one) => one !== day.value)
                                    : [...current, day.value].sort(),
                                )
                              }}
                              className={[
                                'h-11 min-w-11 rounded-lg border px-3 text-sm capitalize',
                                on
                                  ? 'border-[var(--color-brand)] bg-[var(--color-brand)] text-white'
                                  : 'border-[var(--color-line)] bg-white text-[var(--color-ink)]',
                              ].join(' ')}
                            >
                              {day.short}
                            </button>
                          )
                        })}
                      </div>
                    </fieldset>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <Field
                        label={es.permits.scheduleFrom}
                        type="time"
                        value={scheduleFrom}
                        disabled={creating}
                        onChange={(event) => {
                          setScheduleError(undefined)
                          setScheduleFrom(event.target.value)
                        }}
                      />
                      <Field
                        label={es.permits.scheduleTo}
                        type="time"
                        value={scheduleTo}
                        disabled={creating}
                        error={scheduleError}
                        hint={es.permits.scheduleZoneNote}
                        onChange={(event) => {
                          setScheduleError(undefined)
                          setScheduleTo(event.target.value)
                        }}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={es.permits.validFrom}
                    type="datetime-local"
                    value={validFrom}
                    disabled={creating}
                    onChange={(event) => setValidFrom(event.target.value)}
                  />
                  <Field
                    label={es.permits.validTo}
                    type="datetime-local"
                    value={validTo}
                    disabled={creating}
                    error={windowError}
                    hint={es.permits.validHint}
                    onChange={(event) => setValidTo(event.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row-reverse">
                  <SubmitButton busy={creating}>
                    {creating ? es.permits.adding : es.permits.add}
                  </SubmitButton>
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={creating}
                    className="h-11 rounded-lg border border-[var(--color-line)] bg-white px-4 text-sm font-medium disabled:opacity-60 sm:w-40"
                  >
                    {es.actions.cancel}
                  </button>
                </div>
              </form>
            ) : org.approved === false ? (
              /*
                Decision 018. A permit holds a real visitor's name, so it waits
                for the same approval the people screen waits for — and says so
                in the same words, because it is the same reason.
              */
              <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)] px-4 py-3">
                <p className="text-sm font-medium text-[var(--color-ink)]">
                  {es.members.waitingApprovalTitle}
                </p>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                  {es.permits.waitingApprovalBody}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="flex h-11 w-full items-center justify-center rounded-lg bg-[var(--color-brand)] px-4 text-base font-medium text-white hover:bg-[var(--color-brand-dark)]"
              >
                {permits.length === 0 ? es.permits.addFirst : es.permits.add}
              </button>
            )}
          </div>
        ) : null}
      </section>
    </>
  )
}

/**
 * A labelled dropdown, matching `Field`'s shape and accessibility rules: a
 * real label tied to the control, and an error linked with aria-describedby.
 *
 * Local to this screen rather than added to `ui.tsx`: the shared set is small
 * on purpose (`design.md`), and the setup screens each build their own select
 * the same way today. If a third screen needs one, that is the moment to
 * promote it.
 */
function Select({
  label,
  value,
  options,
  onChange,
  disabled,
  error,
}: {
  label: string
  value: string
  options: ReadonlyArray<{ value: string; label: string }>
  onChange: (value: string) => void
  disabled?: boolean
  error?: string
}) {
  const id = `select-${label.replace(/\s+/g, '-').toLowerCase()}`
  const errorId = `${id}-error`

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--color-ink)]">
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={[
          'mt-1.5 block h-11 w-full rounded-lg border bg-white px-3 text-base',
          'text-[var(--color-ink)] disabled:cursor-not-allowed disabled:bg-[var(--color-canvas)]',
          error
            ? 'border-[var(--color-danger)]'
            : 'border-[var(--color-line)] focus:border-[var(--color-brand)]',
        ].join(' ')}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  )
}
