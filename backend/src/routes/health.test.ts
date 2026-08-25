import { describe, expect, it, vi } from 'vitest'
import request from 'supertest'

const listCollections = vi.fn()
vi.mock('../lib/firebase.js', () => ({
  db: () => ({ listCollections }),
  auth: () => ({ verifyIdToken: vi.fn() }),
  getFirebaseApp: () => ({}),
}))

const { createApp } = await import('../app.js')
const app = createApp()

describe('GET /health', () => {
  it('reports the service as up and echoes a request id', async () => {
    const res = await request(app).get('/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.service).toBe('zeker-api')
    expect(res.body.request_id).toMatch(/^req_/)
    expect(res.headers['x-request-id']).toBe(res.body.request_id)
  })

  it('honours a caller-supplied correlation id', async () => {
    const res = await request(app).get('/health').set('X-Request-Id', 'req_from_caller')

    expect(res.body.request_id).toBe('req_from_caller')
  })
})

describe('GET /health/ready', () => {
  it('reports ready when Firestore answers', async () => {
    listCollections.mockResolvedValueOnce([])

    const res = await request(app).get('/health/ready')

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'ready', dependencies: { firestore: 'ok' } })
  })

  it('reports unavailable when Firestore cannot be reached', async () => {
    listCollections.mockRejectedValueOnce(new Error('could not load the default credentials'))

    const res = await request(app).get('/health/ready')

    expect(res.status).toBe(503)
    expect(res.body).toMatchObject({
      status: 'unavailable',
      dependencies: { firestore: 'unreachable' },
    })
  })
})
