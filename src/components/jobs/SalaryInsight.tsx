'use client'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, Loader2, BarChart3, Users } from 'lucide-react'

interface SalaryData {
  count: number
  currency: string
  stats: { median: number; p10: number; p25: number; p75: number; p90: number; min: number; max: number }
  by_seniority: { level: string; count: number; median: number; min: number; max: number }[]
  top_companies: { name: string; count: number; median: number }[]
}

function formatSalary(value: number, currency: string): string {
  if (currency === 'INR') {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
    return `₹${(value / 1000).toFixed(1)}K`
  }
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
  return `$${value.toLocaleString()}`
}

interface SalaryInsightProps {
  role: string
  location: string
}

export function SalaryInsight({ role, location }: SalaryInsightProps) {
  const [data, setData] = useState<SalaryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const roleClean = role.replace(/\(.*?\)/g, '').replace(/-.*$/, '').trim()
    if (!roleClean) return

    setLoading(true)
    setError('')
    setData(null)

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/jobs/salary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: roleClean, location }),
          signal: controller.signal,
        })
        if (!res.ok) {
          if (res.status !== 429) setError('No salary data available')
          return
        }
        const json = await res.json()
        if (json.data) setData(json.data)
        else setError('No salary data available')
      } catch {
        if (!controller.signal.aborted) setError('Failed to load')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 300)

    return () => { clearTimeout(timer); controller.abort() }
  }, [role, location])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading salary insights...
      </div>
    )
  }

  if (error || !data) return null

  const barMax = data.stats.p90
  const bars = [
    { label: 'p10', value: data.stats.p10 },
    { label: 'p25', value: data.stats.p25 },
    { label: 'Median', value: data.stats.median, highlight: true },
    { label: 'p75', value: data.stats.p75 },
    { label: 'p90', value: data.stats.p90 },
  ]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-900">Market Salary Data</h3>
      </div>

      <div className="space-y-2">
        {bars.map((bar) => (
          <div key={bar.label} className="flex items-center gap-3">
            <span className={`w-14 text-xs ${bar.highlight ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
              {bar.label}
            </span>
            <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${bar.highlight ? 'bg-blue-600' : 'bg-blue-200'}`}
                style={{ width: `${(bar.value / barMax) * 100}%` }}
              />
            </div>
            <span className={`w-20 text-right text-xs ${bar.highlight ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
              {formatSalary(bar.value, data.currency)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {data.count} data points</span>
        <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {data.currency}</span>
      </div>

      {data.by_seniority.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-700 mb-2">By seniority</p>
          <div className="flex gap-2 flex-wrap">
            {data.by_seniority.map((s) => (
              <span key={s.level} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 capitalize">
                {s.level}: {formatSalary(s.median, data.currency)}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.top_companies.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-700 mb-2">Top paying companies</p>
          <div className="space-y-1">
            {data.top_companies.slice(0, 3).map((c) => (
              <div key={c.name} className="flex justify-between text-xs text-slate-600">
                <span>{c.name}</span>
                <span className="font-medium">{formatSalary(c.median, data.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-3 text-[10px] text-slate-400">
        Data from <a href="https://optero.ai" target="_blank" rel="noopener noreferrer" className="underline">OpteroAI</a>
      </p>
    </div>
  )
}
