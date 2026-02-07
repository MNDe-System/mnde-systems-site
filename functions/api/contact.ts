export async function onRequestPost({
  request,
  env
}: {
  request: Request
  env: Record<string, string>
}) {
  return new Response(
    JSON.stringify({
      hasKey: !!env.RESEND_API_KEY,
      keys: Object.keys(env)
    }),
    { status: 200 }
  )
}
