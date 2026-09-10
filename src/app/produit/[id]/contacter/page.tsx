import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Photo } from "@/components/ui/Photo";
import { PriceTag } from "@/components/product/PriceTag";
import { Sheet } from "@/components/ui/Sheet";
import { findProduct } from "@/lib/mock";

/**
 * Écran 16 — compte requis.
 *
 * Le seul endroit de toute l'application où l'on demande un compte. Il
 * arrive au moment où le client veut quelque chose, jamais avant — et il
 * rappelle le produit concerné, pour qu'on comprenne pourquoi on est
 * interrompu.
 */
export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = findProduct(id);
  if (!product) notFound();

  return (
    <Sheet
      title="Créez un compte pour écrire"
      description="Le vendeur a besoin de savoir qui le contacte. La création du compte prend moins d'une minute, et vous gardez l'accès à vos échanges."
      closeHref={`/produit/${product.id}`}
    >
      <Card className="flex items-center gap-2.5 p-2.5">
        <Photo ratio="free" className="size-11 shrink-0 rounded-md" iconSize={18} />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">{product.title}</span>
          <PriceTag amount={product.priceGnf} size="sm" />
        </div>
      </Card>
      <Button href="/inscription">Créer mon compte</Button>
      <Button variant="secondary" size="sm" href="/connexion">
        J&apos;ai déjà un compte
      </Button>
      <p className="text-center text-xs text-ink-soft">
        Ou appelez directement le vendeur sur WhatsApp.
      </p>
    </Sheet>
  );
}
