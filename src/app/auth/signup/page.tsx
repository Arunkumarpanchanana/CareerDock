'use client'

import { Button } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useRef, useState, useMemo, useEffect } from 'react'

const PASSWORD_RULES = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= PASSWORD_RULES.minLength) score++
  if (PASSWORD_RULES.hasUppercase.test(password)) score++
  if (PASSWORD_RULES.hasLowercase.test(password)) score++
  if (PASSWORD_RULES.hasNumber.test(password)) score++
  if (PASSWORD_RULES.hasSpecial.test(password)) score++

  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' }
  if (score <= 3) return { score, label: 'Fair', color: 'bg-orange-500' }
  if (score <= 4) return { score, label: 'Good', color: 'bg-yellow-500' }
  return { score, label: 'Strong', color: 'bg-green-500' }
}

function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  const refFromUrl = searchParams.get('ref')
  useEffect(() => {
    if (refFromUrl) {
      setReferralCode(refFromUrl)
    }
  }, [refFromUrl])

  const strength = useMemo(() => getPasswordStrength(password), [password])

  const getSupabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
    }
    return supabaseRef.current
  }

  const validatePassword = (pw: string): string | null => {
    if (pw.length < PASSWORD_RULES.minLength) {
      return `Password must be at least ${PASSWORD_RULES.minLength} characters`
    }
    if (!PASSWORD_RULES.hasUppercase.test(pw)) {
      return 'Password must contain an uppercase letter'
    }
    if (!PASSWORD_RULES.hasLowercase.test(pw)) {
      return 'Password must contain a lowercase letter'
    }
    if (!PASSWORD_RULES.hasNumber.test(pw)) {
      return 'Password must contain a number'
    }
    if (!PASSWORD_RULES.hasSpecial.test(pw)) {
      return 'Password must contain a special character'
    }
    return null
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setTouched(true)

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    setLoading(true)

    const { exists: emailTaken } = await fetch('/api/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).then(r => r.json())

    if (emailTaken) {
      setError('An account with this email already exists. Please sign in instead.')
      setLoading(false)
      return
    }

    const { data, error } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const newUserId = data.user?.id
    if (newUserId) {
      const supabase = getSupabase()

      if (referralCode) {
        const { data: referrer } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', referralCode)
          .single()

        if (referrer) {
          await supabase.from('profiles').upsert({ id: newUserId, referred_by: referrer.id })
          await supabase.from('referrals').insert({
            referrer_id: referrer.id,
            referee_id: newUserId,
          })
        }
      }

      const newCode = `ref-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      await supabase.from('profiles').upsert({ id: newUserId, referral_code: newCode })
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Create account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Start building your career with CareerDock
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div>
            <Input
              label="Password"
              type="password"
              placeholder={`Create a password (min ${PASSWORD_RULES.minLength} characters)`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setTouched(true)
              }}
              minLength={PASSWORD_RULES.minLength}
              required
            />
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        i <= strength.score ? strength.color : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`mt-1 text-xs ${strength.score >= 4 ? 'text-green-600' : 'text-gray-500'}`}>
                  {strength.label}
                </p>
                <ul className="mt-2 space-y-1 text-xs">
                  <li className={password.length >= PASSWORD_RULES.minLength ? 'text-green-600' : 'text-gray-400'}>
                    At least {PASSWORD_RULES.minLength} characters
                  </li>
                  <li className={PASSWORD_RULES.hasUppercase.test(password) ? 'text-green-600' : 'text-gray-400'}>
                    One uppercase letter
                  </li>
                  <li className={PASSWORD_RULES.hasLowercase.test(password) ? 'text-green-600' : 'text-gray-400'}>
                    One lowercase letter
                  </li>
                  <li className={PASSWORD_RULES.hasNumber.test(password) ? 'text-green-600' : 'text-gray-400'}>
                    One number
                  </li>
                  <li className={PASSWORD_RULES.hasSpecial.test(password) ? 'text-green-600' : 'text-gray-400'}>
                    One special character
                  </li>
                </ul>
              </div>
            )}
          </div>

          <Input
            label="Referral code (optional)"
            type="text"
            placeholder="ref-XXXXXXXX"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
          />

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-gray-500">Loading...</div>}>
      <SignupForm />
    </Suspense>
  )
}
