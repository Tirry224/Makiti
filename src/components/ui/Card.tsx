import { cn } from "@/lib/cn";

/**
 * Makiti se dessine avec des bordures, pas des ombres : plus net sur un
 * écran bon marché, plus lisible en plein soleil, et moins coûteux à
 * afficher. `Card` est le seul endroit où cette décision est écrite —
 * changer la bordure en ombre ici la change dans toute l'application.
 */
export function Card({
  children,
  className,
  padded = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Raccourci pour le rembourrage standard d'une carte de contenu. */
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-line bg-surface",
        padded && "p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
