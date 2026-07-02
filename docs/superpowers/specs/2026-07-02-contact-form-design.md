# Contact Form Page

## Overview
A standalone `/contact` page with a form that sends inquiries to `support@mycareerdock.com` via SMTP/nodemailer.

## Pages & Routes

### `/contact` (public)
- `src/app/contact/page.tsx` — 'use client' page with nav header, contact form, and footer
- Header matches the landing page: logo + "Sign In" / "Get Started" links
- Footer matches the landing page footer, with an added "Contact" link

### `POST /api/contact`
- `src/app/api/contact/route.ts` — accepts JSON body, sends email via nodemailer

## Form Fields
| Field | Type | Validation |
|-------|------|------------|
| Name | text input | required |
| Email | email input | required, valid email |
| Subject | text input | required |
| Message | textarea | required, min 10 chars |

## Email Sending
- Library: `nodemailer`
- SMTP config via env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- Email sent from the configured SMTP user to `support@mycareerdock.com`
- Reply-to set to the submitter's email

## UI Design
- Follows the landing page design system (navy/blue palette, Hanken Grotesk headings)
- Form rendered as a card on a light background section
- Reuses existing `Input` and `Button` components
- Inline success/error message above the submit button
- Loading state on submit button

## Files to Create/Modify
1. `src/app/contact/page.tsx` — new contact page
2. `src/app/api/contact/route.ts` — new API route
3. `src/app/page.tsx` — add "Contact" link to footer
4. `package.json` — add `nodemailer` and `@types/nodemailer`

## Out of Scope
- Rate limiting (can add later)
- Captcha (not requested)
- Database storage of submissions (not requested)
- Email template customization
