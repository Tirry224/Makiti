import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Photo } from "@/components/ui/Photo";
import { PriceTag } from "@/components/product/PriceTag";
import { Sheet } from "@/components/ui/Sheet";
import { createClient } from "@/lib/supabase/server";
import { getProduct } from "@/lib/data/products";
import { getMyProfile } from "@/lib/data/session";
import { findOrCreateConversation } from "@/lib/actions/messages";

/**
 * Écran 16 — compte requis.
 *
 * Le seul endroit de toute l'application où l'on demande un compte —
 * mais seulement à qui n'en a pas encore. Une connexion déjà cliente
 * n'a rien à créer : elle ouvre directement le fil avec cette boutique
 * (existant ou nouveau), le produit déjà cité pour son premier message.
 */
export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const product = await getProduct(supabase, id);
  if (!product) notFound();

  const clientProfile = await getMyProfile(supabase, "client");
  if (clientProfile) {
    const conversationId = await findOrCreateConversation(supabase, clientProfile.id, product.merchant.id);
    redirect(`/messages/${conversationId}?produit=${product.id}`);
  }

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
