import { Button } from "@/components/ui/Button";
import { Field, Input, MessageErreur, Select, Textarea } from "@/components/ui/Field";
import { Screen, ScreenBody, ScreenFooter, Section } from "@/components/ui/Screen";
import { TopBar } from "@/components/ui/TopBar";
import { creerBoutique } from "@/lib/actions";
import { cities } from "@/lib/mock";

/**
 * Écran 13 — inscription du commerçant, étape 2.
 *
 * Ce sont ces informations que tu vérifieras à la main avant d'approuver
 * une boutique. Chaque champ existe donc pour une raison précise : le
 * repère sert au client à venir acheter, le numéro WhatsApp sert à te
 * permettre de vérifier que la boutique est réelle.
 */
export default async function ShopSignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { erreur, boutique, ville, adresse, whatsapp, description } = await searchParams;

  return (
    <Screen>
      <TopBar title="Ma boutique" backHref="/inscription" />

      <form action={creerBoutique} className="flex min-h-0 flex-1 flex-col">
      <ScreenBody>
        <Section className="gap-4">
          <MessageErreur code={erreur} />

          <div className="flex items-center gap-2">
            <span className="h-1 flex-1 rounded-full bg-accent" />
            <span className="h-1 flex-1 rounded-full bg-accent" />
            <span className="text-xs font-semibold text-ink-soft">Étape 2 sur 2</span>
          </div>

          <p className="text-base leading-relaxed text-ink-soft">
            Ces informations seront vérifiées avant la mise en ligne de votre boutique.
          </p>

          <Field label="Nom de la boutique" htmlFor="boutique">
            <Input id="boutique" name="boutique" required minLength={2} defaultValue={boutique} placeholder="Chez Aïssatou" />
          </Field>

          <Field label="Ville" htmlFor="ville">
            <Select id="ville" name="ville" defaultValue={ville ?? "Conakry"} required>
              {cities
                .filter((v) => v !== "Toutes les villes")
                .map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
            </Select>
          </Field>

          <Field
            label="Où vous trouver"
            htmlFor="adresse"
            hint="Un repère que vos clients comprennent. C'est là que se fera la vente."
          >
            <Input id="adresse" name="adresse" required minLength={4} defaultValue={adresse} placeholder="Marché de Madina, allée 3" />
          </Field>

          <Field
            label="Numéro WhatsApp"
            htmlFor="whatsapp"
            hint="Affiché sur vos produits, en plus de la messagerie."
          >
            <Input id="whatsapp" name="whatsapp" type="tel" inputMode="tel" pattern="[\s.\-()+0-9]{9,20}" title="Un numéro guinéen à 9 chiffres, commençant par 6." defaultValue={whatsapp} placeholder="622 33 44 55" />
          </Field>

          <Field label="Que vendez-vous ?" htmlFor="description">
            <Textarea id="description" name="description" rows={3} defaultValue={description} placeholder="Parfums, mèches et produits de beauté…" />
          </Field>
        </Section>
      </ScreenBody>

      <ScreenFooter>
        <Button type="submit">Envoyer pour vérification</Button>
      </ScreenFooter>
      </form>
    </Screen>
  );
}
