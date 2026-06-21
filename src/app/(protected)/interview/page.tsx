import { PremiumGate } from '@/components/ui/PremiumGate'
import { InterviewClient } from '@/components/interview/InterviewClient'

export default function InterviewPage() {
  return (
    <PremiumGate feature="Mock Interview">
      <InterviewClient />
    </PremiumGate>
  )
}
