import { cn } from "@/lib/cn";
import { formatGnf } from "@/lib/format";

/**
 * Le prix porte la police d'affichage : c'est l'information que l'œil doit
 * trouver en premier sur une marketplace. Un prix barré signale un produit
 * vendu — l'information passe alors par la forme, pas seulement par la
 * couleur, donc elle reste lisible pour un daltonien.
 */
export function PriceTag({
  amount,
  size = "md",
  struck = false,
  className,
}: {
  amount: number;
  size?: "sm" | "md" | "lg";
  struck?: boolean;
  className?: string;
}) {
  const SIZES = { sm: "text-sm", md: "text-base", lg: "text-3xl" } as const;
  return (
    <span
      className={cn(
        "font-display font-bold tracking-tight",
        SIZES[size],
        struck && "text-ink-soft line-through",
        className,
      )}
    >
      {formatGnf(amount)}
    </span>
  );
}
