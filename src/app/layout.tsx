import './globals.css'
import type { ReactNode } from "react";
import PostHogInit from "@/components/PostHogInit";

import { Lexend } from 'next/font/google'

const lexend = Lexend({ subsets: ['latin'] })

export const metadata = {
  title: 'AI Interview Prep',
  description: 'Practice PM interviews with AI feedback',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={lexend.className}>
        {children}
      </body>
    </html>
  )
}
