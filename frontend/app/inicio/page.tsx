'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { FullPageMessage, Notice, TextLink } from '@/components/ui'
import { toSpanish } from '@/lib/errors'
import { orgsApi, type Org } from '@/lib/api'
import { es } from '@/lib/strings'

/**
 * Home after signing in: the organizations this person belongs to.
 *
 * This is also the organization switcher — picking one from the list is what
 * "switching" means. There is no remembered selection stored in the browser,
 * on purpose (see components/OrgShell.tsx), so this list is always the way in.
 */
export default function HomePage() {
  const { status, user, profile, profileError, signOut } = useAuth()
  const router = useRouter()

  const [orgs, setOrgs] = useState<Org[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

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
