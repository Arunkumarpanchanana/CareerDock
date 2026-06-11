'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { Card } from '@/components/ui'
import Link from 'next/link'

export default function UpgradePage() {
  const { profile } = useAuth()
  const isPremium = profile?.plan_tier === 'premium'

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pricing</h1>
        <p className="mt-1 text-gray-600">Choose the plan that fits your career journey.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-2 border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Free</h2>
          <p className="mt-1 text-3xl font-bold text-gray-900">$0</p>
          <p className="text-sm text-gray-500">forever</p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">✓ Up to 4 resumes</li>
            <li className="flex items-center gap-2">✓ Track 15 job applications</li>
            <li className="flex items-center gap-2">✓ Smart Suggestions</li>
            <li className="flex items-center gap-2">✓ PDF export</li>
          </ul>
          {!isPremium && (
            <div className="mt-6 px-4 py-2 text-center text-sm font-medium text-gray-500 bg-gray-100 rounded-lg">
              Current Plan
            </div>
          )}
        </Card>

        <Card className={`p-6 border-2 ${isPremium ? 'border-green-400' : 'border-amber-400'}`}>
          <h2 className="text-lg font-semibold text-gray-900">Premium</h2>
          <p className="mt-1 text-3xl font-bold text-gray-900">Coming Soon</p>
          <p className="text-sm text-gray-500">unlock everything</p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">✓ Unlimited resumes</li>
            <li className="flex items-center gap-2">✓ Unlimited job tracking</li>
            <li className="flex items-center gap-2">✓ All Smart Suggestions</li>
            <li className="flex items-center gap-2">✓ Priority support</li>
          </ul>
          {isPremium ? (
            <div className="mt-6 px-4 py-2 text-center text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg">
              Active
            </div>
          ) : (
            <div className="mt-6 px-4 py-2 text-center text-sm font-medium text-gray-500 bg-gray-100 rounded-lg">
              Not available yet
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
