import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Une puce de filtre qui ouvre ses options — sans une ligne de JavaScript.
 *
 * `<details>` fait nativement ce qu'on écrirait sinon avec un état React :
 * ouvrir, fermer, refermer au clic ailleurs si le navigateur le gère. Zéro
 * octet ajouté au socle, et surtout : ça fonctionne AVANT que le JavaScript
 * soit chargé, donc pendant les longues secondes qui comptent sur un réseau
 * lent (docs/PERFORMANCE.md, règle R3).
 *
 * Chaque option est un lien : le filtre s'applique par navigation, l'URL
 * porte l'état, le bouton « retour » du téléphone défait le filtre et un
 * résultat filtré se partage tel quel. Pas de bouton « Appliquer » — un
 * brouillon de filtres serait un état de plus à gérer, pour trois filtres.
 *
 * La puce est foncée quand le filtre s'écarte de sa valeur par défaut :
 * l'état se lit d'un regard, sans compter les filtres actifs.
 *
 * Le panneau reste DANS LE FLUX et pousse les résultats vers le bas, au
 * lieu de flotter au-dessus. Ce n'est pas un choix esthétique : un panneau
 * en `absolute` est découpé par la barre de filtres dès qu'elle défile
 * horizontalement — `overflow-x: auto` rogne aussi la verticale. La rangée
 * passe donc à la ligne plutôt que de défiler, et le panneau s'ouvre en
 * dessous, entier. Constaté à l'écran, pas deviné.
 */
export type OptionFiltre = {
  /** Ce qui s'affiche dans la liste. */
  label: string;
  href: string;
  /** Nombre de résultats que donnerait ce choix. Évite d'aller voir pour rien. */
  compte?: number;
  selected?: boolean;
};

export function FiltreChip({
  label,
  actif = false,
  icon: Icon,
  options,
}: {
  label: string;
  actif?: boolean;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;
  options: OptionFiltre[];
}) {
  return (
    <details className="group shrink-0 open:w-full">
      <summary
        className={cn(
          "inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border px-3 py-2",
          "text-sm font-medium [&::-webkit-details-marker]:hidden",
          actif ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink",
        )}
      >
        {Icon ? <Icon size={15} strokeWidth={1.8} aria-hidden /> : null}
        {label}
        <ChevronDown
          size={14}
          strokeWidth={2.2}
          aria-hidden
          className="transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="mt-2 max-h-80 overflow-y-auto rounded-xl border border-line bg-surface p-1">
        {options.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            prefetch={false}
            className="flex h-11 items-center justify-between gap-3 rounded-lg px-3 text-base"
          >
            <span className={cn("truncate", o.selected && "font-semibold")}>{o.label}</span>
            <span className="flex shrink-0 items-center gap-2">
              {o.compte === undefined ? null : (
                <span className="text-sm text-ink-soft">{o.compte}</span>
              )}
              {o.selected ? <Check size={18} strokeWidth={2.2} className="text-accent" aria-hidden /> : null}
            </span>
          </Link>
        ))}
      </div>
    </details>
  );
}
