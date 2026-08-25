import { describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import express from 'express'

vi.mock('../lib/firebase.js', () => ({
  db: () => ({ listCollections: vi.fn() }),
  auth: () => ({ verifyIdToken: vi.fn() }),
  getFirebaseApp: () => ({}),
}))

const { createApp } = await import('../app.js')
const { requestId } = await import('./requestId.js')
const { errorHandler } = await import('./errorHandler.js')
const { conflict } = await import('../lib/errors.js')

const app = express()
app.use(requestId)
app.get('/known', () => {
  throw conflict('Dates are invalid: the end is before the start.')
})
app.get('/unknown', () => {
  throw new Error('unexpected failure')
})
app.use(errorHandler)

describe('error responses', () => {
  it('maps a business-rule failure to its documented status and code', async () => {
    const res = await request(app).get('/known')

    expect(res.status).toBe(409)
    expect(res.body.error).toBe('conflict')
    expect(res.body.message).toContain('end is before the start')
    expect(res.body.request_id).toBeTruthy()
  })

  it('turns an unexpected failure into a generic 500', async () => {
    const res = await request(app).get('/unknown')

    expect(res.status).toBe(500)
    expect(res.body.error).toBe('internal_server_error')
    expect(res.body.request_id).toBeTruthy()
  })
})

describe('unknown routes on the real app', () => {
  it('answer 404 in the documented error shape', async () => {
    const res = await request(createApp()).get('/does-not-exist')

    expect(res.status).toBe(404)
    expect(res.body.error).toBe('not_found')
    expect(res.body.message).toBeTruthy()
    expect(res.body.request_id).toBeTruthy()
  })
})
