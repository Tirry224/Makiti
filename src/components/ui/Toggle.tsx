import { cn } from "@/lib/cn";

/**
 * Interrupteur.
 *
 * C'est une VRAIE case à cocher, cachée sous un dessin. Un `<button>` avec
 * `role="switch"` aurait exigé du JavaScript pour changer d'état et pour
 * être envoyé avec le formulaire ; la case native fait les deux toute
 * seule, se coche au clavier, s'annonce correctement à la voix, et pèse
 * zéro octet (docs/PERFORMANCE.md, règle R3).
 *
 * `sr-only` la rend invisible sans la retirer de la page — la retirer avec
 * `display:none` la sortirait aussi du formulaire et du clavier.
 */
export function Toggle({
  name,
  defaultChecked = false,
  label,
  className,
}: {
  name: string;
  defaultChecked?: boolean;
  label: string;
  className?: string;
}) {
  return (
    <label className={cn("relative inline-flex shrink-0 cursor-pointer", className)}>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        aria-label={label}
        className="peer sr-only"
      />
      {/* Tout est porté par ce span, VOISIN de la case : `peer-checked`
          ne descend pas dans les enfants, il ne vise que les frères. La
          pastille se déplace donc par `justify-end`, pas par une
          translation de l'enfant. */}
      <span
        aria-hidden
        className={cn(
          "flex h-7 w-12 items-center justify-start rounded-full bg-line p-0.5 transition-colors",
          "peer-checked:justify-end peer-checked:bg-accent",
        )}
      >
        <span className="size-6 rounded-full bg-surface" />
      </span>
    </label>
  );
}
