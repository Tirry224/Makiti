import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ChoiceRow } from "@/components/ui/ChoiceRow";
import { Sheet } from "@/components/ui/Sheet";
import { Textarea } from "@/components/ui/Field";
import { findProduct, reportReasons } from "@/lib/mock";
import { signaler } from "@/lib/actions";

/** Écran 10 — signaler un produit. */
export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = findProduct(id);
  if (!product) notFound();

  return (
    <Sheet
      title="Signaler ce produit"
      description="Votre signalement est envoyé à l'équipe Makiti. Le vendeur n'est pas prévenu."
      closeHref={`/produit/${product.id}`}
    >
      <form action={signaler} className="flex flex-col gap-3.5">
        <input type="hidden" name="retour" value={`/produit/${product.id}`} />
        <div>
          {reportReasons.map((reason) => (
            <ChoiceRow key={reason} name="motif" label={reason} requis />
          ))}
        </div>
        <Textarea name="precisions" rows={3} placeholder="Précisez si besoin (facultatif)…" aria-label="Précisions" />
        <Button type="submit">Envoyer le signalement</Button>
      </form>
    </Sheet>
  );
}
