'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { toSpanish } from '@/lib/errors'
import { checkEmail, checkPasswordPresent } from '@/lib/validate'
import { es } from '@/lib/strings'
import { useAuth } from '@/components/AuthProvider'
import { AuthCard, Field, Notice, SubmitButton, TextLink } from '@/components/ui'

export default function SignInPage() {
  const { status } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Someone who is already signed in has no business on this page.
  useEffect(() => {
    if (status === 'signed-in') router.replace('/inicio')
  }, [status, router])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const errors = {
      email: checkEmail(email),
      password: checkPasswordPresent(password),
    }
    setFieldErrors(errors)
    if (errors.email || errors.password) return

    setBusy(true)
    setFormError(null)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      // AuthProvider takes it from here: it calls POST /auth/session and loads
      // the profile. This page only has to get out of the way.
      router.replace('/inicio')
    } catch (error) {
      setFormError(toSpanish(error))
      setBusy(false)
    }
  }

  return (
    <AuthCard
      title={es.signIn.title}
      subtitle={es.signIn.subtitle}
      footer={
        <>
          {es.signIn.noAccount} <TextLink href="/crear-cuenta">{es.signIn.createAccount}</TextLink>
        </>
      }
    >
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
          error={fieldErrors.email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <Field
          label={es.common.password}
          type="password"
          autoComplete="current-password"
          value={password}
          disabled={busy}
          error={fieldErrors.password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <div className="text-right text-sm">
          <TextLink href="/recuperar">{es.signIn.forgot}</TextLink>
        </div>

        <SubmitButton busy={busy}>{busy ? es.signIn.submitting : es.signIn.submit}</SubmitButton>
      </form>
    </AuthCard>
  )
}
