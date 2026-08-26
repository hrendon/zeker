'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { FullPageMessage } from '@/components/ui'
import { es } from '@/lib/strings'

/**
 * The front door. Sends the visitor to sign-in or to their home screen once
 * Firebase has told us which one applies.
 */
export default function RootPage() {
  const { status } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    router.replace(status === 'signed-in' ? '/inicio' : '/entrar')
  }, [status, router])

  return <FullPageMessage>{es.common.loading}</FullPageMessage>
}
