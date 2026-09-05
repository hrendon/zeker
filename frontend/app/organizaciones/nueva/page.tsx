'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { AuthCard, Field, Notice, SubmitButton, TextLink } from '@/components/ui'
import { toSpanish } from '@/lib/errors'
import { orgsApi, type OrgType } from '@/lib/api'
import { checkRequiredText } from '@/lib/validate'
import { es } from '@/lib/strings'

const TYPES: Array<{ value: OrgType; label: string }> = [
  { value: 'residence', label: es.orgs.typeResidence },
  { value: 'school', label: es.orgs.typeSchool },
  { value: 'office', label: es.orgs.typeOffice },
  { value: 'other', label: es.orgs.typeOther },
]

/**
 * Creating an organization. Whoever creates it becomes its administrator.
 *
 * Only the fields the API accepts are sent, and only when they have something
 * in them — the API rejects unknown or empty optional fields outright. There is
 * deliberately no street-address field: city and country are enough, and for a
 * residential customer an address plus an apartment number plus a permit would
 * reveal exactly where a named person lives.
 */
export default function NewOrgPage() {
  const { status } = useAuth()
  const router = useRouter()

  const [name, setName] = useState('')
  const [type, setType] = useState<OrgType>('residence')
  const [description, setDescription] = useState('')
  const [taxId, setTaxId] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [nameError, setNameError] = useState<string | undefined>()
  const [taxIdError, setTaxIdError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (status === 'signed-out') router.replace('/entrar')
  }, [status, router])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const error = checkRequiredText(name, es.validation.orgNameRequired, 120)
    setNameError(error)
    // Decisión 019. Se revisa la forma, no el dígito de verificación: un
    // algoritmo mal recordado rechazaría a un edificio real, que cuesta más
    // que el error de tipeo que atraparía.
    const digits = taxId.replace(/[^0-9]/g, '')
    const taxError =
      digits.length >= 8 && digits.length <= 11 ? undefined : es.orgs.taxIdInvalid
    setTaxIdError(taxError)
    if (error || taxError) return

    setBusy(true)
    setFormError(null)
    try {
      const org = await orgsApi.create({ name, type, tax_id: taxId, description, city, country })
      router.replace(`/organizaciones/${org.id}/sedes`)
    } catch (cause) {
      setFormError(toSpanish(cause))
      setBusy(false)
    }
  }

  return (
    <AuthCard
      title={es.orgs.createTitle}
      subtitle={es.orgs.createSubtitle}
      footer={<TextLink href="/inicio">{es.nav.backToOrgs}</TextLink>}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError ? <Notice kind="error">{formError}</Notice> : null}

        <Field
          label={es.orgs.name}
          placeholder={es.orgs.namePlaceholder}
          autoFocus
          value={name}
          disabled={busy}
          error={nameError}
          onChange={(event) => setName(event.target.value)}
        />

        <div>
          <label
            htmlFor="org-type"
            className="block text-sm font-medium text-[var(--color-ink)]"
          >
            {es.orgs.type}
          </label>
          <select
            id="org-type"
            value={type}
            disabled={busy}
            onChange={(event) => setType(event.target.value as OrgType)}
            className="mt-1.5 block h-11 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 text-base text-[var(--color-ink)] disabled:bg-[var(--color-canvas)]"
          >
            {TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <Field
          label={es.orgs.taxId}
          placeholder={es.orgs.taxIdPlaceholder}
          hint={es.orgs.taxIdHint}
          inputMode="numeric"
          value={taxId}
          disabled={busy}
          error={taxIdError}
          onChange={(event) => setTaxId(event.target.value)}
        />

        <Field
          label={es.orgs.description}
          value={description}
          disabled={busy}
          onChange={(event) => setDescription(event.target.value)}
        />

        <Field
          label={es.orgs.city}
          value={city}
          disabled={busy}
          onChange={(event) => setCity(event.target.value)}
        />

        <Field
          label={es.orgs.country}
          hint={es.orgs.countryHint}
          maxLength={2}
          value={country}
          disabled={busy}
          onChange={(event) => setCountry(event.target.value.toUpperCase())}
        />

        <p className="text-sm text-[var(--color-ink-faint)]">{es.orgs.noAddressNote}</p>

        <SubmitButton busy={busy}>{busy ? es.orgs.creating : es.orgs.create}</SubmitButton>
      </form>
    </AuthCard>
  )
}
