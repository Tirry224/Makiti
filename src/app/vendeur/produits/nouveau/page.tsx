import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, MessageErreur, Select, Textarea } from "@/components/ui/Field";
import { Photo } from "@/components/ui/Photo";
import { Screen, ScreenBody, ScreenFooter, Section } from "@/components/ui/Screen";
import { Toggle } from "@/components/ui/Toggle";
import { TopBar } from "@/components/ui/TopBar";
import { publierProduit } from "@/lib/actions";
import { categories } from "@/lib/mock";

/**
 * Écran 24 — ajouter un produit.
 *
 * Les trois emplacements de photo ne sont pas décoratifs : ils rendent
 * visible une règle de la base de données (1 minimum, 3 maximum) au lieu
 * de la laisser sortir sous forme de message d'erreur après coup. Une
 * contrainte qu'on voit avant d'agir vaut mieux qu'une contrainte qu'on
 * découvre en la heurtant.
 */
export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { erreur, titre, categorie, prix, description, negociable } = await searchParams;
  const choisie = categories.find((c) => c.slug === categorie);

  return (
    <Screen>
      <TopBar
        title="Nouveau produit"
        backHref="/vendeur"
        right={<span className="text-xs text-ink-soft">Brouillon enregistré</span>}
      />

      {/* Le formulaire enveloppe le corps ET le pied : les deux boutons
          du bas doivent envoyer les champs du haut. Un `<form>` qui
          s'arrête avant le pied donne deux boutons qui n'envoient rien. */}
      <form action={publierProduit} className="flex min-h-0 flex-1 flex-col">
      <ScreenBody>
        <Section className="gap-4">
          <MessageErreur code={erreur} />

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

          <Field label="Titre" htmlFor="titre">
            <Input id="titre" name="titre" defaultValue={titre} required minLength={5} placeholder="Parfum Oud Intense 100 ml" />
          </Field>

          {/* L'aide sous le sélecteur : le commerçant reconnaît son produit
              dans la liste d'exemples au lieu de deviner ce que « Accessoires
              téléphone » recouvre. En dur pour l'instant, comme le reste de la
              maquette ; elle viendra de la base au branchement Supabase. */}
          <Field
            label="Catégorie"
            htmlFor="categorie"
            hint={choisie ? undefined : "Huit catégories, un seul niveau : votre produit est forcément dans l'une d'elles."}
          >
            <Select id="categorie" name="categorie" defaultValue={categorie ?? ""} required>
              <option value="" disabled>
                Choisir une catégorie
              </option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nom}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Prix" htmlFor="prix">
            <Input
              id="prix"
              name="prix"
              inputMode="numeric"
              defaultValue={prix}
              required
              pattern="[\s.0-9]{1,15}"
              title="Un montant en francs guinéens, chiffres seulement."
              placeholder="450 000"
              className="pr-14"
            />
          </Field>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-semibold">Prix négociable</span>
              <span className="text-xs text-ink-soft">Le client sait qu&apos;il peut discuter.</span>
            </div>
            <Toggle name="negociable" defaultChecked={negociable !== ""} label="Prix négociable" />
          </div>

          <Field label="Description" htmlFor="description">
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={description}
              placeholder="Eau de parfum boisée, flacon scellé 100 ml. Retrait au marché de Madina…"
            />
          </Field>
        </Section>
      </ScreenBody>

      <ScreenFooter className="flex flex-col gap-2.5">
        <Button type="submit">Publier le produit</Button>
        {/* Même formulaire, autre bouton : `name="brouillon"` dit à
            l'action lequel des deux a été utilisé. Un brouillon n'exige
            que le titre — il sert justement à s'arrêter en route.
            `formNoValidate` désactive les contrôles du navigateur POUR CE
            BOUTON : sans lui, « required » sur le prix empêcherait
            d'enregistrer un brouillon, c'est-à-dire exactement ce que le
            brouillon existe pour permettre. */}
        <Button type="submit" name="brouillon" value="1" formNoValidate variant="secondary" size="sm">
          Garder en brouillon
        </Button>
      </ScreenFooter>
      </form>
    </Screen>
  );
}
