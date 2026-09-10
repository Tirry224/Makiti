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
import { PAR_ECRAN, categories, featuredProduct, products } from "@/lib/mock";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Package } from "lucide-react";
import Link from "next/link";

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
  searchParams: Promise<{ ville?: string }>;
}) {
  const { ville = "Conakry" } = await searchParams;
  const visible = products
    .filter((p) => (p.status === "active" || p.status === "sold") && p.merchant.city === ville)
    .slice(0, PAR_ECRAN);
  const featuredHere = featuredProduct.merchant.city === ville ? featuredProduct : null;

  return (
    <Screen>
      <TopBar
        title={<Wordmark size="lg" />}
        right={<Chip icon={MapPin}>{ville}</Chip>}
      />

      <ScreenBody>
        <Section className="gap-3 pb-1">
          {/* Le champ n'est pas un champ : il ouvre l'écran de recherche.
              Un vrai champ ici obligerait à charger du JavaScript sur le
              premier écran de l'application pour ne rien saisir neuf fois
              sur dix. */}
          <Link href="/recherche" prefetch={false}>
            <FakeInput className="text-ink-soft">
              <Search size={19} strokeWidth={1.8} aria-hidden />
              Rechercher un produit
            </FakeInput>
          </Link>
          {/* `overflow-x-auto` : la rangée de catégories défile au doigt
              plutôt que de passer à la ligne et de manger l'écran. */}
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5">
            <Chip selected>Tout</Chip>
            {categories.map((c) => (
              <Link key={c.slug} href={`/recherche?categorie=${c.slug}`} prefetch={false}>
                <Chip>{c.court}</Chip>
              </Link>
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
        <Section className="gap-2 pt-2 pb-0">
          <SectionLabel>À la une</SectionLabel>
          <Link href={`/produit/${featuredHere?.id ?? featuredProduct.id}`} prefetch={false}>
            <Card className="flex">
              <Photo ratio="free" className="w-26 shrink-0" />
              <div className="flex flex-col justify-center gap-1 px-3 py-3">
                <h3 className="text-base font-semibold">{featuredProduct.title}</h3>
                <PriceTag amount={featuredProduct.priceGnf} size="md" />
                <p className="text-2xs text-ink-soft">
                  {featuredProduct.merchant.shopName} · {featuredProduct.merchant.city}
                </p>
                {featuredProduct.isNegotiable ? (
                  <Badge tone="accent" className="self-start">
                    Négociable
                  </Badge>
                ) : null}
              </div>
            </Card>
          </Link>
        </Section>

        <Section className="gap-2 pt-3.5">
          <div className="flex items-baseline justify-between">
            <SectionLabel>Récents</SectionLabel>
            <span className="text-sm font-semibold text-accent">Populaires</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {visible.map((p) => (
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
