import { updateSession } from '@/lib/supabase/proxy'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID()
  const isDev = process.env.NODE_ENV === 'development'

  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''} https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/",
    "font-src 'self' data:",
    "connect-src 'self' https://xrqombtevssqznnkohzy.supabase.co",
    "frame-src https://www.google.com/recaptcha/",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')

  const { pathname } = new URL(request.url)
  const isApiRoute = pathname.startsWith('/api')

  if (!isApiRoute) {
    request.headers.set('x-nonce', nonce)
    request.headers.set('Content-Security-Policy', cspHeader)
  }

  const { supabaseResponse, user } = await updateSession(request)

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

  if (!isApiRoute) {
    supabaseResponse.headers.set('x-nonce', nonce)
    supabaseResponse.headers.set('Content-Security-Policy', cspHeader)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
