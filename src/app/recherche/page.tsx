import { Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { TopBar } from "@/components/ui/TopBar";
import { ProductCard } from "@/components/product/ProductCard";
import { searchCatalogue } from "@/lib/data";

/**
 * Recherche — écrans 5 et 6 de docs/ECRANS.md.
 *
 * La recherche elle-même est faite par la base, via `search_products` :
 * insensible aux accents et aux majuscules, elle porte sur le titre, la
 * description et le nom de la boutique. Refaire ce tri en JavaScript
 * obligerait à télécharger tout le catalogue pour en jeter la moitié — et
 * garantirait qu'un jour les deux règles divergent.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ville?: string }>;
}) {
  const { q = "", ville = "Conakry" } = await searchParams;

  const results = await searchCatalogue({ query: q, cityName: ville });

  return (
    <Screen>
      <TopBar
        backHref="/"
        title={
          <div className="flex h-tap flex-1 items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5">
            <Search size={18} strokeWidth={1.8} className="shrink-0 text-ink-soft" aria-hidden />
            <span className={q ? "flex-1 truncate text-base font-medium" : "flex-1 text-base text-ink-soft"}>
              {q || "Rechercher un produit"}
            </span>
            {q ? (
              <Link href="/recherche" aria-label="Effacer la recherche" className="shrink-0 text-ink-soft">
                <X size={17} strokeWidth={2} aria-hidden />
              </Link>
            ) : null}
          </div>
        }
      />

      <ScreenBody>
        <Section className="gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">
              <b className="text-ink">
                {results.length} produit{results.length > 1 ? "s" : ""}
              </b>{" "}
              trouvé{results.length > 1 ? "s" : ""}
            </p>
            <Chip selected icon={SlidersHorizontal}>
              Filtres · 2
            </Chip>
          </div>

          {/* Les filtres actifs restent visibles : un résultat vide sans
              filtre affiché est incompréhensible — on croit le catalogue
              vide alors qu'on a simplement trop filtré. */}
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5">
            <Chip selected>{ville}</Chip>
            <Chip selected>Récents</Chip>
            <Chip>Toutes catégories</Chip>
          </div>

          {results.length === 0 ? (
            <EmptyState
              icon={Search}
              title={q ? `Aucun résultat pour « ${q} »` : "Aucun produit ici"}
              description="Essayez un mot plus court, ou retirez le filtre de ville pour chercher dans toute la Guinée."
            >
              <Button href={`/recherche?q=${encodeURIComponent(q)}&ville=Conakry`}>
                Chercher à Conakry
              </Button>
              <Button variant="secondary" href="/recherche">
                Effacer les filtres
              </Button>
            </EmptyState>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </Section>
      </ScreenBody>

      <BottomNav active="search" />
    </Screen>
  );
}
