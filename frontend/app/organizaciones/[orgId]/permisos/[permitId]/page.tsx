'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'qrcode'
import { OrgGate, OrgHeader, useOrgId } from '@/components/OrgShell'
import { ConfirmDialog, Notice, TextLink } from '@/components/ui'
import { toSpanish } from '@/lib/errors'
import { permitsApi, type Org, type Permit } from '@/lib/api'
import { formatMoment, formatSchedule, purposeLabel, stateLabel, useLine } from '@/lib/permits'
import { es } from '@/lib/strings'

/**
 * One permit, and the code that gets its visitor through the door.
 *
 * The QR is drawn here, in the browser, from the code the API returned. It is
 * never stored: it carries the same eight characters the person can read
 * aloud, so keeping a picture of it on the server would be a second copy of
 * something we already have.
 */
export default function PermitPage() {
  const orgId = useOrgId()
  return <OrgGate orgId={orgId}>{(org) => <PermitScreen org={org} />}</OrgGate>
}

function PermitScreen({ org }: { org: Org }) {
  const params = useParams<{ permitId: string }>()
  const permitId = params.permitId

  const [permit, setPermit] = useState<Permit | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [qr, setQr] = useState<string | null>(null)
  const [qrFailed, setQrFailed] = useState(false)
  const [copied, setCopied] = useState(false)

  const [confirming, setConfirming] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [revokeError, setRevokeError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoadError(null)
    permitsApi
      .get(org.id, permitId)
      .then(setPermit)
      .catch((cause) => setLoadError(toSpanish(cause)))
  }, [org.id, permitId])

  useEffect(load, [load])

  // A cancelled or finished permit gets no QR. Drawing one would invite
  // somebody to send a code that will be turned away at the gate.
  const usable = permit?.state === 'active' || permit?.state === 'scheduled'
  const plainCode = permit?.code.replace('-', '') ?? ''

  useEffect(() => {
    if (!usable || plainCode === '') return

    let cancelled = false
    QRCode.toDataURL(plainCode, { width: 512, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (!cancelled) setQr(url)
      })
      .catch(() => {
        // The number below still works, so say so rather than showing a hole.
        if (!cancelled) setQrFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [usable, plainCode])

  async function copyCode() {
    if (!permit) return
    try {
      await navigator.clipboard.writeText(permit.code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Some browsers refuse the clipboard without a user gesture they trust.
      // The code is on screen and can be read out, so this is not worth an
      // error message.
    }
  }

  async function revoke() {
    setRevoking(true)
    setRevokeError(null)
    try {
      await permitsApi.revoke(org.id, permitId)
      setConfirming(false)
      setQr(null)
      load()
    } catch (cause) {
      setRevokeError(toSpanish(cause))
    } finally {
      setRevoking(false)
    }
  }

  return (
    <>
      <OrgHeader org={org} current="permits" />

      <p className="mb-4">
        <TextLink href={`/organizaciones/${org.id}/permisos`}>{es.permits.backToList}</TextLink>
      </p>

      <section className="rounded-2xl bg-[var(--color-surface)] p-6 ring-1 ring-[var(--color-line)]/60">
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
        ) : !permit ? (
          <p className="text-sm text-[var(--color-ink-soft)]">{es.common.loading}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold">{permit.visitor_name}</h2>
              <span className="rounded-full bg-[var(--color-canvas)] px-2 py-0.5 text-xs text-[var(--color-ink-soft)]">
                {stateLabel(permit.state)}
              </span>
            </div>

            <dl className="mt-3 space-y-1 text-sm text-[var(--color-ink-soft)]">
              <div className="flex gap-2">
                <dt className="text-[var(--color-ink-faint)]">{es.permits.forInterior}</dt>
                <dd>{permit.interior_number}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-[var(--color-ink-faint)]">{es.permits.purpose}</dt>
                <dd>{purposeLabel(permit.purpose)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-[var(--color-ink-faint)]">{es.permits.validFrom}</dt>
                <dd>{formatMoment(permit.valid_from)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-[var(--color-ink-faint)]">{es.permits.validTo}</dt>
                <dd>{formatMoment(permit.valid_to)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-[var(--color-ink-faint)]">{es.permits.entryMode}</dt>
                <dd>
                  {permit.entry_mode === 'single'
                    ? es.permits.entryModeSingle
                    : es.permits.entryModeMultiple}
                </dd>
              </div>
              {/*
                Decision 016. Shown only when there is one: telling every
                reader of every permit that it has no schedule is noise on the
                screen they open to send somebody a code.
              */}
              {permit.schedule ? (
                <div className="flex gap-2">
                  <dt className="text-[var(--color-ink-faint)]">{es.permits.scheduleLabel}</dt>
                  <dd>{formatSchedule(permit.schedule)}</dd>
                </div>
              ) : null}
            </dl>

            {/*
              Whether anybody actually came in — the question the Founder asked
              for on 2026-09-02, the day the product was first used for real.
            */}
            {useLine(permit, formatMoment) ? (
              <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
                {useLine(permit, formatMoment)}
              </p>
            ) : null}

            {usable ? (
              <div className="mt-6 border-t border-[var(--color-line)]/60 pt-6">
                <h3 className="text-sm font-medium">{es.permits.codeTitle}</h3>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{es.permits.codeHint}</p>

                <div className="mt-4 flex flex-col items-center">
                  {qr ? (
                    // eslint-disable-next-line @next/next/no-img-element -- a
                    // data URL drawn in this browser; there is nothing for the
                    // image optimizer to fetch or resize.
                    <img
                      src={qr}
                      alt={es.permits.qrAlt}
                      width={256}
                      height={256}
                      className="h-64 w-64 rounded-lg bg-white p-2 ring-1 ring-[var(--color-line)]"
                    />
                  ) : qrFailed ? (
                    <Notice kind="error">{es.permits.qrFailed}</Notice>
                  ) : (
                    <div className="flex h-64 w-64 items-center justify-center rounded-lg bg-[var(--color-canvas)] text-sm text-[var(--color-ink-soft)]">
                      {es.common.loading}
                    </div>
                  )}

                  {/* Large, spaced and monospaced: this gets read aloud across
                      a gate, or typed by a guard holding a phone in one hand. */}
                  <p className="mt-4 font-mono text-3xl tracking-[0.2em] text-[var(--color-ink)]">
                    {permit.code}
                  </p>

                  <div className="mt-4 flex w-full flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={copyCode}
                      className="h-11 flex-1 rounded-lg border border-[var(--color-line)] bg-white px-4 text-sm font-medium"
                    >
                      {copied ? es.permits.copied : es.permits.copyCode}
                    </button>
                    {qr ? (
                      <a
                        href={qr}
                        download={`permiso-${plainCode}.png`}
                        className="flex h-11 flex-1 items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-4 text-sm font-medium"
                      >
                        {es.permits.downloadQr}
                      </a>
                    ) : null}
                  </div>

                  <p className="mt-3 text-center text-sm text-[var(--color-ink-faint)]">
                    {es.permits.shareHint}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 border-t border-[var(--color-line)]/60 pt-6">
                {/*
                  One sentence per state. This used to be a single ternary that
                  called everything that was not "revoked" expired — so a permit
                  that had simply been used said "ya terminó", which reads as
                  the clock running out on something that in fact worked.
                */}
                <Notice kind="error">{stateMessage(permit.state)}</Notice>
              </div>
            )}

            {permit.state !== 'revoked' ? (
              <div className="mt-6 border-t border-[var(--color-line)]/60 pt-6">
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="h-11 w-full rounded-lg border border-[var(--color-danger)] px-4 text-sm font-medium text-[var(--color-danger)]"
                >
                  {es.permits.revoke}
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      <ConfirmDialog
        open={confirming}
        title={es.permits.revokeConfirmTitle}
        body={es.permits.revokeConfirmBody}
        confirmLabel={es.permits.revoke}
        busyLabel={es.actions.saving}
        danger
        busy={revoking}
        error={revokeError}
        onConfirm={revoke}
        onCancel={() => {
          setConfirming(false)
          setRevokeError(null)
        }}
      />
    </>
  )
}

/** What to tell the reader about a permit that cannot be used right now. */
function stateMessage(state: Permit['state']): string {
  if (state === 'revoked') return es.permits.revoked
  if (state === 'used') return es.permits.used
  if (state === 'scheduled') return es.permits.scheduled
  return es.permits.expired
}
