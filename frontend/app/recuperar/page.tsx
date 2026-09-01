'use client'

import { useState, type FormEvent } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { toSpanish } from '@/lib/errors'
import { checkEmail } from '@/lib/validate'
import { es } from '@/lib/strings'
import { AuthCard, Field, Notice, SubmitButton, TextLink } from '@/components/ui'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const error = checkEmail(email)
    setFieldError(error)
    if (error) return

    setBusy(true)
    setFormError(null)
    try {
      // The link lands on Firebase's own page, not ours. Without a continue
      // URL that page is a dead end: the person is told the link failed and
      // has no way back, because the app's address is a Cloud Run hostname
      // nobody types from memory. This gives that page a door back to Zeker.
      await sendPasswordResetEmail(auth, email.trim(), {
        url: `${window.location.origin}/entrar`,
        handleCodeInApp: false,
      })
      setSent(true)
    } catch (error) {
      // "No account with that email" is treated as success on purpose. Saying
      // so out loud would turn this page into a way to find out who has an
      // account with us.
      const code = (error as { code?: string }).code
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        setSent(true)
      } else {
        setFormError(toSpanish(error))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard
      title={es.reset.title}
      subtitle={sent ? undefined : es.reset.subtitle}
      footer={<TextLink href="/entrar">{es.reset.backToSignIn}</TextLink>}
    >
      {sent ? (
        <Notice kind="ok">{es.reset.sent}</Notice>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {formError ? <Notice kind="error">{formError}</Notice> : null}

          <Field
            label={es.common.email}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            value={email}
            disabled={busy}
            error={fieldError}
            onChange={(event) => setEmail(event.target.value)}
          />

          <SubmitButton busy={busy}>
            {busy ? es.reset.submitting : es.reset.submit}
          </SubmitButton>
        </form>
      )}
    </AuthCard>
  )
}
