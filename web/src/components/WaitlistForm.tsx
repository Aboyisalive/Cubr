import { useState, type FormEvent } from "react";
import { api } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import { Button } from "@/components/ui/Button";
import type { WaitlistSignupRequest, WaitlistSignupResponse } from "@shared/types/waitlist";

export function WaitlistForm() {
  const [values, setValues] = useState<WaitlistSignupRequest>({ name: "", email: "" });
  const [error, setError] = useState("");
  const [result, setResult] = useState<WaitlistSignupResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [queued, setQueued] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = values.name.trim();
    const email = values.email.trim();
    if (!name) {
      setError("Enter your name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setSubmitting(true);
    setQueued(true);

    try {
      const response = await api.post<WaitlistSignupResponse>(ENDPOINTS.waitlistJoin, { name, email });
      setResult(response);
      setQueued(false);
    } catch (requestError) {
      setQueued(false);
      setError(requestError instanceof Error ? requestError.message : "Could not join the waitlist.");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="py-8 text-center">
        <p className="type-caption text-[#ff6b0f]">YOU&apos;RE IN</p>
        <p className="type-heading-md mt-3 text-white">You&apos;re #{result.position} on the list</p>
        <p className="type-body-md mt-3 text-white/58">We&apos;ll keep you posted when CUBR is ready.</p>
      </div>
    );
  }

  if (queued) {
    return (
      <div className="space-y-5 py-2" aria-live="polite">
        <div className="rounded-2xl border border-[#ff8d42]/20 bg-[#ff8d42]/6 p-4 text-left">
          <p className="text-xs uppercase tracking-[0.22em] text-[#ff8d42]">Queueing</p>
          <p className="mt-2 text-lg font-medium text-white">You&apos;re in the early-access list.</p>
          <p className="mt-1 text-sm text-white/60">Saving your spot while the request confirms…</p>
        </div>
        <div className="space-y-3 animate-pulse">
          <div className="h-11 w-full rounded-2xl bg-white/8" />
          <div className="h-11 w-full rounded-2xl bg-white/8" />
          <div className="h-12 w-full rounded-2xl bg-[#ff8d42]/20" />
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={submit} noValidate>
      <div>
        <label className="type-label-md mb-2 block text-white/82" htmlFor="waitlist-name">Name</label>
        <input
          id="waitlist-name"
          name="name"
          value={values.name}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          className="cubr-input h-12 w-full px-4 text-body-md text-white placeholder:text-white/35 outline-none"
          placeholder="Your name"
          autoComplete="name"
          required
        />
      </div>
      <div>
        <label className="type-label-md mb-2 block text-white/82" htmlFor="waitlist-email">Email</label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          value={values.email}
          onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
          className="cubr-input h-12 w-full px-4 text-body-md text-white placeholder:text-white/35 outline-none"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>
      {error && <p className="type-body-sm text-red-300" role="alert">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Joining..." : "Join the waitlist"}
      </Button>
    </form>
  );
}
