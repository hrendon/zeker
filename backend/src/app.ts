import express, { type Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import { corsOrigins } from './config/env.js'
import { logger } from './lib/logger.js'
import { requestId } from './middleware/requestId.js'
import { generalRateLimit } from './middleware/rateLimit.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFoundHandler } from './middleware/notFound.js'
import { apiRouter } from './routes/index.js'

/**
 * Builds the Express application without starting a server, so tests can call
 * it directly. Starting the listener is src/index.ts's job.
 */
export function createApp(): Express {
  const app = express()

  // Cloud Run terminates TLS and forwards the caller's address in
  // X-Forwarded-For; without this the rate limiter would see one shared IP.
  app.set('trust proxy', 1)
  app.disable('x-powered-by')

  app.use(requestId)
  app.use(helmet())
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
      // Frontend needs to read the correlation id to report problems.
      exposedHeaders: ['X-Request-Id'],
    }),
  )
  app.use(express.json({ limit: '256kb' }))
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as express.Request).id,
      customProps: (req) => ({ user_id: (req as express.Request).user?.uid }),
    }),
  )
  app.use(generalRateLimit)

  app.use('/', apiRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
