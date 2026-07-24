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
    <div className="flex flex-col gap-10 px-4 py-6 md:px-8">
      <header className="flex flex-col gap-1">
        <p className="type-caption text-text-tertiary">Wednesday · 22 Jul</p>
        <h1 className="type-heading-lg text-text-primary">Welcome back, Max</h1>
      </header>

      {/* Quick-stats row (Section 6.5) */}
      <div className="flex flex-wrap gap-4">
        {stats.isLoading || !stats.data ? (
          <StatsSkeleton />
        ) : (
          <>
            <StatCard label="Total Solves" value={formatCount(stats.data.totalSolves)} />
            <StatCard label="Best Time" value={formatTime(stats.data.bestTimeMs)} hint="PB" />
            <StatCard label="Streak" value={String(stats.data.streakDays)} hint="days" />
            <StatCard label="Algorithms" value={String(stats.data.algorithmsLearned)} hint="learned" />
            <StatCard label="Ao12" value={formatTime(stats.data.ao12?.averageMs ?? null)} />
          </>
        )}
      </div>

      {/* Content shelves (Section 6.4) */}
      <div className="flex flex-col gap-8">
        {shelves.isLoading || !shelves.data
          ? <ShelvesSkeleton />
          : shelves.data.map((shelf) => <Shelf key={shelf.id} shelf={shelf} />)}
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
