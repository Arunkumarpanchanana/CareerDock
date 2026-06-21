import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  const isValidRedirect = (path: string): boolean => {
    try {
      const url = new URL(path, origin)
      return url.origin === origin
    } catch {
      return false
    }
  }

  const redirectTo = isValidRedirect(next) ? next : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user?.email) {
        const adminClient = createAdminClient()
        if (adminClient) {
          const { data } = await adminClient.auth.admin.listUsers()
          const matches = data?.users?.filter(
            (u) => u.email?.toLowerCase() === user.email!.toLowerCase()
          ) ?? []

          if (matches.length > 1) {
            matches.sort((a, b) =>
              new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()
            )
            const keep = matches[0]

            for (const dup of matches) {
              if (dup.id === keep.id) continue
              await adminClient.from('profiles').delete().eq('id', dup.id)
              try { await adminClient.auth.admin.deleteUser(dup.id) } catch {}
            }

            if (user.id !== keep.id) {
              await supabase.auth.signOut()
              return NextResponse.redirect(`${origin}/auth/login?error=account_merged`)
            }
          }
        }
      }

      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
}
