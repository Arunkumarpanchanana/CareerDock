import { NextRequest, NextResponse } from 'next/server'
import { EdgeTTS } from 'edge-tts-universal'

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get('text')
  if (!text) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 })
  }

  try {
    const tts = new EdgeTTS(text, 'en-IN-PrabhatNeural', {
      rate: '-10%',
      volume: '+20%',
      pitch: '+0Hz',
    })
    const result = await tts.synthesize()

    const audioBuffer = Buffer.from(await result.audio.arrayBuffer())

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (e) {
    console.error('TTS error:', e)
    return NextResponse.json({ error: 'TTS synthesis failed' }, { status: 500 })
  }
}

export const maxDuration = 30
