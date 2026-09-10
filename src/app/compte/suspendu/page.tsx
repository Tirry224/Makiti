import { Flag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { TopBar, Wordmark } from "@/components/ui/TopBar";

/**
 * Écran 19 — compte suspendu.
 *
 * La suspension coupe l'écriture, pas la lecture : le catalogue reste
 * consultable. Couper tout d'un coup pousse la personne à créer un second
 * compte, ce qui annule la sanction.
 */
export default function SuspendedPage() {
  return (
    <Screen>
      <TopBar title={<Wordmark />} />
      <ScreenBody>
        <EmptyState
          icon={Flag}
          title="Votre compte est suspendu"
          description="Votre compte a été suspendu le 3 septembre à la suite de signalements. Vous pouvez encore consulter le catalogue, mais pas envoyer de messages."
        >
          <Button>Contester cette décision</Button>
          <Button variant="secondary" href="/">
            Voir les produits
          </Button>
        </EmptyState>
        <Section className="pt-0">
          <p className="rounded-lg bg-warn-soft px-3.5 py-3 text-sm leading-normal text-warn-ink">
            Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, écrivez-nous en expliquant la
            situation. Nous répondons sous 72 heures.
          </p>
        </Section>
      </ScreenBody>
    </Screen>
  );
}
