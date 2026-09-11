import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Ligne d'un choix unique : motif de signalement, ville, produit à citer.
 *
 * La sélection est marquée par une pastille ET par la graisse du texte :
 * deux signaux plutôt qu'un, pour que l'information ne repose pas
 * uniquement sur la couleur.
 *
 * Avec un `name`, la ligne devient un VRAI bouton radio : le `<label>`
 * enveloppe tout, donc taper n'importe où sur la ligne coche le choix, et
 * le formulaire l'envoie sans une ligne de JavaScript. La pastille
 * dessinée réagit par `peer-checked`, l'input natif restant invisible mais
 * bien présent — c'est lui que le clavier et les lecteurs d'écran
 * utilisent. Sans `name`, la ligne reste un simple affichage.
 */
export function ChoiceRow({
  label,
  detail,
  selected = false,
  leading,
  className,
  name,
  value,
  requis = false,
}: {
  label: string;
  detail?: React.ReactNode;
  selected?: boolean;
  leading?: React.ReactNode;
  className?: string;
  name?: string;
  value?: string;
  /** Oblige à choisir une option du groupe avant d'envoyer le formulaire. */
  requis?: boolean;
}) {
  const Ligne = name ? "label" : "div";

  return (
    <Ligne
      className={cn(
        "flex min-h-tap items-center gap-3 border-b border-line py-2.5 last:border-b-0",
        name && "cursor-pointer",
        className,
      )}
    >
      {name ? (
        <input
          type="radio"
          name={name}
          value={value ?? label}
          defaultChecked={selected}
          required={requis}
          className="peer sr-only"
        />
      ) : null}
      {leading}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "text-base",
            selected ? "font-semibold" : "font-normal",
            name && "peer-checked:font-semibold",
          )}
        >
          {label}
        </span>
        {detail}
      </div>
      <span
        aria-hidden
        className={cn(
          "flex size-5.5 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-accent bg-accent text-on-accent" : "border-line",
          name && "peer-checked:border-accent peer-checked:bg-accent peer-checked:text-on-accent",
        )}
      >
        <Check size={13} strokeWidth={3} className={cn(!selected && "invisible", name && "peer-checked:visible")} />
      </span>
    </Ligne>
  );
}
