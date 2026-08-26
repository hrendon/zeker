'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { FullPageMessage, Notice } from '@/components/ui'
import { toSpanish } from '@/lib/errors'
import { es } from '@/lib/strings'
import type { OrgMembership } from '@/lib/api'

/**
 * Temporary landing screen after sign-in.
 *
 * It exists to prove the whole chain works end to end: Firebase signs the user
 * in, the API creates or refreshes their profile, and signing out closes the
 * session on both sides. The real admin / responsable / security screens
 * replace it.
 */
export default function HomePage() {
  const { status, user, profile, profileError, signOut } = useAuth()
  const router = useRouter()
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (status === 'signed-out') router.replace('/entrar')
  }, [status, router])

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
      // The server refused to revoke the session, which means the user is
      // still signed in. Telling them so is the honest thing to do — pretending
      // otherwise would leave a live session on a shared computer.
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
          <h2 className="text-base font-semibold">{es.home.yourOrgs}</h2>

          {!profile ? (
            <p className="mt-3 text-sm text-[var(--color-ink-soft)]">{es.common.loading}</p>
          ) : profile.orgs.length === 0 ? (
            <>
              <p className="mt-3 text-sm text-[var(--color-ink-soft)]">{es.home.noOrgs}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-faint)]">{es.home.noOrgsHint}</p>
            </>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--color-line)]/60">
              {profile.orgs.map((org: OrgMembership) => (
                <li key={org.org_id} className="flex items-center justify-between py-3">
                  <span className="font-mono text-sm">{org.org_id}</span>
                  <span className="text-sm text-[var(--color-ink-soft)]">
                    {es.home.roleLabel}: {es.roles[org.role] ?? org.role}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-sm text-[var(--color-ink-faint)]">{es.home.underConstruction}</p>
      </div>
    </main>
  )
}
