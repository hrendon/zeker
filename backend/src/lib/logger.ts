import pino from 'pino'
import { env, isProduction, isTest } from '../config/env.js'

/**
 * On Cloud Run, JSON written to stdout is picked up by Google Cloud Logging.
 * `severity` and `message` are the field names Cloud Logging understands, so
 * the log level and text show up correctly instead of as opaque payload.
 */
export const logger = pino({
  level: isTest ? 'silent' : env.LOG_LEVEL,
  messageKey: isProduction ? 'message' : 'msg',
  formatters: isProduction
    ? { level: (label) => ({ severity: label.toUpperCase() }) }
    : undefined,
  // Never let a token, password, or authorization header reach the logs.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.refresh_token',
      'req.body.id_token',
    ],
    censor: '[redacted]',
  },
})
