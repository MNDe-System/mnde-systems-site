## Project Summary
MNDe Systems official website. A high-integrity, deterministic control systems company focused on infrastructure compliance and control.
Contact: MNDeproject@proton.me | 231-420-9108

## Tech Stack
- Framework: Next.js 15+
- Language: TypeScript
- Styling: Tailwind CSS
- Components: React
- Email: Resend

## Architecture
- `src/app/page.tsx`: Single page containing all sections.
- `src/app/api/contact/route.ts`: API route for contact form processing via Resend.
- `src/components/Calculator.tsx`: ACRL cost and waste calculator logic and UI.
- `src/components/ContactForm.tsx`: Contact form with Resend integration and mailto fallback.
- `src/app/globals.css`: Brand theme, colors, and global styles.

## User Preferences
- Tone: infrastructure, compliance, control systems, calm, exact.
- Style: short sentences, active voice, no hype, no metaphors.
- Typography: System fonts only.
- Layout: Max width 1080px, left-aligned, 1px border separators.
- Forbidden words: smart, seamless, revolutionary, next generation, platform, AI powered.
- No rounded pills, no gradients, no shadows.

## Project Guidelines
- Keep all content in HTML at first paint (SSR).
- Minimal data retention by default.
- Fail closed behavior.

## Common Patterns
- Section-based layout with 1px border lines.
- Squared buttons with borders only.
- Monospace font for numbers and code.
