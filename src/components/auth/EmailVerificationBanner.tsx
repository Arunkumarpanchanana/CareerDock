'use client'

import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'
import { useState } from 'react'

export function EmailVerificationBanner({ email }: { email: string }) {
  const [dismissed, setDismissed] = useState(false)
  const [resent, setResent] = useState(false)

  if (dismissed) return null

  const handleResend = async () => {
    const supabase = createClient()
    await supabase.auth.resend({ type: 'signup', email })
    setResent(true)
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800">
            Verify your email address
          </p>
          <p className="mt-1 text-sm text-amber-700">
            We sent a verification link to <strong>{email}</strong>. 
            Please check your inbox and click the link to activate your account.
          </p>
          <button
            onClick={handleResend}
            disabled={resent}
            className="mt-2 text-sm font-medium text-amber-700 hover:text-amber-800 underline disabled:text-amber-400 disabled:no-underline"
          >
            {resent ? 'Verification email sent!' : 'Resend verification email'}
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-500 hover:text-amber-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
