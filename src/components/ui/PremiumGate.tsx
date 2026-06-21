'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Lock, RefreshCw, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'

export function PremiumGate({ children, feature }: { children: ReactNode; feature: string }) {
  const { profile, loading, refreshProfile } = useAuth()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setTimedOut(true), 8000)
      return () => clearTimeout(timer)
    }
    setTimedOut(false)
  }, [loading])

  if (loading) {
    if (timedOut) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-sm text-gray-500">Still loading your account...</p>
          <Button variant="secondary" size="sm" onClick={() => { setTimedOut(false); refreshProfile() }}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Retry
          </Button>
        </div>
      )
    }
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (profile?.plan_tier === 'premium') {
    return <>{children}</>
  }

  return (
    <div className="space-y-6">
      <Card className="border-amber-200/50 bg-amber-50/50 dark:border-amber-800/30 dark:bg-amber-950/20">
        <div className="flex flex-col items-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/40">
            <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">
            Premium Feature
          </h2>
          <p className="mb-6 max-w-md text-sm text-gray-600 dark:text-gray-400">
            {feature} is available exclusively on the Premium plan. Upgrade to unlock unlimited
            access to expert consultants, mock interviews, and more.
          </p>
          <Link href="/upgrade">
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              Upgrade to Premium
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
