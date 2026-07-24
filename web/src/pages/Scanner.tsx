import { ScanLine } from "lucide-react";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export default function Scanner() {
  return (
    <PagePlaceholder
      icon={ScanLine}
      title="Scan Cube"
      phase="Phase 5 · Scanner"
      blurb="Point your camera at each face and cubr reads the colors. The getUserMedia + OpenCV/TFLite pipeline lands here — with a manual correction step before solving."
    />
  );
}
