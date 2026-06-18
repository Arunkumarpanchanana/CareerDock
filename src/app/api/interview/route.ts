import { NextRequest, NextResponse } from 'next/server'
import { handleInterviewTurn, handleFeedback } from '@/lib/interview'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phase, resume, jobDescription, history } = body

    if (!resume?.trim() || !jobDescription?.trim() || !Array.isArray(history)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (phase === 'interview') {
      const result = await handleInterviewTurn({ resume, jobDescription, history })
      return NextResponse.json(result)
    }

    if (phase === 'feedback') {
      const result = await handleFeedback({ resume, jobDescription, history })
      if (!result) {
        return NextResponse.json({ error: 'Feedback generation failed' }, { status: 500 })
      }
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
