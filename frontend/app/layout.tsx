import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/geist-mono/400.css'
import '@fontsource/geist-mono/500.css'
import '@fontsource/geist-mono/700.css'
import './globals.css'
import { ParticleWaveField } from '@/components/particle-wave-field'

export const metadata: Metadata = {
  title: 'CyberCarnival 2026 — SRM Ramapuram',
  description:
    'CyberCarnival 2026 — the cybersecurity symposium of SRM Ramapuram. Where cybersecurity meets innovation. 14 August 2026.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#151119',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className="bg-background"
    >
      <body className="antialiased font-sans">
        <ParticleWaveField className="fixed z-0" opacity={0.5} />
        <div className="relative z-10">{children}</div>
        <Analytics />
      </body>
    </html>
  )
}
