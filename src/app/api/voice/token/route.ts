import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST() {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'xAI API key not configured. Set XAI_API_KEY in env.' }, { status: 500 })
  }

  try {
    const res = await fetch('https://api.x.ai/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ expires_after: { seconds: 300 } }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error(`xAI token error (${res.status}):`, errText.slice(0, 300))
      return NextResponse.json({
        error: `xAI API returned ${res.status}`,
        detail: errText.slice(0, 200),
      }, { status: 502 })
    }

    const data = await res.json()

    const token =
      data.client_secret?.value ??
      data.secret ??
      data.token ??
      (typeof data.value === 'string' ? data.value : null)

    if (!token) {
      console.error('xAI token response unexpected shape:', JSON.stringify(data).slice(0, 300))
      return NextResponse.json({ error: 'Unexpected response from xAI' }, { status: 502 })
    }

    return NextResponse.json({
      token,
      expires_at: data.client_secret?.expires_at ?? data.expires_at ?? Date.now() + 300000,
    })
  } catch (e) {
    console.error('xAI token exception:', e)
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: `Token creation failed: ${msg}` }, { status: 502 })
  }
}
