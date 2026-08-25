import { Router } from 'express'
import { healthRouter } from './health.js'
import { authRouter } from './auth.js'
import { orgsRouter } from './orgs.js'

export const apiRouter: Router = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/orgs', orgsRouter)

// Feature routes (/orgs/:orgId/locations, ...) are mounted here as each unit is built.
