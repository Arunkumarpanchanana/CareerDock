import { updateSession } from '@/lib/supabase/proxy'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const { pathname } = new URL(request.url)
  const isApiRoute = pathname.startsWith('/api')
  const isAuthPage = pathname.startsWith('/auth')
  const isLandingPage = pathname === '/'
  const isPublicPath = isAuthPage || isApiRoute || isLandingPage

  if (!user && !isPublicPath) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('redirect', pathname)
    return Response.redirect(url)
  }

  if (user && isAuthPage) {
    return Response.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
