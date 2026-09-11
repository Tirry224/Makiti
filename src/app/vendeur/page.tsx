import { redirect } from "next/navigation";
import Link from "next/link";
import { Check, MessageCircle, Plus, User } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen, ScreenBody, ScreenFooter, Section } from "@/components/ui/Screen";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TopBar } from "@/components/ui/TopBar";
import { ProductRow } from "@/components/product/ProductRow";
import { createClient } from "@/lib/supabase/server";
import { getMyMerchant, getMerchantProducts } from "@/lib/data/merchants";

/**
 * Mes produits — écrans 22 et 23 de docs/ECRANS.md.
 *
 * Cette page ne se contente pas d'afficher : elle aiguille. Une boutique
 * sans compte va s'inscrire, une boutique en attente ou refusée va voir
 * l'écran qui explique pourquoi — voir `/vendeur/attente` et
 * `/vendeur/refusee`. Seule une boutique approuvée voit son catalogue.
 */
export default async function SellerPage() {
  const supabase = await createClient();
  const merchant = await getMyMerchant(supabase);
  if (!merchant) redirect("/inscription/boutique");
  if (merchant.status === "pending") redirect("/vendeur/attente");
  if (merchant.status === "rejected") redirect("/vendeur/refusee");

  const catalogue = await getMerchantProducts(supabase, merchant);
  const published = catalogue.filter((p) => p.status === "active").length;

  return (
    <Screen>
      <TopBar
        title={
          <div className="flex flex-col gap-0.5">
            <span className="font-display text-lg font-bold">{merchant.shopName}</span>
            <span className="flex items-center gap-1 text-2xs font-semibold text-success">
              <Check size={13} strokeWidth={2.8} aria-hidden />
              Boutique validée
            </span>
          </div>
        }
        right={
          <Link href="/vendeur/boutique" aria-label="Modifier ma boutique">
            <User size={20} strokeWidth={1.8} className="text-ink-soft" />
          </Link>
        }
      />

      <ScreenBody>
        {catalogue.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="Votre boutique est vide"
            description="Un premier produit avec une photo nette et un prix clair suffit pour recevoir vos premiers messages."
          >
            <Button href="/vendeur/produits/nouveau">Ajouter mon premier produit</Button>
          </EmptyState>
        ) : (
          <Section className="gap-3.5">
            {/* Deux chiffres, pas six. Le second est le seul qui fera
                revenir un commerçant chaque matin — mais le compteur de
                non-lus n'existe pas encore (étape 3 de docs/REPRISE.md) :
                un lien honnête vaut mieux qu'un chiffre inventé. */}
            <div className="flex gap-3">
              <Card className="flex flex-1 flex-col gap-0.5 p-3.5">
                <span className="font-display text-2xl font-bold">{published}</span>
                <span className="text-xs text-ink-soft">produits publiés</span>
              </Card>
              <Link href="/messages" className="flex-1">
                <Card className="flex h-full flex-col items-start justify-center gap-1 border-accent bg-accent-soft p-3.5">
                  <MessageCircle size={20} strokeWidth={1.9} className="text-accent-hover" aria-hidden />
                  <span className="text-xs font-medium text-accent-hover">Mes messages</span>
                </Card>
              </Link>
            </div>

            <SectionLabel>Mes produits</SectionLabel>
            <div className="flex flex-col gap-2.5">
              {catalogue.map((p) => (
                <Link key={p.id} href={`/vendeur/produits/${p.id}/actions`}>
                  <ProductRow product={p} />
                </Link>
              ))}
            </div>
          </Section>
        )}
      </ScreenBody>

      {catalogue.length > 0 ? (
        <ScreenFooter>
          <Button icon={Plus} href="/vendeur/produits/nouveau">
            Ajouter un produit
          </Button>
        </ScreenFooter>
      ) : null}

      <BottomNav active="account" accountHref="/vendeur/boutique" />
    </Screen>
  );
}
