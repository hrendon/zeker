import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  // The browser only ever talks to Firebase Auth and to our own API. Nothing
  // else is allowed to load, so a script injected into a page cannot phone home.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ]
  },
}

export default config
