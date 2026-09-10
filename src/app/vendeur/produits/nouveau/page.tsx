import { ChevronDown, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, FakeInput, Input, Textarea } from "@/components/ui/Field";
import { Photo } from "@/components/ui/Photo";
import { Screen, ScreenBody, ScreenFooter, Section } from "@/components/ui/Screen";
import { Toggle } from "@/components/ui/Toggle";
import { TopBar } from "@/components/ui/TopBar";

/**
 * Écran 24 — ajouter un produit.
 *
 * Les trois emplacements de photo ne sont pas décoratifs : ils rendent
 * visible une règle de la base de données (1 minimum, 3 maximum) au lieu
 * de la laisser sortir sous forme de message d'erreur après coup. Une
 * contrainte qu'on voit avant d'agir vaut mieux qu'une contrainte qu'on
 * découvre en la heurtant.
 */
export default function NewProductPage() {
  return (
    <Screen>
      <TopBar
        title="Nouveau produit"
        backHref="/vendeur"
        right={<span className="text-xs text-ink-soft">Brouillon enregistré</span>}
      />

      <ScreenBody>
        <Section className="gap-4">
          <Field label="Photos" hint="1 photo minimum, 3 maximum. Sans photo, un produit ne se vend pas.">
            <div className="flex gap-3">
              <div className="relative">
                <Photo ratio="free" className="size-25 rounded-lg" iconSize={24} />
                <button
                  type="button"
                  aria-label="Retirer la photo"
                  className="absolute -top-1.5 -right-1.5 flex size-6 cursor-pointer items-center justify-center rounded-full bg-ink text-paper"
                >
                  <X size={13} strokeWidth={2.6} aria-hidden />
                </button>
              </div>
              {[0, 1].map((i) => (
                <button
                  key={i}
                  type="button"
                  aria-label="Ajouter une photo"
                  className="flex size-25 cursor-pointer items-center justify-center rounded-lg border border-dashed border-line text-ink-soft"
                >
                  <Plus size={24} strokeWidth={2} aria-hidden />
                </button>
              ))}
            </div>
          </Field>

          <Field label="Titre" htmlFor="title">
            <Input id="title" placeholder="Sac de riz importé 50 kg" />
          </Field>

          <Field label="Catégorie">
            <FakeInput trailing={<ChevronDown size={18} strokeWidth={2} className="text-ink-soft" />}>
              Alimentation &amp; Boissons
            </FakeInput>
          </Field>

          <Field label="Prix" htmlFor="price">
            <Input
              id="price"
              inputMode="numeric"
              placeholder="450 000"
              className="pr-14"
            />
          </Field>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-semibold">Prix négociable</span>
              <span className="text-xs text-ink-soft">Le client sait qu&apos;il peut discuter.</span>
            </div>
            <Toggle checked label="Prix négociable" />
          </div>

          <Field label="Description" htmlFor="description">
            <Textarea
              id="description"
              rows={4}
              placeholder="Riz parfumé importé, sac de 50 kg. Retrait au marché de Madina…"
            />
          </Field>
        </Section>
      </ScreenBody>

      <ScreenFooter className="flex flex-col gap-2.5">
        <Button>Publier le produit</Button>
        <Button variant="secondary" size="sm">
          Garder en brouillon
        </Button>
      </ScreenFooter>
    </Screen>
  );
}
