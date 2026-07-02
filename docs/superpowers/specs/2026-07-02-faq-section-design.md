# FAQ Section on Landing Page

## Overview
Add an accordion-style Frequently Asked Questions section to the landing page between the Testimonial section and the CTA section.

## Placement
Between `<!-- Testimonial -->` and `<!-- CTA -->` sections in `src/app/page.tsx`.

## Content (15 questions)

1. Is My Career Dock really free to start?
   Yes, absolutely. You can create a free account and start building resumes, tracking applications, and using AI suggestions right away — no credit card required.

2. What's included in the Free plan?
   The Free plan includes 3 resume builds, skill gap analysis, job search tools, and 10 AI suggestions per month. Enough to get a feel for the platform and make real progress.

3. How is Premium different from Free?
   Premium unlocks unlimited resumes, AI mock interviews, 100 AI suggestions per month, and the full job pipeline tracker. You also get priority support.

4. Can I upgrade or downgrade my plan anytime?
   Yes, you can upgrade or downgrade at any time. Upgrades take effect immediately, and downgrades apply at the next billing cycle.

5. What payment methods do you accept?
   We accept all major credit and debit cards, including Visa, Mastercard, and RuPay. All payments are processed securely through our payment partner.

6. Can I cancel my subscription?
   Absolutely. You can cancel anytime from your account settings. You'll retain access to Premium features until the end of your billing period.

7. How does the ATS resume builder work?
   Our builder guides you through each section with expert-written prompts. It formats your content into clean, ATS-friendly layouts that recruiters and automated systems can parse easily.

8. What resume templates are available?
   We offer three templates: Professional (traditional layout), Executive (leadership-focused), and Fresher (skills-forward). Each is optimized for ATS compatibility.

9. How do AI suggestions work?
   As you fill in your resume, our AI analyzes your content and suggests stronger bullet points, better action verbs, and relevant skills based on your target role.

10. How many AI suggestions do I get per month?
    Free users get 10 suggestions per month. Premium users get 100, and Premium Pro users get unlimited suggestions.

11. How does the job pipeline tracker work?
    You can add jobs to a kanban-style board and drag them across stages — Wishlist, Applied, Interview, Offer, and Rejected. It keeps all your applications organised in one place.

12. How do I book an expert consultation?
    Premium Pro users can browse available experts by industry, check their availability, and book 1:1 sessions directly from the platform.

13. Can I export my resume as PDF?
    Yes, every resume you build can be downloaded as a clean, print-ready PDF with one click.

14. Is my data secure?
    Yes. We use industry-standard encryption for data storage and transmission. Your personal information and documents are never shared without your consent.

15. How do I contact support?
    You can reach us through the Contact page at /contact, or email us directly at support@mycareerdock.com. We typically respond within 24 hours.

## UI Design
- Accordion pattern: click a question to expand/collapse its answer
- Uses the same `AnimatedSection` wrapper for scroll-in animation
- Styling matches the landing page: navy headings, blue accents, Consistent spacing
- Each item: border-bottom separator, chevron icon that rotates on expand
- Smooth height transition on expand/collapse

## Implementation
- Single section added to `src/app/page.tsx` (existing `'use client'` file)
- Local state: `openIndex: number | null` to track which item is expanded
- No new dependencies or components
- No new test files needed (existing page tests verify rendering)

## Out of Scope
- Search/filter for FAQs
- Data-driven from a CMS
- Rich text answers (plain text only)
