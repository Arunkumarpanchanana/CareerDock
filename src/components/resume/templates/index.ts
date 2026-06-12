import type { Profile } from '@/types/database'
import type { ResumeFormData } from '@/lib/resume'
import { FresherTemplate } from './FresherTemplate'
import { ProfessionalTemplate } from './ProfessionalTemplate'
import { ExecutiveTemplate } from './ExecutiveTemplate'

export type Persona = 'fresher' | 'professional' | 'executive'

export const TEMPLATES: Record<Persona, React.FC<{ profile: Profile | null; data: ResumeFormData }>> = {
  fresher: FresherTemplate,
  professional: ProfessionalTemplate,
  executive: ExecutiveTemplate,
}
