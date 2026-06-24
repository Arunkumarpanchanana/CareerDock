'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { Card } from '@/components/ui'
import { Sparkles, Zap, Crown } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

type PlanTier = 'free' | 'premium' | 'premium_pro'

const plans = [
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
    savings: 16,
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
    savings: 8,
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
  const [yearly, setYearly] = useState(false)
  const currentTier: PlanTier = (profile?.plan_tier as PlanTier) || 'free'

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Choose Your Plan</h1>
        <p className="mt-1 text-[var(--text-secondary)]">Pick the plan that fits your career journey.</p>
      </div>

      {/* Toggle */}
      <div className="flex justify-center items-center gap-3">
        <span className={`text-sm font-medium ${!yearly ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
          Monthly
        </span>
        <button
          onClick={() => setYearly(!yearly)}
          className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}
          aria-label="Toggle yearly billing"
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${yearly ? 'translate-x-6' : ''}`} />
        </button>
        <span className={`text-sm font-medium ${yearly ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
          Yearly <span className="text-xs text-[var(--accent)] font-semibold">Save up to 16%</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon
          const price = yearly && plan.yearlyPrice > 0
            ? Math.round(plan.yearlyPrice / 12)
            : plan.monthlyPrice
          const isCurrent = currentTier === plan.id
          const isPopular = plan.popular

          return (
            <Card
              key={plan.id}
              className={`relative p-6 border-2 ${
                isCurrent
                  ? 'border-[var(--accent)]'
                  : isPopular
                    ? 'border-[var(--accent)] shadow-md'
                    : 'border-[var(--glass-border)]'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--accent)] text-white text-xs font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`rounded-lg p-2 ${
                  isCurrent ? 'bg-[var(--accent)]/15 text-[var(--accent)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">{plan.name}</h2>
                  <p className="text-xs text-[var(--text-secondary)]">{plan.tagline}</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-[var(--text-primary)]">
                  ₹{price.toLocaleString('en-IN')}
                </span>
                {plan.monthlyPrice > 0 && (
                  <span className="text-sm text-[var(--text-tertiary)]">/month</span>
                )}
              </div>

              {yearly && plan.yearlyPrice > 0 && (
                <p className="text-xs text-[var(--accent)] font-medium mb-4">
                  ₹{plan.yearlyPrice.toLocaleString('en-IN')}/year &mdash; Save {plan.savings}%
                </p>
              )}
              {plan.monthlyPrice === 0 && <div className="mb-4" />}

              <div className="border-t border-[var(--glass-border)] my-4" />

              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-2 text-sm">
                    <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                      f.included
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                    }`}>
                      {f.included ? '✓' : '✗'}
                    </span>
                    <span className="text-[var(--text-primary)]">{f.label}</span>
                    {f.value && <span className="ml-auto text-xs text-[var(--text-tertiary)]">{f.value}</span>}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="mt-6 px-4 py-2 text-center text-sm font-medium text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-lg">
                  Current Plan
                </div>
              ) : (
                <Link
                  href={plan.monthlyPrice === 0 ? '/dashboard' : `/upgrade?plan=${plan.id}`}
                  className={`mt-6 block text-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isPopular
                      ? 'bg-[var(--accent)] text-white hover:opacity-90'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--border)]'
                  }`}
                >
                  {plan.monthlyPrice === 0 ? 'Get Started' : 'Upgrade'}
                </Link>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
