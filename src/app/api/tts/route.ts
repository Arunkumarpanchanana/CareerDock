import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const GEMINI_API_KEY = process.env.AI_FALLBACK_API_KEY
const GEMINI_TTS_MODEL = 'gemini-3.1-flash-tts-preview'

const VOICES: Record<string, string> = {
  default: 'en-IN-Standard-A',
  kavya: 'en-IN-Neerja',
}

async function geminiTTS(text: string, voiceName: string): Promise<Uint8Array | null> {
  if (!GEMINI_API_KEY) return null

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
    return null
  }

  const data = await res.json()
  const audioPart = data?.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData?.mimeType?.startsWith('audio/')
  )
  if (!audioPart?.inlineData?.data) return null

  return new Uint8Array(Buffer.from(audioPart.inlineData.data, 'base64'))
}

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get('text')
  const voice = req.nextUrl.searchParams.get('voice') || 'default'

  if (!text) {
    return NextResponse.json({ error: 'Missing text param' }, { status: 400 })
  }

  const voiceName = VOICES[voice] || VOICES.default

  if (GEMINI_API_KEY) {
    const audio = await geminiTTS(text, voiceName)
    if (audio) {
      return new NextResponse(audio as BodyInit, {
        headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=3600' },
      })
    }
  }

  try {
    const { EdgeTTS } = await import('edge-tts-universal')
    const config = voice === 'kavya'
      ? { voice: 'en-IN-NeerjaNeural', rate: '-10%' }
      : { voice: 'en-IN-PrabhatNeural', rate: '-10%' }

    const tts = new EdgeTTS(text, config.voice, {
      rate: config.rate,
      volume: '+20%',
      pitch: '+0Hz',
    })
    const result = await tts.synthesize()
    const audioBuffer = new Uint8Array(await result.audio.arrayBuffer())
    return new NextResponse(audioBuffer as BodyInit, {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=3600' },
    })
  } catch {
    return NextResponse.json({ error: 'TTS synthesis failed' }, { status: 500 })
  }
}
