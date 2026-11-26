import { describe, expect, it, vi } from 'vitest'
import { submitWaitlist, validateWaitlistEmail } from './waitlist'

describe('validateWaitlistEmail', () => {
  it('requires an email', () => {
    expect(validateWaitlistEmail('')).toMatch(/enter your email/i)
    expect(validateWaitlistEmail('   ')).toMatch(/enter your email/i)
  })
  it('rejects malformed addresses instantly', () => {
    expect(validateWaitlistEmail('nope')).toMatch(/valid email/i)
    expect(validateWaitlistEmail('a@b')).toMatch(/valid email/i)
    expect(validateWaitlistEmail('a b@c.co')).toMatch(/valid email/i)
  })
  it('accepts plausible addresses (server has the final say)', () => {
    expect(validateWaitlistEmail('Cuber@Example.com')).toBeNull()
  })
})

describe('submitWaitlist', () => {
  it('does not call the API when the field is invalid', async () => {
    const join = vi.fn()
    const result = await submitWaitlist('nope', join)
    expect(join).not.toHaveBeenCalled()
    expect(result).toMatchObject({ ok: false, fieldError: expect.any(String) })
  })

  it('normalizes and subscribes', async () => {
    const join = vi.fn().mockResolvedValue({ status: 'subscribed' })
    const result = await submitWaitlist('  Cuber@Example.com ', join)
    expect(join).toHaveBeenCalledWith('cuber@example.com')
    expect(result).toEqual({ ok: true })
  })

  it('maps API INVALID_EMAIL to a field error with its message', async () => {
    const join = vi.fn().mockRejectedValue({
      code: 'INVALID_EMAIL',
      message: 'Please enter a valid email address.',
    })
    const result = await submitWaitlist('a@b.co', join)
    expect(result).toMatchObject({
      ok: false,
      fieldError: 'Please enter a valid email address.',
    })
  })

  it('maps rate limiting to a form error', async () => {
    const join = vi.fn().mockRejectedValue({ code: 'RATE_LIMITED' })
    const result = await submitWaitlist('a@b.co', join)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.formError).toMatch(/too many tries/i)
  })

  it('maps network failure to a connection message', async () => {
    const join = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    const result = await submitWaitlist('a@b.co', join)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.formError).toMatch(/could not reach/i)
  })
})
