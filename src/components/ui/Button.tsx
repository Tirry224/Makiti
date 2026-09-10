import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

/**
 * Les variantes vivent dans un objet, pas dans une suite de `if`. Ajouter
 * une variante devient une ligne, et TypeScript refuse ensuite tout nom
 * qui n'existe pas dans cet objet.
 */
const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "bg-surface text-ink border border-line hover:border-line-strong",
  ghost: "text-ink hover:bg-accent-soft",
  danger: "bg-surface text-danger border border-line hover:bg-danger-soft",
};

/**
 * `h-control` (52px) et `h-tap` (44px) viennent des tokens. 44px est la
 * hauteur MINIMALE d'une cible tactile : en dessous, on la rate au pouce.
 * Il n'existe donc volontairement aucune taille plus petite.
 */
const SIZES: Record<Size, string> = {
  md: "h-control text-base",
  sm: "h-tap text-base",
};

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  /** Les boutons de Makiti occupent toute la largeur par défaut. */
  fullWidth?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  fullWidth = true,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold",
        "transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {Icon ? <Icon size={20} strokeWidth={1.9} aria-hidden /> : null}
      {children}
    </button>
  );
}
