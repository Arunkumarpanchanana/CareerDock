import { PremiumGate } from '@/components/ui/PremiumGate'
import { KavyaClient } from '@/components/coach/KavyaClient'

export default function CareerCoachPage() {
  return (
    <PremiumGate feature="Career Coach">
      <KavyaClient />
    </PremiumGate>
  )
}
