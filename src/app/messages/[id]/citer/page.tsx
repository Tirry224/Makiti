import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChoiceRow } from "@/components/ui/ChoiceRow";
import { FakeInput } from "@/components/ui/Field";
import { Photo } from "@/components/ui/Photo";
import { PriceTag } from "@/components/product/PriceTag";
import { Sheet } from "@/components/ui/Sheet";
import { myProducts, threads } from "@/lib/mock";

/**
 * Écran 31 — citer un produit dans un fil.
 *
 * C'est la pièce qui rend viable le choix « un seul fil par client » :
 * puisque le fil ne porte plus de produit, chaque message doit pouvoir
 * dire de quoi il parle. Sans cet écran, la décision ne tient pas.
 */
export default async function QuoteProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const thread = threads.find((t) => t.id === id);
  if (!thread) notFound();

  const choices = myProducts.filter((p) => p.status !== "draft");

  return (
    <Sheet
      title="De quel produit parlez-vous ?"
      description="Le produit sera affiché au-dessus de votre message. Le vendeur saura immédiatement de quoi il s'agit."
      closeHref={`/messages/${thread.id}`}
    >
      <FakeInput className="h-tap text-ink-soft">
        <Search size={17} strokeWidth={1.8} aria-hidden />
        Chercher dans cette boutique
      </FakeInput>

      <div>
        {choices.map((product, index) => (
          <ChoiceRow
            key={product.id}
            label={product.title}
            selected={index === 0}
            leading={<Photo ratio="free" className="size-11 shrink-0 rounded-md" iconSize={17} />}
            detail={
              product.status === "sold" ? (
                <Badge>Vendu</Badge>
              ) : (
                <PriceTag amount={product.priceGnf} size="sm" />
              )
            }
          />
        ))}
      </div>

      <Button>Joindre ce produit</Button>
    </Sheet>
  );
}
