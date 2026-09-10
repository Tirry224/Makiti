import { cn } from "@/lib/cn";

/**
 * Feuille glissée depuis le bas, par-dessus l'écran courant.
 *
 * Sur téléphone, elle vaut mieux qu'une boîte de dialogue centrée : elle
 * arrive près du pouce, et elle laisse voir l'écran d'où l'on vient, donc
 * on ne perd pas le fil.
 *
 * Ici purement visuel : l'ouverture, la fermeture et le piège au clavier
 * viendront avec les actions.
 */
export function Sheet({
  title,
  description,
  children,
  tone = "default",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <div className="fixed inset-0 z-10 flex flex-col justify-end">
      <div className="absolute inset-0 bg-overlay" aria-hidden />
      <div className="relative mx-auto w-full max-w-app rounded-t-2xl bg-surface px-4.5 pt-2.5 pb-5 shadow-sheet">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" aria-hidden />
        <h2 className={cn("text-xl font-bold", tone === "danger" && "text-danger")}>{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</p>
        ) : null}
        <div className="mt-4 flex flex-col gap-3.5">{children}</div>
      </div>
    </div>
  );
}
