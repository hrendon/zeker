import { Router } from 'express'
import { healthRouter } from './health.js'

export const apiRouter: Router = Router()

apiRouter.use('/health', healthRouter)

// Feature routes (/auth, /orgs, ...) are mounted here as each unit is built.
