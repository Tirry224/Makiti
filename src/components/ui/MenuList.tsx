import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";
import { cn } from "@/lib/cn";

/**
 * Liste de réglages : une icône, un intitulé, éventuellement une valeur.
 *
 * Le séparateur est posé par `last:border-b-0` plutôt qu'en calculant
 * l'index de la dernière ligne : le composant reste indifférent au nombre
 * d'éléments et à leur ordre.
 */
export function MenuList({ children }: { children: React.ReactNode }) {
  return <Card className="px-3.5">{children}</Card>;
}

export function MenuItem({
  icon: Icon,
  label,
  value,
  href,
  action,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  href?: string;
  /** Action serveur (ex. déconnexion) — rend sa propre petite `<form>`. */
  action?: () => void | Promise<void>;
  tone?: "default" | "danger";
}) {
  const content = (
    <>
      <Icon size={20} strokeWidth={1.8} aria-hidden className="shrink-0" />
      <span className="flex-1 text-base">{label}</span>
      {value ? <span className="text-sm text-ink-soft">{value}</span> : null}
      {href ? (
        <ChevronRight size={18} strokeWidth={2} aria-hidden className="shrink-0 text-ink-soft" />
      ) : null}
    </>
  );

  const className = cn(
    "flex h-tap items-center gap-3.5 border-b border-line last:border-b-0",
    tone === "danger" ? "text-danger" : "text-ink",
  );

  /* Un élément qui navigue est un lien, un élément qui agit est un bouton
     dans sa propre `<form>`. On ne met pas un `onClick` sur un `<div>` :
     ni le clavier ni un lecteur d'écran ne sauraient s'en servir. */
  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  if (action) {
    return (
      <form action={action}>
        <button type="submit" className={cn(className, "w-full cursor-pointer text-left")}>
          {content}
        </button>
      </form>
    );
  }
  return (
    <button type="button" className={cn(className, "w-full cursor-pointer text-left")}>
      {content}
    </button>
  );
}
