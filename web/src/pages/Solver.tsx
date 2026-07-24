import { Boxes } from "lucide-react";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export default function Solver() {
  return (
    <PagePlaceholder
      icon={Boxes}
      title="Solver"
      phase="Phase 1–3 · Engine + Web MVP"
      blurb="Manual cube input on a 2D net, a virtual cube, and step-by-step solutions from the Kociemba service — plus the solve timer and basic stats."
    />
  );
}
