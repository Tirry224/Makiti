import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ChoiceRow } from "@/components/ui/ChoiceRow";
import { Sheet } from "@/components/ui/Sheet";
import { Textarea } from "@/components/ui/Field";
import { reportReasons } from "@/lib/mock";
import { createClient } from "@/lib/supabase/server";
import { getProduct } from "@/lib/data/products";

/** Écran 10 — signaler un produit. */
export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const product = await getProduct(supabase, id);
  if (!product) notFound();

  return (
    <Sheet
      title="Signaler ce produit"
      description="Votre signalement est envoyé à l'équipe Makiti. Le vendeur n'est pas prévenu."
      closeHref={`/produit/${product.id}`}
    >
      <div>
        {reportReasons.map((reason) => (
          <ChoiceRow key={reason} label={reason} selected={reason === "Photo trompeuse"} />
        ))}
      </div>
      <Textarea rows={3} placeholder="Précisez si besoin (facultatif)…" aria-label="Précisions" />
      <Button>Envoyer le signalement</Button>
    </Sheet>
  );
}
