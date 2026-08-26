import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/components/AuthProvider'
import { es } from '@/lib/strings'
import './globals.css'

export const metadata: Metadata = {
  title: es.brand.name,
  description: es.brand.tagline,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1d4ed8',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The product is in Spanish; screen readers and browsers need to be told.
    <html lang="es">
      <body className="min-h-full antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
