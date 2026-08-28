'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { FullPageMessage, Notice, TextLink } from '@/components/ui'
import { ApiError, toSpanish } from '@/lib/errors'
import { orgsApi, type Org } from '@/lib/api'
import { es } from '@/lib/strings'

/**
 * Everything shared by the screens that live inside one organization.
 *
 * Which organization is being viewed comes from the URL and nowhere else. That
 * is a security requirement, not a style preference: a person can administer
 * one organization and be a plain member of another, so nothing about an
 * organization may be kept in browser storage where it could survive a switch
 * and be painted onto the next one. Navigating away drops it; a fresh screen
 * fetches it again.
 */
export function useOrgId(): string {
  const params = useParams<{ orgId: string }>()
  return params.orgId
}

interface OrgState {
  org: Org | null
  loading: boolean
  /** Already in Spanish. Null when nothing went wrong. */
  error: string | null
  /** True when the organization does not exist, or the caller is not a member. */
  denied: boolean
  reload: () => void
}

/**
 * Loads one organization, including its plan limits and current usage.
 *
 * A 404 here means either "no such organization" or "you are not a member" —
 * the API deliberately gives the same answer to both, so that nobody can
 * discover which customers exist by guessing. The screen must not undo that by
 * treating the two differently.
 */
export function useOrg(orgId: string, enabled: boolean): OrgState {
  const [org, setOrg] = useState<Org | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [denied, setDenied] = useState(false)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((value) => value + 1), [])

  useEffect(() => {
    let cancelled = false

    // Clear first. Showing the previous organization while the next one loads
    // would put one customer's data on another customer's screen.
    setOrg(null)
    setError(null)
    setDenied(false)
    setLoading(true)

    // On a fresh page load Firebase restores the session asynchronously, so
    // for a moment there is no signed-in user and no token to send. Asking the
    // API during that gap gets a 401 and tells the person their session ended
    // when it did not. Wait for the restore to finish.
    if (!enabled) return

    orgsApi
      .get(orgId)
      .then((result) => {
        if (!cancelled) setOrg(result)
      })
      .catch((cause) => {
        if (cancelled) return
        if (cause instanceof ApiError && cause.status === 404) setDenied(true)
        else setError(toSpanish(cause))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    // A switch mid-flight must not let the old response land on the new screen.
    return () => {
      cancelled = true
    }
  }, [orgId, nonce, enabled])

  return { org, loading, error, denied, reload }
}

/** Only an administrator may create, change or delete inside an organization. */
export function isAdmin(org: Org | null): boolean {
  return org?.role === 'admin'
}

export function OrgHeader({
  org,
  current,
}: {
  org: Org
  current: 'locations' | 'interiors' | 'members'
}) {
  const tabs = [
    { key: 'locations' as const, label: es.nav.locations, href: `/organizaciones/${org.id}/sedes` },
    {
      key: 'interiors' as const,
      label: es.nav.interiors,
      href: `/organizaciones/${org.id}/interiores`,
    },
    { key: 'members' as const, label: es.nav.members, href: `/organizaciones/${org.id}/personas` },
  ]

  return (
    <header className="mb-6">
      <TextLink href="/inicio">{es.nav.backToOrgs}</TextLink>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{org.name}</h1>

      <nav aria-label={es.nav.myOrgs} className="mt-4 flex gap-1 border-b border-[var(--color-line)]">
        {tabs.map((tab) => (
          <a
            key={tab.key}
            href={tab.href}
            aria-current={tab.key === current ? 'page' : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              tab.key === current
                ? 'border-[var(--color-brand)] text-[var(--color-brand)]'
                : 'border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
            }`}
          >
            {tab.label}
          </a>
        ))}
      </nav>
    </header>
  )
}

/**
 * Wraps an organization-scoped screen: waits for sign-in, loads the
 * organization, and renders the "not found or no access" page when the API
 * gives its deliberately ambiguous 404.
 */
export function OrgGate({
  orgId,
  children,
}: {
  orgId: string
  children: (org: Org) => React.ReactNode
}) {
  const { status } = useAuth()
  const router = useRouter()
  const { org, loading, error, denied } = useOrg(orgId, status === 'signed-in')

  useEffect(() => {
    if (status === 'signed-out') router.replace('/entrar')
  }, [status, router])

  if (status !== 'signed-in' || loading) {
    return <FullPageMessage>{es.common.loading}</FullPageMessage>
  }

  if (denied) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">{es.org.noAccessTitle}</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{es.org.noAccessBody}</p>
        <p className="mt-4">
          <TextLink href="/inicio">{es.nav.backToOrgs}</TextLink>
        </p>
      </main>
    )
  }

  if (error || !org) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <Notice kind="error">{error ?? es.errors.unknown}</Notice>
        <p className="mt-4">
          <TextLink href="/inicio">{es.nav.backToOrgs}</TextLink>
        </p>
      </main>
    )
  }

  return <main className="mx-auto w-full max-w-2xl px-4 py-10">{children(org)}</main>
}
