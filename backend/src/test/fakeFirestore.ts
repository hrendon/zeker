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

  orderBy(field: string): FakeQuery {
    return this.store.query(this.path).orderBy(field)
  }

  async get() {
    return this.store.query(this.path).get()
  }
}

export class FakeQuery {
  private rows: Array<{ id: string; path: string; data: Doc }>

  constructor(
    private readonly store: FakeFirestore,
    private readonly collectionPath: string,
    rows: Array<{ id: string; path: string; data: Doc }>,
  ) {
    this.rows = rows
  }

  where(field: string, op: string, value: unknown): FakeQuery {
    if (op !== '==') throw new Error(`FakeFirestore supports "==" only, got "${op}"`)
    this.rows = this.rows.filter((row) => row.data[field] === value)
    return this
  }

  orderBy(field: string): FakeQuery {
    this.rows = [...this.rows].sort((a, b) =>
      String(a.data[field] ?? '').localeCompare(String(b.data[field] ?? '')),
    )
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

  async get(ref: FakeDoc) {
    return ref.snapshot()
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
