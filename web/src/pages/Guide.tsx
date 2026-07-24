import { GraduationCap } from "lucide-react";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export default function Guide() {
  return (
    <PagePlaceholder
      icon={GraduationCap}
      title="Guide"
      phase="Guide engine"
      blurb="Guided, step-by-step learning — from your first beginner solve through CFOP, with the algorithm library and interactive walkthroughs."
    />
  );
}
