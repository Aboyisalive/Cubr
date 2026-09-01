import { useStats, useShelves } from "@/hooks/useDashboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { Shelf } from "@/components/dashboard/Shelf";
import { formatCount, formatTime } from "@/lib/format";

/**
 * Home dashboard (Section 6): quick-stats row near the top, then themed content
 * shelves. One background token throughout — separation comes from text contrast
 * and the elevated stat/shelf surfaces, never a second background shade.
 */
export default function Home() {
  const stats = useStats();
  const shelves = useShelves();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-4 md:gap-8 md:px-8 md:py-6">
      <header className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,134,71,0.18),_transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-6">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08),transparent_62%)] md:block" />
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <p className="type-caption text-text-tertiary">Wednesday · 22 Jul</p>
            <h1 className="mt-2 type-heading-lg text-text-primary md:type-display-sm">Welcome back, Max</h1>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand/25 bg-brand/15 text-lg font-semibold text-brand shadow-[0_0_24px_rgba(255,134,71,0.2)]">
            M
          </div>
        </div>

        <div className="relative mt-5 grid gap-2 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div className="rounded-[24px] border border-white/10 bg-black/10 p-4 backdrop-blur-md">
            <p className="type-caption text-text-tertiary">Current focus</p>
            <p className="mt-2 text-xl font-medium text-text-primary">CFOP flow</p>
            <p className="mt-1 text-sm text-text-secondary">2 sessions this week · best 8.42s</p>
          </div>
          <button className="rounded-[22px] border border-brand/30 bg-gradient-to-r from-brand to-brand/80 px-4 py-3 text-sm font-semibold text-text-on-brand shadow-[0_14px_30px_rgba(255,134,71,0.28)] transition-transform hover:translate-y-[-1px]">
            Resume session
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap md:gap-4">
        {stats.isLoading || !stats.data ? (
          <StatsSkeleton />
        ) : (
          <>
            <StatCard label="Total Solves" value={formatCount(stats.data.totalSolves)} className="min-w-0 md:min-w-[130px]" />
            <StatCard label="Best Time" value={formatTime(stats.data.bestTimeMs)} hint="PB" className="min-w-0 md:min-w-[130px]" />
            <StatCard label="Streak" value={String(stats.data.streakDays)} hint="days" className="min-w-0 md:min-w-[130px]" />
            <StatCard label="Algorithms" value={String(stats.data.algorithmsLearned)} hint="learned" className="min-w-0 md:min-w-[130px]" />
            <StatCard label="Ao12" value={formatTime(stats.data.ao12?.averageMs ?? null)} className="col-span-2 md:min-w-[130px]" />
          </>
        )}
      </div>

      <div className="flex flex-col gap-7">
        {shelves.isLoading || !shelves.data ? (
          <ShelvesSkeleton />
        ) : (
          shelves.data.map((shelf) => <Shelf key={shelf.id} shelf={shelf} />)
        )}
      </div>

      <section className="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,134,71,0.14),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="type-caption text-text-tertiary">Action</p>
            <h2 className="mt-1 type-heading-sm text-text-primary">Scan a cube</h2>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand/25 bg-brand/15 text-brand shadow-[0_0_24px_rgba(255,134,71,0.2)]">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M3 7V5.5A2.5 2.5 0 0 1 5.5 3H8v2H5.5a.5.5 0 0 0-.5.5V7H3Zm0 10v1.5A2.5 2.5 0 0 0 5.5 21H8v-2H5.5a.5.5 0 0 1-.5-.5V17H3Zm18-10V5.5A2.5 2.5 0 0 0 18.5 3H16v2h2.5a.5.5 0 0 1 .5.5V7h2Zm0 10v1.5A2.5 2.5 0 0 1 18.5 21H16v-2h2.5a.5.5 0 0 0 .5-.5V17h2ZM7 7h10v10H7V7Zm2 2v6h6V9h-6Z" /></svg>
          </div>
        </div>
        <p className="mt-3 max-w-xl text-sm text-text-secondary">
          Capture the cube state, verify the stickers, and jump straight into solver guidance.
        </p>
        <button className="mt-5 inline-flex items-center justify-center rounded-2xl border border-brand/30 bg-gradient-to-r from-brand/95 to-brand/80 px-5 py-3 text-sm font-semibold text-text-on-brand shadow-[0_14px_30px_rgba(255,134,71,0.28)] hover:translate-y-[-1px]">
          Open scanner
        </button>
      </section>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-[76px] min-w-40 flex-1 animate-pulse rounded-xl bg-surface-raised" />
      ))}
    </>
  );
}

function ShelvesSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {Array.from({ length: 2 }).map((_, s) => (
        <div key={s} className="flex flex-col gap-3">
          <div className="h-7 w-48 animate-pulse rounded-md bg-surface-raised" />
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, c) => (
              <div key={c} className="h-56 w-44 animate-pulse rounded-xl bg-surface-raised" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
