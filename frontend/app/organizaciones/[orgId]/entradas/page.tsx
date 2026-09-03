'use client'

import { useCallback, useEffect, useState } from 'react'
import { OrgGate, OrgHeader, useOrgId } from '@/components/OrgShell'
import { Field, Notice } from '@/components/ui'
import { toSpanish } from '@/lib/errors'
import { eventsApi, type AccessEvent, type Org } from '@/lib/api'
import { formatWhen, groupByCheck, lineFor, whoFor, type HistoryRow } from '@/lib/history'
import { es } from '@/lib/strings'

/**
 * The entry history (US-007).
 *
 * What actually happened at the doors. An administrator sees the whole
 * organization; a responsable sees only the interiors they are in charge of —
 * and that is enforced by the API in the query itself, not here. This screen
 * never filters anything for safety, because a filter on a screen is a filter
 * somebody can remove without noticing what it was for.
 *
 * Security staff never reach it: the tab is not offered to them and the API
 * refuses them outright. A guard who could read this would know who came into
 * which apartment, at what time, for the last ninety days.
 *
 * **A guard's note sits under the check it corrects** (Decision 015). Both are
 * shown, because a correction here is a new record and never an edit of the
 * first — that is what makes this log worth reading as evidence.
 */
export default function HistoryPage() {
  const orgId = useOrgId()
  return <OrgGate orgId={orgId}>{(org) => <HistoryScreen org={org} />}</OrgGate>
}

/** A day, as an `<input type="date">` gives it: `2026-09-03`. */
type DayValue = string

function HistoryScreen({ org }: { org: Org }) {
  const [rows, setRows] = useState<HistoryRow[] | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const [from, setFrom] = useState<DayValue>('')
  const [to, setTo] = useState<DayValue>('')
  const [onlyDenied, setOnlyDenied] = useState(false)

  const filtering = from !== '' || to !== '' || onlyDenied

  const query = useCallback(
    () => ({
      // The dates a person picks are days in their own timezone, and the API
      // wants moments. "Hasta" is the end of that day, not its start, or
      // choosing the same day twice would return nothing.
      from: from ? new Date(`${from}T00:00`).toISOString() : undefined,
      to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
      result: onlyDenied ? ('denied' as const) : undefined,
    }),
    [from, to, onlyDenied],
  )

  const load = useCallback(async () => {
    setFailure(null)
    setRows(null)
    try {
      const answer = await eventsApi.list(org.id, query())
      setRows(groupByCheck(answer.events))
      setCursor(answer.next_cursor)
    } catch (cause) {
      setFailure(toSpanish(cause))
      setRows([])
    }
  }, [org.id, query])

  useEffect(() => {
    void load()
  }, [load])

  async function loadMore() {
    if (!cursor) return
    setLoadingMore(true)
    setFailure(null)
    try {
      const answer = await eventsApi.list(org.id, { ...query(), cursor })
      // Regrouped over the whole list, so a note whose check was on the
      // previous page finds it instead of standing alone.
      setRows((held) =>
        groupByCheck([
          ...(held ?? []).flatMap((row) => [row.event, ...row.notes]),
          ...answer.events,
        ]),
      )
      setCursor(answer.next_cursor)
    } catch (cause) {
      setFailure(toSpanish(cause))
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <>
      <OrgHeader org={org} current="history" />

      <h1 className="text-2xl font-semibold tracking-tight">{es.history.title}</h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        {org.role === 'responsable' ? es.history.subtitleResponsable : es.history.subtitle}
      </p>

      <div className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={es.history.from}
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
          <Field
            label={es.history.to}
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>

        <label className="mt-4 flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            checked={onlyDenied}
            onChange={(event) => setOnlyDenied(event.target.checked)}
            className="h-5 w-5 rounded border-[var(--color-line)]"
          />
          {es.history.onlyDenied}
        </label>

        {filtering ? (
          <button
            type="button"
            onClick={() => {
              setFrom('')
              setTo('')
              setOnlyDenied(false)
            }}
            className="mt-3 text-sm font-medium text-[var(--color-brand)] underline"
          >
            {es.history.clear}
          </button>
        ) : null}
      </div>

      {failure ? (
        <div className="mt-4">
          <Notice kind="error">{failure}</Notice>
        </div>
      ) : null}

      {rows === null ? (
        <p className="mt-6 text-sm text-[var(--color-ink-soft)]">{es.common.loading}</p>
      ) : rows.length === 0 && !failure ? (
        <p className="mt-6 text-sm text-[var(--color-ink-soft)]">
          {filtering ? es.history.emptyFiltered : es.history.empty}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((row) => (
            <Row key={row.event.id} row={row} />
          ))}
        </ul>
      )}

      {cursor ? (
        <button
          type="button"
          disabled={loadingMore}
          onClick={() => void loadMore()}
          className="mt-4 h-12 w-full rounded-xl border border-[var(--color-line)] text-base font-medium hover:border-[var(--color-brand)] disabled:opacity-60"
        >
          {loadingMore ? es.history.loadingMore : es.history.more}
        </button>
      ) : null}

      <p className="mt-6 text-xs text-[var(--color-ink-faint)]">{es.history.retentionNote}</p>
    </>
  )
}

/**
 * One check, with whatever the guard said about it underneath.
 *
 * Colour is never the only signal — the words say "Entró" or name the refusal
 * on their own, for the same reason the gate screen does.
 */
function Row({ row }: { row: HistoryRow }) {
  const { event, notes } = row
  const allowed = event.result === 'allowed'
  const who = whoFor(event)

  return (
    <li className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="font-medium">
          {who}
          {event.interior_number ? (
            <span className="text-[var(--color-ink-soft)]"> · {event.interior_number}</span>
          ) : null}
        </p>
        <p className="text-sm text-[var(--color-ink-faint)]">{formatWhen(event.created_at)}</p>
      </div>

      <p
        className={`mt-1 text-sm ${
          allowed ? 'text-[var(--color-ok)]' : 'text-[var(--color-danger)]'
        }`}
      >
        {lineFor(event)}
      </p>

      {event.location_name ? (
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          {es.history.at} {event.location_name}
        </p>
      ) : null}

      {notes.map((note) => (
        <p
          key={note.id}
          className="mt-2 border-l-2 border-[var(--color-line)] pl-3 text-sm text-[var(--color-ink-soft)]"
        >
          {es.history.noteLine} {lineFor(note)}
        </p>
      ))}
    </li>
  )
}
