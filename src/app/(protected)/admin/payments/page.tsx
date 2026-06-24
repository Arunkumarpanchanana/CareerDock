'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface Gateway {
  id: string
  gateway: string
  api_key: string
  api_secret: string
  merchant_id: string
  salt_key: string
  is_active: boolean
}

interface PlanPrice {
  id: string
  plan_tier: string
  monthly_price: number
  yearly_price: number
}

interface Coupon {
  id: string
  code: string
  discount_type: string
  discount_value: number
  max_uses: number | null
  current_uses: number
  min_cart_amount: number | null
  plan_tier: string | null
  expires_at: string | null
  is_active: boolean
}

export default function AdminPaymentsPage() {
  const [tab, setTab] = useState<'gateways' | 'prices' | 'coupons' | 'transactions'>('gateways')
  const [gateways, setGateways] = useState<Gateway[]>([])
  const [prices, setPrices] = useState<PlanPrice[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [editPrices, setEditPrices] = useState<Record<string, { monthly: number; yearly: number }>>({})

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

    const [gRes, pRes, cRes, tRes] = await Promise.all([
      fetch('/api/admin/payments/gateways', { headers }),
      fetch('/api/plan-prices'),
      fetch('/api/admin/coupons', { headers }),
      fetch('/api/admin/payments/transactions', { headers }),
    ])

    const [gData, pData, cData, tData] = await Promise.all([
      gRes.json(), pRes.json(), cRes.json(), tRes.json(),
    ])

    if (Array.isArray(gData)) setGateways(gData)
    if (Array.isArray(pData)) {
      setPrices(pData)
      const ep: Record<string, { monthly: number; yearly: number }> = {}
      pData.forEach((p: PlanPrice) => { ep[p.plan_tier] = { monthly: p.monthly_price, yearly: p.yearly_price } })
      setEditPrices(ep)
    }
    if (Array.isArray(cData)) setCoupons(cData)
    if (Array.isArray(tData)) setTransactions(tData)
    setLoading(false)
  }

  const savePrices = async () => {
    setSaving(true)
    setMessage('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

    for (const [tier, vals] of Object.entries(editPrices)) {
      await fetch('/api/admin/payments/prices', {
        method: 'PUT', headers,
        body: JSON.stringify({ planTier: tier, monthlyPrice: vals.monthly, yearlyPrice: vals.yearly }),
      })
    }
    setMessage('Prices saved!')
    setSaving(false)
  }

  const TABS = [
    { id: 'gateways' as const, label: 'Gateways' },
    { id: 'prices' as const, label: 'Prices' },
    { id: 'coupons' as const, label: 'Coupons' },
    { id: 'transactions' as const, label: 'Transactions' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Configure gateways, prices, coupons, and view transactions.</p>
      </div>

      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {message && <p className="text-sm text-green-600">{message}</p>}

      {tab === 'gateways' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Payment Gateways</h2>
          {gateways.map(g => (
            <div key={g.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg mb-2">
              <div>
                <p className="font-medium">{g.gateway === 'instamojo' ? 'Instamojo' : 'PhonePe'}</p>
                <p className="text-xs text-gray-500">API Key: {g.api_key ? `${g.api_key.slice(0, 4)}...${g.api_key.slice(-4)}` : 'Not set'}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${g.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {g.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
          {gateways.length === 0 && <p className="text-gray-400 text-sm py-4 text-center">No gateways configured yet.</p>}
        </div>
      )}

      {tab === 'prices' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Plan Prices</h2>
            <button onClick={savePrices} disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save All'}
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-medium text-gray-600">Plan</th>
                <th className="text-left py-3 font-medium text-gray-600">Monthly (₹)</th>
                <th className="text-left py-3 font-medium text-gray-600">Yearly (₹)</th>
              </tr>
            </thead>
            <tbody>
              {prices.map(p => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="py-3 font-medium">{p.plan_tier === 'premium' ? 'Premium' : 'Premium Pro'}</td>
                  <td className="py-3">
                    <input type="number" value={editPrices[p.plan_tier]?.monthly ?? ''}
                      onChange={e => setEditPrices(prev => ({ ...prev, [p.plan_tier]: { ...prev[p.plan_tier], monthly: Number(e.target.value) } }))}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-right" />
                  </td>
                  <td className="py-3">
                    <input type="number" value={editPrices[p.plan_tier]?.yearly ?? ''}
                      onChange={e => setEditPrices(prev => ({ ...prev, [p.plan_tier]: { ...prev[p.plan_tier], yearly: Number(e.target.value) } }))}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-right" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'coupons' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Coupon Codes</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-medium text-gray-600">Code</th>
                <th className="text-left py-3 font-medium text-gray-600">Discount</th>
                <th className="text-left py-3 font-medium text-gray-600">Uses</th>
                <th className="text-left py-3 font-medium text-gray-600">Plan</th>
                <th className="text-left py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} className="border-b border-gray-100">
                  <td className="py-3 font-mono font-medium">{c.code}</td>
                  <td className="py-3">{c.discount_type === 'percentage' ? `${c.discount_value}% off` : `₹${c.discount_value} off`}</td>
                  <td className="py-3 text-gray-500">{c.current_uses}{c.max_uses ? `/${c.max_uses}` : ''}</td>
                  <td className="py-3">{c.plan_tier ?? 'Any'}</td>
                  <td className="py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {coupons.length === 0 && <p className="text-gray-400 text-sm py-4 text-center">No coupons created yet.</p>}
        </div>
      )}

      {tab === 'transactions' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Transaction Log</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-medium text-gray-600">Plan</th>
                <th className="text-left py-3 font-medium text-gray-600">Amount</th>
                <th className="text-left py-3 font-medium text-gray-600">Gateway</th>
                <th className="text-left py-3 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="border-b border-gray-100">
                  <td className="py-3 font-medium">{t.plan_tier}</td>
                  <td className="py-3">₹{t.final_amount}</td>
                  <td className="py-3 capitalize">{t.gateway}</td>
                  <td className="py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      t.status === 'completed' ? 'bg-green-100 text-green-700' :
                      t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{t.status}</span>
                  </td>
                  <td className="py-3 text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && <p className="text-gray-400 text-sm py-4 text-center">No transactions yet.</p>}
        </div>
      )}
    </div>
  )
}
