'use client'

import { Suspense, useCallback, useEffect, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { OrgGate, OrgHeader, useOrgId } from '@/components/OrgShell'
import { QrScanner } from '@/components/QrScanner'
import { Field, FullPageMessage, Notice, SubmitButton } from '@/components/ui'
import { toSpanish } from '@/lib/errors'
import {
  checksApi,
  locationsApi,
  type CheckNote,
  type CheckResult,
  type Location,
  type Org,
} from '@/lib/api'
import { cleanCode, denyMessage, groupCode, noteLabel, notesFor } from '@/lib/gate'
import { formatMoment, formatSchedule, purposeLabel } from '@/lib/permits'
import { es } from '@/lib/strings'

/**
 * The gate: a guard checks one permit, at one entrance.
 *
 * This is the only screen security staff can open, and it is deliberately the
 * whole of what they can do. A guard answers a code that is put in front of
 * them; a guard who could list a building's permits would know who is expected
 * where, all day (Decision 007).
 *
 * **Which entrance the guard is standing at lives in the web address.** A
 * permit is valid at one entrance, so the answer depends on where the guard
 * is. Keeping it in the address and nowhere else follows the same rule as the
 * organization itself: nothing about a customer is kept in browser storage,
 * where it could survive a switch and be painted onto the next customer's
 * screen. It also means a guard can bookmark their own gate.
 *
 * **A refusal is not an error.** The API answers "denied" with a normal
 * success, so anything that throws here is a fault of ours and is shown
 * differently — a guard must be able to tell "this visitor may not enter" from
 * "our system is broken".
 */
export default function GatePage() {
  return (
    <Suspense fallback={<FullPageMessage>{es.common.loading}</FullPageMessage>}>
      <GateRoute />
    </Suspense>
  )
}

function GateRoute() {
  const orgId = useOrgId()
  return <OrgGate orgId={orgId}>{(org) => <GateScreen org={org} />}</OrgGate>
}

/** The query key that holds the entrance. Spanish, like every other address. */
const ENTRANCE_PARAM = 'entrada'

function GateScreen({ org }: { org: Org }) {
  const router = useRouter()
  const params = useSearchParams()
  const entranceId = params.get(ENTRANCE_PARAM) ?? ''

  const [locations, setLocations] = useState<Location[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | undefined>()
  const [checking, setChecking] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [answer, setAnswer] = useState<CheckResult | null>(null)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    setLoadError(null)
    locationsApi
      .list(org.id)
      // A retired entrance is one the administrator has taken out of service.
      // The API refuses a check there, so it is not offered here either.
      .then((result) => setLocations(result.locations.filter((one) => one.enabled)))
      .catch((cause) => setLoadError(toSpanish(cause)))
  }, [org.id])

  const chooseEntrance = useCallback(
    (id: string) => {
      const query = new URLSearchParams(params.toString())
      if (id) query.set(ENTRANCE_PARAM, id)
      else query.delete(ENTRANCE_PARAM)
      router.replace(`/organizaciones/${org.id}/porteria?${query.toString()}`)
    },
    [org.id, params, router],
  )

  // One entrance is the common case — a small building has a single gate — and
  // making the guard choose from a list of one is a tap for nothing.
  useEffect(() => {
    if (!entranceId && locations?.length === 1) chooseEntrance(locations[0]!.id)
  }, [entranceId, locations, chooseEntrance])

  const entrance = locations?.find((one) => one.id === entranceId)

  const submit = useCallback(
    async (raw: string) => {
      const clean = cleanCode(raw)
      if (!clean) {
        setCodeError(es.gate.codeRequired)
        return
      }

      setCodeError(undefined)
      setFailure(null)
      setChecking(true)
      try {
        setAnswer(await checksApi.check(org.id, { location_id: entranceId, code: clean }))
      } catch (cause) {
        // Our fault, not the visitor's. Never shown as a refusal.
        setFailure(toSpanish(cause))
        setAnswer(null)
      } finally {
        setChecking(false)
      }
    },
    [org.id, entranceId],
  )

  const onScanned = useCallback(
    (text: string) => {
      setScanning(false)
      setCode(text)
      void submit(text)
    },
    [submit],
  )

  function reset() {
    setAnswer(null)
    setFailure(null)
    setCode('')
    setCodeError(undefined)
  }

  if (loadError) {
    return (
      <>
        <OrgHeader org={org} current="gate" />
        <Notice kind="error">{loadError}</Notice>
      </>
    )
  }

  if (!locations) {
    return (
      <>
        <OrgHeader org={org} current="gate" />
        <p className="text-sm text-[var(--color-ink-soft)]">{es.common.loading}</p>
      </>
    )
  }

  return (
    <>
      <OrgHeader org={org} current="gate" />

      <h1 className="text-2xl font-semibold tracking-tight">{es.gate.title}</h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{es.gate.subtitle}</p>

      {locations.length === 0 ? (
        <div className="mt-6">
          <Notice kind="error">{es.gate.entranceNone}</Notice>
        </div>
      ) : !entrance ? (
        <EntrancePicker locations={locations} onChoose={chooseEntrance} />
      ) : (
        <div className="mt-6 space-y-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm">
              <span className="text-[var(--color-ink-soft)]">{es.gate.entrance}: </span>
              <span className="font-medium">{entrance.name}</span>
            </p>
            {locations.length > 1 ? (
              <button
                type="button"
                onClick={() => {
                  reset()
                  chooseEntrance('')
                }}
                className="text-sm font-medium text-[var(--color-brand)] underline"
              >
                {es.gate.entranceChange}
              </button>
            ) : null}
          </div>

          {answer ? (
            <Answer answer={answer} onAgain={reset} orgId={org.id} />
          ) : (
            <>
              {failure ? <Notice kind="error">{failure}</Notice> : null}

              {scanning ? (
                <QrScanner onFound={onScanned} onStop={() => setScanning(false)} />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setFailure(null)
                    setScanning(true)
                  }}
                  className="h-14 w-full rounded-xl bg-[var(--color-brand)] text-lg font-medium text-white"
                >
                  {es.gate.scan}
                </button>
              )}

              <form
                onSubmit={(event: FormEvent) => {
                  event.preventDefault()
                  void submit(code)
                }}
                className="space-y-4"
                noValidate
              >
                <Field
                  label={es.gate.codeLabel}
                  hint={es.gate.codeHint}
                  error={codeError}
                  value={groupCode(code)}
                  onChange={(event) => setCode(cleanCode(event.target.value))}
                  placeholder={es.gate.codePlaceholder}
                  inputMode="text"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="off"
                />
                <SubmitButton busy={checking}>
                  {checking ? es.gate.submitting : es.gate.submit}
                </SubmitButton>
              </form>
            </>
          )}
        </div>
      )}
    </>
  )
}

function EntrancePicker({
  locations,
  onChoose,
}: {
  locations: Location[]
  onChoose: (id: string) => void
}) {
  return (
    <div className="mt-6">
      <h2 className="text-sm font-medium">{es.gate.entrance}</h2>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{es.gate.entranceHint}</p>
      <ul className="mt-3 space-y-2">
        {locations.map((one) => (
          <li key={one.id}>
            <button
              type="button"
              onClick={() => onChoose(one.id)}
              className="h-14 w-full rounded-xl border border-[var(--color-line)] px-4 text-left text-base font-medium hover:border-[var(--color-brand)]"
            >
              {one.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * The answer, sized to be read at arm's length in daylight.
 *
 * `role="alert"` so a screen reader announces it the moment it appears, and
 * colour is never the only signal — the words say allowed or denied on their
 * own, for a guard who cannot tell green from red.
 */
function Answer({
  answer,
  onAgain,
  orgId,
}: {
  answer: CheckResult
  onAgain: () => void
  orgId: string
}) {
  const allowed = answer.result === 'allowed'
  const permit = answer.permit

  return (
    <div className="space-y-4">
      <div
        role="alert"
        className={[
          'rounded-2xl px-5 py-6 text-center',
          allowed
            ? 'bg-[var(--color-ok-soft)] text-[var(--color-ok)]'
            : 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
        ].join(' ')}
      >
        <p className="text-3xl font-semibold">
          {allowed ? es.gate.allowed : es.gate.denied}
        </p>
        {answer.result === 'denied' ? (
          <p className="mt-2 text-base">{denyMessage(answer.reason)}</p>
        ) : null}
        {answer.result === 'denied' && answer.expected_location ? (
          <p className="mt-1 text-base">
            {es.gate.rightEntrance}: <strong>{answer.expected_location}</strong>
          </p>
        ) : null}
        {/*
          Decision 016. A refusal for the hour is the one refusal where the
          visitor is not being turned away for good, so the guard is given the
          sentence that says when to come back — otherwise "no" is all they
          have, and the person at the door argues with them about it.
        */}
        {answer.result === 'denied' &&
        answer.reason === 'outside_schedule' &&
        answer.permit?.schedule ? (
          <p className="mt-1 text-base">
            {es.gate.scheduleAllows}: <strong>{formatSchedule(answer.permit.schedule)}</strong>
          </p>
        ) : null}
      </div>

      {permit ? (
        <dl className="space-y-2 rounded-xl border border-[var(--color-line)] px-4 py-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-ink-soft)]">{es.permits.visitorName}</dt>
            <dd className="text-right font-medium">{permit.visitor_name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-ink-soft)]">{es.gate.goingTo}</dt>
            <dd className="text-right font-medium">{permit.interior_number}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-ink-soft)]">{es.permits.purpose}</dt>
            <dd className="text-right">{purposeLabel(permit.purpose)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-ink-soft)]">{es.gate.validUntil}</dt>
            <dd className="text-right">{formatMoment(permit.valid_to)}</dd>
          </div>
        </dl>
      ) : null}

      <p className="text-sm text-[var(--color-ink-soft)]">{es.gate.recorded}</p>

      <WhatHappened orgId={orgId} eventId={answer.event_id} allowed={allowed} />

      <button
        type="button"
        onClick={onAgain}
        className="h-14 w-full rounded-xl bg-[var(--color-brand)] text-lg font-medium text-white"
      >
        {es.gate.again}
      </button>
    </div>
  )
}

/**
 * What happened, after the check (Decision 015).
 *
 * Four fixed options and no text box. A guard is rotating staff from a
 * contracted security firm, typing with somebody waiting at the gate; what
 * lands in a free field in practice is cedulas, phone numbers and descriptions
 * of third parties who consented to nothing. A closed list is also the only
 * version an administrator can count.
 *
 * **"El visitante no entró" only appears after a "puede entrar."** Offering it
 * under a refusal would ask the guard to record what the screen just said, and
 * there would be no entry to give back anyway.
 *
 * One press, then the panel is done: the API refuses a second note on the same
 * check, and a button that looks live but always fails is worse than no button.
 */
function WhatHappened({
  orgId,
  eventId,
  allowed,
}: {
  orgId: string
  eventId: string
  allowed: boolean
}) {
  const [saving, setSaving] = useState<CheckNote | null>(null)
  const [done, setDone] = useState<{ returned: boolean } | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  const options = notesFor(allowed)

  async function record(note: CheckNote) {
    setFailure(null)
    setSaving(note)
    try {
      const answer = await checksApi.note(orgId, eventId, note)
      setDone({ returned: answer.entry_returned })
    } catch (cause) {
      setFailure(toSpanish(cause))
    } finally {
      setSaving(null)
    }
  }

  if (done) {
    return (
      <Notice kind="ok">
        {done.returned ? es.gate.noteSavedReturned : es.gate.noteSaved}
      </Notice>
    )
  }

  return (
    <div className="border-t border-[var(--color-line)]/60 pt-4">
      <h3 className="text-sm font-medium">{es.gate.noteTitle}</h3>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{es.gate.noteHint}</p>

      {failure ? (
        <div className="mt-3">
          <Notice kind="error">{failure}</Notice>
        </div>
      ) : null}

      <ul className="mt-3 space-y-2">
        {options.map((option) => (
          <li key={option}>
            <button
              type="button"
              disabled={saving !== null}
              onClick={() => void record(option)}
              className="h-14 w-full rounded-xl border border-[var(--color-line)] px-4 text-left text-base font-medium hover:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving === option ? es.gate.noteSaving : noteLabel(option)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

