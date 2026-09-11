import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ChoiceRow } from "@/components/ui/ChoiceRow";
import { Photo } from "@/components/ui/Photo";
import { PriceTag } from "@/components/product/PriceTag";
import { Sheet } from "@/components/ui/Sheet";
import { createClient } from "@/lib/supabase/server";
import { getThreadContext, getCitableProducts } from "@/lib/data/messages";

/**
 * Écran 31 — citer un produit dans un fil.
 *
 * C'est la pièce qui rend viable le choix « un seul fil par client » :
 * puisque le fil ne porte plus de produit, chaque message doit pouvoir
 * dire de quoi il parle. Chaque ligne est un LIEN qui repose la citation
 * sur `/messages/{id}` (même principe que les feuilles de filtre de
 * recherche) : pas de bouton « valider » séparé, choisir EST valider.
 */
export default async function QuoteProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const context = await getThreadContext(supabase, id);
  if (!context) notFound();

  const products = await getCitableProducts(supabase, context.merchantId);

  return (
    <Sheet
      title="De quel produit parlez-vous ?"
      description="Le produit sera affiché au-dessus de votre message. Le vendeur saura immédiatement de quoi il s'agit."
      closeHref={`/messages/${id}`}
    >
      {products.length === 0 ? (
        <p className="text-sm text-ink-soft">Cette boutique n&apos;a aucun produit disponible pour l&apos;instant.</p>
      ) : (
        <div>
          {products.map((product) => (
            <Link key={product.id} href={`/messages/${id}?produit=${product.id}`}>
              <ChoiceRow
                label={product.title}
                leading={
                  <Photo src={product.imageUrl} ratio="free" className="size-11 shrink-0 rounded-md" iconSize={17} />
                }
                detail={
                  product.status === "sold" ? <Badge>Vendu</Badge> : <PriceTag amount={product.priceGnf} size="sm" />
                }
              />
            </Link>
          ))}
        </div>
      )}
    </Sheet>
  );
}
