import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import type { Request } from 'express'
import { isTest } from '../config/env.js'

/**
 * Limits come from docs/architecture/api.md, "Rate Limiting".
 * Authenticated calls are counted per user; anonymous ones per IP.
 */
function keyByUserOrIp(req: Request): string {
  return req.user?.uid ?? ipKeyGenerator(req.ip ?? 'unknown')
}

function build(limit: number, keyGenerator: (req: Request) => string) {
  return rateLimit({
    windowMs: 60_000,
    limit,
    // api.md documents the X-RateLimit-* headers, which are the legacy set.
    standardHeaders: false,
    legacyHeaders: true,
    keyGenerator,
    // Rate limiting would make test runs order-dependent, so it is off there.
    skip: () => isTest,
    handler: (req, res) => {
      res.status(429).json({
        error: 'rate_limited',
        message: 'Too many requests. Please wait a moment and try again.',
        request_id: req.id,
      })
    },
  })
}

// There is deliberately no stricter limit for /auth/*. Sign-up, sign-in and
// password reset happen at Firebase, not here (Decision 002), so no route on
// this API can be used to guess a password. A 5-per-minute-per-IP limit would
// also lock out colleagues sharing one office IP address.

/** 100 requests per minute per user — the entry-validation endpoint. */
export const validateRateLimit = build(100, keyByUserOrIp)

/** 60 requests per minute per user — everything else. */
export const generalRateLimit = build(60, keyByUserOrIp)
