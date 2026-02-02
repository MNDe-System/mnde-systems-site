import type { Metadata } from "next"
import "./globals.css"
import Script from "next/script"
import dynamic from "next/dynamic"

const VisualEditsMessenger = dynamic(
  () => import("../visual-edits/VisualEditsMessenger"),
  { ssr: false }
)

const ErrorReporter = dynamic(
  () => import("@/components/ErrorReporter"),
  { ssr: false }
)

export const metadata: Metadata = {
  title: "MNDe Systems",
  description: "Deterministic control for irreversible execution"
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="lazyOnload"
          data-orchids-project-id="f8396d68-c913-4e83-acea-977ed7b68cf1"
        />

        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/route-messenger.js"
          strategy="lazyOnload"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
        />

        {children}

        <ErrorReporter />
        <VisualEditsMessenger />
      </body>
    </html>
  )
}
