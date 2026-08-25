import { Router } from 'express'
import { db } from '../lib/firebase.js'
import { env } from '../config/env.js'
import { logger } from '../lib/logger.js'

export const healthRouter: Router = Router()

/** Liveness: is the process up? Used by Cloud Run and by uptime checks. */
healthRouter.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'zeker-api',
    environment: env.NODE_ENV,
    uptime_seconds: Math.round(process.uptime()),
    request_id: req.id,
  })
})

/**
 * Readiness: can the API actually reach Firestore with the credentials it has?
 * This is what confirms Application Default Credentials are wired correctly,
 * both on a developer machine and on Cloud Run.
 */
healthRouter.get('/ready', async (req, res) => {
  try {
    await db().listCollections()
    res.json({ status: 'ready', dependencies: { firestore: 'ok' }, request_id: req.id })
  } catch (error) {
    logger.error({ err: error, request_id: req.id }, 'Firestore readiness check failed')
    res.status(503).json({
      status: 'unavailable',
      dependencies: { firestore: 'unreachable' },
      request_id: req.id,
    })
  }
})
