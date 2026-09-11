import { cn } from "@/lib/cn";

/**
 * Forme grise affichée pendant le chargement.
 *
 * Elle reproduit la SILHOUETTE du contenu attendu, et pas un tourniquet
 * centré. Deux raisons : la page ne saute pas quand les données arrivent,
 * et l'attente paraît plus courte parce que l'utilisateur voit déjà où les
 * choses vont se placer.
 *
 * ATTENTION — ce composant ne sert plus de `loading.tsx`. Une frontière de
 * chargement fait envoyer le squelette d'abord et le contenu ensuite, et
 * c'est le JAVASCRIPT du navigateur qui remplace l'un par l'autre : sans
 * lui, la page reste un squelette pour toujours. Mesuré, pas supposé —
 * cinq écrans sur sept étaient dans ce cas. Voir docs/PERFORMANCE.md,
 * règle R7. Il reste utilisable dans une page, pour un bloc qu'on remplit
 * réellement plus tard.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-sm bg-line/70", className)} />;
}
