export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY missing" }),
      { status: 500 }
    )
  }

  let payload
  try {
    payload = await request.json()
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      { status: 400 }
    )
  }

  const {
    name,
    company,
    role,
    email,
    environment,
    message
  } = payload

  if (!name || !email || !message) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400 }
    )
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "MNDe Systems <onboarding@mndesystems.com>",
      to: ["mndeproject@proton.me"],
      reply_to: email,
      subject: `New inquiry from ${name}`,
      text:
`Name: ${name}
Company: ${company || "N/A"}
Role: ${role || "N/A"}
Email: ${email}
Environment: ${environment || "N/A"}

Message:
${message}`
    })
  })

  if (!res.ok) {
    const err = await res.text()
    return new Response(
      JSON.stringify({ error: "Email send failed", detail: err }),
      { status: 500 }
    )
  }

  return new Response(
    JSON.stringify({ ok: true }),
    { status: 200 }
  )
}
