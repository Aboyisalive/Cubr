import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuthStore } from "@/store/authSlice";

/**
 * Login (Section 7): a calm, minimal moment — a centered card on the single
 * background, not a shelf-heavy layout. Room left for future OAuth options.
 */
export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const status = useAuthStore((s) => s.status);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await login(email, password);
    navigate("/app");
  }

  return (
    <div className="flex min-h-full flex-col bg-bg-default">
      <header className="mx-auto flex w-full max-w-6xl items-center px-4 py-5 md:px-8">
        <Link to="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary">
          <ArrowLeft size={18} />
          <Logo />
        </Link>
        <ThemeToggle className="ml-auto" />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-raised p-8">
          <h1 className="type-heading-md mb-1 text-text-primary">Welcome back</h1>
          <p className="type-body-md mb-6 text-text-secondary">Log in to pick up where you left off.</p>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

            <Button type="submit" size="lg" className="mt-2 w-full" disabled={status === "loading"}>
              {status === "loading" ? "Logging in…" : "Log in"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="type-caption text-text-tertiary">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Room for future OAuth options (Section 7) */}
          <Button variant="secondary" size="lg" className="w-full" disabled>
            Continue with Google
          </Button>

          <p className="type-body-sm mt-6 text-center text-text-secondary">
            New to cubr?{" "}
            <Link to="/app" className="text-brand hover:underline">Create an account</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="type-label-md text-text-primary">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="h-11 rounded-lg border border-border bg-surface-default px-3 text-body-md text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:border-brand"
      />
    </label>
  );
}
