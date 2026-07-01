# Pricing Plans: Three-Tier Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current 2-tier (Free + Premium/Coming Soon) with 3-tier (Free Trial, Premium, Premium Pro) with INR pricing and annual billing.

**Architecture:** All plan logic flows from `plan_tier` string on `profiles` table. The enum expands from `'free' | 'premium'` to `'free' | 'premium' | 'premium_pro'`. Plan limits are centralized in `quota.ts`. Feature gating uses the plan_tier value directly in API routes. The pricing page is a 3-column client component with monthly/yearly toggle.

**Tech Stack:** Next.js, Supabase (Postgres), Zod, Tailwind CSS

---

### Task 1: Database Migration — Add `premium_pro` tier

**Files:**
- Create: `supabase/migrations/016_add_premium_pro_tier.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Add premium_pro to the plan_tier check constraint
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_plan_tier_check;

ALTER TABLE profiles 
  ADD CONSTRAINT profiles_plan_tier_check 
  CHECK (plan_tier IN ('free', 'premium', 'premium_pro'));
```

- [ ] **Step 2: Verify migration syntax**

Run: `supabase migration list`
Expected: Shows 016_add_premium_pro_tier as pending or similar

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/016_add_premium_pro_tier.sql
git commit -m "feat: add premium_pro plan tier to database"
```

---

### Task 2: Update Plan Limits in `quota.ts`

**Files:**
- Modify: `src/lib/quota.ts`

- [ ] **Step 1: Update `getPlanLimits` for 3 tiers**

Replace the function body with:

```typescript
export function getPlanLimits(planTier: string): { maxResumes: number; maxJobs: number } {
  if (planTier === 'premium' || planTier === 'premium_pro') {
    return { maxResumes: Infinity, maxJobs: Infinity }
  }
  return { maxResumes: 3, maxJobs: 15 }
}
```

Change free limit from 4 resumes to 3.

- [ ] **Step 2: Add `getAiLimit` helper**

Add after `getPlanLimits`:

```typescript
export function getAiLimit(planTier: string): number {
  if (planTier === 'premium_pro') return Infinity
  if (planTier === 'premium') return 100
  return 10
}
```

- [ ] **Step 3: Verify file reads correctly**

Run: `npm run typecheck`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/quota.ts
git commit -m "feat: update plan limits for 3-tier system"
```

---

### Task 3: Update Zod Validation

**Files:**
- Modify: `src/lib/validation.ts`

- [ ] **Step 1: Add `premium_pro` to admin update plan schema**

Change line 93 from:
```typescript
plan_tier: z.enum(['free', 'premium']),
```
to:
```typescript
plan_tier: z.enum(['free', 'premium', 'premium_pro']),
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validation.ts
git commit -m "feat: add premium_pro to Zod validation"
```

---

### Task 4: Update AI Route — Tiered Limits

**Files:**
- Modify: `src/app/api/ai/route.ts`

- [ ] **Step 1: Replace inline AI limit logic**

Import `getAiLimit` at the top:
```typescript
import { checkResumeQuota, getAiLimit } from '@/lib/quota'
```

Change line 25 from:
```typescript
const aiLimit = planTier === 'premium' ? 100 : 10
```
to:
```typescript
const aiLimit = getAiLimit(planTier)
```

Update the error message on line 35 from:
```typescript
{ error: `AI usage limit reached (${count}/${aiLimit}). ${planTier === 'free' ? 'Upgrade to premium for more.' : ''}` },
```
to:
```typescript
{ error: `AI usage limit reached (${count}/${aiLimit}). ${planTier === 'free' ? 'Upgrade to Premium or Premium Pro for more.' : ''}` },
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/ai/route.ts
git commit -m "feat: use getAiLimit for tiered AI usage limits"
```

---

### Task 5: Update Interview API Gate

**Files:**
- Modify: `src/app/api/interview/route.ts`

- [ ] **Step 1: Update gate check**

Change line 20 from:
```typescript
if (planTier !== 'premium') {
```
to:
```typescript
if (planTier !== 'premium' && planTier !== 'premium_pro') {
```

Update error message on line 22 from:
```typescript
{ error: 'Mock Interview is a Premium feature. Upgrade to access.' },
```
to:
```typescript
{ error: 'Mock Interview is available on Premium and Premium Pro plans. Upgrade to access.' },
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/interview/route.ts
git commit -m "feat: allow premium_pro access to mock interview"
```

---

### Task 6: Update Experts API Gate

**Files:**
- Modify: `src/app/api/experts/route.ts`

- [ ] **Step 1: Update gate check**

Change line 23 from:
```typescript
if (planTier !== 'premium') {
```
to:
```typescript
if (planTier !== 'premium_pro') {
```

Update error message on line 25 from:
```typescript
{ error: 'Expert Consultants is a Premium feature. Upgrade to access.' },
```
to:
```typescript
{ error: 'Expert Consultants is a Premium Pro feature. Upgrade to access.' },
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/experts/route.ts
git commit -m "feat: gate experts behind premium_pro tier"
```

---

### Task 7: Update Check-Premium API

**Files:**
- Modify: `src/app/api/auth/check-premium/route.ts`

- [ ] **Step 1: Return plan info instead of just premium boolean**

Replace the file content with:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ premium: false, planTier: 'free' }, { status: 401 })
    }

    const { data } = await supabase
      .from('profiles')
      .select('plan_tier')
      .eq('id', user.id)
      .single()

    const planTier = data?.plan_tier || 'free'
    const premium = planTier === 'premium' || planTier === 'premium_pro'
    return NextResponse.json({ premium, planTier })
  } catch {
    return NextResponse.json({ premium: false, planTier: 'free' })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/auth/check-premium/route.ts
git commit -m "feat: return planTier from check-premium API"
```

---

### Task 8: Update PremiumGate Component

**Files:**
- Modify: `src/components/ui/PremiumGate.tsx`

- [ ] **Step 1: Add prop for required tier**

Change the props type and add logic for which tier is required:

```typescript
export function PremiumGate({ children, feature, requiredTier = 'premium' }: { 
  children: ReactNode; 
  feature: string;
  requiredTier?: 'premium' | 'premium_pro' 
}) {
```

- [ ] **Step 2: Update the plan check**

Change line 53 from:
```typescript
if (profile?.plan_tier === 'premium' || serverPremium) {
```
to:
```typescript
if (profile?.plan_tier === requiredTier || profile?.plan_tier === 'premium_pro' || serverPremium) {
```

(Premium Pro users get access to everything, including premium-tier features)

- [ ] **Step 3: Update the lock message**

Change lines 67-70 from:
```typescript
<p className="mb-6 max-w-md text-sm text-gray-600 dark:text-gray-400">
  {feature} is available exclusively on the Premium plan. Upgrade to unlock unlimited
  access to expert consultants, mock interviews, and more.
</p>
```
to:
```typescript
<p className="mb-6 max-w-md text-sm text-gray-600 dark:text-gray-400">
  {feature} is available on the {requiredTier === 'premium_pro' ? 'Premium Pro' : 'Premium'} plan{requiredTier === 'premium' ? ' and above' : ''}. Upgrade to unlock access.
</p>
```

- [ ] **Step 4: Update the Upgrade button link**

Change the button text from "Upgrade to Premium" to:
```typescript
Upgrade to {requiredTier === 'premium_pro' ? 'Premium Pro' : 'Premium'}
```

- [ ] **Step 5: Update upgrade link to include plan param**

Change the Link href from `/upgrade` to:
```typescript
<Link href={`/upgrade?plan=${requiredTier}`}>
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/PremiumGate.tsx
git commit -m "feat: update PremiumGate with tiered gating"
```

---

### Task 9: Rebuild Upgrade/Pricing Page

**Files:**
- Modify: `src/app/(protected)/upgrade/page.tsx`

- [ ] **Step 1: Replace entire file**

Write the new 3-column pricing page with monthly/yearly toggle:

```typescript
'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { Card } from '@/components/ui'
import { Sparkles, Zap, Crown } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

const MONTHLY = {
  premium: { price: 299, yearly: 3000, savings: 16 },
  premiumPro: { price: 500, yearly: 5500, savings: 8 },
}

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
      { label: 'Resume creations', value: '3 total' },
      { label: 'Skill Gap' },
      { label: 'Job Search' },
      { label: 'AI Mock Interview', included: false },
      { label: 'Expert support (1:1)', included: false },
      { label: 'AI actions', value: '10/month' },
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
      { label: 'Resume creations', value: 'Unlimited' },
      { label: 'Skill Gap' },
      { label: 'Job Search' },
      { label: 'AI Mock Interview' },
      { label: 'Expert support (1:1)', included: false },
      { label: 'AI actions', value: '100/month' },
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
      { label: 'Resume creations', value: 'Unlimited' },
      { label: 'Skill Gap' },
      { label: 'Job Search' },
      { label: 'AI Mock Interview' },
      { label: 'Expert support (1:1)' },
      { label: 'AI actions', value: 'Unlimited' },
    ],
  },
]

export default function UpgradePage() {
  const { profile } = useAuth()
  const searchParams = useSearchParams()
  const preselected = searchParams.get('plan') || ''
  const [yearly, setYearly] = useState(false)
  const currentTier: PlanTier = profile?.plan_tier || 'free'

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
                  ₹{plan.yearlyPrice.toLocaleString('en-IN')}/year — Save {plan.savings}%
                </p>
              )}
              {plan.monthlyPrice === 0 && <div className="mb-4" />}

              <div className="border-t border-[var(--glass-border)] my-4" />

              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-2 text-sm">
                    <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                      f.included !== false
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                    }`}>
                      {f.included !== false && f.included !== undefined ? '✓' : f.included === undefined && !f.value ? '✓' : '✗'}
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
```

- [ ] **Step 2: Verify the page renders**

Run: `npm run build` (check for compilation errors only)
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/(protected)/upgrade/page.tsx
git commit -m "feat: rebuild pricing page with 3 tiers and INR pricing"
```

---

### Task 10: Update Sidebar — Premium Icon Logic

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Update `isFree` check**

Change line 32 from:
```typescript
const isFree = profile?.plan_tier !== 'premium'
```
to:
```typescript
const isFree = profile?.plan_tier !== 'premium' && profile?.plan_tier !== 'premium_pro'
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: update sidebar premium check for premium_pro"
```

---

### Task 11: Update Dashboard — Plan Banner

**Files:**
- Modify: `src/app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Update the tier check for showing upgrade banner**

Change line 48 from:
```typescript
{profile?.plan_tier === 'free' && (
```
to:
```typescript
{profile?.plan_tier === 'free' && (profile?.plan_tier !== 'premium' && profile?.plan_tier !== 'premium_pro') && (
```

(Simpler: just keep it as `=== 'free'` — the free trial users see the upgrade banner, premium/premium_pro don't. The original `=== 'free'` already works for this since premium_pro users won't match.)

Actually, the original line `profile?.plan_tier === 'free'` already works correctly — premium_pro users won't match this condition. No change needed. But let me update the copy.

Update the banner text on line 52 from:
```typescript
<p className="text-xs text-[var(--text-secondary)]">Upgrade to Premium for unlimited resumes and job tracking.</p>
```
to:
```typescript
<p className="text-xs text-[var(--text-secondary)]">Upgrade to Premium or Premium Pro for unlimited resumes and job tracking.</p>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(protected)/dashboard/page.tsx
git commit -m "feat: update dashboard banner text for 3 tiers"
```

---

### Task 12: Update Profile Form — Plan Badge

**Files:**
- Modify: `src/app/(protected)/profile/ProfileForm.tsx`

- [ ] **Step 1: Update the plan display section (lines 278-311)**

Change the plan tier section to handle 3 tiers:

Replace the content from line 279 to 311 with:

```tsx
        {/* Plan Tier */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl mb-6">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${
              activeProfile?.plan_tier === 'premium' || activeProfile?.plan_tier === 'premium_pro'
                ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                : 'bg-[var(--warning)]/15 text-[var(--warning)]'
            }`}>
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {activeProfile?.plan_tier === 'premium_pro' ? 'Premium Pro Plan' 
                  : activeProfile?.plan_tier === 'premium' ? 'Premium Plan' 
                  : 'Free Trial Plan'}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {activeProfile?.plan_tier === 'premium_pro'
                  ? 'Unlimited resumes, tracking, expert support & more'
                  : activeProfile?.plan_tier === 'premium'
                  ? 'Unlimited resumes and job tracking'
                  : 'Upgrade for unlimited resumes, mock interviews & more'}
              </p>
            </div>
          </div>
          {activeProfile?.plan_tier === 'free' && (
            <Link
              href="/upgrade"
              className="flex items-center gap-1 px-4 py-2 bg-[var(--accent)] text-white text-sm font-medium rounded-xl hover:bg-[var(--accent-hover)] transition-all"
            >
              Upgrade
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
          {(activeProfile?.plan_tier === 'premium' || activeProfile?.plan_tier === 'premium_pro') && (
            <Badge variant="accent">{activeProfile.plan_tier === 'premium_pro' ? 'Premium Pro' : 'Premium'}</Badge>
          )}
        </div>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(protected)/profile/ProfileForm.tsx
git commit -m "feat: update profile plan display for 3 tiers"
```

---

### Task 13: Update Admin Users Page — 3-Tier Plan Toggle

**Files:**
- Modify: `src/app/(protected)/admin/users/page.tsx`

- [ ] **Step 1: Update PLAN_COLORS**

Change lines 7-10 from:
```typescript
const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  premium: 'bg-green-100 text-green-700',
}
```
to:
```typescript
const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  premium: 'bg-green-100 text-green-700',
  premium_pro: 'bg-purple-100 text-purple-700',
}
```

- [ ] **Step 2: Update `togglePlan` to cycle through 3 tiers**

Replace the togglePlan function (lines 43-64) with:

```typescript
  const cyclePlan = async (user: Profile) => {
    const nextTier = user.plan_tier === 'free' ? 'premium' 
      : user.plan_tier === 'premium' ? 'premium_pro' 
      : 'free'
    setUpdating(user.id)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id: user.id, plan_tier: nextTier }),
      })
      if (!res.ok) throw new Error('Update failed')
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, plan_tier: nextTier } : u)))
    } catch {
      setError('Failed to update plan')
    } finally {
      setUpdating(null)
    }
  }
```

- [ ] **Step 3: Update the button onClick and text**

Change line 183-193:
```typescript
                    <button
                      onClick={() => togglePlan(u)}
                      disabled={updating === u.id}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        u.plan_tier === 'premium'
                          ? 'border-red-200 text-red-600 hover:bg-red-50'
                          : 'border-green-200 text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {updating === u.id ? '...' : u.plan_tier === 'premium' ? 'Downgrade' : 'Upgrade'}
                    </button>
```
to:
```typescript
                    <button
                      onClick={() => cyclePlan(u)}
                      disabled={updating === u.id}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        u.plan_tier === 'free'
                          ? 'border-green-200 text-green-600 hover:bg-green-50'
                          : u.plan_tier === 'premium'
                          ? 'border-purple-200 text-purple-600 hover:bg-purple-50'
                          : 'border-red-200 text-red-600 hover:bg-red-50'
                      }`}
                    >
                      {updating === u.id ? '...' : u.plan_tier === 'free' ? 'To Premium' : u.plan_tier === 'premium' ? 'To Pro' : 'To Free'}
                    </button>
```

- [ ] **Step 4: Update counts on line 119-120**

Change from:
```typescript
  const freeCount = users.filter(u => u.plan_tier === 'free').length
  const premiumCount = users.filter(u => u.plan_tier === 'premium').length
```
to:
```typescript
  const freeCount = users.filter(u => u.plan_tier === 'free').length
  const premiumCount = users.filter(u => u.plan_tier === 'premium').length
  const proCount = users.filter(u => u.plan_tier === 'premium_pro').length
```

Update the display on line 128 from:
```typescript
            {users.length} total · {freeCount} free · {premiumCount} premium
```
to:
```typescript
            {users.length} total · {freeCount} free · {premiumCount} premium · {proCount} pro
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(protected)/admin/users/page.tsx
git commit -m "feat: update admin users page for 3-tier plan cycling"
```

---

### Task 14: Update Admin API — Accept `premium_pro`

**Files:**
- Modify: `src/app/api/admin/users/route.ts`

No code change needed — the Zod schema was updated in Task 3 to accept `'premium_pro'`, and the API uses the parsed value directly. Validation is handled.

- [ ] **Step 1: Verify no changes needed**

Run: `npm run typecheck`
Expected: No type errors

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: admin API already supports premium_pro via updated Zod schema"
```

---

### Task 15: Update Admin Sales Page — Track Premium Pro

**Files:**
- Modify: `src/app/(protected)/admin/sales/page.tsx`

- [ ] **Step 1: Update PlanStats interface**

Add `premiumPro` field:
```typescript
interface PlanStats {
  total: number
  free: number
  premium: number
  premiumPro: number
  conversionRate: string
  referredCount: number
  withReferralCode: number
}
```

- [ ] **Step 2: Update stats computation**

Change lines 41-49 to:
```typescript
  const stats: PlanStats = {
    total: users.length,
    free: users.filter(u => u.plan_tier === 'free').length,
    premium: users.filter(u => u.plan_tier === 'premium').length,
    premiumPro: users.filter(u => u.plan_tier === 'premium_pro').length,
    conversionRate: users.length > 0
      ? (((users.filter(u => u.plan_tier === 'premium' || u.plan_tier === 'premium_pro').length) / users.length) * 100).toFixed(1)
      : '0.0',
    referredCount: users.filter(u => u.referred_by).length,
    withReferralCode: users.filter(u => u.referral_code).length,
  }
```

- [ ] **Step 3: Update stat cards**

Add a card for premium_pro after the premium card (after line 55):
```typescript
    { label: 'Premium Pro', value: String(stats.premiumPro), sub: `${stats.total > 0 ? ((stats.premiumPro / stats.total) * 100).toFixed(0) : 0}% of users`, color: 'text-purple-600 bg-purple-50' },
```

- [ ] **Step 4: Update plan distribution chart**

Add premium_pro bar after Premium (after line 110):
```tsx
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Premium Pro</span>
                <span className="font-medium text-gray-900">{stats.premiumPro} ({((stats.premiumPro / stats.total) * 100).toFixed(0)}%)</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${(stats.premiumPro / stats.total) * 100}%` }}
                />
              </div>
            </div>
```

- [ ] **Step 5: Update recent users plan badge**

Change the badge check on line 128 from:
```typescript
u.plan_tier === 'premium' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
```
to:
```typescript
u.plan_tier === 'premium_pro' ? 'bg-purple-100 text-purple-700' : u.plan_tier === 'premium' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
```

- [ ] **Step 6: Commit**

```bash
git add src/app/(protected)/admin/sales/page.tsx
git commit -m "feat: track premium_pro in admin sales dashboard"
```

---

### Task 16: Update Expert/Mock Interview Page to use Premium Gate

**Files:**
- Modify: `src/app/(protected)/experts/page.tsx`
- Modify: `src/app/(protected)/interview/page.tsx`

- [ ] **Step 1: Update experts page gate**

In `src/app/(protected)/experts/page.tsx`, find the `<PremiumGate>` usage (likely wrapping the content). Change it to:
```tsx
<PremiumGate feature="Expert Consultants" requiredTier="premium_pro">
```

- [ ] **Step 2: Update interview page gate**

In `src/app/(protected)/interview/page.tsx`, find the `<PremiumGate>` usage. It should be:
```tsx
<PremiumGate feature="Mock Interview" requiredTier="premium">
```
(or no change needed since 'premium' is the default)

- [ ] **Step 3: Commit**

```bash
git add src/app/(protected)/experts/page.tsx src/app/(protected)/interview/page.tsx
git commit -m "feat: update PremiumGate usage for correct tier requirements"
```

---

### Task 17: Self-Review and Verification

**Files:** None

- [ ] **Step 1: Verify the plan covers all spec requirements**

Check each spec section maps to a task:
- Plan structure (3 tiers, prices) → Task 9
- Feature mapping (mock interview on premium+, experts on premium_pro) → Task 5, 6, 8, 16
- AI limits → Task 4
- Database changes → Task 1
- File modifications → Tasks 2-16
- Pricing page layout → Task 9
- Non-changes (Skill Gap, Job Search stay free) → confirmed by not adding gates

- [ ] **Step 2: Verify no placeholders**

Check the plan for any "TBD", "TODO", "implement later" — none should exist.

- [ ] **Step 3: Run full build to verify**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Run existing tests**

```bash
npm test
```

Expected: All tests pass.
