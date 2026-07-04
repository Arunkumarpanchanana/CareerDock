import { NextRequest, NextResponse } from 'next/server'
import { EdgeTTS } from 'edge-tts-universal'

export const runtime = 'nodejs'

const VOICES: Record<string, { voice: string; rate: string }> = {
  default: { voice: 'en-IN-PrabhatNeural', rate: '-10%' },
  kavya: { voice: 'en-IN-NeerjaNeural', rate: '-10%' },
}

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get('text')
  const voice = req.nextUrl.searchParams.get('voice') || 'default'

  if (!text) {
    return NextResponse.json({ error: 'Missing text param' }, { status: 400 })
  }

  const config = VOICES[voice] || VOICES.default

  try {
    const tts = new EdgeTTS(text, config.voice, {
      rate: config.rate,
      volume: '+20%',
      pitch: '+0Hz',
    })
    const result = await tts.synthesize()
    const audioBuffer = Buffer.from(await result.audio.arrayBuffer())
    return new NextResponse(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=3600' },
    })
  } catch {
    return NextResponse.json({ error: 'TTS synthesis failed' }, { status: 500 })
  }
}
