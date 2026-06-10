import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  const response = NextResponse.redirect(new URL('/auth/login', origin).toString())

  // Clear all Supabase auth cookies from the request cookie store
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    for (const cookie of allCookies) {
      if (cookie.name.includes('sb-') || cookie.name.includes('supabase')) {
        cookieStore.set(cookie.name, '', { maxAge: 0, path: '/' })
        response.cookies.set(cookie.name, '', { maxAge: 0, path: '/' })
      }
    }
  } catch (e) {
    console.error('Cookie clear error:', e)
  }

  return response
}
