import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, FakeInput, Input, Textarea } from "@/components/ui/Field";
import { Screen, ScreenBody, ScreenFooter, Section } from "@/components/ui/Screen";
import { TopBar } from "@/components/ui/TopBar";

/**
 * Écran 13 — inscription du commerçant, étape 2.
 *
 * Ce sont ces informations que tu vérifieras à la main avant d'approuver
 * une boutique. Chaque champ existe donc pour une raison précise : le
 * repère sert au client à venir acheter, le numéro WhatsApp sert à te
 * permettre de vérifier que la boutique est réelle.
 */
export default function ShopSignupPage() {
  return (
    <Screen>
      <TopBar title="Ma boutique" backHref="/inscription" />

      <ScreenBody>
        <Section className="gap-4">
          <div className="flex items-center gap-2">
            <span className="h-1 flex-1 rounded-full bg-accent" />
            <span className="h-1 flex-1 rounded-full bg-accent" />
            <span className="text-xs font-semibold text-ink-soft">Étape 2 sur 2</span>
          </div>

          <p className="text-base leading-relaxed text-ink-soft">
            Ces informations seront vérifiées avant la mise en ligne de votre boutique.
          </p>

          <Field label="Nom de la boutique" htmlFor="shop">
            <Input id="shop" placeholder="Chez Aïssatou" />
          </Field>

          <Field label="Ville">
            <FakeInput trailing={<ChevronDown size={18} strokeWidth={2} className="text-ink-soft" />}>
              Conakry
            </FakeInput>
          </Field>

          <Field
            label="Où vous trouver"
            htmlFor="address"
            hint="Un repère que vos clients comprennent. C'est là que se fera la vente."
          >
            <Input id="address" placeholder="Marché de Madina, allée 3" />
          </Field>

          <Field
            label="Numéro WhatsApp"
            htmlFor="whatsapp"
            hint="Affiché sur vos produits, en plus de la messagerie."
          >
            <Input id="whatsapp" type="tel" inputMode="tel" placeholder="622 33 44 55" />
          </Field>

          <Field label="Que vendez-vous ?" htmlFor="description">
            <Textarea id="description" rows={3} placeholder="Parfums, mèches et produits de beauté…" />
          </Field>
        </Section>
      </ScreenBody>

      <ScreenFooter>
        <Button href="/vendeur/attente">Envoyer pour vérification</Button>
      </ScreenFooter>
    </Screen>
  );
}
