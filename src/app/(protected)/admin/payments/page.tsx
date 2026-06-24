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
  updated_at: string
}

interface PlanPrice {
  id: string
  plan_tier: string
  monthly_price: number
  yearly_price: number
  updated_at: string
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
  created_at: string
}

type TabId = 'gateways' | 'prices' | 'coupons' | 'transactions'

export default function AdminPaymentsPage() {
  const [tab, setTab] = useState<TabId>('gateways')
  const [gateways, setGateways] = useState<Gateway[]>([])
  const [prices, setPrices] = useState<PlanPrice[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [editPrices, setEditPrices] = useState<Record<string, { monthly: number; yearly: number }>>({})

  const [showGatewayForm, setShowGatewayForm] = useState(false)
  const [editingGateway, setEditingGateway] = useState<Gateway | null>(null)
  const [gatewayForm, setGatewayForm] = useState({ gateway: 'instamojo', api_key: '', api_secret: '', merchant_id: '', salt_key: '', is_active: true })

  const [showCouponForm, setShowCouponForm] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [couponForm, setCouponForm] = useState({
    code: '', discount_type: 'percentage', discount_value: 20,
    max_uses: '', plan_tier: '', expires_at: '', is_active: true,
  })

  useEffect(() => { loadAll() }, [])

  const getHeaders = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
    return headers
  }

  const loadAll = async () => {
    setLoading(true)
    const headers = await getHeaders()
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
    setSaving(true); setMessage('')
    const headers = await getHeaders()
    for (const [tier, vals] of Object.entries(editPrices)) {
      await fetch('/api/admin/payments/prices', {
        method: 'PUT', headers,
        body: JSON.stringify({ planTier: tier, monthlyPrice: vals.monthly, yearlyPrice: vals.yearly }),
      })
    }
    setMessage('Prices saved!'); setSaving(false)
    await loadAll()
  }

  const openNewGateway = () => {
    setEditingGateway(null)
    setGatewayForm({ gateway: 'instamojo', api_key: '', api_secret: '', merchant_id: '', salt_key: '', is_active: true })
    setShowGatewayForm(true)
  }

  const openEditGateway = (g: Gateway) => {
    setEditingGateway(g)
    setGatewayForm({ gateway: g.gateway, api_key: g.api_key, api_secret: g.api_secret, merchant_id: g.merchant_id, salt_key: g.salt_key, is_active: g.is_active })
    setShowGatewayForm(true)
  }

  const saveGateway = async () => {
    setSaving(true); setMessage('')
    const headers = await getHeaders()
    const body: any = { ...gatewayForm }
    if (editingGateway) body.id = editingGateway.id
    const res = await fetch('/api/admin/payments/gateways', { method: 'PUT', headers, body: JSON.stringify(body) })
    const data = await res.json()
    setMessage(data.success ? 'Gateway saved!' : (data.error || 'Failed'))
    setShowGatewayForm(false); setSaving(false)
    if (data.success) await loadAll()
  }

  const openNewCoupon = () => {
    setEditingCoupon(null)
    setCouponForm({ code: '', discount_type: 'percentage', discount_value: 20, max_uses: '', plan_tier: '', expires_at: '', is_active: true })
    setShowCouponForm(true)
  }

  const openEditCoupon = (c: Coupon) => {
    setEditingCoupon(c)
    setCouponForm({
      code: c.code, discount_type: c.discount_type, discount_value: c.discount_value,
      max_uses: c.max_uses ? String(c.max_uses) : '', plan_tier: c.plan_tier || '',
      expires_at: c.expires_at ? c.expires_at.split('T')[0] : '', is_active: c.is_active,
    })
    setShowCouponForm(true)
  }

  const saveCoupon = async () => {
    setSaving(true); setMessage('')
    const headers = await getHeaders()
    const body: any = { ...couponForm }
    if (couponForm.max_uses === '') body.max_uses = null
    if (couponForm.plan_tier === '') body.plan_tier = null
    if (couponForm.expires_at === '') body.expires_at = null

    if (editingCoupon) {
      body.id = editingCoupon.id
      const res = await fetch('/api/admin/coupons', { method: 'PUT', headers, body: JSON.stringify(body) })
      const data = await res.json()
      setMessage(data.success ? 'Coupon updated!' : (data.error || 'Failed'))
    } else {
      const res = await fetch('/api/admin/coupons', { method: 'POST', headers, body: JSON.stringify(body) })
      const data = await res.json()
      if (data.id) {
        setMessage('Coupon created!')
      } else {
        setMessage(data.error || 'Failed to create coupon')
      }
    }
    setShowCouponForm(false); setSaving(false)
    await loadAll()
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const TABS: { id: TabId; label: string }[] = [
    { id: 'gateways', label: 'Gateways' },
    { id: 'prices', label: 'Prices' },
    { id: 'coupons', label: 'Coupons' },
    { id: 'transactions', label: 'Transactions' },
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
            }`}>{t.label}</button>
        ))}
      </div>

      {message && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">{message}</div>
      )}

      {/* ---- GATEWAYS TAB ---- */}
      {tab === 'gateways' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Payment Gateways</h2>
            <button onClick={openNewGateway}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              + Add Gateway
            </button>
          </div>

          {showGatewayForm && (
            <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg space-y-3">
              <h3 className="font-medium text-sm">{editingGateway ? 'Edit' : 'Add'} Gateway</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Gateway</label>
                  <select value={gatewayForm.gateway}
                    onChange={e => setGatewayForm(p => ({ ...p, gateway: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm">
                    <option value="instamojo">Instamojo</option>
                    <option value="phonepe">PhonePe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Active</label>
                  <select value={gatewayForm.is_active ? 'true' : 'false'}
                    onChange={e => setGatewayForm(p => ({ ...p, is_active: e.target.value === 'true' }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm">
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">API Key</label>
                  <input type="text" value={gatewayForm.api_key}
                    onChange={e => setGatewayForm(p => ({ ...p, api_key: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">API Secret</label>
                  <input type="password" value={gatewayForm.api_secret}
                    onChange={e => setGatewayForm(p => ({ ...p, api_secret: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Merchant ID</label>
                  <input type="text" value={gatewayForm.merchant_id}
                    onChange={e => setGatewayForm(p => ({ ...p, merchant_id: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Salt Key</label>
                  <input type="password" value={gatewayForm.salt_key}
                    onChange={e => setGatewayForm(p => ({ ...p, salt_key: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={saveGateway} disabled={saving}
                  className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setShowGatewayForm(false)}
                  className="px-4 py-1.5 bg-gray-100 text-sm font-medium rounded-lg hover:bg-gray-200">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {['instamojo', 'phonepe'].map(gw => {
              const g = gateways.find(x => x.gateway === gw)
              const initials = gw === 'instamojo' ? 'IM' : 'PP'
              return (
                <div key={gw} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                      {initials}
                    </div>
                    <div>
                      <p className="font-medium">{gw === 'instamojo' ? 'Instamojo' : 'PhonePe'}</p>
                      {g ? (
                        <p className="text-xs text-gray-500">
                          API Key: {g.api_key ? `${g.api_key.slice(0, 4)}••••${g.api_key.slice(-4)}` : 'Not set'}
                          {g.updated_at && <span className="ml-2">· Last updated: {formatDate(g.updated_at)}</span>}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">Not configured yet</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      g?.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>{g?.is_active ? 'Active' : 'Inactive'}</span>
                    <button onClick={() => g ? openEditGateway(g) : openNewGateway()}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ---- PRICES TAB ---- */}
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
                <th className="text-left py-3 font-medium text-gray-600">Monthly Price (₹)</th>
                <th className="text-left py-3 font-medium text-gray-600">Yearly Price (₹)</th>
                <th className="text-left py-3 font-medium text-gray-600">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {prices.map(p => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.plan_tier === 'premium' ? 'Premium' : 'Premium Pro'}</span>
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Live</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">₹</span>
                      <input type="number" value={editPrices[p.plan_tier]?.monthly ?? ''}
                        onChange={e => setEditPrices(prev => ({ ...prev, [p.plan_tier]: { ...prev[p.plan_tier], monthly: Number(e.target.value) } }))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-right" />
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">₹</span>
                      <input type="number" value={editPrices[p.plan_tier]?.yearly ?? ''}
                        onChange={e => setEditPrices(prev => ({ ...prev, [p.plan_tier]: { ...prev[p.plan_tier], yearly: Number(e.target.value) } }))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-right" />
                    </div>
                  </td>
                  <td className="py-3 text-gray-500 text-xs">{formatDate(p.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-gray-400">Changes take effect immediately on the pricing page.</p>
        </div>
      )}

      {/* ---- COUPONS TAB ---- */}
      {tab === 'coupons' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Coupon Codes</h2>
            <button onClick={openNewCoupon}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              + Create Coupon
            </button>
          </div>

          {showCouponForm && (
            <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg space-y-3">
              <h3 className="font-medium text-sm">{editingCoupon ? 'Edit' : 'Create New'} Coupon</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Code</label>
                  <input type="text" value={couponForm.code} placeholder="e.g. SUMMER50"
                    onChange={e => setCouponForm(p => ({ ...p, code: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Discount Type</label>
                  <select value={couponForm.discount_type}
                    onChange={e => setCouponForm(p => ({ ...p, discount_type: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Value</label>
                  <input type="number" value={couponForm.discount_value}
                    onChange={e => setCouponForm(p => ({ ...p, discount_value: Number(e.target.value) }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Max Uses</label>
                  <input type="text" value={couponForm.max_uses} placeholder="Unlimited"
                    onChange={e => setCouponForm(p => ({ ...p, max_uses: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Plan Restriction</label>
                  <select value={couponForm.plan_tier}
                    onChange={e => setCouponForm(p => ({ ...p, plan_tier: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm">
                    <option value="">Any Plan</option>
                    <option value="premium">Premium</option>
                    <option value="premium_pro">Premium Pro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Expiry Date</label>
                  <input type="date" value={couponForm.expires_at}
                    onChange={e => setCouponForm(p => ({ ...p, expires_at: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="coupon-active" checked={couponForm.is_active}
                    onChange={e => setCouponForm(p => ({ ...p, is_active: e.target.checked }))}
                    className="rounded border-gray-300" />
                  <label htmlFor="coupon-active" className="text-sm text-gray-700">Active</label>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={saveCoupon} disabled={saving}
                  className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
                <button onClick={() => setShowCouponForm(false)}
                  className="px-4 py-1.5 bg-gray-100 text-sm font-medium rounded-lg hover:bg-gray-200">Cancel</button>
              </div>
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-medium text-gray-600">Code</th>
                <th className="text-left py-3 font-medium text-gray-600">Discount</th>
                <th className="text-left py-3 font-medium text-gray-600">Usage</th>
                <th className="text-left py-3 font-medium text-gray-600">Plan</th>
                <th className="text-left py-3 font-medium text-gray-600">Expires</th>
                <th className="text-left py-3 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} className="border-b border-gray-100">
                  <td className="py-3 font-mono font-medium">{c.code}</td>
                  <td className="py-3">{c.discount_type === 'percentage' ? `${c.discount_value}% off` : `₹${c.discount_value} off`}</td>
                  <td className="py-3 text-gray-500">{c.current_uses}{c.max_uses ? `/${c.max_uses}` : ''}</td>
                  <td className="py-3">{c.plan_tier ?? 'Any'}</td>
                  <td className="py-3 text-xs text-gray-500">{formatDate(c.expires_at)}</td>
                  <td className="py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      c.is_active && (!c.expires_at || new Date(c.expires_at) > new Date())
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {c.is_active && (!c.expires_at || new Date(c.expires_at) > new Date()) ? 'Active' : 'Expired'}
                    </span>
                  </td>
                  <td className="py-3">
                    <button onClick={() => openEditCoupon(c)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {coupons.length === 0 && !showCouponForm && <p className="text-gray-400 text-sm py-4 text-center">No coupons created yet.</p>}
        </div>
      )}

      {/* ---- TRANSACTIONS TAB ---- */}
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
                  <td className="py-3 text-gray-500">{formatDate(t.created_at)}</td>
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
