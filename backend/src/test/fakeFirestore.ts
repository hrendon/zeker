import { vi } from 'vitest'

/**
 * A small in-memory stand-in for Firestore, good enough for route tests.
 *
 * Documents are held in one flat map keyed by their full path
 * ("orgs/org_a/locations/loc_1"), which is how Firestore addresses them too, so
 * subcollections need no special handling.
 *
 * Deliberate simplification: a transaction applies its writes immediately
 * rather than buffering them for an atomic commit. Every transaction in this
 * codebase performs all its reads and all its checks before its first write, so
 * a rejected transaction writes nothing either way. Tests that need to prove
 * "nothing was written" assert on the store, which stays accurate.
 */

export type Doc = Record<string, unknown>

const INCREMENT = Symbol('increment')
const ARRAY_UNION = Symbol('arrayUnion')
const SERVER_TIMESTAMP = Symbol('serverTimestamp')

export const FieldValue = {
  increment: (by: number) => ({ [INCREMENT]: by }),
  arrayUnion: (...items: unknown[]) => ({ [ARRAY_UNION]: items }),
  serverTimestamp: () => ({ [SERVER_TIMESTAMP]: true }),
}

function isSentinel(value: unknown, key: symbol): boolean {
  return typeof value === 'object' && value !== null && key in value
}

function resolve(current: unknown, incoming: unknown): unknown {
  if (isSentinel(incoming, INCREMENT)) {
    const by = (incoming as { [INCREMENT]: number })[INCREMENT] ?? 0
    return (typeof current === 'number' ? current : 0) + by
  }
  if (isSentinel(incoming, ARRAY_UNION)) {
    const items = (incoming as { [ARRAY_UNION]: unknown[] })[ARRAY_UNION] ?? []
    return [...(Array.isArray(current) ? current : []), ...items]
  }
  if (isSentinel(incoming, SERVER_TIMESTAMP)) {
    const at = new Date()
    return { toDate: () => at }
  }
  return incoming
}

/** Applies one field, honouring dotted paths such as "counts.locations". */
function assign(target: Doc, field: string, value: unknown): void {
  const parts = field.split('.')
  let cursor = target
  for (const part of parts.slice(0, -1)) {
    const existing = cursor[part]
    cursor[part] = typeof existing === 'object' && existing !== null ? { ...(existing as Doc) } : {}
    cursor = cursor[part] as Doc
  }
  const last = parts[parts.length - 1]!
  cursor[last] = resolve(cursor[last], value)
}

export class FakeFirestore {
  readonly docs = new Map<string, Doc>()
  /** Every write performed, in order — for asserting that nothing was written. */
  readonly writes: Array<{ op: string; path: string }> = []
  private autoId = 0

  reset(): void {
    this.docs.clear()
    this.writes.length = 0
    this.autoId = 0
  }

  /** Puts a document in place without going through the API. */
  seed(path: string, data: Doc): void {
    this.docs.set(path, { ...data })
  }

  private write(op: string, path: string, data: Doc, merge: boolean): void {
    this.writes.push({ op, path })
    const base = merge ? { ...(this.docs.get(path) ?? {}) } : {}
    for (const [field, value] of Object.entries(data)) assign(base, field, value)
    this.docs.set(path, base)
  }

  private remove(path: string): void {
    this.writes.push({ op: 'delete', path })
    this.docs.delete(path)
  }

  /** Documents directly inside a collection path (not deeper descendants). */
  private childrenOf(collectionPath: string): Array<{ id: string; path: string; data: Doc }> {
    const prefix = `${collectionPath}/`
    const rows: Array<{ id: string; path: string; data: Doc }> = []
    for (const [path, data] of this.docs) {
      if (!path.startsWith(prefix)) continue
      const rest = path.slice(prefix.length)
      if (rest.includes('/')) continue
      rows.push({ id: rest, path, data })
    }
    return rows
  }

  collection(path: string): FakeCollection {
    return new FakeCollection(this, path)
  }

  doc(path: string): FakeDoc {
    return new FakeDoc(this, path)
  }

  nextId(): string {
    return `auto${++this.autoId}`
  }

  query(collectionPath: string): FakeQuery {
    return new FakeQuery(this, collectionPath, this.childrenOf(collectionPath))
  }

  // ---- the surface the application actually calls ----

  async getAll(...refs: FakeDoc[]) {
    return refs.map((ref) => ref.snapshot())
  }

  batch() {
    const queued: Array<() => void> = []
    return {
      set: (ref: FakeDoc, data: Doc, options?: { merge?: boolean }) => {
        queued.push(() => this.write('batch.set', ref.path, data, options?.merge === true))
      },
      update: (ref: FakeDoc, data: Doc) => {
        queued.push(() => this.write('batch.update', ref.path, data, true))
      },
      delete: (ref: FakeDoc) => {
        queued.push(() => this.remove(ref.path))
      },
      commit: async () => {
        queued.forEach((run) => run())
      },
    }
  }

  async runTransaction<T>(fn: (tx: FakeTransaction) => Promise<T>): Promise<T> {
    return fn(new FakeTransaction(this))
  }

  listCollections = vi.fn()

  // Used by FakeDoc / FakeTransaction.
  internalWrite(op: string, path: string, data: Doc, merge: boolean): void {
    this.write(op, path, data, merge)
  }

  internalRemove(path: string): void {
    this.remove(path)
  }
}

export class FakeDoc {
  constructor(
    private readonly store: FakeFirestore,
    readonly path: string,
  ) {}

  get id(): string {
    return this.path.split('/').pop()!
  }

  snapshot() {
    const data = this.store.docs.get(this.path)
    return { id: this.id, exists: data !== undefined, data: () => data, ref: this }
  }

  async get() {
    return this.snapshot()
  }

  async set(data: Doc, options?: { merge?: boolean }) {
    this.store.internalWrite('set', this.path, data, options?.merge === true)
  }

  async update(data: Doc) {
    this.store.internalWrite('update', this.path, data, true)
  }

  async delete() {
    this.store.internalRemove(this.path)
  }

  collection(name: string): FakeCollection {
    return new FakeCollection(this.store, `${this.path}/${name}`)
  }
}

export class FakeCollection {
  constructor(
    private readonly store: FakeFirestore,
    readonly path: string,
  ) {}

  doc(id?: string): FakeDoc {
    return new FakeDoc(this.store, `${this.path}/${id ?? this.store.nextId()}`)
  }

  where(field: string, op: string, value: unknown): FakeQuery {
    return this.store.query(this.path).where(field, op, value)
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): FakeQuery {
    return this.store.query(this.path).orderBy(field, direction)
  }

  async get() {
    return this.store.query(this.path).get()
  }
}

/**
 * Orders two stored values the way Firestore does.
 *
 * Timestamps come back from the real SDK as objects with `toDate()`, and this
 * double stores either those or plain Dates. Sorting them with `String()`
 * yields "[object Object]" for every row, so an `orderBy` on `created_at`
 * silently becomes no ordering at all — a double that answers a question real
 * Firestore would answer differently, which is exactly the failure R-16 is
 * about.
 */
function comparable(value: unknown): number | string {
  if (value instanceof Date) return value.getTime()
  const maybe = value as { toDate?: () => Date } | null | undefined
  if (maybe && typeof maybe.toDate === 'function') return maybe.toDate().getTime()
  if (typeof value === 'number') return value
  return String(value ?? '')
}

function compareValues(a: unknown, b: unknown): number {
  const x = comparable(a)
  const y = comparable(b)
  if (typeof x === 'number' && typeof y === 'number') return x - y
  return String(x).localeCompare(String(y))
}

/** Compares two stored objects by content, as Firestore does — not by key order. */
function stableKey(value: unknown): string {
  if (typeof value !== 'object' || value === null) return JSON.stringify(value)
  const entries = Object.entries(value as Doc).sort(([a], [b]) => a.localeCompare(b))
  return JSON.stringify(entries)
}

export class FakeQuery {
  private rows: Array<{ id: string; path: string; data: Doc }>
  private ordered?: { field: string; direction: 'asc' | 'desc' }

  constructor(
    private readonly store: FakeFirestore,
    private readonly collectionPath: string,
    rows: Array<{ id: string; path: string; data: Doc }>,
  ) {
    this.rows = rows
  }

  where(field: string, op: string, value: unknown): FakeQuery {
    if (op === '==') {
      this.rows = this.rows.filter((row) => row.data[field] === value)
      return this
    }
    // Permits are found by a range on valid_to ("still live"), which in real
    // Firestore needs the composite indexes in firestore.indexes.json. The
    // stored value is an ISO 8601 UTC string, so comparing it as a string
    // orders it chronologically — see lib/permits.ts.
    if (op === '>' || op === '>=' || op === '<' || op === '<=') {
      this.rows = this.rows.filter((row) => {
        const held = row.data[field]
        if (held === undefined || held === null) return false
        const a = String(held)
        const b = String(value)
        if (op === '>') return a > b
        if (op === '>=') return a >= b
        if (op === '<') return a < b
        return a <= b
      })
      return this
    }
    // Used by the entry history: a responsable sees the events of the interiors
    // they are in charge of. The 30-value cap is real Firestore's, and it is
    // enforced here so a double never accepts a query the database would
    // reject.
    if (op === 'in') {
      const wanted = value as unknown[]
      if (!Array.isArray(wanted)) throw new Error('FakeFirestore: "in" needs an array')
      if (wanted.length === 0 || wanted.length > 30) {
        throw new Error(`FakeFirestore: "in" takes 1 to 30 values, got ${wanted.length}`)
      }
      this.rows = this.rows.filter((row) => wanted.includes(row.data[field] as never))
      return this
    }
    // Membership is stored as objects inside users/{uid}.orgs[], so listing an
    // organization's members matches on any of the {org_id, role} shapes.
    if (op === 'array-contains-any') {
      const wanted = (value as unknown[]).map(stableKey)
      this.rows = this.rows.filter((row) => {
        const held = row.data[field]
        return Array.isArray(held) && held.some((item) => wanted.includes(stableKey(item)))
      })
      return this
    }
    throw new Error(`FakeFirestore does not support "${op}"`)
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): FakeQuery {
    const sign = direction === 'desc' ? -1 : 1
    this.rows = [...this.rows].sort((a, b) => sign * compareValues(a.data[field], b.data[field]))
    this.ordered = { field, direction }
    return this
  }

  /**
   * Continues after a document, as Firestore's cursor does.
   *
   * Positional, not value-based: the row itself is found in the current
   * ordering and everything up to and including it is dropped. Two events
   * written in the same millisecond therefore cannot make a page skip one,
   * which a timestamp cursor would.
   */
  startAfter(snapshot: { id: string }): FakeQuery {
    if (!this.ordered) throw new Error('FakeFirestore: startAfter needs an orderBy')
    const at = this.rows.findIndex((row) => row.id === snapshot.id)
    this.rows = at === -1 ? [] : this.rows.slice(at + 1)
    return this
  }

  limit(count: number): FakeQuery {
    this.rows = this.rows.slice(0, count)
    return this
  }

  async get() {
    const docs = this.rows.map((row) => ({
      id: row.id,
      exists: true,
      data: () => row.data,
      ref: new FakeDoc(this.store, row.path),
    }))
    return { empty: docs.length === 0, size: docs.length, docs }
  }
}

export class FakeTransaction {
  constructor(private readonly store: FakeFirestore) {}

  /** Firestore transactions can read a single document or run a query. */
  async get(target: FakeDoc): Promise<ReturnType<FakeDoc['snapshot']>>
  async get(target: FakeQuery): Promise<Awaited<ReturnType<FakeQuery['get']>>>
  async get(target: FakeDoc | FakeQuery): Promise<unknown> {
    return target instanceof FakeQuery ? target.get() : target.snapshot()
  }

  set(ref: FakeDoc, data: Doc, options?: { merge?: boolean }): void {
    this.store.internalWrite('tx.set', ref.path, data, options?.merge === true)
  }

  update(ref: FakeDoc, data: Doc): void {
    this.store.internalWrite('tx.update', ref.path, data, true)
  }

  delete(ref: FakeDoc): void {
    this.store.internalRemove(ref.path)
  }
}
