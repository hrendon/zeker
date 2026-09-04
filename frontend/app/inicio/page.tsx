'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Field, FullPageMessage, Notice, SubmitButton, TextLink } from '@/components/ui'
import { toSpanish } from '@/lib/errors'
import { authApi, orgsApi, type Org } from '@/lib/api'
import { checkRequiredText } from '@/lib/validate'
import { es } from '@/lib/strings'

/**
 * Home after signing in: the organizations this person belongs to.
 *
 * This is also the organization switcher — picking one from the list is what
 * "switching" means. There is no remembered selection stored in the browser,
 * on purpose (see components/OrgShell.tsx), so this list is always the way in.
 */
export default function HomePage() {
  const { status, user, profile, profileError, signOut, applyProfile } = useAuth()
  const router = useRouter()

  const [orgs, setOrgs] = useState<Org[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  // Editing one's own name. Closed by default: it is a correction, not a
  // step, and it must not sit in front of the reason people open this screen.
  const [editingName, setEditingName] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [nameErrors, setNameErrors] = useState<{ first?: string; last?: string }>({})
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameSaved, setNameSaved] = useState(false)
  const [savingName, setSavingName] = useState(false)

  const load = useCallback(() => {
    setLoadError(null)
    orgsApi
      .list()
      .then((result) => setOrgs(result.orgs))
      .catch((error) => setLoadError(toSpanish(error)))
  }, [])

  useEffect(() => {
    if (status === 'signed-out') router.replace('/entrar')
  }, [status, router])

  useEffect(() => {
    if (status === 'signed-in') load()
  }, [status, load])

  if (status !== 'signed-in') {
    return <FullPageMessage>{es.common.loading}</FullPageMessage>
  }

  async function handleSignOut() {
    setSigningOut(true)
    setSignOutError(null)
    try {
      await signOut()
      router.replace('/entrar')
    } catch (error) {
      // The server refused to end the session, so the person is still signed
      // in. Saying otherwise would leave a live session on a shared computer.
      setSignOutError(`${es.errors.signOutFailed} (${toSpanish(error)})`)
      setSigningOut(false)
    }
  }

  const displayName = profile?.first_name ?? user?.displayName ?? ''

  function openNameEditor() {
    setFirstName(profile?.first_name ?? '')
    setLastName(profile?.last_name ?? '')
    setNameErrors({})
    setNameError(null)
    setNameSaved(false)
    setEditingName(true)
  }

  async function handleSaveName(event: FormEvent) {
    event.preventDefault()

    const first = checkRequiredText(firstName, es.validation.firstNameRequired, 100)
    const last = checkRequiredText(lastName, es.validation.lastNameRequired, 100)
    setNameErrors({ first, last })
    if (first || last) return

    setSavingName(true)
    setNameError(null)
    try {
      // The answer carries the whole profile, so the greeting changes without
      // a second round trip and without a reload.
      applyProfile(
        await authApi.updateProfile({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        }),
      )
      setEditingName(false)
      setNameSaved(true)
    } catch (cause) {
      setNameError(toSpanish(cause))
    } finally {
      setSavingName(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {es.home.greeting}
            {displayName ? `, ${displayName}` : ''}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {profile?.email ?? user?.email}
          </p>
          {!editingName ? (
            <button
              type="button"
              onClick={openNameEditor}
              className="mt-1 text-sm font-medium text-[var(--color-brand)] underline underline-offset-2"
            >
              {es.home.editName}
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="h-11 rounded-lg border border-[var(--color-line)] bg-white px-4 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-canvas)] disabled:opacity-60"
        >
          {signingOut ? es.common.signingOut : es.common.signOut}
        </button>
      </header>

      <div className="mt-6 space-y-4">
        {signOutError ? <Notice kind="error">{signOutError}</Notice> : null}
        {profileError ? <Notice kind="error">{profileError}</Notice> : null}
        {nameSaved ? <Notice kind="ok">{es.home.editNameSaved}</Notice> : null}

        {editingName ? (
          <section className="rounded-2xl bg-[var(--color-surface)] p-6 ring-1 ring-[var(--color-line)]/60">
            <h2 className="text-base font-semibold">{es.home.editNameTitle}</h2>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{es.home.editNameHint}</p>

            <form onSubmit={handleSaveName} noValidate className="mt-4 space-y-4">
              {nameError ? <Notice kind="error">{nameError}</Notice> : null}

              <Field
                label={es.common.firstName}
                autoFocus
                value={firstName}
                disabled={savingName}
                error={nameErrors.first}
                onChange={(event) => setFirstName(event.target.value)}
              />
              <Field
                label={es.common.lastName}
                value={lastName}
                disabled={savingName}
                error={nameErrors.last}
                onChange={(event) => setLastName(event.target.value)}
              />

              <div className="flex flex-col gap-3 sm:flex-row-reverse">
                <SubmitButton busy={savingName}>
                  {savingName ? es.actions.saving : es.actions.save}
                </SubmitButton>
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  disabled={savingName}
                  className="h-11 rounded-lg border border-[var(--color-line)] bg-white px-4 text-sm font-medium disabled:opacity-60 sm:w-40"
                >
                  {es.actions.cancel}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <section className="rounded-2xl bg-[var(--color-surface)] p-6 ring-1 ring-[var(--color-line)]/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">{es.orgs.listTitle}</h2>
            {orgs && orgs.length > 0 ? (
              <TextLink href="/organizaciones/nueva">{es.orgs.create}</TextLink>
            ) : null}
          </div>

          {loadError ? (
            <div className="mt-4 space-y-3">
              <Notice kind="error">{loadError}</Notice>
              <button
                type="button"
                onClick={load}
                className="h-11 rounded-lg border border-[var(--color-line)] bg-white px-4 text-sm font-medium"
              >
                {es.actions.retry}
              </button>
            </div>
          ) : !orgs ? (
            <p className="mt-3 text-sm text-[var(--color-ink-soft)]">{es.common.loading}</p>
          ) : orgs.length === 0 ? (
            <div className="mt-3">
              <p className="text-sm text-[var(--color-ink-soft)]">{es.orgs.empty}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-faint)]">{es.orgs.emptyHint}</p>
              <a
                href="/organizaciones/nueva"
                className="mt-4 flex h-11 w-full items-center justify-center rounded-lg bg-[var(--color-brand)] px-4 text-base font-medium text-white hover:bg-[var(--color-brand-dark)]"
              >
                {es.orgs.create}
              </a>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--color-line)]/60">
              {orgs.map((org) => (
                <li key={org.id} className="py-3">
                  <a
                    href={`/organizaciones/${org.id}/sedes`}
                    className="flex items-center justify-between gap-3 rounded-lg py-1 hover:opacity-80"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium text-[var(--color-ink)]">{org.name}</span>
                      <span className="block text-sm text-[var(--color-ink-soft)]">
                        {es.home.roleLabel}: {org.role ? es.roles[org.role] : '—'} ·{' '}
                        {es.usage.locationsLabel} {org.counts.locations}/{org.limits.max_locations}{' '}
                        · {es.usage.interiorsLabel} {org.counts.interiors}/
                        {org.limits.max_interiors}
                      </span>
                    </span>
                    <span aria-hidden="true" className="text-[var(--color-ink-faint)]">
                      →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
