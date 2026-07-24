import { Gauge } from "lucide-react";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export default function ProMode() {
  return (
    <PagePlaceholder
      icon={Gauge}
      title="Pro Mode"
      phase="Phase 6 · Pro features"
      blurb="OLL/PLL/F2L trainers, WCA inspection, Ao5/Ao12/Ao100, solve-history graphs, algorithm favorites, and method comparison."
    />
  );
}
