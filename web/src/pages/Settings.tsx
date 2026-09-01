import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setLoading(false), 350);
    return () => window.clearTimeout(timeout);
  }, []);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 md:px-8">
        <header className="flex flex-col gap-2">
          <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-2xl bg-white/10" />
            <div className="h-8 w-32 animate-pulse rounded-full bg-white/10" />
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.03]" />
          ))}
        </div>

        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 md:px-8">
      <header className="flex flex-col gap-2">
        <p className="type-caption text-text-tertiary">Preferences</p>
        <h1 className="type-heading-lg flex items-center gap-3 text-text-primary">
          <Settings className="text-brand" size={28} />
          Settings
        </h1>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Theme" value="Glass" />
        <StatCard label="Mode" value="Dark" />
        <StatCard label="Focus" value="General" />
      </div>

      <div className="space-y-5">
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl">
          <h2 className="type-heading-sm text-text-primary">Appearance</h2>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="type-label-md text-text-primary">CUBR v1 visual system</p>
            <p className="mt-2 type-body-sm text-text-secondary">
              Dark glassmorphism is the default experience for the app. The interface uses frosted surfaces,
              soft depth, and controlled orange accents to keep the product premium, minimal, and readable.
            </p>
          </div>
        </section>

        <Section title="Cube preferences" />
        <Section title="Timer preferences" />
        <Section title="Notifications" />
        <Section title="Accessibility" />
      </div>
    </div>
  );
}

function Section({ title }: { title: string }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl">
      <h2 className="type-heading-sm text-text-primary">{title}</h2>
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="type-body-sm text-text-tertiary">Coming soon</p>
      </div>
    </section>
  );
}
