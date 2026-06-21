import { createClient } from '@/lib/supabase/server'
import { rateLimitByIp } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { jobSearchSchema } from '@/lib/validation'
import { XMLParser } from 'fast-xml-parser'

const ADZUNA_API_URL = process.env.ADZUNA_API_URL ?? 'https://api.adzuna.com/v1/api/jobs'
const INDEED_PUBLISHER_ID = process.env.INDEED_PUBLISHER_ID
const INDIAN_API_KEY = process.env.INDIAN_API_KEY

function mapAdzunaResults(results: Record<string, unknown>[]) {
  return (results ?? []).map((r) => ({
    source: 'adzuna' as const,
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
}

function parseIndeedSalary(text: string | undefined): { salary_min: number | null; salary_max: number | null } {
  if (!text) return { salary_min: null, salary_max: null }
  const nums = text.match(/\d[\d,]*/g)?.map((n) => parseInt(n.replace(/,/g, ''), 10)) ?? []
  if (nums.length === 0) return { salary_min: null, salary_max: null }
  if (nums.length === 1) return { salary_min: nums[0], salary_max: nums[0] }
  return { salary_min: nums[0], salary_max: nums[1] }
}

function mapIndeedItems(items: Record<string, unknown>[] | Record<string, unknown> | undefined) {
  if (!items) return []
  const arr = Array.isArray(items) ? items : [items]
  return arr.map((item) => {
    const salary = parseIndeedSalary(item.salary as string | undefined)
    const pubDate = item.pubDate as string | undefined
    return {
      source: 'indeed' as const,
      adzuna_id: `indeed-${item.guid ?? item.link ?? Math.random()}`,
      title: (item.title as string)?.replace(/<[^>]+>/g, '') ?? '',
      company: (item.source as string) ?? (item.company as string) ?? 'Unknown',
      location: [item.city as string, item.state as string, item.country as string].filter(Boolean).join(', '),
      description: (item.description as string) ?? '',
      salary_min: salary.salary_min,
      salary_max: salary.salary_max,
      salary_is_predicted: false,
      redirect_url: (item.link as string) ?? '',
      category: '',
      contract_type: null,
      created: pubDate ?? new Date().toISOString(),
      daysAgo: pubDate ? Math.floor((Date.now() - new Date(pubDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
    }
  })
}

function mapIndianItems(results: Record<string, unknown>[]) {
  return (results ?? []).map((r) => ({
    source: 'indian' as const,
    adzuna_id: `indian-${r.id}`,
    title: (r.title as string) ?? '',
    company: (r.company as string) ?? 'Unknown',
    location: (r.location as string) ?? '',
    description: [
      r.job_description as string,
      r.about_company as string,
      r.role_and_responsibility as string,
      r.education_and_skills as string,
    ].filter(Boolean).join('\n\n'),
    salary_min: null,
    salary_max: null,
    salary_is_predicted: false,
    redirect_url: (r.apply_link as string) ?? '',
    category: '',
    contract_type: (r.job_type as string) ?? null,
    created: (r.posted_date as string) ?? new Date().toISOString(),
    daysAgo: r.posted_date ? Math.floor((Date.now() - new Date(r.posted_date as string).getTime()) / (1000 * 60 * 60 * 24)) : null,
  }))
}

function deduplicate<T extends { title: string; company: string }>(listings: T[]) {
  const seen = new Set<string>()
  return listings.filter((l) => {
    const key = `${l.title.toLowerCase()}|${l.company.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

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

    if (!adzunaAppId || !adzunaApiKey) {
      return NextResponse.json({ error: 'Adzuna API not configured' }, { status: 503 })
    }

    const body = await request.json()
    const parsed = jobSearchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { keyword, location, company, page, postedWithin } = parsed.data

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
      ? Object.entries(COUNTRY_MAP).find(([, cities]) => cities.some((c) => locationLower.includes(c)))?.[0] ?? 'in'
      : 'in'

    const params = new URLSearchParams({
      app_id: adzunaAppId,
      app_key: adzunaApiKey,
      what: keyword,
      where: location ?? '',
      results_per_page: '20',
    })
    if (postedWithin) params.set('max_days_old', String(postedWithin))

    const [adzunaResponse, indeedResponse, indianResponse] = await Promise.all([
      fetch(`${ADZUNA_API_URL}/${country}/search/${page}?${params}`).then(async (r) => {
        if (!r.ok) {
          console.error('Adzuna error:', r.status)
          return { results: [], count: 0, page: 1 }
        }
        return r.json()
      }),
      (async () => {
        try {
          const res = await fetch(`https://rss.indeed.com/rss?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location ?? '')}${INDEED_PUBLISHER_ID ? `&publisher=${INDEED_PUBLISHER_ID}` : ''}`)
          if (!res.ok) {
            console.error('Indeed error:', res.status)
            return null
          }
          const xml = await res.text()
          const parser = new XMLParser({ ignoreAttributes: false })
          const data = parser.parse(xml)
          return data?.rss?.channel?.item ?? null
        } catch (e) {
          console.error('Indeed error:', e)
          return null
        }
      })(),
      (async () => {
        if (!INDIAN_API_KEY) return []
        const titles = keyword.split(',').map((t) => t.trim()).filter(Boolean)
        try {
          const results = await Promise.all(titles.map((title) =>
            fetch(`https://jobs.indianapi.in/jobs?title=${encodeURIComponent(title)}&limit=20${location ? `&location=${encodeURIComponent(location)}` : ''}`, {
              headers: { 'X-Api-Key': INDIAN_API_KEY },
            }).then(async (r) => {
              if (!r.ok) { console.error('IndianAPI error:', r.status); return [] }
              return r.json()
            }).catch((e) => { console.error('IndianAPI error:', e); return [] })
          ))
          return results.flat()
        } catch {
          return []
        }
      })(),
    ])

    const adzunaListings = mapAdzunaResults(adzunaResponse.results ?? [])
    let indeedItems = mapIndeedItems(indeedResponse)
    if (postedWithin) {
      indeedItems = indeedItems.filter((item) => item.daysAgo !== null && item.daysAgo <= postedWithin)
    }
    const indianItems = mapIndianItems(indianResponse as Record<string, unknown>[])
    let allListings = deduplicate([...adzunaListings, ...indeedItems, ...indianItems])

    if (company) {
      const q = company.toLowerCase()
      allListings = allListings.filter((l) => l.company.toLowerCase().includes(q))
    }

    return NextResponse.json({
      results: allListings,
      total: adzunaResponse.count ?? 0,
      page: adzunaResponse.page ?? page,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
