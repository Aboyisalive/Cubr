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
    try {
      const response = await api.post<WaitlistSignupResponse>(ENDPOINTS.waitlistJoin, { name, email });
      setResult(response);
    } catch (requestError) {
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
