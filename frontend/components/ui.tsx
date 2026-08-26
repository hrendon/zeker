'use client'

import { forwardRef, useId } from 'react'

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
