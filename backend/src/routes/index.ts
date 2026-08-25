import { Router } from 'express'
import { healthRouter } from './health.js'
import { authRouter } from './auth.js'

export const apiRouter: Router = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/auth', authRouter)

// Feature routes (/orgs, ...) are mounted here as each unit is built.
