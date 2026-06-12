import { createClient } from '@/lib/supabase/server'
import { rateLimitByIp } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { jobSearchSchema } from '@/lib/validation'

export async function POST(request: Request) {
  const limit = rateLimitByIp(request, 10, 60_000)
  if (limit instanceof NextResponse) return limit

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adzunaAppId = process.env.ADZUNA_API_ID
    const adzunaApiKey = process.env.ADZUNA_API_KEY
    const adzunaApiUrl = process.env.ADZUNA_API_URL ?? 'https://api.adzuna.com/v1/api/jobs'

    if (!adzunaAppId || !adzunaApiKey) {
      return NextResponse.json({ error: 'Adzuna API not configured' }, { status: 503 })
    }

    const body = await request.json()
    const parsed = jobSearchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { keyword, location, page } = parsed.data

    const locationLower = (location ?? '').toLowerCase()
    const COUNTRY_MAP: Record<string, string[]> = {
      gb: ['london', 'manchester', 'birmingham', 'leeds', 'glasgow', 'uk', 'england', 'britain', 'edinburgh'],
      us: ['new york', 'san francisco', 'chicago', 'los angeles', 'seattle', 'boston', 'austin', 'us', 'usa', 'united states'],
      au: ['sydney', 'melbourne', 'brisbane', 'perth', 'australia'],
      ca: ['toronto', 'vancouver', 'montreal', 'canada'],
      de: ['berlin', 'munich', 'hamburg', 'frankfurt', 'germany'],
      sg: ['singapore'],
      ae: ['dubai', 'abu dhabi', 'uae'],
    }
    const country = locationLower
      ? Object.entries(COUNTRY_MAP).find(([, cities]) => cities.some(c => locationLower.includes(c)))?.[0] ?? 'in'
      : 'in'
    const params = new URLSearchParams({
      app_id: adzunaAppId,
      app_key: adzunaApiKey,
      what: keyword,
      where: location ?? '',
      results_per_page: '20',
    })

    const adzunaRes = await fetch(`${adzunaApiUrl}/${country}/search/${page}?${params}`)
    if (!adzunaRes.ok) {
      const errorText = await adzunaRes.text()
      console.error('Adzuna error:', adzunaRes.status, errorText)
      return NextResponse.json({ error: 'Job search failed' }, { status: 502 })
    }

    const adzunaData = await adzunaRes.json()

    const listings = (adzunaData.results ?? []).map((r: Record<string, unknown>) => ({
      adzuna_id: String(r.id),
      title: r.title as string,
      company: (r.company as Record<string, string>)?.display_name ?? 'Unknown',
      location: (r.location as Record<string, string>)?.display_name ?? '',
      description: (r.description as string) ?? '',
      salary_min: r.salary_min != null ? Number(r.salary_min) : null,
      salary_max: r.salary_max != null ? Number(r.salary_max) : null,
      salary_is_predicted: r.salary_is_predicted === '1',
      redirect_url: r.redirect_url as string,
      category: (r.category as Record<string, string>)?.label ?? '',
      contract_type: r.contract_type as string | null,
      created: r.created as string,
      daysAgo: r.created ? Math.floor((Date.now() - new Date(r.created as string).getTime()) / (1000 * 60 * 60 * 24)) : null,
    }))

    return NextResponse.json({
      results: listings,
      total: adzunaData.count ?? 0,
      page: adzunaData.page ?? page,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
