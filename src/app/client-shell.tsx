"use client"

import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger"
import ErrorReporter from "@/components/ErrorReporter"
import Script from "next/script"

export default function ClientShell() {
  return (
    <>
      <ErrorReporter />
      <Script
        src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/route-messenger.js"
        strategy="afterInteractive"
        data-target-origin="*"
        data-message-type="ROUTE_CHANGE"
        data-include-search-params="true"
        data-only-in-iframe="true"
        data-debug="true"
      />
      <VisualEditsMessenger />
    </>
  )
}
