# FAQ Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 15-item accordion FAQ section to the landing page

**Architecture:** Single section added to `src/app/page.tsx` (existing 'use client' component). FAQ data as a const array, accordion toggle via `useState<number | null>`.

**Tech Stack:** Next.js 16, Tailwind v4, React 19

---

### Task 1: Add FAQ section to the landing page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/__tests__/page.test.tsx`

- [ ] **Step 1: Write the failing test**

Update `src/app/__tests__/page.test.tsx` to add a test for FAQ rendering:

```tsx
// Add this as a 4th test inside the existing describe block
it('renders the FAQ section with questions', () => {
  render(<HomePage />)
  expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument()
  expect(screen.getByText(/Is My Career Dock really free/)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/app/__tests__/page.test.tsx
```
Expected: FAIL — "Frequently Asked Questions" not found

- [ ] **Step 3: Add FAQ data and section to page.tsx**

Add this before the `export default function HomePage()` line (after the `steps` array):

```tsx
const faqs = [
  {
    q: 'Is My Career Dock really free to start?',
    a: 'Yes, absolutely. You can create a free account and start building resumes, tracking applications, and using AI suggestions right away — no credit card required.',
  },
  {
    q: "What's included in the Free plan?",
    a: 'The Free plan includes 3 resume builds, skill gap analysis, job search tools, and 10 AI suggestions per month. Enough to get a feel for the platform and make real progress.',
  },
  {
    q: 'How is Premium different from Free?',
    a: 'Premium unlocks unlimited resumes, AI mock interviews, 100 AI suggestions per month, and the full job pipeline tracker. You also get priority support.',
  },
  {
    q: 'Can I upgrade or downgrade my plan anytime?',
    a: 'Yes, you can upgrade or downgrade at any time. Upgrades take effect immediately, and downgrades apply at the next billing cycle.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards, including Visa, Mastercard, and RuPay. All payments are processed securely through our payment partner.',
  },
  {
    q: 'Can I cancel my subscription?',
    a: 'Absolutely. You can cancel anytime from your account settings. You\'ll retain access to Premium features until the end of your billing period.',
  },
  {
    q: 'How does the ATS resume builder work?',
    a: 'Our builder guides you through each section with expert-written prompts. It formats your content into clean, ATS-friendly layouts that recruiters and automated systems can parse easily.',
  },
  {
    q: 'What resume templates are available?',
    a: 'We offer three templates: Professional (traditional layout), Executive (leadership-focused), and Fresher (skills-forward). Each is optimized for ATS compatibility.',
  },
  {
    q: 'How do AI suggestions work?',
    a: 'As you fill in your resume, our AI analyzes your content and suggests stronger bullet points, better action verbs, and relevant skills based on your target role.',
  },
  {
    q: 'How many AI suggestions do I get per month?',
    a: 'Free users get 10 suggestions per month. Premium users get 100, and Premium Pro users get unlimited suggestions.',
  },
  {
    q: 'How does the job pipeline tracker work?',
    a: 'You can add jobs to a kanban-style board and drag them across stages — Wishlist, Applied, Interview, Offer, and Rejected. It keeps all your applications organised in one place.',
  },
  {
    q: 'How do I book an expert consultation?',
    a: 'Premium Pro users can browse available experts by industry, check their availability, and book 1:1 sessions directly from the platform.',
  },
  {
    q: 'Can I export my resume as PDF?',
    a: 'Yes, every resume you build can be downloaded as a clean, print-ready PDF with one click.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. We use industry-standard encryption for data storage and transmission. Your personal information and documents are never shared without your consent.',
  },
  {
    q: 'How do I contact support?',
    a: 'You can reach us through the Contact page, or email us directly at support@mycareerdock.com. We typically respond within 24 hours.',
  },
]
```

Then add `useState` and `ChevronDown` to the imports:

```tsx
import { useEffect, useRef, useState } from 'react'
// ... and in the lucide-react imports, add:
import { ChevronDown } from 'lucide-react'
```

Add this state inside the `HomePage` component, alongside the existing `scrolled` and `prices` state:

```tsx
const [openFaq, setOpenFaq] = useState<number | null>(null)
```

Insert the FAQ section between the Testimonial section and the CTA section (between the `</section>` closing the testimonial and the next `<section>` for CTA):

```tsx
        {/* FAQ */}
        <section className="bg-surface-faint py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <AnimatedSection className="text-center mb-16">
              <h2
                className="text-[32px] sm:text-[40px] font-bold text-navy-900 tracking-tight"
                style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
              >
                Frequently Asked Questions
              </h2>
              <p className="mt-3 text-lg text-on-surface-variant max-w-xl mx-auto">
                Quick answers to common questions. If you don&apos;t see what you&apos;re looking for, reach out through our Contact page.
              </p>
            </AnimatedSection>

            <div className="space-y-0">
              {faqs.map((faq, i) => (
                <div key={i} className="border-b border-blue-100 last:border-b-0">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-blue-600"
                  >
                    <span
                      className="text-base font-semibold text-navy-900"
                      style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
                    >
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-outline transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-96 pb-5' : 'max-h-0'}`}
                  >
                    <p className="text-base text-on-surface-variant leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/app/__tests__/page.test.tsx
```
Expected: PASS (4 tests)

- [ ] **Step 5: Run the full test suite**

```bash
npm test
```
Expected: All existing tests still pass

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/app/__tests__/page.test.tsx
git commit -m "feat: add FAQ section to landing page"
```
