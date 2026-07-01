# Pricing Plans: Three-Tier Restructure

## Overview

Restructure from current 2-tier (Free + Premium/Coming Soon) to 3-tier (Free Trial, Premium, Premium Pro) with INR pricing and annual billing options.

## Plan Structure

| Tier | Monthly | Yearly |
|------|---------|--------|
| Free Trial | ₹0 | — |
| Premium | ₹299/mo | ₹3,000/yr |
| Premium Pro | ₹500/mo | ₹5,500/yr |

## Feature Mapping

| Feature | Free Trial | Premium | Premium Pro |
|---------|:---------:|:-------:|:-----------:|
| Resume creations | 3 total | Unlimited | Unlimited |
| Skill Gap | ✅ | ✅ | ✅ |
| Job Search | ✅ | ✅ | ✅ |
| AI actions/month | 10 | 100 | Unlimited |
| AI Mock Interview | — | ✅ | ✅ |
| Expert support (1:1 booking) | — | — | ✅ |

## Database Changes

- New `plan_tier` values: `'free' | 'premium' | 'premium_pro'`
- Migration to update CHECK constraint on `profiles.plan_tier`
- Backfill existing `'free'` users stay on `'free'`
- Backfill existing `'premium'` users stay on `'premium'`

## Files to Modify

1. **supabase/migrations/** — new migration adding `'premium_pro'` to CHECK constraint
2. **src/lib/quota.ts** — `getPlanLimits()` for 3 tiers
3. **src/lib/validation.ts** — Zod enum add `'premium_pro'`
4. **src/types/database.ts** — type update (string, no strict enum needed)
5. **src/app/api/ai/route.ts** — AI limit switch for 3 tiers
6. **src/app/(protected)/upgrade/page.tsx** — 3-column pricing with INR
7. **src/components/ui/PremiumGate.tsx** — gate logic for 3 tiers
8. **src/app/api/experts/route.ts** — gate behind `premium_pro`
9. **src/app/api/interview/route.ts** — gate behind `premium` or `premium_pro`
10. **src/app/(protected)/dashboard/page.tsx** — plan banner update
11. **src/app/(protected)/profile/ProfileForm.tsx** — plan badge update
12. **src/components/layout/Sidebar.tsx** — premium icon logic for both paid tiers
13. **src/app/api/auth/check-premium/route.ts** — update for new tiers
14. **src/app/api/admin/users/route.ts** — update plan toggle for 3 tiers
15. **src/app/(protected)/admin/users/page.tsx** — admin UI update

## Pricing Page Layout

- 3-column grid (md:grid-cols-3)
- Free Trial: minimal card, ₹0, feature list
- Premium: highlighted card ("Most Popular"), monthly + yearly toggle
- Premium Pro: highest tier, monthly + yearly toggle
- Yearly pricing shows savings badge

## Non-Changes

- Skill Gap feature remains free across all tiers (no gate)
- Job Search remains free across all tiers (no gate)
- No Stripe/payment integration yet (admin-manually-set plans)
- No forced migration of existing users
