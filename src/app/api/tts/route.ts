import { NextRequest, NextResponse } from 'next/server'
import { EdgeTTS } from 'node-edge-tts'
import { writeFile, readFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'

export const runtime = 'nodejs'

const VOICES: Record<string, { voice: string; lang: string }> = {
  default: { voice: 'en-IN-NeerjaNeural', lang: 'en-IN' },
  kavya: { voice: 'en-IN-NeerjaNeural', lang: 'en-IN' },
}

const audioCache = new Map<string, ArrayBuffer>()

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get('text')
  const voice = req.nextUrl.searchParams.get('voice') || 'default'

  if (!text) {
    return NextResponse.json({ error: 'Missing text param' }, { status: 400 })
  }

  const cfg = VOICES[voice] || VOICES.default
  const truncated = text.slice(0, 1000)

  const cacheKey = cfg.voice + truncated
  const cached = audioCache.get(cacheKey)
  if (cached) {
    return new NextResponse(cached, {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=86400' },
    })
  }

  const tmpPath = join(tmpdir(), `tts-${randomUUID()}.mp3`)

  try {
    const tts = new EdgeTTS({
      voice: cfg.voice,
      lang: cfg.lang,
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
      timeout: 15000,
    })

    await tts.ttsPromise(truncated, tmpPath)
    const buf = await readFile(tmpPath)
    const audio = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)

    if (audioCache.size < 200) {
      audioCache.set(cacheKey, audio)
    }

    return new NextResponse(audio, {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=86400' },
    })
  } catch (e) {
    console.error('TTS exception:', e)
    return NextResponse.json({ error: 'TTS failed' }, { status: 502 })
  } finally {
    unlink(tmpPath).catch(() => {})
  }
}