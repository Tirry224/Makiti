import { cn } from "@/lib/cn";

/**
 * Forme grise affichée pendant le chargement.
 *
 * Elle reproduit la SILHOUETTE du contenu attendu, et pas un tourniquet
 * centré. Deux raisons : la page ne saute pas quand les données arrivent,
 * et l'attente paraît plus courte parce que l'utilisateur voit déjà où les
 * choses vont se placer.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-sm bg-line/70", className)} />;
}
