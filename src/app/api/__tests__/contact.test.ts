import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSendMail = vi.fn()
vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail: mockSendMail }) },
}))

async function post(body: Record<string, unknown>) {
  const { POST } = await import('../contact/route')
  const req = new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return POST(req)
}

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.stubEnv('SMTP_HOST', 'smtp.example.com')
    vi.stubEnv('SMTP_PORT', '587')
    vi.stubEnv('SMTP_USER', 'user@example.com')
    vi.stubEnv('SMTP_PASS', 'pass')
    mockSendMail.mockReset()
  })

  it('returns 400 for missing fields', async () => {
    const res = await post({})
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  it('returns 400 for invalid email', async () => {
    const res = await post({ name: 'A', email: 'not-email', subject: 'S', message: 'M'.repeat(10) })
    expect(res.status).toBe(400)
  })

  it('sends email and returns 200 on valid input', async () => {
    mockSendMail.mockResolvedValue({ messageId: '123' })
    const res = await post({
      name: 'Alice',
      email: 'alice@test.com',
      subject: 'Hello',
      message: 'This is a test message.',
    })
    expect(res.status).toBe(200)
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'user@example.com',
        replyTo: 'alice@test.com',
        to: 'support@mycareerdock.com',
        subject: '[Contact] Hello',
      })
    )
  })

  it('returns 500 when SMTP fails', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP error'))
    const res = await post({
      name: 'Alice',
      email: 'alice@test.com',
      subject: 'Hello',
      message: 'This is a test message.',
    })
    expect(res.status).toBe(500)
  })
})
