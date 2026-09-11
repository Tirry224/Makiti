import { notFound } from "next/navigation";
import { Check, Clock, MapPin } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { BottomNav } from "@/components/ui/BottomNav";
import { Card } from "@/components/ui/Card";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TopBar } from "@/components/ui/TopBar";
import { ProductCard } from "@/components/product/ProductCard";
import { getShop } from "@/lib/data";

/** Boutique publique — écran 11 de docs/ECRANS.md. */
export default async function ShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  /* Une boutique en attente de validation n'est visible que par son
     propre commerçant : c'est le RLS qui le décide, pas cette page. Pour
     tous les autres, `getShop` renvoie `null` et on affiche « introuvable ». */
  const shop = await getShop(id);
  if (!shop) notFound();

  const { merchant, catalogue } = shop;

  return (
    <Screen>
      <TopBar title={merchant.shopName} backHref="/" />

      <ScreenBody>
        <Section className="gap-4">
          <div className="flex items-center gap-3.5">
            <Avatar name={merchant.shopName} kind="shop" size={64} />
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold">{merchant.shopName}</h2>
              {merchant.description ? (
                <p className="text-sm text-ink-soft">{merchant.description}</p>
              ) : null}
              {merchant.status === "approved" ? (
                <p className="flex items-center gap-1 text-xs font-semibold text-success">
                  <Check size={14} strokeWidth={2.6} aria-hidden />
                  Boutique vérifiée
                </p>
              ) : null}
            </div>
          </div>

          <Card className="flex flex-col gap-2 p-3.5">
            <p className="flex items-center gap-2.5 text-sm">
              <MapPin size={17} strokeWidth={1.8} className="shrink-0 text-ink-soft" aria-hidden />
              {merchant.addressHint ? `${merchant.addressHint} · ` : ""}
              {merchant.city}
            </p>
            <p className="flex items-center gap-2.5 text-sm">
              <Clock size={17} strokeWidth={1.8} className="shrink-0 text-ink-soft" aria-hidden />
              Répond en général dans la journée
            </p>
          </Card>

          <SectionLabel>
            {catalogue.length} produit{catalogue.length > 1 ? "s" : ""} en vente
          </SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {catalogue.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Section>
      </ScreenBody>

      <BottomNav active="search" />
    </Screen>
  );
}
