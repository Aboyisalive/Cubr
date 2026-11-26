import { joinWaitlist } from '@cubr/api-client'

/**
 * Generated API client (F0.3). The base URL is set at build time with
 * VITE_API_URL; local dev talks to the Go backend on :8080.
 */
const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

/** Join the waitlist. Throws the API's typed error object on failure. */
export async function joinWaitlistApi(email: string): Promise<{ status?: string }> {
  const { data, error } = await joinWaitlist({ body: { email }, baseUrl })
  if (error) {
    // ErrorResponse shape: { error: { code, message, details? } }
    throw (error as { error?: { code?: string; message?: string } }).error ?? error
  }
  return data ?? {}
}
