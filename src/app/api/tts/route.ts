import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const GEMINI_API_KEY = process.env.AI_FALLBACK_API_KEY
const GEMINI_TTS_MODEL = 'gemini-3.1-flash-tts-preview'

const VOICES: Record<string, string> = {
  default: 'en-IN-Prabhat',
  kavya: 'en-IN-Neerja',
}

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get('text')
  const voice = req.nextUrl.searchParams.get('voice') || 'default'

  if (!text) {
    return NextResponse.json({ error: 'Missing text param' }, { status: 400 })
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'TTS not configured' }, { status: 500 })
  }

  const voiceName = VOICES[voice] || VOICES.default

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ['audio'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        }),
      }
    )

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.error(`Gemini TTS error (${res.status}):`, errBody.slice(0, 200))
      return NextResponse.json({ error: 'TTS synthesis failed' }, { status: 502 })
    }

    const data = await res.json()
    const audioPart = data?.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData?.mimeType?.startsWith('audio/')
    )

    if (!audioPart?.inlineData?.data) {
      return NextResponse.json({ error: 'No audio in response' }, { status: 502 })
    }

    const audio = new Uint8Array(Buffer.from(audioPart.inlineData.data, 'base64'))
    return new NextResponse(audio as BodyInit, {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=3600' },
    })
  } catch (e) {
    console.error('Gemini TTS exception:', e)
    return NextResponse.json({ error: 'TTS synthesis failed' }, { status: 502 })
  }
}
