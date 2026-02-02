import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const { name, company, role, email, environment, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MNDe Systems <onboarding@resend.dev>",
        to: ["MNDeproject@proton.me"],
        reply_to: email,
        subject: `New inquiry from ${name}`,
        text: `
Name: ${name}
Company: ${company || "N/A"}
Role: ${role || "N/A"}
Email: ${email}
Environment: ${environment}

Message:
${message}
        `,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
