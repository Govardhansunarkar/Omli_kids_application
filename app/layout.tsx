import './globals.css'
import type { Metadata } from 'next'
import React from 'react'
import { AuthProvider } from './context/AuthContext'

export const metadata: Metadata = {
  title: 'Monu',
  description: 'A friendly talking AI for kids',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}