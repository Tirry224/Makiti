import { MapPin, Package, Search } from "lucide-react";
import Link from "next/link";
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
import { getCategories, searchCatalogue } from "@/lib/data";

/**
 * Fil d'accueil — écrans 1 et 2 de docs/ECRANS.md.
 *
 * Le filtre de ville passe par l'URL (`/?ville=Boké`) et non par un état
 * caché dans la page. Conséquence : le fil filtré se partage par lien, le
 * bouton « retour » du téléphone défait le filtre, et l'écran vide est
 * atteignable pour de vrai — pas seulement en imagination.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ ville?: string; categorie?: string }>;
}) {
  const { ville = "Conakry", categorie } = await searchParams;

  /* Les deux requêtes ne dépendent pas l'une de l'autre : les enchaîner
     ferait attendre au visiteur la somme des deux allers-retours au lieu
     du plus long des deux. */
  const [categories, visible] = await Promise.all([
    getCategories(),
    searchCatalogue({ cityName: ville, categorySlug: categorie }),
  ]);

  /* `search_products` remonte déjà les produits « à la une » en tête. On
     prend le premier pour la bannière, le reste va dans la grille — aucun
     produit n'est affiché deux fois. */
  const featured = visible.find((p) => p.isFeatured) ?? null;
  const rest = featured ? visible.filter((p) => p.id !== featured.id) : visible;

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
            <Chip href={`/?ville=${encodeURIComponent(ville)}`} selected={!categorie}>
              Tout
            </Chip>
            {categories.map((c) => (
              <Chip
                key={c.id}
                href={`/?ville=${encodeURIComponent(ville)}&categorie=${c.slug}`}
                selected={c.slug === categorie}
              >
                {/* « Alimentation & Boissons » est le libellé officiel de la
                    base ; sur une puce de 8 mm de haut, il pousse toutes les
                    autres catégories hors de l'écran. On garde ce qui
                    précède le « & », qui suffit à reconnaître le rayon. */}
                {c.name.split(" & ")[0]}
              </Chip>
            ))}
          </div>
        </Section>

        {visible.length === 0 ? (
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
            {featured ? (
              <Section className="gap-2 pt-2 pb-0">
                <SectionLabel>À la une</SectionLabel>
                <Link href={`/produit/${featured.id}`}>
                  <Card className="flex">
                    <Photo
                      ratio="free"
                      className="w-26 shrink-0"
                      src={featured.imageUrls[0]}
                      alt={featured.title}
                    />
                    <div className="flex flex-col justify-center gap-1 px-3 py-3">
                      <h3 className="text-base font-semibold">{featured.title}</h3>
                      <PriceTag amount={featured.priceGnf} size="md" />
                      <p className="text-2xs text-ink-soft">
                        {featured.merchant.shopName} · {featured.merchant.city}
                      </p>
                      {featured.isNegotiable ? (
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
                {rest.map((p) => (
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
