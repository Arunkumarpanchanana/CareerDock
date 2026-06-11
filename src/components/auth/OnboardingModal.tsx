'use client'

import { Button } from '@/components/ui'
import { Briefcase, FileText, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

const ONBOARDING_KEY = 'careerdock_onboarded'

const steps = [
  {
    icon: FileText,
    title: 'Build Your Resume',
    desc: 'Use the Resume Builder to create ATS-optimized resumes. Add your experience, education, skills, and more with guided templates.',
  },
  {
    icon: Briefcase,
    title: 'Track Your Jobs',
    desc: 'Add job applications to the Kanban board and drag them across stages — from Wishlist to Offered. Never lose track of where you applied.',
  },
  {
    icon: Users,
    title: 'Connect with Experts',
    desc: 'Book 1:1 sessions with industry professionals for resume reviews, interview prep, and career advice tailored to your goals.',
  },
]

export function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setOpen(true)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setOpen(false)
  }

  if (!open) return null

  const current = steps[step]
  const Icon = current.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
            <Icon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-gray-900">{current.title}</h2>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">{current.desc}</p>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {step < steps.length - 1 ? (
            <>
              <Button onClick={() => setStep(step + 1)} className="w-full">
                Next
              </Button>
              <Button variant="ghost" onClick={dismiss} className="w-full">
                Skip tour
              </Button>
            </>
          ) : (
            <>
              <Button onClick={dismiss} className="w-full">
                Get Started
              </Button>
              <Button variant="ghost" onClick={dismiss} className="w-full">
                Skip tour
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
