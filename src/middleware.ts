import { updateSession } from '@/lib/supabase/proxy'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const { supabaseResponse, user } = await updateSession(request)

  const isApiRoute = pathname.startsWith('/api')
  const isAuthPage = pathname.startsWith('/auth')

  if (!user && !isApiRoute && !isAuthPage) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
