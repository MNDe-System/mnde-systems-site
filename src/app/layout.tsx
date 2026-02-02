import type { Metadata } from "next"
import "./globals.css"
import Script from "next/script"

export const metadata: Metadata = {
  title: {
    default: "MNDe Systems",
    template: "%s | MNDe Systems"
  },
  description: "Deterministic control for irreversible execution"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="f8396d68-c913-4e83-acea-977ed7b68cf1"
        />

        {children}
      </body>
    </html>
  )
}
