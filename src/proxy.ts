import { updateSession } from '@/lib/supabase/proxy'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isCms = pathname.startsWith('/cms')
  const isAuthPage = pathname.startsWith('/auth')
  const isApiRoute = pathname.startsWith('/api')

  if (!isCms && !isAuthPage && !isApiRoute) {
    return NextResponse.next()
  }

  const { supabaseResponse, user } = await updateSession(request)

  if (!user && !isApiRoute && !isAuthPage) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/cms', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
