import { MapPin, Search } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { Chip } from "@/components/ui/Chip";
import { FakeInput } from "@/components/ui/Field";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TopBar, Wordmark } from "@/components/ui/TopBar";
import { ProductCard } from "@/components/product/ProductCard";
import { Card } from "@/components/ui/Card";
import { Photo } from "@/components/ui/Photo";
import { Badge } from "@/components/ui/Badge";
import { PriceTag } from "@/components/product/PriceTag";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Package } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getCities } from "@/lib/data/reference";
import { searchProducts } from "@/lib/data/products";

/**
 * Fil d'accueil — écrans 1 et 2 de docs/ECRANS.md.
 *
 * Le filtre de ville passe par l'URL (`/?ville=Boké`) et non par un état
 * caché dans la page. Conséquence : le fil filtré se partage par lien, le
 * bouton « retour » du téléphone défait le filtre, et l'écran vide est
 * atteignable pour de vrai — pas seulement en imagination. La catégorie
 * suit la même règle (`&categorie=...`).
 *
 * Un seul appel réseau : `inCity` (toute la ville, sans filtre de
 * catégorie) est déjà tout ce dont l'écran a besoin — la catégorie choisie
 * ne fait que filtrer ce résultat en mémoire, comme `src/lib/mock.ts` le
 * faisait avant. Le catalogue d'une ville reste de taille modeste (limite
 * dure de 50 dans `search_products`) : un deuxième aller-retour réseau
 * n'apporterait rien.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ ville?: string; categorie?: string }>;
}) {
  const { ville = "Conakry", categorie = "Tout" } = await searchParams;
  const supabase = await createClient();

  const [cities, categories] = await Promise.all([getCities(supabase), getCategories(supabase)]);
  const city = cities.find((c) => c.name === ville) ?? cities.find((c) => c.name === "Conakry");

  const inCity = city ? await searchProducts(supabase, { cityId: city.id, limit: 50 }) : [];
  const visible = categorie === "Tout" ? inCity : inCity.filter((p) => p.category === categorie);
  const featuredHere = visible.find((p) => p.isFeatured) ?? null;
  const gridItems = featuredHere ? visible.filter((p) => p.id !== featuredHere.id) : visible;

  return (
    <Screen>
      <TopBar
        title={<Wordmark size="lg" />}
        right={<Chip icon={MapPin}>{ville}</Chip>}
      />

      <ScreenBody>
        <Section className="gap-3 pb-1">
          <Link href="/recherche">
            <FakeInput className="text-ink-soft">
              <Search size={19} strokeWidth={1.8} aria-hidden />
              Rechercher un produit
            </FakeInput>
          </Link>
          {/* `overflow-x-auto` : la rangée de catégories défile au doigt
              plutôt que de passer à la ligne et de manger l'écran. */}
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5">
            <Link href={`/?ville=${encodeURIComponent(ville)}&categorie=Tout`}>
              <Chip selected={categorie === "Tout"}>Tout</Chip>
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/?ville=${encodeURIComponent(ville)}&categorie=${encodeURIComponent(c.name)}`}
              >
                <Chip selected={c.name === categorie}>{c.name}</Chip>
              </Link>
            ))}
          </div>
        </Section>

        {visible.length === 0 && categorie !== "Tout" && inCity.length > 0 ? (
          <EmptyState
            icon={Package}
            title={`Aucun produit « ${categorie} » à ${ville}`}
            description="Essayez une autre catégorie, ou regardez tout ce qui est en vente dans cette ville."
          >
            <Button href={`/?ville=${encodeURIComponent(ville)}`}>Voir toutes les catégories</Button>
          </EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Package}
            title={`Aucun produit à ${ville} pour le moment`}
            description="Makiti démarre à Conakry. Changez de ville pour voir ce qui est en vente, ou inscrivez-vous comme vendeur pour être le premier ici."
          >
            <Button href="/?ville=Conakry">Voir les produits à Conakry</Button>
            <Button variant="secondary" href="/inscription">
              Devenir vendeur à {ville}
            </Button>
          </EmptyState>
        ) : (
          <>
        {featuredHere ? (
          <Section className="gap-2 pt-2 pb-0">
            <SectionLabel>À la une</SectionLabel>
            <Link href={`/produit/${featuredHere.id}`}>
              <Card className="flex">
                <Photo ratio="free" className="w-26 shrink-0" />
                <div className="flex flex-col justify-center gap-1 px-3 py-3">
                  <h3 className="text-base font-semibold">{featuredHere.title}</h3>
                  <PriceTag amount={featuredHere.priceGnf} size="md" />
                  <p className="text-2xs text-ink-soft">
                    {featuredHere.merchant.shopName} · {featuredHere.merchant.city}
                  </p>
                  {featuredHere.isNegotiable ? (
                    <Badge tone="accent" className="self-start">
                      Négociable
                    </Badge>
                  ) : null}
                </div>
              </Card>
            </Link>
          </Section>
        ) : null}

        <Section className="gap-2 pt-3.5">
          <div className="flex items-baseline justify-between">
            <SectionLabel>Récents</SectionLabel>
            <span className="text-sm font-semibold text-accent">Populaires</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {gridItems.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Section>
          </>
        )}
      </ScreenBody>

      <BottomNav active="home" />
    </Screen>
  );
}
