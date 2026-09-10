import { Search, SlidersHorizontal, X } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { Chip } from "@/components/ui/Chip";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { TopBar } from "@/components/ui/TopBar";
import { ProductCard } from "@/components/product/ProductCard";
import { products } from "@/lib/mock";

/** Recherche — écran 5 de docs/ECRANS.md. */
export default function SearchPage() {
  const results = products.filter((p) => p.status !== "draft");

  return (
    <Screen>
      <TopBar
        backHref="/"
        title={
          <div className="flex h-tap flex-1 items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5">
            <Search size={18} strokeWidth={1.8} className="shrink-0 text-ink-soft" aria-hidden />
            <span className="flex-1 truncate text-base font-medium">telephone</span>
            <X size={17} strokeWidth={2} className="shrink-0 text-ink-soft" aria-hidden />
          </div>
        }
      />

      <ScreenBody>
        <Section className="gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">
              <b className="text-ink">{results.length} produits</b> trouvés
            </p>
            <Chip selected icon={SlidersHorizontal}>
              Filtres · 2
            </Chip>
          </div>

          {/* Les filtres actifs restent visibles : un résultat vide sans
              filtre affiché est incompréhensible — on croit que le
              catalogue est vide alors qu'on a simplement trop filtré. */}
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5">
            <Chip selected>Conakry</Chip>
            <Chip selected>Récents</Chip>
            <Chip>Toutes catégories</Chip>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Section>
      </ScreenBody>

      <BottomNav active="search" />
    </Screen>
  );
}
