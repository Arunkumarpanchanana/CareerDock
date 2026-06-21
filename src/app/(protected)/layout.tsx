import { AuthProvider } from '@/components/auth/AuthProvider'
import { OnboardingModal } from '@/components/auth/OnboardingModal'
import { Sidebar } from '@/components/layout/Sidebar'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <OnboardingModal />
      <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </div>
    </AuthProvider>
  )
}
