/**
 * Waitlist form logic (F0.7). The Go API is the authority on validity; the
 * client checks only what it can know instantly, then surfaces the API's
 * typed errors verbatim (messages are display-safe by contract).
 */

export type WaitlistResult =
  | { ok: true }
  | { ok: false; fieldError?: string; formError?: string }

type JoinFn = (email: string) => Promise<{ status?: string }>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Instant client-side check. Returns a message for the field, or null. */
export function validateWaitlistEmail(raw: string): string | null {
  const email = raw.trim()
  if (email === '') return 'Enter your email address.'
  if (email.length > 254) return 'That email address is too long.'
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address.'
  return null
}

export async function submitWaitlist(
  rawEmail: string,
  join: JoinFn,
): Promise<WaitlistResult> {
  const fieldError = validateWaitlistEmail(rawEmail)
  if (fieldError) return { ok: false, fieldError }

  try {
    await join(rawEmail.trim().toLowerCase())
    // The API answers duplicates identically to new signups (silent
    // success), so every success lands in the same success state.
    return { ok: true }
  } catch (error) {
    const apiError = error as { code?: string; message?: string } | null
    if (apiError && typeof apiError === 'object' && 'code' in apiError) {
      if (apiError.code === 'INVALID_EMAIL') {
        return { ok: false, fieldError: apiError.message ?? 'Enter a valid email address.' }
      }
      if (apiError.code === 'RATE_LIMITED') {
        return { ok: false, formError: 'Too many tries — wait a moment and try again.' }
      }
      return { ok: false, formError: apiError.message ?? 'Something went wrong. Please try again.' }
    }
    return {
      ok: false,
      formError: 'Could not reach the server. Check your connection and try again.',
    }
  }
}
