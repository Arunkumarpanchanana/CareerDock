# Payment Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real-time payment processing with Instamojo/PhonePe, configurable plan prices, and coupon codes.

**Architecture:** New DB tables (`payment_configs`, `plan_prices`, `coupons`, `payment_transactions`) store all payment data. Admin manages via `/admin/payments`. Pricing page fetches dynamic prices. Coupon validation runs server-side. Webhooks auto-upgrade `profiles.plan_tier` on successful payment.

**Tech Stack:** Supabase (Postgres), Next.js API routes, Instamojo/PhonePe webhooks

---

### Task 1: Database Migration — Payment Tables

**Files:**
- Create: `supabase/migrations/017_add_payment_tables.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Payment gateway configs
CREATE TABLE payment_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL CHECK (gateway IN ('instamojo', 'phonepe')),
  api_key TEXT NOT NULL DEFAULT '',
  api_secret TEXT NOT NULL DEFAULT '',
  merchant_id TEXT DEFAULT '',
  salt_key TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Plan prices (admin-configurable)
CREATE TABLE plan_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('premium', 'premium_pro')),
  monthly_price INTEGER NOT NULL,
  yearly_price INTEGER NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default prices
INSERT INTO plan_prices (plan_tier, monthly_price, yearly_price) VALUES
  ('premium', 299, 3000),
  ('premium_pro', 500, 5500);

-- Coupon codes
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  min_cart_amount INTEGER,
  plan_tier TEXT CHECK (plan_tier IN ('premium', 'premium_pro') OR plan_tier IS NULL),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payment transactions log
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('premium', 'premium_pro')),
  billing TEXT NOT NULL CHECK (billing IN ('monthly', 'yearly')),
  original_amount INTEGER NOT NULL,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  final_amount INTEGER NOT NULL,
  coupon_code TEXT,
  gateway TEXT NOT NULL CHECK (gateway IN ('instamojo', 'phonepe')),
  gateway_order_id TEXT,
  gateway_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/017_add_payment_tables.sql
git commit -m "feat: add payment tables (configs, prices, coupons, transactions)"
```

---

### Task 2: Plan Prices API

**Files:**
- Create: `src/app/api/plan-prices/route.ts`

- [ ] **Step 1: Create route**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('plan_prices').select('*')
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json({ error: 'Failed to load prices' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/plan-prices/route.ts
git commit -m "feat: add plan-prices API for dynamic pricing"
```

---

### Task 3: Coupon Validate API

**Files:**
- Create: `src/app/api/coupons/validate/route.ts`

- [ ] **Step 1: Create route**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code, planTier, amount } = await request.json()
    if (!code) {
      return NextResponse.json({ valid: false, error: 'Coupon code is required' })
    }

    const upperCode = String(code).toUpperCase()
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', upperCode)
      .single()

    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'Invalid coupon code' })
    }

    if (!coupon.is_active) {
      return NextResponse.json({ valid: false, error: 'This coupon is no longer active' })
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'This coupon has expired' })
    }

    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return NextResponse.json({ valid: false, error: 'This coupon has reached its usage limit' })
    }

    if (coupon.plan_tier && coupon.plan_tier !== planTier) {
      return NextResponse.json({ valid: false, error: `This coupon is only valid for ${coupon.plan_tier} plans` })
    }

    if (coupon.min_cart_amount && amount < coupon.min_cart_amount) {
      return NextResponse.json({ valid: false, error: `Minimum cart amount is ₹${coupon.min_cart_amount}` })
    }

    let discountAmount = 0
    if (coupon.discount_type === 'percentage') {
      discountAmount = Math.round(amount * (coupon.discount_value / 100))
    } else {
      discountAmount = Math.min(coupon.discount_value, amount - 1)
    }

    const finalAmount = amount - discountAmount

    return NextResponse.json({
      valid: true,
      code: upperCode,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      discountAmount,
      finalAmount,
    })
  } catch {
    return NextResponse.json({ valid: false, error: 'Failed to validate coupon' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/coupons/validate/route.ts
git commit -m "feat: add coupon validation API"
```

---

### Task 4: Create Order API

**Files:**
- Create: `src/app/api/payments/create-order/route.ts`

- [ ] **Step 1: Create route**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planTier, billing, couponCode } = await request.json()

    if (!['premium', 'premium_pro'].includes(planTier)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    if (!['monthly', 'yearly'].includes(billing)) {
      return NextResponse.json({ error: 'Invalid billing period' }, { status: 400 })
    }

    const { data: priceRow } = await supabase
      .from('plan_prices')
      .select('*')
      .eq('plan_tier', planTier)
      .single()

    if (!priceRow) {
      return NextResponse.json({ error: 'Plan pricing not found' }, { status: 500 })
    }

    const originalAmount = billing === 'monthly' ? priceRow.monthly_price : priceRow.yearly_price
    let finalAmount = originalAmount
    let appliedCoupon = null
    let discountAmount = 0

    if (couponCode) {
      const validateRes = await fetch(new URL('/api/coupons/validate', request.url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, planTier, amount: originalAmount }),
      })
      const validateData = await validateRes.json()
      if (validateData.valid) {
        finalAmount = validateData.finalAmount
        discountAmount = validateData.discountAmount
        appliedCoupon = couponCode.toUpperCase()
      }
    }

    // Get active gateway
    const { data: gateway } = await supabase
      .from('payment_configs')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!gateway) {
      return NextResponse.json({ error: 'No payment gateway configured' }, { status: 503 })
    }

    // Create order in gateway
    const orderPayload = {
      amount: finalAmount * 100, // paise
      purpose: `${planTier}_${billing}`,
      buyer_name: user.email,
      email: user.email,
    }

    const gatewayRes = await fetch('https://www.instamojo.com/api/1.1/payment-requests/', {
      method: 'POST',
      headers: {
        'X-Api-Key': gateway.api_key,
        'X-Auth-Token': gateway.api_secret,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: String(finalAmount),
        purpose: `CareerDock ${planTier} - ${billing}`,
        buyer_name: user.email ?? 'User',
        email: user.email ?? '',
        redirect_url: `${new URL(request.url).origin}/payments/callback?plan=${planTier}`,
        webhook: `${new URL(request.url).origin}/api/webhooks/instamojo`,
      }),
    })

    const gatewayData = await gatewayRes.json()

    if (!gatewayRes.ok) {
      return NextResponse.json(
        { error: 'Failed to create payment order. Please try again.' },
        { status: 502 }
      )
    }

    const paymentRequest = gatewayData.payment_request
    const orderId = paymentRequest.id

    // Log transaction
    await supabase.from('payment_transactions').insert({
      user_id: user.id,
      plan_tier: planTier,
      billing,
      original_amount: originalAmount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      coupon_code: appliedCoupon,
      gateway: gateway.gateway,
      gateway_order_id: orderId,
      status: 'pending',
    })

    return NextResponse.json({
      checkoutUrl: paymentRequest.longurl,
      orderId,
      finalAmount,
      originalAmount,
      discountAmount,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Create order error:', message)
    return NextResponse.json({ error: 'Payment processing error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/payments/create-order/route.ts
git commit -m "feat: add create-order API with coupon support"
```

---

### Task 5: Payment Status API

**Files:**
- Create: `src/app/api/payments/status/route.ts`

- [ ] **Step 1: Create route**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    const { data } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('gateway_order_id', orderId)
      .eq('user_id', user.id)
      .single()

    if (!data) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json({
      status: data.status,
      planTier: data.plan_tier,
      amount: data.final_amount,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/payments/status/route.ts
git commit -m "feat: add payment status polling API"
```

---

### Task 6: Instamojo Webhook Handler

**Files:**
- Create: `src/app/api/webhooks/instamojo/route.ts`

- [ ] **Step 1: Create route**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const paymentId = formData.get('payment_id') as string
    const orderId = formData.get('payment_request_id') as string
    const status = formData.get('status') as string

    if (!paymentId || !orderId || status !== 'Credit') {
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
    }

    const supabase = await createClient()

    // Look up transaction
    const { data: tx } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('gateway_order_id', orderId)
      .single()

    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (tx.status !== 'pending') {
      return NextResponse.json({ error: 'Already processed' }, { status: 200 })
    }

    // Update transaction
    await supabase
      .from('payment_transactions')
      .update({
        gateway_payment_id: paymentId,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', tx.id)

    // Update user's plan
    await supabase
      .from('profiles')
      .update({ plan_tier: tx.plan_tier })
      .eq('id', tx.user_id)

    // Increment coupon usage
    if (tx.coupon_code) {
      await supabase.rpc('increment_coupon_usage', { coupon_code: tx.coupon_code })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Instamojo webhook error:', e)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/webhooks/instamojo/route.ts
git commit -m "feat: add Instamojo webhook handler"
```

---

### Task 7: PhonePe Webhook Handler

**Files:**
- Create: `src/app/api/webhooks/phonepe/route.ts`

- [ ] **Step 1: Create route**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const checksum = request.headers.get('X-VERIFY') || ''
    const transactionId = body.transactionId
    const orderId = body.merchantOrderId
    const state = body.state

    if (!transactionId || !orderId || state !== 'COMPLETED') {
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
    }

    const supabase = await createClient()

    // Look up transaction
    const { data: tx } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('gateway_order_id', orderId)
      .single()

    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (tx.status !== 'pending') {
      return NextResponse.json({ success: true })
    }

    // Verify checksum using active PhonePe config
    const { data: config } = await supabase
      .from('payment_configs')
      .select('*')
      .eq('gateway', 'phonepe')
      .eq('is_active', true)
      .single()

    if (config) {
      const expectedChecksum = crypto
        .createHash('sha256')
        .update(JSON.stringify(body) + config.salt_key)
        .digest('hex')
      if (checksum !== expectedChecksum) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
      }
    }

    // Update transaction
    await supabase
      .from('payment_transactions')
      .update({
        gateway_payment_id: transactionId,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', tx.id)

    // Update user's plan
    await supabase
      .from('profiles')
      .update({ plan_tier: tx.plan_tier })
      .eq('id', tx.user_id)

    if (tx.coupon_code) {
      await supabase.rpc('increment_coupon_usage', { coupon_code: tx.coupon_code })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('PhonePe webhook error:', e)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Add increment_coupon_usage function to migration**

Add to the migration from Task 1:
```sql
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_code TEXT)
RETURNS void AS $$
BEGIN
  UPDATE coupons SET current_uses = current_uses + 1 WHERE code = coupon_code;
END;
$$ LANGUAGE plpgsql;
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/webhooks/phonepe/route.ts
git commit -m "feat: add PhonePe webhook handler"
```

---

### Task 8: Admin Payments Page

**Files:**
- Create: `src/app/(protected)/admin/payments/page.tsx`

- [ ] **Step 1: Create admin payments page**

```typescript
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
    { id: 'gateways' as const, label: '🔑 Gateways' },
    { id: 'prices' as const, label: '💰 Prices' },
    { id: 'coupons' as const, label: '🎫 Coupons' },
    { id: 'transactions' as const, label: '📋 Transactions' },
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

      {/* GATEWAYS TAB */}
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

      {/* PRICES TAB */}
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

      {/* COUPONS TAB */}
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

      {/* TRANSACTIONS TAB */}
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
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(protected)/admin/payments/page.tsx"
git commit -m "feat: add admin payments page with tabs"
```

---

### Task 9: Admin API Routes for Payments

**Files:**
- Create: `src/app/api/admin/payments/gateways/route.ts`
- Create: `src/app/api/admin/payments/prices/route.ts`
- Create: `src/app/api/admin/payments/transactions/route.ts`
- Create: `src/app/api/admin/coupons/route.ts`

- [ ] **Step 1: Create admin gateways API**

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const adminClient = createAdminClient()
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const authHeader = request.headers.get('Authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await adminClient.auth.getUser(token)
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user?.id ?? '').single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data } = await adminClient.from('payment_configs').select('*')
  return NextResponse.json(data ?? [])
}
```

- [ ] **Step 2: Create admin prices API**

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
  const adminClient = createAdminClient()
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const authHeader = request.headers.get('Authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await adminClient.auth.getUser(token)
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user?.id ?? '').single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { planTier, monthlyPrice, yearlyPrice } = await request.json()
  const { error } = await adminClient.from('plan_prices').update({ monthly_price: monthlyPrice, yearly_price: yearlyPrice, updated_at: new Date().toISOString() }).eq('plan_tier', planTier)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Create admin transactions API**

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const adminClient = createAdminClient()
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const authHeader = request.headers.get('Authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await adminClient.auth.getUser(token)
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user?.id ?? '').single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data } = await adminClient.from('payment_transactions').select('*').order('created_at', { ascending: false }).limit(50)
  return NextResponse.json(data ?? [])
}
```

- [ ] **Step 4: Create admin coupons API**

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const adminClient = createAdminClient()
  if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const authHeader = request.headers.get('Authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await adminClient.auth.getUser(token)
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user?.id ?? '').single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data } = await adminClient.from('coupons').select('*').order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}
```

- [ ] **Step 5: Commit all admin APIs**

```bash
mkdir -p src/app/api/admin/payments/gateways src/app/api/admin/payments/prices src/app/api/admin/payments/transactions src/app/api/admin/coupons
git add src/app/api/admin/payments/ src/app/api/admin/coupons/
git commit -m "feat: add admin payment API routes"
```

---

### Task 10: Admin Sidebar — Add Payments Link

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Add payments link to admin nav**

Add after the admin link in `navItems`:
```typescript
    ...(profile?.role === 'admin'
      ? [
          { href: '/admin', label: 'Admin', icon: Shield },
          { href: '/admin/payments', label: 'Payments', icon: Shield },
        ]
      : []),
```

For the icon, add `CreditCard` to imports from `lucide-react` and use it:
```typescript
import { ..., CreditCard } from 'lucide-react'
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: add payments link to admin sidebar"
```

---

### Task 11: Update Upgrade Page — Dynamic Prices + Coupon Input + Payment Trigger

**Files:**
- Modify: `src/app/(protected)/upgrade/page.tsx`

- [ ] **Step 1: Rewrite upgrade page to fetch prices and support payments**

```typescript
'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { Card } from '@/components/ui'
import { Sparkles, Zap, Crown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type PlanTier = 'free' | 'premium' | 'premium_pro'

interface PlanPrice {
  plan_tier: string
  monthly_price: number
  yearly_price: number
}

const defaultPlans = [
  {
    id: 'free' as PlanTier,
    name: 'Free Trial',
    tagline: 'Get started',
    icon: Sparkles,
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      { label: 'Resume creations', value: '3 total', included: true },
      { label: 'Skill Gap', included: true },
      { label: 'Job Search', included: true },
      { label: 'AI Mock Interview', included: false },
      { label: 'Expert support (1:1)', included: false },
      { label: 'AI actions', value: '10/month', included: true },
    ],
  },
  {
    id: 'premium' as PlanTier,
    name: 'Premium',
    tagline: 'For serious job seekers',
    icon: Zap,
    monthlyPrice: 299,
    yearlyPrice: 3000,
    popular: true,
    features: [
      { label: 'Resume creations', value: 'Unlimited', included: true },
      { label: 'Skill Gap', included: true },
      { label: 'Job Search', included: true },
      { label: 'AI Mock Interview', included: true },
      { label: 'Expert support (1:1)', included: false },
      { label: 'AI actions', value: '100/month', included: true },
    ],
  },
  {
    id: 'premium_pro' as PlanTier,
    name: 'Premium Pro',
    tagline: 'Everything plus expert guidance',
    icon: Crown,
    monthlyPrice: 500,
    yearlyPrice: 5500,
    features: [
      { label: 'Resume creations', value: 'Unlimited', included: true },
      { label: 'Skill Gap', included: true },
      { label: 'Job Search', included: true },
      { label: 'AI Mock Interview', included: true },
      { label: 'Expert support (1:1)', included: true },
      { label: 'AI actions', value: 'Unlimited', included: true },
    ],
  },
]

export default function UpgradePage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [yearly, setYearly] = useState(false)
  const [prices, setPrices] = useState<Record<string, { monthly: number; yearly: number }>>({})
  const [couponInput, setCouponInput] = useState('')
  const [couponResult, setCouponResult] = useState<any>(null)
  const [applying, setApplying] = useState(false)
  const [paying, setPaying] = useState<string | null>(null)

  const currentTier: PlanTier = (profile?.plan_tier as PlanTier) || 'free'

  useEffect(() => {
    fetch('/api/plan-prices')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const map: Record<string, { monthly: number; yearly: number }> = {}
          data.forEach((p: PlanPrice) => { map[p.plan_tier] = { monthly: p.monthly_price, yearly: p.yearly_price } })
          setPrices(map)
        }
      })
      .catch(() => {})
  }, [])

  const getPrice = (tier: string): number => {
    const p = prices[tier]
    if (!p) {
      const plan = defaultPlans.find(x => x.id === tier)
      return yearly && plan ? plan.yearlyPrice / 12 : (plan?.monthlyPrice ?? 0)
    }
    return yearly ? Math.round(p.yearly / 12) : p.monthly
  }

  const getYearlyPrice = (tier: string): number => {
    const p = prices[tier]
    if (!p) {
      const plan = defaultPlans.find(x => x.id === tier)
      return plan?.yearlyPrice ?? 0
    }
    return p.yearly
  }

  const applyCoupon = async (tier: string) => {
    if (!couponInput.trim()) return
    setApplying(true)
    const amount = yearly ? getYearlyPrice(tier) : getPrice(tier)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput, planTier: tier, amount }),
      })
      const data = await res.json()
      setCouponResult(data)
    } catch {
      setCouponResult({ valid: false, error: 'Failed to validate' })
    }
    setApplying(false)
  }

  const handleUpgrade = async (tier: string) => {
    if (tier === 'free') return
    setPaying(tier)
    try {
      const amount = yearly ? getYearlyPrice(tier) : getPrice(tier)
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planTier: tier,
          billing: yearly ? 'yearly' : 'monthly',
          couponCode: couponResult?.valid ? couponResult.code : undefined,
        }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        alert(data.error || 'Failed to create payment')
      }
    } catch {
      alert('Payment failed. Please try again.')
    }
    setPaying(null)
  }

  const savingsPercent = (tier: string): number => {
    const p = prices[tier]
    if (!p || p.monthly === 0) return 0
    return Math.round((1 - p.yearly / (p.monthly * 12)) * 100)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Choose Your Plan</h1>
        <p className="mt-1 text-[var(--text-secondary)]">Pick the plan that fits your career journey.</p>
      </div>

      <div className="flex justify-center items-center gap-3">
        <span className={`text-sm font-medium ${!yearly ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>Monthly</span>
        <button onClick={() => setYearly(!yearly)}
          className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${yearly ? 'translate-x-6' : ''}`} />
        </button>
        <span className={`text-sm font-medium ${yearly ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
          Yearly <span className="text-xs text-[var(--accent)] font-semibold">Save up to 16%</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {defaultPlans.map((plan) => {
          const Icon = plan.icon
          const price = getPrice(plan.id)
          const isCurrent = currentTier === plan.id
          const isPopular = plan.popular
          const savings = savingsPercent(plan.id)

          const amount = yearly ? getYearlyPrice(plan.id) : price
          const finalAmount = couponResult?.valid && couponResult.finalAmount != null && amount > 0
            ? Math.round(couponResult.finalAmount)
            : amount

          return (
            <Card key={plan.id} className={`relative p-6 border-2 ${
              isCurrent ? 'border-[var(--accent)]' : isPopular ? 'border-[var(--accent)] shadow-md' : 'border-[var(--glass-border)]'
            }`}>
              {isPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--accent)] text-white text-xs font-semibold rounded-full">Most Popular</div>}

              <div className="flex items-center gap-3 mb-4">
                <div className={`rounded-lg p-2 ${isCurrent ? 'bg-[var(--accent)]/15 text-[var(--accent)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">{plan.name}</h2>
                  <p className="text-xs text-[var(--text-secondary)]">{plan.tagline}</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-[var(--text-primary)]">
                  ₹{finalAmount.toLocaleString('en-IN')}
                </span>
                {plan.monthlyPrice > 0 && <span className="text-sm text-[var(--text-tertiary)]">/month</span>}
              </div>

              {couponResult?.valid && finalAmount < amount && (
                <p className="text-xs text-green-600 font-medium mb-1">🎉 Coupon applied! Save ₹{amount - finalAmount}</p>
              )}

              {yearly && plan.yearlyPrice > 0 && (
                <p className="text-xs text-[var(--accent)] font-medium mb-2">
                  ₹{getYearlyPrice(plan.id).toLocaleString('en-IN')}/year {savings > 0 && `— Save ${savings}%`}
                </p>
              )}
              {plan.monthlyPrice === 0 && <div className="mb-4" />}

              <div className="border-t border-[var(--glass-border)] my-4" />

              {/* Coupon input for paid plans */}
              {plan.monthlyPrice > 0 && !isCurrent && (
                <div className="flex gap-2 mb-4">
                  <input type="text" placeholder="Coupon code"
                    value={couponInput}
                    onChange={e => { setCouponInput(e.target.value); setCouponResult(null) }}
                    className="flex-1 px-3 py-1.5 border border-[var(--glass-border)] rounded-lg text-sm" />
                  <button onClick={() => applyCoupon(plan.id)} disabled={applying}
                    className="px-3 py-1.5 bg-gray-100 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50">
                    {applying ? '...' : 'Apply'}
                  </button>
                </div>
              )}

              {couponResult && !couponResult.valid && (
                <p className="text-xs text-red-500 mb-2">{couponResult.error}</p>
              )}

              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-2 text-sm">
                    <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                      f.included ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                    }`}>{f.included ? '✓' : '✗'}</span>
                    <span className="text-[var(--text-primary)]">{f.label}</span>
                    {f.value && <span className="ml-auto text-xs text-[var(--text-tertiary)]">{f.value}</span>}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="mt-6 px-4 py-2 text-center text-sm font-medium text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-lg">Current Plan</div>
              ) : plan.monthlyPrice === 0 ? (
                <div className="mt-6 px-4 py-2 text-center text-sm font-medium bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg">Get Started</div>
              ) : (
                <button onClick={() => handleUpgrade(plan.id)} disabled={paying === plan.id}
                  className={`mt-6 w-full text-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isPopular ? 'bg-[var(--accent)] text-white hover:opacity-90' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--border)]'
                  }`}>
                  {paying === plan.id ? 'Redirecting...' : `Upgrade — ₹${finalAmount.toLocaleString('en-IN')}`}
                </button>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(protected)/upgrade/page.tsx"
git commit -m "feat: dynamic prices, coupon input, and payment trigger on upgrade page"
```

---

### Task 12: Add Admin Sidebar Link for Payments (Update)

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Add Payments link in admin section**

```typescript
import { ..., CreditCard } from 'lucide-react'
```

Add to admin nav items:
```typescript
    ...(profile?.role === 'admin'
      ? [
          { href: '/admin', label: 'Admin', icon: Shield },
          { href: '/admin/payments', label: 'Payments', icon: CreditCard },
        ]
      : []),
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: add payments link to admin sidebar"
```

---

### Task 13: Self-Review and Verification

- [ ] **Step 1: Run full build**

```bash
npm run build
```
Expected: Build succeeds

- [ ] **Step 2: Run tests**

```bash
npm test
```
Expected: All tests pass

- [ ] **Step 3: Verify consistency**

Check that all references use consistent tier names (`'premium'`, `'premium_pro'`), no hardcoded prices remain that bypass `plan_prices`, and all API routes handle errors properly.
