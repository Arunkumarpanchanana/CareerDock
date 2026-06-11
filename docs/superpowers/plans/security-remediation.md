# Security Remediation Plan

## Goal: Full OWASP/CSP/HSTS/nosniff/BOLA/IDOR compliance

## Tasks

### Task 1: CSP with Nonces (middleware.ts)
- Move CSP from next.config.ts to middleware.ts
- Generate per-request nonce using `crypto.randomUUID()`
- Use `'strict-dynamic'` + nonce for script-src
- Conditionally allow `'unsafe-eval'` only in development
- Tighten `img-src` from `https:` to specific origins
- Add `frame-ancestors 'none'`
- Pass nonce via `x-nonce` header for Next.js auto-detection
- Keep auth redirect logic intact

Files: `src/middleware.ts`, `next.config.ts`

### Task 2: Fix Open Redirect (auth/callback)
- Validate `next` parameter is same-origin or on allowed path list
- Reject absolute URLs to external domains

File: `src/app/auth/callback/route.ts`

### Task 3: Zod Validation for Admin Routes
- Add expertSchema, bookingUpdateSchema, adminRoleSchema to validation.ts
- Import and use in admin/experts, admin/admins, admin/bookings

Files: `src/lib/validation.ts`, `src/app/api/admin/experts/route.ts`, `src/app/api/admin/admins/route.ts`, `src/app/api/admin/bookings/route.ts`

### Task 4: Secure Supabase Auth Config
- Set `password_requirements = "lower_upper_letters_digits_symbols"`
- Set `minimum_password_length = 8`
- Set `enable_confirmations = true`
- Set `secure_password_change = true`

File: `supabase/config.toml`

### Task 5: Remove Duplicate Referrer Meta Tag
- Remove `<meta name="referrer">` from layout.tsx (already in HTTP header)

File: `src/app/layout.tsx`

### Task 6: Re-audit
- Re-read all modified files to verify correctness
- Verify all 5 compliance areas
