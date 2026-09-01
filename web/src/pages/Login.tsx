import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authSlice";

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
    <div className="flex min-h-full flex-col bg-transparent">
      <header className="mx-auto flex w-full max-w-6xl items-center px-4 py-5 md:px-8">
        <Link to="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary">
          <ArrowLeft size={18} />
          <Logo />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.38)] backdrop-blur-2xl sm:p-8">
          <div className="mb-6">
            <p className="type-caption text-brand">CUBR / SIGN IN</p>
            <h1 className="mt-2 type-heading-md text-text-primary">Welcome back</h1>
            <p className="mt-2 type-body-md text-text-secondary">Log in to pick up where you left off.</p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

            <Button type="submit" size="lg" className="mt-2 w-full rounded-2xl" disabled={status === "loading"}>
              {status === "loading" ? "Logging in…" : "Log in"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="type-caption text-text-tertiary">or</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <Button variant="secondary" size="lg" className="w-full rounded-2xl" disabled>
            Continue with Google
          </Button>

          <p className="type-body-sm mt-6 text-center text-text-secondary">
            New to cubr? <Link to="/app" className="text-brand hover:underline">Create an account</Link>
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
        className="h-12 rounded-2xl border border-white/10 bg-black/15 px-3 text-body-md text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:border-brand/50"
      />
    </label>
  );
}
