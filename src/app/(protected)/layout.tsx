import { AuthProvider } from '@/components/auth/AuthProvider'
import { Sidebar } from '@/components/layout/Sidebar'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </div>
    </AuthProvider>
  )
}
