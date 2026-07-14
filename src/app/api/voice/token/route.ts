import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

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
      const err = await res.text().catch(() => '')
      console.error(`xAI token error (${res.status}):`, err.slice(0, 200))
      return NextResponse.json({ error: 'Failed to create token' }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json({
      token: data.client_secret?.value ?? data.secret ?? data.token,
      expires_at: data.client_secret?.expires_at ?? data.expires_at ?? Date.now() + 300000,
    })
  } catch (e) {
    console.error('xAI token exception:', e)
    return NextResponse.json({ error: 'Token creation failed' }, { status: 502 })
  }
}
