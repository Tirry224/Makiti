import { X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { TopBar, Wordmark } from "@/components/ui/TopBar";

/**
 * Écran 21 — boutique refusée.
 *
 * Un refus sans motif est un vendeur perdu définitivement. L'écran dit
 * POURQUOI, dit CE QU'IL FAUT FAIRE, et rassure sur ce qui est conservé.
 * Le motif viendra d'une colonne qui n'existe pas encore dans la base :
 * c'est l'un des trois manques relevés dans docs/ECRANS.md.
 */
export default function RejectedShopPage() {
  return (
    <Screen>
      <TopBar title={<Wordmark />} right={<Badge tone="danger">Refusée</Badge>} />

      <ScreenBody>
        <Section className="gap-5 py-6">
          <div className="flex size-14 items-center justify-center rounded-xl bg-danger-soft text-danger">
            <X size={28} strokeWidth={2.2} aria-hidden />
          </div>

          <div className="flex flex-col gap-2.5">
            <h1 className="text-2xl font-bold">Votre boutique n&apos;a pas été validée</h1>
            <p className="text-base leading-relaxed text-ink-soft">
              Le numéro de téléphone indiqué ne répond pas. Nous devons pouvoir vous joindre
              avant d&apos;ouvrir votre boutique aux clients.
            </p>
          </div>

          <Card padded className="flex flex-col gap-2">
            <span className="text-base font-bold">Ce que vous pouvez faire</span>
            <p className="text-sm leading-relaxed text-ink-soft">
              Vérifiez votre numéro, corrigez-le si nécessaire, puis renvoyez votre boutique.
              Vos produits en brouillon sont conservés.
            </p>
          </Card>

          <Button href="/vendeur/boutique">Corriger ma boutique</Button>
          <Button variant="secondary" size="sm">
            Nous écrire
          </Button>
        </Section>
      </ScreenBody>

      <BottomNav active="account" />
    </Screen>
  );
}
