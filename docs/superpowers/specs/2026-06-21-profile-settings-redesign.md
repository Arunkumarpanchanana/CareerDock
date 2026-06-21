# Profile Settings Page Redesign

**Date:** 2026-06-21
**Status:** Approved Design
**Approach:** Structured Settings Hub

---

## 1. Layout & Structure

The page reorganizes into three grouped cards under a shared heading:

| Card | Contents |
|------|----------|
| **Personal Information** | Avatar, name, role title, location, persona selector |
| **Contact Details** | Email, phone, LinkedIn URL, website/portfolio |
| **Account** | Plan tier badge + upgrade link + change password |

All three sit inside the existing `max-w-2xl mx-auto` wrapper. No tabs or accordions — clean section headers with subtle dividers.

### Data Flow

1. `AuthProvider` provides `profile` and `refreshProfile`
2. On mount, form fields populate from `profile` (or direct Supabase fetch if null)
3. **Save Changes** calls `PUT /api/profile`, then `refreshProfile()`
4. Persona selection calls same `PUT /api/profile` endpoint
5. Password change uses Supabase Auth client-side methods (unchanged)

---

## 2. Styling Alignment

All hardcoded Tailwind gray classes replaced with app CSS variables:

| Before | After |
|--------|-------|
| `text-gray-900` | `text-[var(--text-primary)]` |
| `text-gray-600`, `text-gray-500` | `text-[var(--text-secondary)]` |
| `text-gray-400` | `text-[var(--text-tertiary)]` |
| `border-gray-100` | `border-[var(--glass-border)]` |
| `bg-blue-100` / `text-blue-700` (avatar) | `bg-[var(--accent)]/15` / `text-[var(--accent)]` |
| `text-green-600` / `text-red-600` | `text-[var(--success)]` / `text-[var(--danger)]` |

Buttons, inputs, and card components already use CSS variables — no changes needed there.

---

## 3. Persona Selector

A compact three-button chip group in the Personal Information card, between the avatar header and the location field.

- Uses `Button` component with `variant={selected ? 'primary' : 'secondary'}` and `size="sm"`
- On click: calls `PUT /api/profile { persona: 'fresher'|'professional'|'executive' }`
- Current persona from profile is pre-selected
- Icons: `GraduationCap` (Fresher), `Briefcase` (Professional), `Crown` (Executive)

---

## 4. Plan Tier & Referral

In the Account card, above the password section:

- Plan tier displayed as a `Badge` component: `accent` variant for Premium, `warning` for Free
- "Upgrade" link next to badge → `/upgrade`
- `ReferralCard` component placed below the Account card (matching dashboard pattern)

---

## 5. Change Password

Same functionality — only visual changes:

- Heading: `text-[var(--text-primary)]`
- Labels: `text-[var(--text-secondary)]`
- Success: `text-[var(--success)]`
- Error: `text-[var(--danger)]`

No behavioral changes.

---

## 6. Files to Modify

| File | Changes |
|------|---------|
| `src/app/(protected)/profile/page.tsx` | Full rewrite of page component |
| `src/types/database.ts` | No changes needed (Profile type already has `persona`, `plan_tier`) |
| `src/lib/validation.ts` | No changes needed (`profileUpdateSchema` already includes `persona`) |
| `src/app/api/profile/route.ts` | No changes needed (already passes all parsed fields) |

## 7. Non-Goals

- No new API routes
- No new database migrations
- No new components (uses existing `Button`, `Input`, `Card`, `Badge`, `ReferralCard`)
- No behavior change to password reset flow
- No tabs or accordions
