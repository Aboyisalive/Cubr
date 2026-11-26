import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { joinWaitlistApi } from '@/lib/api'
import { submitWaitlist, validateWaitlistEmail } from '@/lib/waitlist'

const WaitlistContext = createContext<{ openWaitlist: () => void } | null>(null)

export function useWaitlist(): { openWaitlist: () => void } {
  const ctx = useContext(WaitlistContext)
  if (!ctx) throw new Error('useWaitlist must be used within WaitlistProvider')
  return ctx
}

type Status = 'idle' | 'submitting' | 'success'

/**
 * One shared signup modal serves every CTA on the page (hero + final CTA).
 * Built on the native <dialog> element: Esc closes, focus moves inside on
 * open, the backdrop click closes, and it is fully keyboard/screen-reader
 * operable without a focus-trap library.
 */
export function WaitlistProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const [status, setStatus] = useState<Status>('idle')

  const openWaitlist = useCallback(() => {
    setStatus('idle')
    setFormError(null)
    dialogRef.current?.showModal()
    // Move focus to the email field explicitly (autoFocus is unreliable
    // inside a <dialog> that mounts closed).
    emailRef.current?.focus()
  }, [])

  const close = useCallback(() => dialogRef.current?.close(), [])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    setFormError(null)
    setStatus('submitting')
    const result = await submitWaitlist(email, joinWaitlistApi)
    if (result.ok) {
      setStatus('success')
      setFieldError(null)
    } else {
      setStatus('idle')
      setFieldError(result.fieldError ?? null)
      setFormError(result.formError ?? null)
    }
  }

  return (
    <WaitlistContext.Provider value={{ openWaitlist }}>
      {children}

      <dialog
        ref={dialogRef}
        aria-labelledby="waitlist-title"
        className="m-auto w-[min(92vw,26rem)] rounded-xl border border-border bg-card p-0 text-card-foreground shadow-xl backdrop:bg-black/60 open:animate-in open:fade-in"
        onClick={(event) => {
          if (event.target === dialogRef.current) close()
        }}
        onClose={() => {
          setStatus('idle')
          setFormError(null)
        }}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2
              id="waitlist-title"
              className="font-heading text-xl font-bold tracking-tight"
            >
              {status === 'success' ? "You're on the list" : 'Join the waitlist'}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={close}
              aria-label="Close dialog"
            >
              <X aria-hidden />
            </Button>
          </div>

          {status === 'success' ? (
            <div className="mt-4">
              <p className="flex items-start gap-2 text-base leading-relaxed">
                <CheckCircle2 aria-hidden className="mt-1 shrink-0 text-success" />
                Thanks — we&apos;ll email you when cubr launches. No spam,
                just the launch.
              </p>
              <Button type="button" className="mt-6 w-full" onClick={close} autoFocus>
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="mt-4">
              <p className="text-base leading-relaxed text-muted-foreground">
                Be first to scan, solve and learn with cubr at launch.
              </p>

              {formError && (
                <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {formError}
                </p>
              )}

              <div className="mt-4">
                <label htmlFor="waitlist-email" className="text-sm font-medium">
                  Email address
                </label>
                <input
                  ref={emailRef}
                  id="waitlist-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  aria-invalid={fieldError ? true : undefined}
                  aria-describedby={fieldError ? 'waitlist-email-error' : undefined}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    // Re-validate on input once the field has shown an error.
                    if (touched && fieldError) {
                      setFieldError(validateWaitlistEmail(event.target.value))
                    }
                  }}
                  onBlur={() => {
                    setTouched(true)
                    setFieldError(validateWaitlistEmail(email))
                  }}
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
                  placeholder="you@example.com"
                />
                {fieldError && (
                  <p id="waitlist-email-error" role="alert" className="mt-1.5 text-sm text-destructive">
                    {fieldError}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="mt-6 w-full"
                disabled={status === 'submitting'}
                aria-busy={status === 'submitting'}
              >
                {status === 'submitting' ? 'Joining…' : 'Join the waitlist'}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                One launch email. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </dialog>
    </WaitlistContext.Provider>
  )
}
