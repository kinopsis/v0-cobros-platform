import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/lib/auth-context"
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
})

export const metadata: Metadata = {
  title: 'Sistema de Gestión de Cobro Coactivo | DESAJ Antioquia',
  description: 'Plataforma web centralizada para la gestión integral de procesos de cobro coactivo de la Dirección Seccional de Administración Judicial de Antioquia',
  keywords: ['cobro coactivo', 'rama judicial', 'SIGOBIUS', 'gestión judicial', 'Colombia'],
  authors: [{ name: 'Dirección Seccional de Administración Judicial - Antioquia' }],
}

export const viewport: Viewport = {
  themeColor: '#1e3a5f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  )
}
