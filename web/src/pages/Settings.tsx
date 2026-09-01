import { Settings, Moon, Sun, Droplets, SquareStack } from "lucide-react";
import { useUiStore, type Theme, type VisualTheme } from "@/store/uiStore";
import { cn } from "@/lib/cn";
import { StatCard } from "@/components/dashboard/StatCard";

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

const VISUAL_OPTIONS: { value: VisualTheme; label: string; desc: string; icon: typeof Droplets }[] = [
  { value: "liquid-glass", label: "Liquid Glass", desc: "Frosted, translucent, premium feel", icon: Droplets },
  { value: "material3", label: "Material 3", desc: "Clean, structured, Android-native", icon: SquareStack },
];

export default function SettingsPage() {
  const theme = useUiStore((s) => s.theme);
  const visualTheme = useUiStore((s) => s.visualTheme);
  const setTheme = useUiStore((s) => s.setTheme);
  const setVisualTheme = useUiStore((s) => s.setVisualTheme);

  return (
    <div className="flex flex-col gap-10 px-4 py-6 md:px-8">
      <header className="flex flex-col gap-1">
        <p className="type-caption text-text-tertiary">Preferences</p>
        <h1 className="type-heading-lg flex items-center gap-3 text-text-primary">
          <Settings className="text-brand" size={28} />
          Settings
        </h1>
      </header>

      <div className="flex flex-wrap gap-4">
        <StatCard label="Theme" value={theme === "dark" ? "Dark" : "Light"} />
        <StatCard label="Visual" value={visualTheme === "material3" ? "Material 3" : "Glass"} />
        <StatCard label="Focus" value="General" />
      </div>

      <div className="max-w-3xl space-y-6">
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-raised p-4">
          <h2 className="type-heading-sm text-text-primary">Appearance</h2>

          <div className="flex flex-col gap-2">
            <p className="type-label-md text-text-secondary">Color mode</p>
            <div className="flex gap-3">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-3 text-label-md transition-all",
                    "border",
                    theme === value
                      ? "border-brand bg-brand-subtle text-brand"
                      : "border-border bg-surface-base text-text-secondary hover:border-border-strong hover:text-text-primary"
                  )}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="type-label-md text-text-secondary">Visual theme</p>
            <div className="flex gap-3">
              {VISUAL_OPTIONS.map(({ value, label, desc, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setVisualTheme(value)}
                  className={cn(
                    "flex flex-1 items-start gap-3 rounded-xl px-4 py-3 text-left transition-all",
                    "border",
                    visualTheme === value
                      ? "border-brand bg-brand-subtle"
                      : "border-border bg-surface-base hover:border-border-strong"
                  )}
                >
                  <Icon
                    size={20}
                    className={cn(
                      "mt-0.5 shrink-0",
                      visualTheme === value ? "text-brand" : "text-text-tertiary"
                    )}
                  />
                  <div className="flex flex-col gap-0.5">
                    <span
                      className={cn(
                        "type-label-md",
                        visualTheme === value ? "text-brand" : "text-text-primary"
                      )}
                    >
                      {label}
                    </span>
                    <span className="type-body-sm text-text-secondary">{desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <Section title="Cube preferences" />
        <Section title="Timer preferences" />
        <Section title="Notifications" />
        <Section title="Accessibility" />
        <Section title="About cubr" />
      </div>
    </div>
  );
}

function Section({ title }: { title: string }) {
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-raised p-4">
      <h2 className="type-heading-sm text-text-primary">{title}</h2>
      <div className="rounded-xl bg-surface-base p-4">
        <p className="type-body-sm text-text-tertiary">Coming soon</p>
      </div>
    </section>
  );
}
