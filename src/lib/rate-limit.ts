import { NextResponse } from 'next/server'

// In-memory rate limiter — resets on server restart.
// Not suitable for serverless deployments (Vercel, Lambda) where
// each instance has an isolated memory space. For production with
// multiple instances, replace with Redis or a distributed store.
const store = new Map<string, { count: number; resetAt: number }>()

function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

export function rateLimitByIp(
  request: Request,
  limit = 30,
  windowMs = 60_000
): { allowed: boolean; remaining: number; resetAt: number } | NextResponse {
  const ip = getClientIp(request)
  const result = rateLimit(`ip:${ip}`, limit, windowMs)

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  return result
}
