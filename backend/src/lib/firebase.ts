import { type App, applicationDefault, getApps, initializeApp } from 'firebase-admin/app'
import { type Auth, getAuth } from 'firebase-admin/auth'
import { type Firestore, getFirestore } from 'firebase-admin/firestore'
import { env } from '../config/env.js'

/**
 * Authentication to GCP uses Application Default Credentials, as decided in
 * docs/architecture/architecture.md. There is no service account key file:
 * locally the credentials come from `gcloud auth application-default login`,
 * and on Cloud Run from the service account attached to the instance.
 *
 * Initialisation is lazy so that importing this module never requires
 * credentials — only actually touching Firestore or Auth does.
 */
let app: App | undefined

export function getFirebaseApp(): App {
  if (app) return app

  const existing = getApps()[0]
  if (existing) {
    app = existing
    return app
  }

  app = initializeApp({
    credential: applicationDefault(),
    ...(env.GCP_PROJECT_ID ? { projectId: env.GCP_PROJECT_ID } : {}),
  })
  return app
}

export function db(): Firestore {
  return getFirestore(getFirebaseApp())
}

export function auth(): Auth {
  return getAuth(getFirebaseApp())
}
