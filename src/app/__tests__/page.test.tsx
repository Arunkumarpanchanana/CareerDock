import { describe, it, expect, vi } from "vitest"

const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({
  redirect: (...args: string[]) => mockRedirect(...args),
}))

import RootPage from "../page"

describe("Root Page", () => {
  it("redirects to /auth/login", () => {
    RootPage()
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
  })
})
