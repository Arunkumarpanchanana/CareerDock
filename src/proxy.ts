import { updateSession } from '@/lib/supabase/proxy'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const MARKETING_DOMAIN = 'mycareerdock.com'
const APP_DOMAIN = 'app.mycareerdock.com'
const MARKETING_PREFIXES = ['/articles', '/offers', '/cms']
const APP_ROUTES = [
  '/career-coach', '/interview', '/jobs', '/skill-gap',
  '/tracker', '/experts', '/contact', '/upgrade',
  '/profile', '/dashboard', '/resume', '/auth',
]

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const isMarketingDomain = host === MARKETING_DOMAIN || host === 'www.' + MARKETING_DOMAIN || host.startsWith('localhost')
  const isAppDomain = host === APP_DOMAIN || host.startsWith('app.')
  const { pathname } = request.nextUrl

  if (isMarketingDomain) {
    if (pathname === '/' || pathname === '/admin' || MARKETING_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))) {
      const url = request.nextUrl.clone()
      url.pathname = `/marketing${pathname === '/' ? '' : pathname}`
      return NextResponse.rewrite(url)
    }
    const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1')
    if (isLocalhost) {
      return NextResponse.next()
    }
    const isAppRoute = APP_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
    if (isAppRoute) {
      return NextResponse.redirect(new URL(pathname, `https://${APP_DOMAIN}`))
    }
  }

  if (isAppDomain) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    const isMarketingPath = MARKETING_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
    if (isMarketingPath || pathname === '/admin') {
      return NextResponse.redirect(new URL(pathname, 'https://mycareerdock.com'))
    }
  }

  const { supabaseResponse, user } = await updateSession(request)

  const isApiRoute = pathname.startsWith('/api')
  const isAuthPage = pathname.startsWith('/auth')
  const isLandingPage = pathname === '/marketing'
  const isMarketingPage = pathname.startsWith('/marketing')
  const isPublicPath = isApiRoute || isAuthPage || isLandingPage || isMarketingPage

  if (!user && !isPublicPath) {
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
