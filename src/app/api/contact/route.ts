import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY missing" },
      { status: 500 }
    )
  }

  const resend = new Resend(apiKey)

  try {
    const {
      name,
      company,
      role,
      email,
      environment,
      message,
    } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const { error } = await resend.emails.send({
      from: "MNDe Systems <onboarding@mndesystems.com>",
      to: ["mndeproject@proton.me"],
      replyTo: email,
      subject: `New inquiry from ${name}`,
      text: `Name: ${name}
Company: ${company || "N/A"}
Role: ${role || "N/A"}
Email: ${email}
Environment: ${environment || "N/A"}

Message:
${message}`,
    })

    if (error) {
      return NextResponse.json(
        { error: "Email send failed" },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
