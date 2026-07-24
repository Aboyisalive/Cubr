import { Palette } from "lucide-react";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export default function Themes() {
  return (
    <PagePlaceholder
      icon={Palette}
      title="Themes"
      phase="Cube theming"
      blurb="Recolor and restyle your cube — custom sticker schemes, materials, and the signature chrome finish applied to the 3D render surfaces."
    />
  );
}
