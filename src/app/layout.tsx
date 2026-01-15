import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Website Cooker',
    template: '%s | Website Cooker',
  },
  description: 'Extract design systems and generate pixel-perfect websites',
  keywords: ['website builder', 'design system', 'extraction', 'React', 'Tailwind CSS'],
  authors: [{ name: 'Website Cooker' }],
  creator: 'Website Cooker',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} ${inter.variable} antialiased min-h-screen bg-background text-foreground`}>
        {children}
      </body>
    </html>
  )
}
