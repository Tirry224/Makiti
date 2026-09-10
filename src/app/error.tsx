"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen, ScreenBody } from "@/components/ui/Screen";
import { TopBar, Wordmark } from "@/components/ui/TopBar";

/**
 * Écran 4 — le chargement a échoué.
 *
 * `"use client"` est obligatoire ici : ce fichier doit tourner dans le
 * navigateur pour proposer un bouton « Réessayer » qui relance vraiment le
 * rendu. C'est le premier composant client de l'application, et il l'est
 * pour une raison précise, pas par confort.
 *
 * En Guinée, la connexion tombe. Une page blanche à ce moment-là est
 * comprise comme « l'application est cassée », pas comme « le réseau est
 * mauvais ». La différence entre les deux, c'est un utilisateur qui
 * revient ou pas.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <Screen>
      <TopBar title={<Wordmark />} />
      <div className="flex shrink-0 items-center gap-2.5 bg-warn-soft px-4 py-2.5 text-warn-ink">
        <WifiOff size={16} strokeWidth={2.2} aria-hidden />
        <span className="text-sm font-semibold">Pas de connexion</span>
      </div>
      <ScreenBody>
        <EmptyState
          icon={WifiOff}
          title="Impossible de charger les produits"
          description="Vérifiez votre connexion, puis réessayez."
        >
          <Button onClick={reset}>Réessayer</Button>
          <Button variant="secondary" href="/">
            Retour à l&apos;accueil
          </Button>
        </EmptyState>
      </ScreenBody>
    </Screen>
  );
}
