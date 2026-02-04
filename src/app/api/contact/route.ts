export const runtime = "nodejs"


import { Resend } from "resend"
import { NextResponse } from "next/server"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { name, company, role, email, environment, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const result = await resend.emails.send({
      from: "MNDe Systems <contact@mndesystems.com>",
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

    if (result.error) {
      console.error("Resend error:", result.error)
      return NextResponse.json(
        { error: "Email send failed" },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("API error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
