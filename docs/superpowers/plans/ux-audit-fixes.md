# Plan: UX Audit Fixes — All Items

## Approach Decisions
- **PDF generation**: `@react-pdf/renderer` (client-side, real PDFs)
- **AI labeling**: Rename to "Templates" / "Suggestions" — remove all "AI" claims
- **ATS scoring**: Skipped (future feature)
- **Rate limiting**: In-memory is acceptable for v1; document limitation

## Task Breakdown

### Phase 1 — Critical (must ship)

| # | Task | Files | Effort |
|---|------|-------|--------|
| 1 | **Forgot Password flow** — Add `/auth/forgot-password` page (email → reset link), `/auth/reset-password` page (new password form). Wire to Supabase `resetPasswordForEmail()` + `updateUser()`. Update login page to link to forgot-password instead of alert. | `src/app/auth/forgot-password/page.tsx` (new), `src/app/auth/reset-password/page.tsx` (new), `src/app/auth/login/page.tsx` (edit) | 30 min |
| 2 | **PDF export** — Install `@react-pdf/renderer`. Create `ResumePDF.tsx` component matching resume layout. Replace "Download PDF" button to use PDF download. Remove old .html download. | `package.json`, `src/components/resume/ResumePDF.tsx` (new), `src/app/(protected)/resume/ResumeClient.tsx` (edit) | 45 min |
| 3 | **Email verification UI** — Check Supabase session for `email_confirmed_at`. Add unverified banner on dashboard. Handle unverified state in middleware (don't redirect to login, but show warning). | `src/app/(protected)/dashboard/page.tsx` (edit), `src/components/auth/EmailVerificationBanner.tsx` (new), `src/middleware.ts` (tweak) | 20 min |
| 4 | **Remove "AI" labeling** — Landing page: "AI-Powered Insights" → "Smart Suggestions". Resume builder: already says "Suggestions" (keep). Any metadata/descriptions referencing AI. | `src/app/page.tsx` (edit), `src/app/layout.tsx` (edit metadata) | 10 min |

### Phase 2 — High

| # | Task | Files | Effort |
|---|------|-------|--------|
| 5 | **Onboarding welcome** — Show welcome modal on first login (check localStorage flag). 3-step tooltip tour: Resume Builder → Job Tracker → Experts. | `src/components/auth/OnboardingModal.tsx` (new), `src/app/(protected)/layout.tsx` (edit) | 30 min |
| 6 | **Autosave resume** — Add 30s debounced auto-save in `ResumeClient`. Track dirty state. Show "Saved"/"Saving..." indicator. Warn on navigation with unsaved changes. | `src/app/(protected)/resume/ResumeClient.tsx` (edit) | 30 min |
| 7 | **Student summary template** — Add "Student / Entry Level" summary template to `suggestions.ts`. Add placeholder guidance text. | `src/lib/suggestions.ts` (edit), `src/components/resume/SummarySection.tsx` (edit) | 10 min |
| 8 | **Kanban search/filter** — Add search input above Kanban. Filter cards by company name or job title. | `src/app/(protected)/tracker/page.tsx` (edit) | 20 min |
| 9 | **Experts loading skeleton** — Create `CardSkeleton` component. Show 3 skeleton cards while experts load. | `src/components/ui/CardSkeleton.tsx` (new), `src/app/(protected)/experts/page.tsx` (edit) | 15 min |
| 10 | **Custom confirm modal** — Create `ConfirmModal` component. Replace all `confirm()` calls in tracker, resume, admin pages. | `src/components/ui/ConfirmModal.tsx` (new), `src/app/(protected)/tracker/page.tsx` (edit), `src/app/(protected)/resume/ResumeClient.tsx` (edit), admin pages | 30 min |
| 11 | **Dashboard expert sessions stat** — Query bookings count from DB instead of hardcoded "0". | `src/app/(protected)/dashboard/page.tsx` (edit) | 10 min |

### Phase 3 — Medium

| # | Task | Files | Effort |
|---|------|-------|--------|
| 12 | **Kanban drag threshold** — Increase drag activation distance to prevent accidental moves. | `src/app/(protected)/tracker/page.tsx` (edit) | 5 min |
| 13 | **Kanban column tooltips** — Add helper text explaining each column. | `src/app/(protected)/tracker/page.tsx` (edit) | 10 min |
| 14 | **Profile tab in resume** — Remove the dead-end Profile tab. Or replace with inline editable fields. | `src/app/(protected)/resume/ResumeClient.tsx` (edit) | 10 min |
| 15 | **Save feedback duration** — Increase auto-dismiss from 2s to 5s. | `src/app/(protected)/resume/ResumeClient.tsx` (edit) | 5 min |
| 16 | **Keyboard shortcut Cmd+S** — Add save-on-Cmd+S in resume builder. | `src/app/(protected)/resume/ResumeClient.tsx` (edit) | 10 min |
| 17 | **Mobile preview toggle** — Add toggle button to show/hide preview on small screens. | `src/app/(protected)/resume/ResumeClient.tsx` (edit) | 15 min |
| 18 | **Replace rate-limit Map with WeakMap** — Minor memory optimization. Document serverless limitation. | `src/lib/rate-limit.ts` (edit) | 5 min |

## Verification
- Build: `npx next build`
- Typecheck: `npx tsc --noEmit`
- Each task: manual test of the specific feature changed
