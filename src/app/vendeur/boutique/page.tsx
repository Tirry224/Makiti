import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field, Input, MessageErreur, Select, Textarea } from "@/components/ui/Field";
import { Screen, ScreenBody, ScreenFooter, Section } from "@/components/ui/Screen";
import { TopBar } from "@/components/ui/TopBar";
import { modifierBoutique } from "@/lib/actions";
import { cities, merchantAissatou } from "@/lib/mock";

/** Écran 26 — modifier ma boutique. */
export default async function EditShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { erreur, boutique, ville, adresse, whatsapp, description } = await searchParams;

  return (
    <Screen>
      {/* « Enregistrer » a quitté la barre du haut pour devenir un vrai
          bouton d'envoi en pied d'écran. Un lien en haut à droite ne peut
          pas envoyer un formulaire sans JavaScript, et il était de toute
          façon hors de portée du pouce. */}
      <TopBar title="Ma boutique" backHref="/vendeur" />

      <form action={modifierBoutique} className="flex min-h-0 flex-1 flex-col">
      <ScreenBody>
        <Section className="gap-4">
          <MessageErreur code={erreur} />

          <div className="flex items-center gap-3.5">
            <Avatar name={merchantAissatou.shopName} kind="shop" size={64} />
            <button type="button" className="cursor-pointer text-base font-semibold text-accent">
              Changer le logo
            </button>
          </div>

          <Field label="Nom de la boutique" htmlFor="boutique">
            <Input id="boutique" name="boutique" required minLength={2} defaultValue={boutique ?? merchantAissatou.shopName} />
          </Field>

          <Field label="Ville" htmlFor="ville">
            <Select id="ville" name="ville" defaultValue={ville ?? merchantAissatou.city} required>
              {cities
                .filter((v) => v !== "Toutes les villes")
                .map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
            </Select>
          </Field>

          <Field label="Où vous trouver" htmlFor="adresse">
            <Input id="adresse" name="adresse" required minLength={4} defaultValue={adresse ?? merchantAissatou.addressHint ?? ""} />
          </Field>

          <Field label="Numéro WhatsApp" htmlFor="whatsapp">
            <Input id="whatsapp" name="whatsapp" type="tel" inputMode="tel" pattern="[\s.\-()+0-9]{9,20}" title="Un numéro guinéen à 9 chiffres, commençant par 6." defaultValue={whatsapp ?? "622 33 44 55"} />
          </Field>

          <Field label="Description" htmlFor="description">
            <Textarea id="description" name="description" rows={3} defaultValue={description ?? merchantAissatou.description ?? ""} />
          </Field>

          {/* Prévenir avant, pas après : un commerçant qui découvre sa
              boutique retirée du catalogue parce qu'il a corrigé une faute
              dans son nom ne comprend pas ce qui lui arrive. */}
          <p className="rounded-lg bg-warn-soft px-3.5 py-3 text-xs leading-normal text-warn-ink">
            Changer le nom ou la ville de votre boutique déclenche une nouvelle vérification.
            Vos produits restent en ligne pendant ce temps.
          </p>
        </Section>
      </ScreenBody>

      <ScreenFooter>
        <Button type="submit">Enregistrer</Button>
      </ScreenFooter>
      </form>
    </Screen>
  );
}
