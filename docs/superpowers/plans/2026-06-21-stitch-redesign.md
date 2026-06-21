# Stitch-Inspired Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Redesign CareerDock with Stitch-inspired dark/light glassmorphism design system, career canvas page, vibe system, and CAREER.md export.

**Architecture:** CSS variables for theming, new UI component system (GlassPanel, Badge, ThemeToggle, VibeChip, AnimatedBackground), canvas page with draggable modules and agent manager sidebar, vibe-driven accent shifting.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, TypeScript, lucide-react, Zod v4

---

### Task 1: Design System CSS Tokens & Globals

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update globals.css with design tokens and glass utilities**

```css
@import "tailwindcss";

:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-tertiary: #1a1a25;
  --glass-bg: rgba(255, 255, 255, 0.04);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-glow: rgba(99, 102, 241, 0.15);
  --accent: #6366f1;
  --accent-hover: #5558e6;
  --accent-gradient: linear-gradient(135deg, #6366f1, #8b5cf6);
  --text-primary: #f1f1f7;
  --text-secondary: #9ca3af;
  --text-tertiary: #6b7280;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
}

.light {
  --bg-primary: #f8f9fc;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f1f3f8;
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(0, 0, 0, 0.06);
  --accent: #6366f1;
  --accent-hover: #5558e6;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
}

@theme inline {
  --color-background: var(--bg-primary);
  --color-foreground: var(--text-primary);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-sans), Arial, Helvetica, sans-serif;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  33% { transform: translateY(-10px) rotate(1deg); }
  66% { transform: translateY(5px) rotate(-1deg); }
}

@keyframes float-delayed {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(2deg); }
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in-down {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-soft {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 20px var(--glass-glow); }
  50% { box-shadow: 0 0 40px var(--glass-glow), 0 0 60px var(--glass-glow); }
}

@keyframes particle-float {
  0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  50% { transform: translateY(-100px) translateX(50px); }
}

.animate-float { animation: float 6s ease-in-out infinite; }
.animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
.animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
.animate-fade-in-down { animation: fade-in-down 0.5s ease-out forwards; }
.animate-pulse-soft { animation: pulse-soft 2s ease-in-out infinite; }
.animate-glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }
.animate-particle-float { animation: particle-float 8s ease-in-out infinite; }

.scroll-animate {
  opacity: 0; transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
.scroll-animate.visible { opacity: 1; transform: translateY(0); }

.scroll-animate-stagger {
  opacity: 0; transform: translateY(20px);
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}
.scroll-animate-stagger.visible { opacity: 1; transform: translateY(0); }

@media (prefers-reduced-motion: reduce) {
  .animate-float, .animate-float-delayed, .animate-fade-in-up,
  .animate-fade-in-down, .animate-pulse-soft, .animate-glow-pulse,
  .animate-particle-float, .scroll-animate, .scroll-animate-stagger {
    animation: none; opacity: 1; transform: none;
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build` or `npx next build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add Stitch-inspired design tokens and glass utilities"
```

---

### Task 2: Theme Infrastructure (useTheme hook + layout script)

**Files:**
- Create: `src/hooks/useTheme.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create useTheme hook**

```typescript
'use client'

import { useCallback, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

const STORAGE_KEY = 'careerdock-theme'

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return null
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('light', theme === 'light')
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    const stored = getStoredTheme() ?? getSystemTheme()
    setThemeState(stored)
    applyTheme(stored)
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    localStorage.setItem(STORAGE_KEY, t)
    applyTheme(t)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return { theme, setTheme, toggleTheme }
}
```

- [ ] **Step 2: Add theme initialization script to root layout**

```typescript
// In src/app/layout.tsx, add before <body>
```

Read `src/app/layout.tsx` first:

- [ ] **Step 3: Read and update layout.tsx with theme script**

Add this script in the `<head>` to prevent flash:

```typescript
const themeInitScript = `
(function() {
  var theme = localStorage.getItem('careerdock-theme');
  if (!theme) {
    theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.documentElement.classList.toggle('light', theme === 'light');
  document.documentElement.classList.toggle('dark', theme === 'dark');
})();
`
```

Then in the layout component, add before children:

```typescript
<script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
```

Read `src/app/layout.tsx` and apply these changes.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useTheme.ts src/app/layout.tsx
git commit -m "feat: add theme infrastructure with dark/light toggle"
```

---

### Task 3: UI Component Upgrades (Button, Input, Card)

**Files:**
- Modify: `src/components/ui/Button.tsx`
- Modify: `src/components/ui/Input.tsx`
- Modify: `src/components/ui/Card.tsx`

- [ ] **Step 1: Update Button with glass variant and dark mode**

```typescript
import { forwardRef, type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] focus:ring-[var(--accent)] disabled:opacity-50',
  secondary:
    'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] hover:bg-[var(--bg-tertiary)] focus:ring-[var(--accent)]',
  ghost:
    'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] focus:ring-[var(--accent)]',
  danger:
    'bg-[var(--danger)] text-white hover:opacity-90 focus:ring-[var(--danger)] disabled:opacity-50',
  glass:
    'bg-[var(--glass-bg)] backdrop-blur-xl text-[var(--text-primary)] border border-[var(--glass-border)] hover:bg-white/10 focus:ring-[var(--accent)] shadow-lg',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-xl',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
  icon: 'p-2 rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {loading && (
          <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
```

- [ ] **Step 2: Update Input with dark mode**

```typescript
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  variant?: 'default' | 'glass'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, variant = 'default', className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const baseClasses = 'block w-full rounded-xl px-3 py-2 text-sm transition-colors placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50'

    const variantClasses = {
      default: `bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-[var(--text-primary)] focus:border-[var(--accent)]`,
      glass: `bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] text-[var(--text-primary)] focus:border-[var(--accent)]`,
    }

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${baseClasses} ${variantClasses[variant]} ${error ? '!border-[var(--danger)] !focus:ring-[var(--danger)]' : ''} ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
```

- [ ] **Step 3: Update Card to use glass styling**

```typescript
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean
  hover?: boolean
}

export function Card({ padding = true, hover = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] shadow-sm ${
        padding ? 'p-6' : ''
      } ${
        hover ? 'transition-all duration-200 hover:shadow-lg hover:shadow-[var(--glass-glow)] hover:border-[var(--accent)]/30' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-lg font-semibold text-[var(--text-primary)] ${className}`} {...props}>
      {children}
    </h3>
  )
}
```

- [ ] **Step 4: Run tests to verify**

Run: `npx vitest run src/components/ui/__tests__/Button.test.tsx` (if exists) or `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Button.tsx src/components/ui/Input.tsx src/components/ui/Card.tsx
git commit -m "feat: update UI components with dark mode and glass styling"
```

---

### Task 4: New UI Components (GlassPanel, Badge, ThemeToggle, VibeChip, AnimatedBackground)

**Files:**
- Create: `src/components/ui/GlassPanel.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/ThemeToggle.tsx`
- Create: `src/components/ui/VibeChip.tsx`
- Create: `src/components/ui/AnimatedBackground.tsx`
- Modify: `src/components/ui/index.ts`

- [ ] **Step 1: Create GlassPanel**

```typescript
'use client'

import type { HTMLAttributes, ReactNode } from 'react'

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean
  hover?: boolean
  glow?: boolean
  children: ReactNode
}

export function GlassPanel({ padding = true, hover = false, glow = false, className = '', children, ...props }: GlassPanelProps) {
  return (
    <div
      className={`rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl shadow-lg ${
        padding ? 'p-6' : ''
      } ${
        hover ? 'transition-all duration-200 hover:shadow-[var(--glass-glow)] hover:border-[var(--accent)]/30' : ''
      } ${
        glow ? 'shadow-[var(--glass-glow)]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Create Badge**

```typescript
import type { ReactNode } from 'react'

type BadgeVariant = 'accent' | 'success' | 'warning' | 'danger' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  accent: 'bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/25',
  success: 'bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/25',
  warning: 'bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/25',
  danger: 'bg-[var(--danger)]/15 text-[var(--danger)] border-[var(--danger)]/25',
  neutral: 'bg-[var(--glass-bg)] text-[var(--text-secondary)] border-[var(--glass-border)]',
}

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 3: Create ThemeToggle**

```typescript
'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`rounded-xl p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all duration-200 ${className}`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
```

- [ ] **Step 4: Create VibeChip**

```typescript
'use client'

interface VibeChipProps {
  label: string
  active?: boolean
  color: string
  onClick?: () => void
}

export function VibeChip({ label, active = false, color, onClick }: VibeChipProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium border transition-all duration-300 ${
        active
          ? `border-[${color}] bg-[${color}]/15 text-[${color}] shadow-lg`
          : 'border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--glass-bg)] backdrop-blur-sm'
      }`}
      style={active ? { borderColor: color, backgroundColor: `${color}25`, color } : undefined}
    >
      {label}
    </button>
  )
}
```

- [ ] **Step 5: Create AnimatedBackground**

```typescript
'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  color: string
}

interface AnimatedBackgroundProps {
  density?: number
  colors?: string[]
  className?: string
}

export function AnimatedBackground({ density = 20, colors = ['var(--accent)', '#8b5cf6', '#6366f1'], className = '' }: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let particles: Particle[] = []

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    function init() {
      resize()
      particles = Array.from({ length: density }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      }))
    }

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        p.x += p.speedX
        p.y += p.speedY
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.opacity
        ctx.fill()
      })

      ctx.globalAlpha = 1
      animationId = requestAnimationFrame(animate)
    }

    init()
    animate()
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [density, colors])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 z-0 ${className}`}
    />
  )
}
```

- [ ] **Step 6: Update index.ts barrel export**

```typescript
export { Button } from './Button'
export { Input } from './Input'
export { Card, CardHeader, CardTitle } from './Card'
export { GlassPanel } from './GlassPanel'
export { Badge } from './Badge'
export { ThemeToggle } from './ThemeToggle'
export { VibeChip } from './VibeChip'
export { AnimatedBackground } from './AnimatedBackground'
```

- [ ] **Step 7: Build check**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add GlassPanel, Badge, ThemeToggle, VibeChip, AnimatedBackground"
```

---

### Task 5: Sidebar Redesign (Glass Styling + Theme Toggle)

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Update Sidebar with glass styling and theme toggle**

Key changes:
- `bg-white` → `bg-[var(--bg-secondary)]` / glass variant
- `border-r border-gray-200` → `border-r border-[var(--glass-border)]`
- `text-gray-900` → `text-[var(--text-primary)]`
- `text-gray-600` → `text-[var(--text-secondary)]`
- `hover:bg-gray-100 hover:text-gray-900` → `hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]`
- `bg-blue-50 text-blue-700` → `bg-[var(--accent)]/10 text-[var(--accent)]`
- Add ThemeToggle in footer next to collapse button
- User avatar: glass circle

Read the current file and apply these changes:

- [ ] **Step 2: Update the sidebar implementation**

Replace all gray color references with CSS variables. Import and add ThemeToggle. The footer should show ThemeToggle and collapse button side by side.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: redesign sidebar with glass styling and theme toggle"
```

---

### Task 6: Protected Layout Update

**Files:**
- Modify: `src/app/(protected)/layout.tsx`

- [ ] **Step 1: Update protected layout to apply theme-aware bg**

```typescript
import { AuthProvider } from '@/components/auth/AuthProvider'
import { OnboardingModal } from '@/components/auth/OnboardingModal'
import { Sidebar } from '@/components/layout/Sidebar'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OnboardingModal />
      <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </div>
    </AuthProvider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(protected\)/layout.tsx
git commit -m "feat: update protected layout with theme-aware background"
```

---

### Task 7: Landing Page Redesign (Stitch Aesthetic)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Rewrite landing page**

Replace all colors with CSS variable references, add AnimatedBackground to hero section, glass panels for features/stats/testimonials. The page is a `'use client'` component already.

Key changes:
- Wrap hero section with `AnimatedBackground`
- Replace `bg-white/80 backdrop-blur-md` nav with glass nav: `bg-[var(--glass-bg)] backdrop-blur-xl border-b border-[var(--glass-border)]`
- Hero background: `bg-[var(--bg-primary)]` with floating gradient orbs
- Feature cards: use `Card` with `hover` prop for glass effect
- Stats: glass panels
- CTA section: gradient with glass orbs

This is a large rewrite. Read the current page.tsx then update all color references and add glass aesthetic throughout.

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: redesign landing page with Stitch glass aesthetic"
```

---

### Task 8: Dashboard Redesign

**Files:**
- Modify: `src/app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Update dashboard with glass styling**

Changes:
- Replace `bg-white` and `border border-gray-200` on stat cards with `Card hover` or inline glass classes
- `text-gray-900` → `text-[var(--text-primary)]`
- `text-gray-600` → `text-[var(--text-secondary)]`
- Upgrade banner to amber glass panel
- `rounded-xl` → `rounded-2xl` where applicable
- Stat icons use accent color

- [ ] **Step 2: Commit**

```bash
git add src/app/\(protected\)/dashboard/page.tsx
git commit -m "feat: redesign dashboard with glass stat cards"
```

---

### Task 9: Core Pages Visual Refresh

**Files:**
- Modify: `src/app/(protected)/resume/page.tsx`
- Modify: `src/app/(protected)/resume/ResumeClient.tsx`
- Modify: `src/app/(protected)/tracker/page.tsx`
- Modify: `src/app/(protected)/jobs/layout.tsx`
- Modify: `src/app/(protected)/jobs/search/page.tsx`
- Modify: `src/app/(protected)/interview/page.tsx`
- Modify: `src/app/(protected)/experts/page.tsx`
- Modify: `src/app/(protected)/skill-gap/page.tsx`
- Modify: `src/app/(protected)/profile/page.tsx`
- Modify: `src/app/(protected)/upgrade/page.tsx`
- Modify: `src/app/(protected)/admin/page.tsx`
- Modify: `src/app/(protected)/admin/*/page.tsx`
- Modify: `src/components/jobs/JobCard.tsx`
- Modify: `src/components/jobs/JobDetailPanel.tsx`
- Modify: `src/components/jobs/JobSearchBar.tsx`
- Modify: `src/components/jobs/ApplicationPrep.tsx`
- Modify: `src/components/referral/ReferralCard.tsx`
- Modify: `src/components/auth/EmailVerificationBanner.tsx`
- Modify: `src/components/auth/OnboardingModal.tsx`
- Modify: `src/components/interview/InterviewClient.tsx`
- Modify: `src/components/resume/*.tsx` (all resume components)

This is bulk visual replacement: `bg-white` → `bg-[var(--bg-secondary)]`, `border-gray-200` → `border-[var(--glass-border)]`, `text-gray-900` → `text-[var(--text-primary)]`, `text-gray-600` → `text-[var(--text-secondary)]`, `rounded-xl` → `rounded-2xl` where appropriate, `hover:shadow-lg` → `hover:shadow-[var(--glass-glow)]`.

- [ ] **Step 1: Apply color token replacements across all protected pages**

Use a script to batch-replace common patterns, then verify each page compiles:

```bash
cd src/app/\(protected\)/
# Replace gray color classes with CSS variables in each page
```

Actually, let's be surgical per page. Read each file, apply the changes, commit in batches.

- [ ] **Step 2: Resume builder pages**

Update `resume/page.tsx`, `resume/ResumeClient.tsx`, and all resume sub-components with glass styling.

- [ ] **Step 3: Tracker page**

Update `tracker/page.tsx` with glass Kanban styling.

- [ ] **Step 4: Job search pages**

Update `jobs/layout.tsx`, `jobs/search/page.tsx` and job components.

- [ ] **Step 5: Other pages**

Update interview, experts, skill-gap, profile, upgrade, admin pages.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(protected\)/ -A
git commit -m "feat: visual refresh all protected pages with design tokens"
```

---

### Task 10: Canvas Types

**Files:**
- Create: `src/types/canvas.ts`

- [ ] **Step 1: Create canvas type definitions**

```typescript
export type CanvasModuleType = 'resume' | 'job-search' | 'skill-insights' | 'interview-feedback' | 'expert-sessions'

export interface CanvasPosition {
  x: number
  y: number
}

export interface CanvasSize {
  width: number
  height: number
}

export interface CanvasModule {
  id: string
  type: CanvasModuleType
  title: string
  position: CanvasPosition
  size: CanvasSize
  minimized: boolean
}

export interface CareerPath {
  id: string
  name: string
  modules: string[] // module IDs
  createdAt: string
  updatedAt: string
}

export interface CanvasState {
  paths: CareerPath[]
  modules: CanvasModule[]
  activePathId: string | null
  viewport: {
    x: number
    y: number
    zoom: number
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/canvas.ts
git commit -m "feat: add canvas type definitions"
```

---

### Task 11: Canvas Page Shell

**Files:**
- Create: `src/app/(protected)/canvas/page.tsx`

- [ ] **Step 1: Create canvas page with full-screen layout**

```typescript
'use client'

import { Canvas } from '@/components/canvas/Canvas'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'

export default function CanvasPage() {
  return (
    <div className="fixed inset-0 z-0">
      <AnimatedBackground density={15} className="opacity-30" />
      <Canvas />
    </div>
  )
}
```

- [ ] **Step 2: Add canvas to sidebar nav**

In `Sidebar.tsx`, add:
```typescript
{ href: '/canvas', label: 'Career Canvas', icon: LayoutDashboard }
```
(Import `LayoutDashboard` from lucide-react — already imported)

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/canvas/page.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: add canvas page shell and sidebar nav item"
```

---

### Task 12: Canvas Workspace Component

**Files:**
- Create: `src/components/canvas/Canvas.tsx`
- Create: `src/components/canvas/CanvasModule.tsx`
- Create: `src/components/canvas/AgentManager.tsx`
- Create: `src/components/canvas/CanvasToolbar.tsx`
- Create: `src/hooks/useCanvasState.ts`

- [ ] **Step 1: Create useCanvasState hook**

```typescript
'use client'

import { useState, useCallback } from 'react'
import type { CanvasState, CanvasModule, CanvasModuleType } from '@/types/canvas'

const DEFAULT_STATE: CanvasState = {
  paths: [{ id: 'default', name: 'Main Path', modules: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
  modules: [],
  activePathId: 'default',
  viewport: { x: 0, y: 0, zoom: 1 },
}

export function useCanvasState() {
  const [state, setState] = useState<CanvasState>(DEFAULT_STATE)

  const addModule = useCallback((type: CanvasModuleType, title: string) => {
    const module: CanvasModule = {
      id: `mod-${Date.now()}`,
      type,
      title,
      position: { x: 100 + state.modules.length * 50, y: 100 + state.modules.length * 50 },
      size: { width: 320, height: 240 },
      minimized: false,
    }
    setState((prev) => ({
      ...prev,
      modules: [...prev.modules, module],
    }))
  }, [state.modules.length])

  const updateModulePosition = useCallback((id: string, x: number, y: number) => {
    setState((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => (m.id === id ? { ...m, position: { x, y } } : m)),
    }))
  }, [])

  const toggleMinimize = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => (m.id === id ? { ...m, minimized: !m.minimized } : m)),
    }))
  }, [])

  const removeModule = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      modules: prev.modules.filter((m) => m.id !== id),
    }))
  }, [])

  const addPath = useCallback((name: string) => {
    const path = { id: `path-${Date.now()}`, name, modules: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    setState((prev) => ({ ...prev, paths: [...prev.paths, path], activePathId: path.id }))
  }, [])

  const setActivePath = useCallback((id: string) => {
    setState((prev) => ({ ...prev, activePathId: id }))
  }, [])

  const setZoom = useCallback((zoom: number) => {
    setState((prev) => ({ ...prev, viewport: { ...prev.viewport, zoom: Math.max(0.25, Math.min(2, zoom)) } }))
  }, [])

  return { state, addModule, updateModulePosition, toggleMinimize, removeModule, addPath, setActivePath, setZoom }
}
```

- [ ] **Step 2: Create CanvasModule component**

```typescript
'use client'

import { GripVertical, Minus, X } from 'lucide-react'
import { useRef, useCallback, type ReactNode } from 'react'
import { GlassPanel } from '@/components/ui/GlassPanel'

interface CanvasModuleProps {
  id: string
  title: string
  x: number
  y: number
  width: number
  height: number
  minimized: boolean
  onMove: (id: string, x: number, y: number) => void
  onMinimize: (id: string) => void
  onRemove: (id: string) => void
  children?: ReactNode
}

export function CanvasModule({ id, title, x, y, width, height, minimized, onMove, onMinimize, onRemove, children }: CanvasModuleProps) {
  const dragRef = useRef({ startX: 0, startY: 0, modX: 0, modY: 0, dragging: false })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const el = e.currentTarget.parentElement
    if (!el) return
    dragRef.current = { startX: e.clientX, startY: e.clientY, modX: x, modY: y, dragging: true }

    function onMove(ev: MouseEvent) {
      if (!dragRef.current.dragging) return
      const dx = ev.clientX - dragRef.current.startX
      const dy = ev.clientY - dragRef.current.startY
      onMove(id, dragRef.current.modX + dx, dragRef.current.modY + dy)
    }

    function onUp() {
      dragRef.current.dragging = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [id, x, y, onMove])

  return (
    <div
      className="absolute"
      style={{ left: x, top: y, width: minimized ? 320 : width, zIndex: 10 }}
    >
      <GlassPanel className={minimized ? '!p-3' : ''}>
        <div className="flex items-center justify-between gap-2 mb-2 cursor-move" onMouseDown={handleMouseDown}>
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-[var(--text-tertiary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onMinimize(id)} className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onRemove(id)} className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {!minimized && <div>{children}</div>}
      </GlassPanel>
    </div>
  )
}
```

- [ ] **Step 3: Create AgentManager component**

```typescript
'use client'

import { Plus, Check } from 'lucide-react'
import { useState } from 'react'
import type { CareerPath } from '@/types/canvas'

interface AgentManagerProps {
  paths: CareerPath[]
  activePathId: string | null
  onSelectPath: (id: string) => void
  onAddPath: (name: string) => void
}

export function AgentManager({ paths, activePathId, onSelectPath, onAddPath }: AgentManagerProps) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  return (
    <div className="w-60 border-l border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Paths</h3>
      <div className="flex-1 space-y-2">
        {paths.map((path) => (
          <button
            key={path.id}
            onClick={() => onSelectPath(path.id)}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
              path.id === activePathId
                ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2">
              {path.id === activePathId && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
              <span className="truncate">{path.name}</span>
            </div>
          </button>
        ))}
      </div>
      {adding ? (
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Path name..."
            className="flex-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) { onAddPath(name.trim()); setName(''); setAdding(false) } }}
          />
          <button onClick={() => setAdding(false)} className="p-1.5 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Add Path
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create CanvasToolbar component**

```typescript
'use client'

import { Plus, ZoomIn, ZoomOut, Maximize2, Download, Trash2 } from 'lucide-react'
import { GlassPanel } from '@/components/ui/GlassPanel'

interface CanvasToolbarProps {
  onAddModule: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  onExport: () => void
  onClear: () => void
}

export function CanvasToolbar({ onAddModule, onZoomIn, onZoomOut, onFitView, onExport, onClear }: CanvasToolbarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
      <GlassPanel className="!p-2">
        <div className="flex items-center gap-1">
          <button onClick={onAddModule} className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all" title="Add Module">
            <Plus className="h-4 w-4" />
          </button>
          <div className="w-px h-5 bg-[var(--glass-border)]" />
          <button onClick={onZoomIn} className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all" title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={onZoomOut} className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all" title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={onFitView} className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all" title="Fit to View">
            <Maximize2 className="h-4 w-4" />
          </button>
          <div className="w-px h-5 bg-[var(--glass-border)]" />
          <button onClick={onExport} className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all" title="Export">
            <Download className="h-4 w-4" />
          </button>
          <button onClick={onClear} className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all" title="Clear">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </GlassPanel>
    </div>
  )
}
```

Need to import `X` from lucide for the AgentManager:
- [ ] **Fix lucide import in AgentManager**

Add `X` to the import: `import { Plus, Check, X } from 'lucide-react'`

- [ ] **Step 5: Create the main Canvas component**

```typescript
'use client'

import { useCallback, useRef, useState } from 'react'
import { CanvasModule } from './CanvasModule'
import { AgentManager } from './AgentManager'
import { CanvasToolbar } from './CanvasToolbar'
import { useCanvasState } from '@/hooks/useCanvasState'
import type { CanvasModuleType } from '@/types/canvas'

const MODULE_TYPES: { type: CanvasModuleType; title: string }[] = [
  { type: 'resume', title: 'Resume Snapshot' },
  { type: 'job-search', title: 'Job Search' },
  { type: 'skill-insights', title: 'Skill Insights' },
  { type: 'interview-feedback', title: 'Interview Feedback' },
  { type: 'expert-sessions', title: 'Expert Sessions' },
]

export function Canvas() {
  const { state, addModule, updateModulePosition, toggleMinimize, removeModule, addPath, setActivePath, setZoom } = useCanvasState()
  const [showPicker, setShowPicker] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  const handleAddModule = useCallback(() => {
    setShowPicker((prev) => !prev)
  }, [])

  const handlePickModule = useCallback((type: CanvasModuleType, title: string) => {
    addModule(type, title)
    setShowPicker(false)
  }, [addModule])

  const handleExport = useCallback(() => {
    const json = JSON.stringify(state, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'canvas-state.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [state])

  return (
    <div className="flex h-screen">
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden"
        style={{ transform: `scale(${state.viewport.zoom})`, transformOrigin: '0 0' }}
      >
        {state.modules.map((mod) => (
          <CanvasModule
            key={mod.id}
            id={mod.id}
            title={mod.title}
            x={mod.position.x}
            y={mod.position.y}
            width={mod.size.width}
            height={mod.size.height}
            minimized={mod.minimized}
            onMove={updateModulePosition}
            onMinimize={toggleMinimize}
            onRemove={removeModule}
          >
            <div className="text-sm text-[var(--text-secondary)]">
              {mod.type === 'resume' && <p>Resume preview will render here</p>}
              {mod.type === 'job-search' && <p>Saved searches and listings</p>}
              {mod.type === 'skill-insights' && <p>Skill gap analysis results</p>}
              {mod.type === 'interview-feedback' && <p>Recent interview scores</p>}
              {mod.type === 'expert-sessions' && <p>Upcoming expert sessions</p>}
            </div>
          </CanvasModule>
        ))}

        {showPicker && (
          <div className="absolute top-4 left-4 z-20 bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-2xl shadow-xl p-3 space-y-1 min-w-48">
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-2 pb-1">Add Module</p>
            {MODULE_TYPES.map((mt) => (
              <button
                key={mt.type}
                onClick={() => handlePickModule(mt.type, mt.title)}
                className="w-full text-left px-3 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
              >
                {mt.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <AgentManager
        paths={state.paths}
        activePathId={state.activePathId}
        onSelectPath={setActivePath}
        onAddPath={addPath}
      />

      <CanvasToolbar
        onAddModule={handleAddModule}
        onZoomIn={() => setZoom(state.viewport.zoom + 0.1)}
        onZoomOut={() => setZoom(state.viewport.zoom - 0.1)}
        onFitView={() => setZoom(1)}
        onExport={handleExport}
        onClear={() => {}}
      />
    </div>
  )
}
```

- [ ] **Step 6: Build check**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
git add src/components/canvas/ src/hooks/useCanvasState.ts
git commit -m "feat: implement career canvas with modules, agent manager, toolbar"
```

---

### Task 13: Vibe System

**Files:**
- Create: `src/hooks/useVibe.ts`
- Add database migration for `profiles.vibe` column
- Add vibe selector to canvas page and resume builder

- [ ] **Step 1: Create useVibe hook**

```typescript
'use client'

import { useCallback, useState, useEffect } from 'react'

export type Vibe = 'confident' | 'strategic' | 'growth' | 'bold'

export interface VibeConfig {
  id: Vibe
  label: string
  color: string
  description: string
}

export const VIBES: VibeConfig[] = [
  { id: 'confident', label: 'Confident', color: '#6366f1', description: 'Bold language, leadership focus' },
  { id: 'strategic', label: 'Strategic', color: '#10b981', description: 'Data-driven, impact metrics' },
  { id: 'growth', label: 'Growth', color: '#f59e0b', description: 'Learning-focused, potential emphasis' },
  { id: 'bold', label: 'Bold', color: '#f43f5e', description: 'Disruptive, innovative language' },
]

function getStoredVibe(): Vibe {
  if (typeof window === 'undefined') return 'confident'
  return (localStorage.getItem('careerdock-vibe') as Vibe) || 'confident'
}

export function useVibe() {
  const [vibe, setVibeState] = useState<Vibe>('confident')

  useEffect(() => {
    setVibeState(getStoredVibe())
  }, [])

  const setVibe = useCallback((v: Vibe) => {
    setVibeState(v)
    localStorage.setItem('careerdock-vibe', v)
    const config = VIBES.find((vb) => vb.id === v)
    if (config) {
      document.documentElement.style.setProperty('--accent', config.color)
      document.documentElement.style.setProperty('--accent-hover', config.color + 'dd')
      document.documentElement.style.setProperty('--glass-glow', config.color + '26')
    }
  }, [])

  return { vibe, setVibe, config: VIBES.find((v) => v.id === vibe) ?? VIBES[0], vibes: VIBES }
}
```

- [ ] **Step 2: Add vibe selector to canvas toolbar**

In `Canvas.tsx`, add the vibe selector row. Import useVibe and VibeChip.

Add to the Canvas component:
```typescript
const { vibe, setVibe, vibes, config } = useVibe()
```

Then in the JSX (above the module picker or in a floating panel):
```typescript
<div className="absolute top-4 right-4 z-20 flex gap-2">
  {vibes.map((v) => (
    <button
      key={v.id}
      onClick={() => setVibe(v.id)}
      className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-300 ${
        vibe === v.id
          ? 'text-white shadow-lg'
          : 'border-[var(--glass-border)] text-[var(--text-secondary)] bg-[var(--glass-bg)]'
      }`}
      style={vibe === v.id ? { backgroundColor: v.color, borderColor: v.color } : undefined}
    >
      {v.label}
    </button>
  ))}
</div>
```

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useVibe.ts src/components/canvas/Canvas.tsx
git commit -m "feat: add vibe system with accent shifting"
```

---

### Task 14: CAREER.md Export

**Files:**
- Create: `src/lib/career-config.ts`

- [ ] **Step 1: Create career config export/import utility**

```typescript
import type { Vibe } from '@/hooks/useVibe'

interface CareerConfig {
  vibe: Vibe
  persona: string
  plan: string
  skills: string[]
  summary: string
  activeApplications: { company: string; role: string; status: string }[]
  skillTargets: string[]
  preferredRoles: string[]
}

export function generateCareerConfig(config: CareerConfig): string {
  const frontmatter = [
    '---',
    `vibe: ${config.vibe}`,
    `persona: ${config.persona}`,
    `plan: ${config.plan}`,
    '---',
    '',
  ].join('\n')

  const sections = [
    '# Career Configuration',
    '',
    '## Skills',
    config.skills.length > 0 ? config.skills.map((s) => `- ${s}`).join('\n') : '- None listed',
    '',
    '## Resume Summary',
    config.summary || '- No summary',
    '',
    '## Active Applications',
    ...(config.activeApplications.length > 0
      ? config.activeApplications.map((a) => `- ${a.company} - ${a.role} (${a.status})`)
      : ['- None active']),
    '',
    '## Skill Targets',
    ...(config.skillTargets.length > 0
      ? config.skillTargets.map((s) => `- ${s}`)
      : ['- None specified']),
    '',
    '## Preferred Roles',
    ...(config.preferredRoles.length > 0
      ? config.preferredRoles.map((r) => `- ${r}`)
      : ['- None specified']),
  ].join('\n')

  return frontmatter + sections
}

export function parseCareerConfig(markdown: string): Partial<CareerConfig> {
  const config: Partial<CareerConfig> = {}

  const frontmatch = markdown.match(/^---\n([\s\S]*?)\n---/)
  if (frontmatch) {
    const fm = frontmatter(frontmatch[1])
    if (fm.vibe) config.vibe = fm.vibe as Vibe
    if (fm.persona) config.persona = fm.persona
    if (fm.plan) config.plan = fm.plan
  }

  const skillsMatch = markdown.match(/## Skills\n([\s\S]*?)(?=\n## |$)/)
  if (skillsMatch) {
    config.skills = skillsMatch[1].split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2))
  }

  const summaryMatch = markdown.match(/## Resume Summary\n([\s\S]*?)(?=\n## |$)/)
  if (summaryMatch) {
    config.summary = summaryMatch[1].trim().replace(/^- /, '')
  }

  const appsMatch = markdown.match(/## Active Applications\n([\s\S]*?)(?=\n## |$)/)
  if (appsMatch) {
    config.activeApplications = appsMatch[1].split('\n').filter((l) => l.startsWith('- ')).map((l) => {
      const parts = l.slice(2).split(' - ')
      return { company: parts[0] || '', role: parts[1] || '', status: parts[2]?.replace(/[()]/g, '') || '' }
    })
  }

  const targetsMatch = markdown.match(/## Skill Targets\n([\s\S]*?)(?=\n## |$)/)
  if (targetsMatch) {
    config.skillTargets = targetsMatch[1].split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2))
  }

  const rolesMatch = markdown.match(/## Preferred Roles\n([\s\S]*?)(?=\n## |$)/)
  if (rolesMatch) {
    config.preferredRoles = rolesMatch[1].split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2))
  }

  return config
}

function frontmatter(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  text.split('\n').forEach((line) => {
    const [key, ...rest] = line.split(':')
    if (key && rest.length > 0) result[key.trim()] = rest.join(':').trim()
  })
  return result
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/lib/career-config.ts
git commit -m "feat: add CAREER.md export/import functionality"
```

---

### Task 15: Final Verification

- [ ] **Step 1: Full build check**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Run tests**

Run: `npx vitest run`
Expected: All existing tests pass

- [ ] **Step 3: Verify all pages render**

Run `npm run dev`, visit:
- `/` — landing page with Stitch glass aesthetic
- `/dashboard` — glass stat cards, theme-aware
- `/canvas` — canvas workspace with modules, agent manager, toolbar, vibe selector
- `/resume`, `/tracker`, `/jobs/search`, `/interview`, `/experts`, `/skill-gap`, `/profile`, `/upgrade` — visual refresh
- Toggle dark/light mode — all pages adapt

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Stitch-inspired redesign phase 1"
```
