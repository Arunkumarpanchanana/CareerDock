import { createClient } from '@/lib/supabase/server'
import { rateLimitByIp } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { analyzeSkillGap, generateCoverLetter } from '@/lib/ai'
import { jobPrepareSchema } from '@/lib/validation'

export async function POST(request: Request) {
  const limit = rateLimitByIp(request, 10, 60_000)
  if (limit instanceof NextResponse) return limit

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = jobPrepareSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { job_title, company, description, resume_id } = parsed.data

    const { data: resume } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resume_id)
      .eq('user_id', user.id)
      .single()

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    const resumeText = [
      resume.summary,
      ...((resume.experience as Array<Record<string, unknown>>) ?? []).map(
        (e) => `${e.role} at ${e.company}: ${((e.bullets as string[]) ?? []).join(', ')}`
      ),
      `Skills: ${(resume.skills ?? []).join(', ')}`,
    ].filter(Boolean).join('\n')

    const [skillGap, coverLetter] = await Promise.all([
      analyzeSkillGap({
        resume: resumeText,
        jobTitle: job_title,
        jobDescription: description,
      }),
      generateCoverLetter({
        resume: resumeText,
        jobTitle: job_title,
        company,
        jobDescription: description,
      }),
    ])

    return NextResponse.json({
      matchScore: skillGap.score,
      verdict: skillGap.verdict,
      verdict_explanation: skillGap.verdict_explanation,
      strengths: skillGap.strengths,
      gaps: skillGap.gaps,
      missingKeywords: skillGap.missingKeywords,
      suggestions: skillGap.suggestions,
      coverLetter,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Jobs prepare API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
