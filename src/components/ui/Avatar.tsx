import { Package } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Deux formes d'interlocuteur : une personne (ses initiales) ou une
 * boutique (une icône). Les initiales évitent d'avoir à gérer des photos
 * de profil, que personne ne remplira au lancement.
 */
export function Avatar({
  name,
  kind = "person",
  size = 44,
  className,
}: {
  name: string;
  kind?: "person" | "shop";
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      style={{ width: size, height: size }}
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-placeholder",
        "font-display font-bold text-ink-soft",
        className,
      )}
    >
      {kind === "shop" ? (
        <Package size={size * 0.44} strokeWidth={1.6} />
      ) : (
        <span style={{ fontSize: size * 0.34 }}>{initials}</span>
      )}
    </div>
  );
}
