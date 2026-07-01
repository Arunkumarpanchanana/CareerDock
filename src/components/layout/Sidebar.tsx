'use client'

import Image from 'next/image'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  Briefcase,
  ChevronLeft,
  CreditCard,
  Globe,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  MessageSquare,
  ScrollText,
  Search,
  Settings,
  Shield,
  Users,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { profile, signOut } = useAuth()

  const isFree = profile?.plan_tier !== 'premium' && profile?.plan_tier !== 'premium_pro'

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/resume', label: 'Resume Builder', icon: ScrollText },
    { href: '/skill-gap', label: 'Skill Gap', icon: Search },
    { href: '/jobs/search', label: 'Job Search', icon: Globe },
    { href: '/tracker', label: 'Job Tracker', icon: Briefcase },
    { href: '/interview', label: 'Mock Interview', icon: MessageSquare, premium: true },
    { href: '/experts', label: 'Experts', icon: Users, premium: true },
    { href: '/profile', label: 'Profile', icon: Settings },
    ...(profile?.role === 'admin'
      ? [
          { href: '/admin', label: 'Admin', icon: Shield },
          { href: '/admin/payments', label: 'Payments', icon: CreditCard },
        ]
      : []),
  ]

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl p-2 shadow-lg lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl transition-all duration-300 lg:static ${
          collapsed ? 'w-16' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[var(--glass-border)] px-4">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/logo.png" alt="My Career Dock" width={32} height={32} className="h-8 w-8 object-contain" />
              <span className="text-lg font-bold text-[var(--text-primary)]">My Career Dock</span>
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard" className="mx-auto">
              <Image src="/logo.png" alt="My Career Dock" width={32} height={32} className="h-8 w-8 object-contain" />
            </Link>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden rounded-xl p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] lg:block"
            >
              <ChevronLeft
                className={`h-4 w-4 transition-transform ${
                  collapsed ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="flex-1">{item.label}</span>
                )}
                {!collapsed && isFree && (item as { premium?: boolean }).premium && (
                  <Lock className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-[var(--glass-border)] p-3">
          {profile && !collapsed && (
            <div className="mb-3 flex items-center gap-3 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/15 text-sm font-semibold text-[var(--accent)]">
                {(profile.full_name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {profile.full_name}
                </p>
                {profile.role_title && (
                  <p className="truncate text-xs text-[var(--text-tertiary)]">
                    {profile.role_title}
                  </p>
                )}
              </div>
            </div>
          )}
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
