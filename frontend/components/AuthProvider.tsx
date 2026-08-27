'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { authApi, type UserProfile } from '@/lib/api'

/**
 * Holds the answer to "who is signed in" for the whole app.
 *
 * Firebase owns the session; this only mirrors it. Two things happen when
 * Firebase reports a signed-in user:
 *
 *  1. `POST /auth/session` runs once, creating the Zeker profile on a first
 *     sign-in and refreshing `last_login` afterwards.
 *  2. The profile is kept here so screens can decide what to show without each
 *     of them asking the API again.
 */

type Status = 'loading' | 'signed-out' | 'signed-in'

interface AuthState {
  status: Status
  /** The Firebase account. Null unless status is 'signed-in'. */
  user: User | null
  /** The Zeker profile, including org membership. Null while it loads. */
  profile: UserProfile | null
  /** Set when the profile could not be loaded; already in Spanish. */
  profileError: string | null
  /**
   * Ends the session here and on the server. Throws if the server refused,
   * because in that case the session is NOT closed and the user must be told.
   */
  signOut: () => Promise<void>
  /** Used by the sign-up screen to send the name on the very first call. */
  registerNames: (names: { first_name: string; last_name: string }) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Names captured at sign-up, waiting for the first /auth/session call. Held
  // in a ref so setting them never triggers a render of its own.
  const pendingNames = useRef<{ first_name: string; last_name: string } | null>(null)
  // Guards against a second /auth/session for the same account when React
  // re-runs effects (strict mode does this in development).
  const sessionStartedFor = useRef<string | null>(null)

  const registerNames = useCallback((names: { first_name: string; last_name: string }) => {
    pendingNames.current = names
  }, [])

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)

      if (!nextUser) {
        sessionStartedFor.current = null
        setProfile(null)
        setProfileError(null)
        setStatus('signed-out')
        return
      }

      setStatus('signed-in')

      if (sessionStartedFor.current === nextUser.uid) return
      sessionStartedFor.current = nextUser.uid

      try {
        const names = pendingNames.current
        pendingNames.current = null
        // On a first sign-in this creates the profile; afterwards it just
        // refreshes last_login. Either way we get the profile back.
        setProfile(await authApi.createSession(names ?? undefined))
        setProfileError(null)
      } catch (error) {
        // The account is valid — only our own profile call failed. Try a plain
        // read before giving up, so a transient write problem is not fatal.
        try {
          setProfile(await authApi.me())
          setProfileError(null)
        } catch {
          setProfile(null)
          const { toSpanish } = await import('@/lib/errors')
          setProfileError(toSpanish(error))
        }
      }
    })
  }, [])

  const signOut = useCallback(async () => {
    // Server first. If revoking fails the session is still alive, and clearing
    // the browser copy would only hide that from the user.
    await authApi.logout()
    await firebaseSignOut(auth)
  }, [])

  const value = useMemo<AuthState>(
    () => ({ status, user, profile, profileError, signOut, registerNames }),
    [status, user, profile, profileError, signOut, registerNames],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
