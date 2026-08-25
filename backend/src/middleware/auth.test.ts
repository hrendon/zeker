import { describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import express from 'express'

const verifyIdToken = vi.fn()
vi.mock('../lib/firebase.js', () => ({
  db: () => ({ listCollections: vi.fn() }),
  auth: () => ({ verifyIdToken }),
  getFirebaseApp: () => ({}),
}))

const { requireAuth } = await import('./auth.js')
const { requestId } = await import('./requestId.js')
const { errorHandler } = await import('./errorHandler.js')

// A minimal pipeline around the middleware under test: correlation id in,
// protected route, shared error handler out.
const app = express()
app.use(requestId)
app.get('/whoami', requireAuth, (req, res) => {
  res.json({ uid: req.user?.uid, email: req.user?.email })
})
app.use(errorHandler)

describe('requireAuth', () => {
  it('rejects a request with no Authorization header', async () => {
    const res = await request(app).get('/whoami')

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('unauthorized')
    expect(res.body.request_id).toBeTruthy()
  })

  it('rejects a header that is not a Bearer token', async () => {
    const res = await request(app).get('/whoami').set('Authorization', 'Basic abc123')

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('unauthorized')
  })

  it('rejects a token Firebase does not accept', async () => {
    verifyIdToken.mockRejectedValueOnce(new Error('token expired'))

    const res = await request(app).get('/whoami').set('Authorization', 'Bearer expired')

    expect(res.status).toBe(401)
    expect(res.body.message).toContain('sign in again')
  })

  it('never leaks the reason Firebase rejected the token', async () => {
    verifyIdToken.mockRejectedValueOnce(new Error('kid mismatch: internal detail'))

    const res = await request(app).get('/whoami').set('Authorization', 'Bearer bad')

    expect(JSON.stringify(res.body)).not.toContain('kid mismatch')
  })

  it('accepts a valid token and exposes the caller', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'user_xyz789', email: 'juan@example.com' })

    const res = await request(app).get('/whoami').set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ uid: 'user_xyz789', email: 'juan@example.com' })
    // checkRevoked=true: a revoked session must stop working immediately.
    expect(verifyIdToken).toHaveBeenCalledWith('good', true)
  })
})
