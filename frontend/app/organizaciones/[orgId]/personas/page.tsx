'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { OrgGate, OrgHeader, isAdmin, useOrgId } from '@/components/OrgShell'
import { ConfirmDialog, Field, ListRow, Notice, SubmitButton } from '@/components/ui'
import { ApiError, toSpanish } from '@/lib/errors'
import { membersApi, type AssignableRole, type Member, type Org } from '@/lib/api'
import { checkEmail, checkRequiredText } from '@/lib/validate'
import { es } from '@/lib/strings'
import { memberLabel } from '@/lib/members'

/**
 * The people who belong to one organization (Decision 006).
 *
 * A building administrator creates the accounts. The person then receives an
 * email from Firebase to set their own password — this screen asks Firebase to
 * send it, because our API never handles a password (Decision 002).
 *
 * What we keep about them is their name and their role. The email address goes
 * to Firebase, which is already where every user's email lives; it is never
 * written to our own database.
 */
export default function MembersPage() {
  const orgId = useOrgId()
  return <OrgGate orgId={orgId}>{(org) => <MembersScreen org={org} />}</OrgGate>
}

function roleLabel(role: Member['role']): string {
  if (role === 'admin') return es.roles.admin
  if (role === 'security') return es.roles.security
  return es.roles.responsable
}

function MembersScreen({ org }: { org: Org }) {
  const admin = isAdmin(org)

  const [members, setMembers] = useState<Member[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AssignableRole>('responsable')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [pending, setPending] = useState<Member | null>(null)
  const [pendingBusy, setPendingBusy] = useState(false)
  const [pendingError, setPendingError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoadError(null)
    membersApi
      .list(org.id)
      .then((result) => setMembers(result.members))
      .catch((error) => setLoadError(toSpanish(error)))
  }, [org.id])

  useEffect(load, [load])

  async function handleAdd(event: FormEvent) {
    event.preventDefault()

    const errors = {
      firstName: checkRequiredText(firstName, es.validation.firstNameRequired, 100),
      lastName: checkRequiredText(lastName, es.validation.lastNameRequired, 100),
      email: checkEmail(email),
    }
    setFieldErrors(errors)
    if (Object.values(errors).some(Boolean)) return

    setAdding(true)
    setFormError(null)
    setNotice(null)
    const address = email.trim()

    try {
      await membersApi.add(org.id, {
        email: address,
        first_name: firstName,
        last_name: lastName,
        role,
      })

      // Firebase sends the "set your password" email, exactly as the
      // password-recovery screen does. Our API sends no email of its own.
      let emailed = true
      try {
        await sendPasswordResetEmail(auth, address)
      } catch {
        // The person is a member either way. Telling the administrator the
        // truth beats a screen that claims an email was sent when it was not.
        emailed = false
      }

      setFirstName('')
      setLastName('')
      setEmail('')
      setRole('responsable')
      setShowForm(false)
      setNotice(emailed ? es.members.added : es.members.addedNoEmail)
      load()
    } catch (cause) {
      // The one conflict when adding is the administrator entering their own
      // address; they already belong here as an administrator.
      const self = cause instanceof ApiError && cause.code === 'conflict'
      setFormError(self ? es.members.selfConflict : toSpanish(cause))
    } finally {
      setAdding(false)
    }
  }

  async function runRemove() {
    if (!pending) return
    setPendingBusy(true)
    setPendingError(null)
    try {
      await membersApi.remove(org.id, pending.user_id)
      setPending(null)
      load()
    } catch (cause) {
      const conflict = cause instanceof ApiError && cause.code === 'conflict'
      setPendingError(conflict ? es.members.removeConflict : toSpanish(cause))
    } finally {
      setPendingBusy(false)
    }
  }

  return (
    <>
      <OrgHeader org={org} current="members" />

      <section className="rounded-2xl bg-[var(--color-surface)] p-6 ring-1 ring-[var(--color-line)]/60">
        <h2 className="text-base font-semibold">{es.members.title}</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{es.members.subtitle}</p>

        {!admin ? (
          <p className="mt-4 text-sm text-[var(--color-ink-faint)]">{es.org.adminOnlyNote}</p>
        ) : null}

        {notice ? (
          <div className="mt-5">
            <Notice kind="ok">{notice}</Notice>
          </div>
        ) : null}

        <div className="mt-5">
          {loadError ? (
            <div className="space-y-3">
              <Notice kind="error">{loadError}</Notice>
              <button
                type="button"
                onClick={load}
                className="h-11 rounded-lg border border-[var(--color-line)] bg-white px-4 text-sm font-medium"
              >
                {es.actions.retry}
              </button>
            </div>
          ) : !members ? (
            <p className="text-sm text-[var(--color-ink-soft)]">{es.common.loading}</p>
          ) : members.length === 0 ? (
            <div>
              <p className="text-sm text-[var(--color-ink-soft)]">{es.members.empty}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-faint)]">{es.members.emptyHint}</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-line)]/60">
              {members.map((member) => (
                <ListRow
                  key={member.user_id}
                  title={memberLabel(member)}
                  subtitle={`${roleLabel(member.role)} · ${member.email ?? es.members.noEmail}`}
                  actions={
                    admin && member.role !== 'admin'
                      ? [
                          {
                            label: es.members.remove,
                            danger: true,
                            onSelect: () => setPending(member),
                          },
                        ]
                      : []
                  }
                />
              ))}
            </ul>
          )}
        </div>

        {admin && members ? (
          <div className="mt-5 border-t border-[var(--color-line)]/60 pt-5">
            {showForm ? (
              <form onSubmit={handleAdd} noValidate className="space-y-4">
                {formError ? <Notice kind="error">{formError}</Notice> : null}

                <Field
                  label={es.members.firstName}
                  autoFocus
                  value={firstName}
                  disabled={adding}
                  error={fieldErrors.firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                />

                <Field
                  label={es.members.lastName}
                  value={lastName}
                  disabled={adding}
                  error={fieldErrors.lastName}
                  onChange={(event) => setLastName(event.target.value)}
                />

                <Field
                  label={es.members.email}
                  type="email"
                  inputMode="email"
                  hint={es.members.emailHint}
                  // A shared front-desk computer must not build a browsing
                  // history of residents in its autofill suggestions.
                  autoComplete="off"
                  value={email}
                  disabled={adding}
                  error={fieldErrors.email}
                  onChange={(event) => setEmail(event.target.value)}
                />

                <div>
                  <label
                    htmlFor="member-role"
                    className="block text-sm font-medium text-[var(--color-ink)]"
                  >
                    {es.members.role}
                  </label>
                  <select
                    id="member-role"
                    value={role}
                    disabled={adding}
                    onChange={(event) => setRole(event.target.value as AssignableRole)}
                    className="mt-1.5 block h-11 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 text-base disabled:bg-[var(--color-canvas)]"
                  >
                    <option value="responsable">{es.members.roleResponsable}</option>
                    <option value="security">{es.members.roleSecurity}</option>
                  </select>
                  <p className="mt-1.5 text-sm text-[var(--color-ink-faint)]">
                    {role === 'security'
                      ? es.members.roleSecurityHint
                      : es.members.roleResponsableHint}
                  </p>
                </div>

                <p className="text-sm text-[var(--color-ink-faint)]">{es.members.privacyNote}</p>

                <div className="flex flex-col gap-2 sm:flex-row-reverse">
                  <SubmitButton busy={adding}>
                    {adding ? es.members.adding : es.members.add}
                  </SubmitButton>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setFormError(null)
                      setFieldErrors({})
                    }}
                    disabled={adding}
                    className="h-11 rounded-lg border border-[var(--color-line)] bg-white px-4 text-sm font-medium disabled:opacity-60 sm:w-40"
                  >
                    {es.actions.cancel}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowForm(true)
                  setNotice(null)
                }}
                className="flex h-11 w-full items-center justify-center rounded-lg bg-[var(--color-brand)] px-4 text-base font-medium text-white hover:bg-[var(--color-brand-dark)]"
              >
                {members.length <= 1 ? es.members.addFirst : es.members.add}
              </button>
            )}
          </div>
        ) : null}
      </section>

      <ConfirmDialog
        open={pending !== null}
        title={es.members.removeConfirmTitle}
        body={es.members.removeConfirmBody}
        confirmLabel={es.members.remove}
        busyLabel={es.actions.saving}
        danger
        busy={pendingBusy}
        error={pendingError}
        onConfirm={runRemove}
        onCancel={() => {
          setPending(null)
          setPendingError(null)
        }}
      />
    </>
  )
}
