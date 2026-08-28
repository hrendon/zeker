'use client'

import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import { es } from '@/lib/strings'

/**
 * The small set of building blocks every screen uses.
 *
 * Kept deliberately plain: one input, one button, one message box, one card.
 * Sizes are set for a phone held in one hand — inputs and buttons are at least
 * 44px tall, which is the smallest reliable tap target.
 */

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-[var(--color-surface)] p-6 shadow-sm ring-1 ring-[var(--color-line)]/60 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {subtitle}
            </p>
          ) : null}
          <div className="mt-6">{children}</div>
        </div>
        {footer ? (
          <div className="mt-5 text-center text-sm text-[var(--color-ink-soft)]">{footer}</div>
        ) : null}
      </div>
    </main>
  )
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Spanish text shown under the field. Also announced to screen readers. */
  error?: string
  hint?: string
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, hint, ...props },
  ref,
) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--color-ink)]">
        {label}
      </label>
      <input
        {...props}
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={[
          'mt-1.5 block h-11 w-full rounded-lg border bg-white px-3 text-base',
          'text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)]',
          'disabled:cursor-not-allowed disabled:bg-[var(--color-canvas)]',
          error
            ? 'border-[var(--color-danger)]'
            : 'border-[var(--color-line)] focus:border-[var(--color-brand)]',
        ].join(' ')}
      />
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-sm text-[var(--color-ink-soft)]">
          {hint}
        </p>
      ) : null}
    </div>
  )
})

export function SubmitButton({
  children,
  busy,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  return (
    <button
      {...props}
      type="submit"
      disabled={busy || props.disabled}
      className="flex h-11 w-full items-center justify-center rounded-lg bg-[var(--color-brand)] px-4 text-base font-medium text-white transition-colors hover:bg-[var(--color-brand-dark)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  )
}

/**
 * A whole-form message. `role="alert"` makes a screen reader announce it the
 * moment it appears, which is the only way a blind user learns the sign-in
 * failed.
 */
export function Notice({ kind, children }: { kind: 'error' | 'ok'; children: React.ReactNode }) {
  const isError = kind === 'error'
  return (
    <div
      role="alert"
      className={[
        'rounded-lg px-3 py-2.5 text-sm',
        isError
          ? 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
          : 'bg-[var(--color-ok-soft)] text-[var(--color-ok)]',
      ].join(' ')}
    >
      {children}
    </div>
  )
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="font-medium text-[var(--color-brand)] underline-offset-4 hover:underline">
      {children}
    </a>
  )
}

export function FullPageMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <p className="text-sm text-[var(--color-ink-soft)]">{children}</p>
    </main>
  )
}

/**
 * The three pieces the setup screens need beyond the original five.
 *
 * Each one is here because the sign-in screens had no equivalent, not because
 * a bigger component set is desirable — a small set is what keeps the admin,
 * responsable and security experiences feeling like one product.
 */

/**
 * Plan usage, as a bar and as words.
 *
 * Never colour alone: the numbers are always written out, because a bar that
 * is "nearly full" means nothing to someone who cannot see it, and nothing to
 * a guard glancing at a phone in daylight.
 */
export function UsageMeter({
  label,
  used,
  limit,
  note,
}: {
  label: string
  used: number
  limit: number
  note?: string
}) {
  const full = used >= limit
  const ratio = limit > 0 ? Math.min(used / limit, 1) : 0

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
        <span
          className={`text-sm tabular-nums ${
            full ? 'font-medium text-[var(--color-danger)]' : 'text-[var(--color-ink-soft)]'
          }`}
        >
          {used} {es.usage.of} {limit}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuetext={`${used} ${es.usage.of} ${limit}`}
        className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--color-line)]"
      >
        <div
          className={`h-full rounded-full transition-[width] ${
            full ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-brand)]'
          }`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      {full ? (
        <p className="mt-1.5 text-sm text-[var(--color-danger)]">{es.usage.full}</p>
      ) : note ? (
        <p className="mt-1.5 text-sm text-[var(--color-ink-faint)]">{note}</p>
      ) : null}
    </div>
  )
}

/**
 * Asks before something irreversible happens.
 *
 * QA refused to sign off on deletion without a confirmation step, and the two
 * destructive-looking actions here are genuinely different: retiring keeps the
 * record and its plan slot, deleting frees the slot and cannot be undone. The
 * wording, not the button colour, is what tells them apart.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  busyLabel,
  danger,
  busy,
  error,
  children,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  busyLabel: string
  danger?: boolean
  busy?: boolean
  error?: string | null
  /** An optional control the decision needs — e.g. choosing a replacement. */
  children?: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
}) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  // Focus lands on the dialog when it opens, and Escape closes it — otherwise a
  // keyboard user is stranded behind an overlay they cannot see or reach.
  useEffect(() => {
    if (!open) return
    confirmRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        className="w-full max-w-sm rounded-2xl bg-[var(--color-surface)] p-6 shadow-lg"
      >
        <h2 id="confirm-title" className="text-lg font-semibold text-[var(--color-ink)]">
          {title}
        </h2>
        <p id="confirm-body" className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
          {body}
        </p>

        {children ? <div className="mt-4">{children}</div> : null}

        {error ? (
          <p role="alert" className="mt-3 rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-11 rounded-lg border border-[var(--color-line)] bg-white px-4 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-canvas)] disabled:opacity-60"
          >
            {es.actions.cancel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`h-11 rounded-lg px-4 text-sm font-medium text-white disabled:opacity-60 ${
              danger
                ? 'bg-[var(--color-danger)] hover:brightness-90'
                : 'bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)]'
            }`}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export interface RowAction {
  label: string
  onSelect: () => void
  danger?: boolean
}

/**
 * One item in a list, with its actions behind a menu.
 *
 * The actions hide behind a menu rather than sitting on the row because a row
 * on a phone is not wide enough for three buttons that are still 44px apart —
 * and putting "delete" one thumb-width from "change" is how records get lost.
 */
export function ListRow({
  title,
  subtitle,
  badge,
  actions,
  dimmed,
}: {
  title: string
  subtitle?: string
  badge?: string
  actions: RowAction[]
  dimmed?: boolean
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className={dimmed ? 'min-w-0 opacity-60' : 'min-w-0'}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-[var(--color-ink)]">{title}</span>
          {badge ? (
            <span className="rounded-full bg-[var(--color-canvas)] px-2 py-0.5 text-xs text-[var(--color-ink-soft)]">
              {badge}
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <p className="mt-0.5 truncate text-sm text-[var(--color-ink-soft)]">{subtitle}</p>
        ) : null}
      </div>

      {actions.length > 0 ? (
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            aria-label={`${es.actions.options}: ${title}`}
            aria-expanded={open}
            aria-haspopup="menu"
            onClick={() => setOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--color-ink-soft)] hover:bg-[var(--color-canvas)]"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ⋯
            </span>
          </button>

          {open ? (
            <div
              role="menu"
              className="absolute right-0 z-10 mt-1 w-52 overflow-hidden rounded-lg bg-[var(--color-surface)] py-1 shadow-lg ring-1 ring-[var(--color-line)]"
            >
              {actions.map((action) => (
                <button
                  key={action.label}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    action.onSelect()
                  }}
                  className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--color-canvas)] ${
                    action.danger ? 'text-[var(--color-danger)]' : 'text-[var(--color-ink)]'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}
