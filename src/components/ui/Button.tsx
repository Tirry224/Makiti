import Link from "next/link";
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

type CommonProps = {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  /** Les boutons de Makiti occupent toute la largeur par défaut. */
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
};

/**
 * `href` produit un LIEN, son absence produit un BOUTON.
 *
 * La distinction n'est pas cosmétique. Un lien mène quelque part : il
 * s'ouvre dans un nouvel onglet au clic du milieu, se copie, se
 * référence. Un bouton agit sur la page courante. Emboîter l'un dans
 * l'autre — un `<button>` dans un `<a>` — produit du HTML invalide et un
 * comportement imprévisible au clavier. Le composant tranche à ta place.
 */
type ButtonProps = CommonProps &
  ({ href: string } & Omit<React.ComponentProps<typeof Link>, "href" | "className">
   | ({ href?: undefined } & Omit<React.ComponentProps<"button">, "className">));

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  fullWidth = true,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold",
    "transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
    className,
  );

  const content = (
    <>
      {Icon ? <Icon size={20} strokeWidth={1.9} aria-hidden /> : null}
      {children}
    </>
  );

  if ("href" in props && props.href) {
    const { href, ...rest } = props as { href: string };
    return (
      <Link href={href} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...(props as React.ComponentProps<"button">)}>
      {content}
    </button>
  );
}
