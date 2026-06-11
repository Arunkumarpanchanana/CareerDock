# Master Audit Report — CareerDock

**Date:** 2026-06-11  
**Audit Type:** Dual Persona UX Review (College Fresher + 3–5 Yr Engineer)  
**Status:** 🔴 Critical issues remain — not launch-ready

---

## Already Fixed (Since Prior Audit)

| Item | Status |
|------|--------|
| Security headers (CSP, HSTS, X-Frame-Options) | ✅ Fixed |
| Rate limiting on auth endpoints | ✅ Fixed (in-memory — see caveat in Medium) |
| reCAPTCHA on signup | ✅ Fixed |
| Password policy (min length, complexity) | ✅ Fixed |
| robots.txt | ✅ Fixed |

---

## Issue Catalog

### 🔴 Critical

| # | Issue | Persona | Problem | Recommended Fix |
|---|-------|---------|---------|----------------|
| 1 | **Forgot Password — Not Implemented** | Both | Clicking "Forgot Password" shows `alert("Not implemented")`. Hard production-blocker. | Implement full password reset flow (token by email, reset form, expiry). |
| 2 | **Download PDF Downloads .html** | Fresher | Resume "Download PDF" exports an `.html` file. Completely unusable for job applications. | Use a real HTML→PDF renderer (puppeteer, wkhtmltopdf, or a server-side library). |
| 3 | **No Email Verification on Signup** | Fresher | Users can sign up with any email — no verification link sent. Security and spam risk. | Send verification email on signup; block key features until verified. |
| 4 | **"AI-Powered Insights" Is Not AI** | Engineer | AI cards serve static arrays — no actual ML/LLM call. Misleading marketing. | Either integrate an actual AI call, rename to "Suggested Insights" or remove the AI badge entirely. Fraud claims erode trust. |

### 🟠 High

| # | Issue | Persona | Problem | Recommended Fix |
|---|-------|---------|---------|----------------|
| 5 | **Zero Onboarding / Walkthrough** | Both | After signup, users see an empty dashboard with no guidance. Both personas reported "now what?" | Add a progressive onboarding flow: welcome modal → guided tour (3–4 tooltips) → empty states with CTA. |
| 6 | **No Autosave** | Engineer | No autosave on resume builder. Competitors (Teal, Novoresume) save on blur. Users lose work. | Implement autosave (on blur / 30s interval) with "Saved" indicator. Add unsaved-changes warning on navigation. |
| 7 | **Resume Builder: No Student Templates** | Fresher | Fresher has zero experience — all templates assume work history. No guidance or placeholder text. | Add "Student / No Experience" template with sections: Education, Projects, Certifications, Skills. Include inline placeholder hints. |
| 8 | **Kanban Board: No Search / Filter / Pagination** | Engineer | At 50+ applications the board becomes unusable. No way to search, filter by status, paginate, or sort. | Add search bar, quick filters (status, company, date), pagination or virtual scroll, and column overflow scroll. |
| 9 | **No ATS Score / Keyword Analysis** | Engineer | Teal et al. scan job description vs resume and give an ATS match score. CareerDock has none. | Implement keyword extraction from JD, compare against resume, surface match % + missing keywords. |
| 10 | **No LinkedIn Import** | Engineer | Users must type every job/resume entry from scratch. Biggest adoption blocker. | Integrate LinkedIn API or PDF resume parser to auto-populate work history, education, skills. |
| 11 | **Experts Page: Flash of Empty + No Skeleton** | Both | On load, "No experts available" flashes before data arrives. No loading skeleton. No pricing, reviews, or availability shown. | Add skeleton loader (3–4 placeholder cards). Show loading state by default, hide on success. Show pricing tier + rating + available badges on cards. |
| 12 | **Delete Uses browser.confirm()** | Engineer | Delete actions (job, resume, etc.) use native `confirm()` — feels unpolished and cannot be styled. | Replace with a custom modal (confirm/cancel) that matches the app design system. |
| 13 | **Dashboard "Expert Sessions" Stuck at 0** | Engineer | Stat card shows `0` hardcoded — likely never wired to real data. Misleading to users. | Connect to actual bookings count (or hide if zero, with CTA to book one). |

### 🟡 Medium

| # | Issue | Persona | Problem | Recommended Fix |
|---|-------|---------|---------|----------------|
| 14 | **Kanban: Accidental Card Moves** | Fresher | Drag-and-drop too sensitive; cards move on click attempt. No confirmation. | Add drag delay or require explicit drag threshold. Consider a dropdown status picker as fallback. |
| 15 | **Kanban: Column Labels Confusing** | Fresher | "Wishlist" vs "Applied" distinction unclear. User uncertain where to place a job. | Add tooltip descriptions on column headers. Show example text in empty state: *"Jobs you've submitted an application for"*. |
| 16 | **Resume Builder: Profile Tab Is Dead End** | Fresher | Clicking Profile tab just redirects — no content, no feedback. | Remove the tab if unused, or wire it to real profile editing. At minimum show a "Coming Soon" state. |
| 17 | **Save Feedback Disappears Too Fast** | Engineer | Success toast auto-dismisses in ~2s. User has no time to read it. | Increase dismiss time to 5s or use a persistent banner that requires manual dismiss. |
| 18 | **No Keyboard Shortcuts** | Engineer | Resume editing requires all-mouse interaction. Keyboard shortcuts (Cmd+S → save, Tab → navigate sections) missing. | Add common shortcuts: Cmd+S (save), Cmd+B/I (bold/italic), Tab between sections. |
| 19 | **Preview Hidden on Mobile** | Fresher | Resume preview is hidden on small screens. User can't see output while editing. | Add slide-up preview toggle or switch to mobile-optimized single-column layout. |
| 20 | **In-Memory Rate Limiting Resets on Restart** | Engineer | Current rate limiter stores state in memory — data lost on server restart. Doesn't work in serverless (Vercel, Lambda). | Move rate limiting to Redis, DB, or use a distributed store. |
| 21 | **Inconsistent Error States** | Engineer | Some errors show toasts, some show inline messages, some fail silently. No pattern. | Centralize error handling: one component for inline errors, one for toasts. Define component-level loading/error/empty states. |

### 🔵 Low

| # | Issue | Persona | Problem | Recommended Fix |
|---|-------|---------|---------|----------------|
| 22 | **No Job Search Integration** | Fresher | Must manually add every job. No integration with LinkedIn, Indeed, etc. | (Lower priority) Add "Import from URL" or browser bookmarklet. |
| 23 | **Only One Resume Template (Serif)** | Engineer | Single template — serif font that user may not prefer. Competitors offer 20+. | (Lower priority) Add 3–5 templates covering sans-serif, modern, minimal. Offer font family switcher. |
| 24 | **No Browser Extension** | Engineer | Simplify.jobs auto-detects job postings. No equivalent here. | (Feature-track) Build a simple Chrome extension that captures job URL + metadata. |
| 25 | **No Duplicate Job Detection** | Engineer | Same job can be added twice across columns. No dedup or warning. | Check URL/company+title uniqueness before insert; show duplicate warning. |

### 🟢 Feature Requests

| # | Issue | Persona | Problem | Recommended Fix |
|---|-------|---------|---------|----------------|
| 26 | **Would Use Google Sheets Instead** | Fresher | App doesn't offer enough value over a spreadsheet. Not sticky. | Address Critical + High issues above. Only once core value is solid, add: email reminders, application stats, weekly progress emails. |
| 27 | **Experts: No Reviews / Ratings** | Engineer | No social proof to pick an expert. | (Post-MVP) Add reviewed-only ratings, number of sessions completed, tags. |
| 28 | **Experts: No Inline Availability** | Engineer | Must click into each expert to see if they're free. | (Post-MVP) Show calendar availability dots on the card. |

---

## Summary: Top 5 Things to Fix First

Ranked by blast radius (blocks users + erodes trust):

1. **Forgot Password** (Critical) — Blocks login recovery for every user.
2. **Download PDF = .html** (Critical) — Resume export is core feature; broken export = broken product.
3. **No Email Verification** (Critical) — Security risk; enables spam accounts.
4. **"AI" Is Fake** (Critical) — Legal/marketing liability. Fix messaging or implement real AI.
5. **Zero Onboarding** (High) — Both personas bounced immediately. Largest retention lever.

---

## Verdict

**Not launch-ready.** 4 Critical and 9 High issues remain. The app has skeleton features but fails at every core user-facing moment: onboarding, login recovery, resume export, and data persistence. The engineering review also revealed architectural concerns (rate limiting in serverless, fake AI) that will erode trust once discovered.

The app needs **one focused sprint** on the Critical and top-5 High issues before any further feature work. The prior audit's security fixes are good — but UX fundamentals and core feature delivery are not yet at production quality.

**Estimated readiness: ~40%**
