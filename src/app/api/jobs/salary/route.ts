import { NextResponse } from 'next/server'

const OPTERO_API = 'https://optero.ai/api/public/salaries'

interface OpteroResponse {
  data: {
    query: { role: string; location: string; level: string; currency: string }
    count: number
    currency: string
    stats: { median: number; p10: number; p25: number; p75: number; p90: number; min: number; max: number }
    by_seniority: { level: string; count: number; median: number; min: number; max: number }[]
    top_companies: { name: string; count: number; median: number }[]
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { role, location } = body

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 })
    }

    const params = new URLSearchParams({ role, location: location ?? '' })
    const res = await fetch(`${OPTERO_API}?${params}`)

    if (!res.ok) {
      if (res.status === 429) {
        return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
      }
      return NextResponse.json({ error: 'Salary data unavailable' }, { status: 502 })
    }

    const data: OpteroResponse = await res.json()

    if (!data.data || data.data.count === 0) {
      return NextResponse.json({ data: null })
    }

    return NextResponse.json({ data: data.data })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch salary data' }, { status: 500 })
  }
}
