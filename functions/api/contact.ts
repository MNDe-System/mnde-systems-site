type Env = {
  RESEND_API_KEY: string
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ hasKey: false, keys: Object.keys(env || {}) }),
      { status: 500 }
    )
  }

  const body = await request.json()

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "MNDe Systems <onboarding@mndesystems.com>",
      to: ["mndeproject@proton.me"],
      subject: "Contact test",
      text: JSON.stringify(body, null, 2)
    })
  })

  return new Response(JSON.stringify({ ok: res.ok }), {
    headers: { "Content-Type": "application/json" }
  })
}
