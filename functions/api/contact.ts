import { Resend } from "resend"

export async function onRequestPost(context: any) {
  const { request, env } = context

  if (!env.RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY missing" }),
      { status: 500 }
    )
  }

  const resend = new Resend(env.RESEND_API_KEY)

  try {
    const {
      name,
      company,
      role,
      email,
      environment,
      message
    } = await request.json()

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
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
${message}`
    })

    if (error) {
      return new Response(
        JSON.stringify({ error: "Email send failed" }),
        { status: 500 }
      )
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    )
  }
}
