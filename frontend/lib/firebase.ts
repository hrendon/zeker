import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

/**
 * Firebase client setup.
 *
 * The browser signs in against Firebase directly and the Zeker API never sees
 * a password (Decision 002). These values are public by design — they identify
 * the project, they do not grant access to it. Access is decided by Firebase
 * Auth and by the Firestore rules, which deny browsers entirely (Decision 004).
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    // Failing loudly at startup beats a sign-in button that silently does
    // nothing because one variable was missing.
    throw new Error(
      `Missing ${name}. Copy frontend/.env.local.example to frontend/.env.local and fill it in.`,
    )
  }
  return value
}

const firebaseConfig = {
  apiKey: required('NEXT_PUBLIC_FIREBASE_API_KEY', process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: required(
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  ),
  projectId: required(
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  ),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: required('NEXT_PUBLIC_FIREBASE_APP_ID', process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
}

// Next.js re-runs modules on hot reload; initialising twice throws.
export const firebaseApp: FirebaseApp =
  getApps()[0] ?? initializeApp(firebaseConfig)

export const auth: Auth = getAuth(firebaseApp)
