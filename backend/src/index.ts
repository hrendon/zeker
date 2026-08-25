import { createApp } from './app.js'
import { env } from './config/env.js'
import { logger } from './lib/logger.js'

const app = createApp()

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, environment: env.NODE_ENV }, 'Zeker API listening')
})

/**
 * Cloud Run sends SIGTERM before shutting an instance down. Closing the server
 * lets in-flight requests finish instead of being cut off mid-response.
 */
function shutdown(signal: string): void {
  logger.info({ signal }, 'Shutting down')
  server.close((error) => {
    if (error) {
      logger.error({ err: error }, 'Error during shutdown')
      process.exit(1)
    }
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
