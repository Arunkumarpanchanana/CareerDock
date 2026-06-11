'use client'

import { useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

export function useReCaptcha(action: string) {
  const readyRef = useRef(false)

  useEffect(() => {
    if (!SITE_KEY) return
    if (document.querySelector('#recaptcha-script')) return

    const script = document.createElement('script')
    script.id = 'recaptcha-script'
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }, [])

  const execute = useCallback(async (): Promise<string | null> => {
    if (!SITE_KEY || !window.grecaptcha) return null

    return new Promise((resolve) => {
      window.grecaptcha!.ready(() => {
        window
          .grecaptcha!.execute(SITE_KEY!, { action })
          .then((token) => resolve(token))
          .catch(() => resolve(null))
      })
    })
  }, [action])

  return { execute, enabled: !!SITE_KEY }
}
