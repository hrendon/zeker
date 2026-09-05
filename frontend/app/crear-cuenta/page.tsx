'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { toSpanish } from '@/lib/errors'
import { checkEmail, checkName, checkNewPassword, checkOptionalName } from '@/lib/validate'
import { es } from '@/lib/strings'
import { useAuth } from '@/components/AuthProvider'
import { AuthCard, Field, Notice, SubmitButton, TextLink } from '@/components/ui'

export default function SignUpPage() {
  const { status, registerNames } = useAuth()
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (status === 'signed-in') router.replace('/inicio')
  }, [status, router])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const errors = {
      firstName: checkName(firstName, 'first'),
      lastName: checkOptionalName(lastName),
      email: checkEmail(email),
      password: checkNewPassword(password),
    }
    setFieldErrors(errors)
    if (Object.values(errors).some(Boolean)) return

    setBusy(true)
    setFormError(null)
    try {
      // Hand the names to AuthProvider before the account exists, so its first
      // POST /auth/session carries them. Sending them afterwards would leave a
      // profile with no name for a moment.
      registerNames({ first_name: firstName.trim(), last_name: lastName.trim() })
      await createUserWithEmailAndPassword(auth, email.trim(), password)
      router.replace('/inicio')
    } catch (error) {
      setFormError(toSpanish(error))
      setBusy(false)
    }
  }

  return (
    <AuthCard
      title={es.signUp.title}
      subtitle={es.signUp.subtitle}
      footer={
        <>
          {es.signUp.haveAccount} <TextLink href="/entrar">{es.signUp.signIn}</TextLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError ? <Notice kind="error">{formError}</Notice> : null}

        <Field
          label={es.common.firstName}
          autoComplete="given-name"
          autoFocus
          value={firstName}
          disabled={busy}
          error={fieldErrors.firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />

        <Field
          label={es.common.lastName}
          autoComplete="family-name"
          value={lastName}
          disabled={busy}
          error={fieldErrors.lastName}
          onChange={(event) => setLastName(event.target.value)}
        />

        <Field
          label={es.common.email}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          disabled={busy}
          error={fieldErrors.email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <Field
          label={es.common.password}
          type="password"
          autoComplete="new-password"
          hint={es.signUp.passwordHint}
          value={password}
          disabled={busy}
          error={fieldErrors.password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <SubmitButton busy={busy}>{busy ? es.signUp.submitting : es.signUp.submit}</SubmitButton>
      </form>
    </AuthCard>
  )
}
