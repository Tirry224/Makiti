import Link from "next/link";
import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

type BaseProps = {
  icon: LucideIcon;
  label: string;
  description: string;
  tone?: "default" | "danger";
};

/**
 * Ligne d'action dans une feuille : un intitulé, sa conséquence en dessous.
 *
 * Trois formes selon ce qu'on lui donne — jamais un `onClick`, cette
 * page est un composant serveur :
 * - `href` : une navigation (« Modifier le produit ») → un `<Link>`.
 * - `action` + `hiddenFields` : une action serveur (« Marquer vendu ») →
 *   sa propre petite `<form>`, une par ligne. Chacune reste une adresse
 *   « GET »-like au sens où la page ne devient pas un gros formulaire
 *   unique : chaque bouton fait une seule chose.
 * - ni l'un ni l'autre : un bouton inerte, pour les écrans pas encore
 *   branchés (voir docs/REPRISE.md).
 */
type ActionRowProps =
  | (BaseProps & { href: string; action?: undefined; hiddenFields?: undefined })
  | (BaseProps & {
      href?: undefined;
      action: (formData: FormData) => void | Promise<void>;
      hiddenFields?: Record<string, string>;
    })
  | (BaseProps & { href?: undefined; action?: undefined; hiddenFields?: undefined });

export function ActionRow(props: ActionRowProps) {
  const { icon: Icon, label, description, tone = "default" } = props;

  const classes = cn(
    "flex w-full cursor-pointer items-start gap-3.5 border-b border-line py-3.5 text-left last:border-b-0",
    tone === "danger" ? "text-danger" : "text-ink",
  );

  const content = (
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

  if (props.href) {
    return (
      <Link href={props.href} className={classes}>
        {content}
      </Link>
    );
  }

  if (props.action) {
    return (
      <form action={props.action}>
        {Object.entries(props.hiddenFields ?? {}).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <button type="submit" className={classes}>
          {content}
        </button>
      </form>
    );
  }

  return (
    <button type="button" className={classes}>
      {content}
    </button>
  );
}
