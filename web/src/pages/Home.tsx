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
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-4 md:gap-10 md:px-8 md:py-6">
      <header className="overflow-hidden rounded-[28px] border border-border bg-gradient-to-br from-brand/15 via-surface-raised to-transparent p-4 shadow-sm md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="type-caption text-text-tertiary">Wednesday · 22 Jul</p>
            <h1 className="mt-2 type-heading-lg text-text-primary">Welcome back, Max</h1>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-xl font-bold text-text-on-brand">
            M
          </div>
        </div>

        <div className="mt-5 flex gap-2 md:hidden">
          <button className="flex-1 rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-text-on-brand shadow-lg shadow-brand/25">
            Scan cube
          </button>
          <button className="rounded-2xl border border-border bg-surface-default px-4 py-3 text-sm font-semibold text-text-primary">
            Practice
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap md:gap-4">
        {stats.isLoading || !stats.data ? (
          <StatsSkeleton />
        ) : (
          <>
            <StatCard label="Total Solves" value={formatCount(stats.data.totalSolves)} className="min-w-0 md:min-w-40" />
            <StatCard label="Best Time" value={formatTime(stats.data.bestTimeMs)} hint="PB" className="min-w-0 md:min-w-40" />
            <StatCard label="Streak" value={String(stats.data.streakDays)} hint="days" className="min-w-0 md:min-w-40" />
            <StatCard label="Algorithms" value={String(stats.data.algorithmsLearned)} hint="learned" className="min-w-0 md:min-w-40" />
            <StatCard label="Ao12" value={formatTime(stats.data.ao12?.averageMs ?? null)} className="col-span-2 md:min-w-40" />
          </>
        )}
      </div>

      <div className="flex flex-col gap-8">
        {shelves.isLoading || !shelves.data ? (
          <ShelvesSkeleton />
        ) : (
          shelves.data.map((shelf) => <Shelf key={shelf.id} shelf={shelf} />)
        )}
      </div>
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
