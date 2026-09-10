import { ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Field, FakeInput, Input, Textarea } from "@/components/ui/Field";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { TopBar } from "@/components/ui/TopBar";
import { merchantAissatou } from "@/lib/mock";

/** Écran 26 — modifier ma boutique. */
export default function EditShopPage() {
  return (
    <Screen>
      <TopBar
        title="Ma boutique"
        backHref="/vendeur"
        right={<span className="text-base font-semibold text-accent">Enregistrer</span>}
      />

      <ScreenBody>
        <Section className="gap-4">
          <div className="flex items-center gap-3.5">
            <Avatar name={merchantAissatou.shopName} kind="shop" size={64} />
            <button type="button" className="cursor-pointer text-base font-semibold text-accent">
              Changer le logo
            </button>
          </div>

          <Field label="Nom de la boutique" htmlFor="shop">
            <Input id="shop" defaultValue={merchantAissatou.shopName} />
          </Field>

          <Field label="Ville">
            <FakeInput trailing={<ChevronDown size={18} strokeWidth={2} className="text-ink-soft" />}>
              {merchantAissatou.city}
            </FakeInput>
          </Field>

          <Field label="Où vous trouver" htmlFor="address">
            <Input id="address" defaultValue={merchantAissatou.addressHint ?? ""} />
          </Field>

          <Field label="Numéro WhatsApp" htmlFor="whatsapp">
            <Input id="whatsapp" type="tel" inputMode="tel" defaultValue="622 33 44 55" />
          </Field>

          <Field label="Description" htmlFor="description">
            <Textarea id="description" rows={3} defaultValue={merchantAissatou.description ?? ""} />
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
    </Screen>
  );
}
