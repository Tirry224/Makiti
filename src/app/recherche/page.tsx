import { Search, SlidersHorizontal, X } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { TopBar } from "@/components/ui/TopBar";
import { ProductCard } from "@/components/product/ProductCard";
import { featuredProduct, products } from "@/lib/mock";
import Link from "next/link";

/** Sans accents et sans majuscules : « telephone » doit trouver « Téléphone ». */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Recherche — écrans 5 et 6 de docs/ECRANS.md.
 *
 * La même règle qu'en base de données est appliquée ici : la recherche
 * porte sur le titre, la description et le nom de la boutique, et ignore
 * accents et majuscules. Ce code disparaîtra quand la page appellera la
 * fonction `search_products` de Supabase — mais le comportement, lui, ne
 * changera pas.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ville?: string }>;
}) {
  const { q = "", ville = "Conakry" } = await searchParams;
  const needle = normalize(q.trim());

  const results = [...products, featuredProduct].filter((p) => {
    if (p.status === "draft" || p.status === "hidden") return false;
    if (p.merchant.city !== ville) return false;
    if (!needle) return true;
    return [p.title, p.description ?? "", p.merchant.shopName].some((field) =>
      normalize(field).includes(needle),
    );
  });

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
