import { Gauge, Sparkles } from "lucide-react";

export default function ProMode() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_60px_rgba(5,8,12,0.7)] backdrop-blur-2xl sm:p-8">
        <div className="flex items-center gap-3 text-[#ff8d42]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ff8d42]/25 bg-[#ff8d42]/8">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-white/55">Phase 6 · Pro features</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Pro Mode</h1>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            "OLL/PLL/F2L trainers",
            "WCA inspection & Ao5/Ao12/Ao100",
            "Solve history graphs",
            "Algorithm favorites & method comparison",
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-black/15 p-4 text-sm text-white/70">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#ff8d42]">
                <Sparkles className="h-4 w-4" />
              </div>
              {item}
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-[#ff8d42]/20 bg-[#ff8d42]/6 p-4 text-sm text-white/72">
          This premium layer is designed to match the rest of the CUBR glass system while the product-specific pro tooling is still being built out.
        </div>
      </div>
    </div>
  );
}
