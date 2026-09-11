"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Bandeau « pas de connexion » — écran 4 de docs/ECRANS.md.
 *
 * ── Le premier composant client du projet, et pourquoi il l'est ─────────
 *
 * Savoir si le téléphone a du réseau est une information que seul le
 * navigateur possède : aucun rendu serveur ne peut la deviner. C'est donc
 * l'une des rares choses qui justifie du JavaScript côté client. Il pèse
 * quelques centaines d'octets et ne s'affiche presque jamais — mais quand
 * il s'affiche, il évite à quelqu'un de croire que l'application est
 * cassée alors que c'est le réseau qui est tombé.
 *
 * ── Ce qu'il ne fait pas ────────────────────────────────────────────────
 *
 * Il ne rend pas l'application consultable hors ligne : sans service
 * worker, une page non chargée reste inaccessible. Le vrai écran 4 — le
 * fil rempli des produits déjà consultés — arrivera avec ce service
 * worker, après le branchement de la base (docs/PERFORMANCE.md, règle R6).
 *
 * `navigator.onLine` ment dans un cas : il dit « en ligne » quand le
 * téléphone est connecté à un réseau qui ne mène nulle part. Il détecte
 * donc la coupure franche, pas le réseau poussif. C'est déjà l'essentiel.
 */
export function BandeauReseau({ demo = false }: { demo?: boolean }) {
  const [horsLigne, setHorsLigne] = useState(false);

  useEffect(() => {
    const relever = () => setHorsLigne(!navigator.onLine);
    relever();
    window.addEventListener("online", relever);
    window.addEventListener("offline", relever);
    return () => {
      window.removeEventListener("online", relever);
      window.removeEventListener("offline", relever);
    };
  }, []);

  if (!horsLigne && !demo) return null;

  return (
    <p
      role="status"
      className="flex items-center justify-center gap-2 bg-warn-soft px-4 py-2 text-xs font-semibold text-warn-ink"
    >
      <WifiOff size={15} strokeWidth={2} aria-hidden />
      Pas de connexion — vous voyez les produits déjà consultés.
    </p>
  );
}
