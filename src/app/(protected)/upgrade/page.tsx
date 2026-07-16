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
  const [paymentError, setPaymentError] = useState<string | null>(null)

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
    setPaymentError(null)
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
        setPaymentError(data.error || 'Failed to create payment')
      }
    } catch {
      setPaymentError('Payment failed. Please try again.')
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
          Yearly <span className="text-xs text-[var(--accent)] font-semibold">{savingsPercent('premium') > 0 ? `Save up to ${savingsPercent('premium_pro')}%` : ''}</span>
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
                <p className="text-xs text-green-600 font-medium mb-1">Coupon applied! Save ₹{amount - finalAmount}</p>
              )}

              {yearly && plan.yearlyPrice > 0 && (
                <p className="text-xs text-[var(--accent)] font-medium mb-2">
                  ₹{getYearlyPrice(plan.id).toLocaleString('en-IN')}/year {savings > 0 && `— Save ${savings}%`}
                </p>
              )}
              {plan.monthlyPrice === 0 && <div className="mb-4" />}

              <div className="border-t border-[var(--glass-border)] my-4" />

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

      {paymentError && (
        <div className="max-w-md mx-auto rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
          {paymentError}
        </div>
      )}
    </div>
  )
}
