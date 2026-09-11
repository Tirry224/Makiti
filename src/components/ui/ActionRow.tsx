import Link from "next/link";
import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

/**
 * Ligne d'action dans une feuille : un intitulé, sa conséquence en dessous.
 *
 * Trois formes,choisies par les props, selon ce que la ligne fait vraiment :
 * `href` produit un lien (on va ailleurs), `name` produit un bouton
 * d'envoi du formulaire qui l'entoure (on agit ici), et sans ni l'un ni
 * l'autre la ligne reste un affichage inerte — le cas des actions dont la
 * donnée n'existe pas encore.
 */
export function ActionRow({
  icon: Icon,
  label,
  description,
  tone = "default",
  href,
  name,
  value,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  tone?: "default" | "danger";
  href?: string;
  name?: string;
  value?: string;
}) {
  const classes = cn(
    "flex w-full items-start gap-3.5 border-b border-line py-3.5 text-left last:border-b-0",
    (href || name) && "cursor-pointer",
    tone === "danger" ? "text-danger" : "text-ink",
  );

  const contenu = (
    <>
      <Icon size={20} strokeWidth={1.8} aria-hidden className="mt-px shrink-0" />
      <span className="flex flex-col gap-0.5">
        <span className="text-base font-semibold">{label}</span>
        {/* La conséquence est écrite sous chaque action. « Masquer » et
            « Supprimer » se ressemblent ; ce qu'ils font à tes données,
            non. C'est là que se joue la confiance. */}
        <span className="text-xs leading-normal text-ink-soft">{description}</span>
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} prefetch={false} className={classes}>
        {contenu}
      </Link>
    );
  }

  return (
    <button type={name ? "submit" : "button"} name={name} value={value} className={classes}>
      {contenu}
    </button>
  );
}
