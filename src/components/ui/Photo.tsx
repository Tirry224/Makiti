import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Emplacement de photo.
 *
 * Aucune vraie image n'existe encore : elles viendront du stockage
 * Supabase, déposées par les commerçants. Ce composant tient la place et
 * le dit honnêtement. Le jour où les photos arriveront, il devient le seul
 * endroit à modifier pour brancher `next/image` — dimensions, chargement
 * différé et compression compris.
 */
export function Photo({
  ratio = "square",
  label,
  className,
  iconSize = 26,
}: {
  ratio?: "square" | "card" | "hero" | "free";
  label?: string;
  className?: string;
  iconSize?: number;
}) {
  const RATIOS = {
    square: "aspect-square",
    card: "h-33",       /* 132px, la vignette du fil */
    hero: "h-75",       /* 300px, la photo de la fiche produit */
    free: "",
  } as const;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 bg-placeholder text-ink-soft/60",
        RATIOS[ratio],
        className,
      )}
    >
      <ImageIcon size={iconSize} strokeWidth={1.5} aria-hidden />
      {label ? <span className="text-2xs font-medium">{label}</span> : null}
    </div>
  );
}
