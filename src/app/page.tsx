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
import { categories, featuredProduct, products } from "@/lib/mock";
import Link from "next/link";

/** Fil d'accueil — écran 1 de docs/ECRANS.md. */
export default function HomePage() {
  const visible = products.filter((p) => p.status === "active" || p.status === "sold");

  return (
    <Screen>
      <TopBar
        title={<Wordmark size="lg" />}
        right={
          <Chip icon={MapPin}>
            Conakry
          </Chip>
        }
      />

      <ScreenBody>
        <Section className="gap-3 pb-1">
          <FakeInput className="text-ink-soft">
            <Search size={19} strokeWidth={1.8} aria-hidden />
            Rechercher un produit
          </FakeInput>
          {/* `overflow-x-auto` : la rangée de catégories défile au doigt
              plutôt que de passer à la ligne et de manger l'écran. */}
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5">
            {categories.map((c) => (
              <Chip key={c} selected={c === "Tout"}>
                {c}
              </Chip>
            ))}
          </div>
        </Section>

        <Section className="gap-2 pt-2 pb-0">
          <SectionLabel>À la une</SectionLabel>
          <Link href={`/produit/${featuredProduct.id}`}>
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
      </ScreenBody>

      <BottomNav active="home" />
    </Screen>
  );
}
