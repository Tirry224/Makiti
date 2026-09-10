import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Feuille glissée depuis le bas, par-dessus l'écran courant.
 *
 * Sur téléphone, elle vaut mieux qu'une boîte de dialogue centrée : elle
 * arrive près du pouce et laisse voir l'écran d'où l'on vient, donc on ne
 * perd pas le fil.
 *
 * Chaque feuille est une VRAIE ADRESSE (`/produit/p-riz/signaler`) et non
 * un état caché dans la page. Trois avantages : le bouton « retour » du
 * téléphone la referme sans qu'on écrive une ligne, la feuille se partage
 * par lien, et l'écran existe sans qu'aucune action ne soit encore
 * branchée. Quand les actions arriveront, on pourra la superposer sans
 * rechargement — l'adresse restera la même.
 *
 * Le voile est un lien vers `closeHref` : taper à côté referme, comme le
 * fait n'importe quelle application.
 */
export function Sheet({
  title,
  description,
  children,
  closeHref,
  tone = "default",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  closeHref: string;
  tone?: "default" | "danger";
}) {
  return (
    <div className="fixed inset-0 flex flex-col justify-end">
      <Link href={closeHref} aria-label="Fermer" className="absolute inset-0 bg-overlay" />
      <div className="relative mx-auto w-full max-w-app rounded-t-2xl bg-surface px-4.5 pt-2.5 pb-5 shadow-sheet">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" aria-hidden />
        <h1 className={cn("text-xl font-bold", tone === "danger" && "text-danger")}>{title}</h1>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</p>
        ) : null}
        <div className="mt-4 flex flex-col gap-3.5">{children}</div>
      </div>
    </div>
  );
}
