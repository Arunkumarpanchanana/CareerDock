'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useState } from 'react'

export default function ReferralCard() {
  const { profile } = useAuth()
  const [copied, setCopied] = useState(false)

  if (!profile?.referral_code) return null

  const referralLink = `${window.location.origin}/auth/signup?ref=${profile.referral_code}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900">Invite Friends</h3>
      <p className="mt-1 text-sm text-gray-600">
        Share your referral link and help friends kickstart their career journey.
      </p>
      <div className="mt-4 flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={referralLink}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700"
        />
        <button
          onClick={copyLink}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Your code: <span className="font-mono font-medium">{profile.referral_code}</span>
      </p>
    </div>
  )
}
