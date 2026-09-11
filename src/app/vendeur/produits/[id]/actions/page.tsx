import { notFound } from "next/navigation";
import { Check, EyeOff, Pencil, Trash2 } from "lucide-react";
import { ActionRow } from "@/components/ui/ActionRow";
import { Sheet } from "@/components/ui/Sheet";
import { trouverProduit } from "@/lib/magasin";
import { changerEtatProduit } from "@/lib/actions";

/**
 * Écran 25 — actions sur un produit.
 *
 * Chaque action dit sa CONSÉQUENCE. « Masquer » et « Supprimer » se
 * ressemblent dans une liste ; ce qu'ils font aux données, non. Écrire la
 * conséquence sous l'intitulé coûte une ligne et évite des suppressions
 * regrettées.
 */
export default async function ProductActionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = trouverProduit(id);
  if (!product) notFound();

  return (
    <Sheet title={product.title} closeHref="/vendeur">
      {/* Un seul formulaire pour les trois actions qui agissent : c'est le
          bouton utilisé qui dit laquelle, par son `name`/`value`. Trois
          formulaires auraient demandé trois fois le même champ caché. */}
      <form action={changerEtatProduit}>
        <input type="hidden" name="id" value={product.id} />
        <ActionRow
          icon={Check}
          label="Marquer comme vendu"
          description="Le produit reste visible, barré, avec la mention « Vendu »."
          name="action"
          value="vendu"
        />
        <ActionRow
          icon={Pencil}
          label="Modifier le produit"
          description="Titre, prix, photos, description."
          href="/vendeur/produits/nouveau"
        />
        <ActionRow
          icon={EyeOff}
          label="Masquer du catalogue"
          description="Personne ne le voit plus, vous le republiez quand vous voulez."
          name="action"
          value="masquer"
        />
        <ActionRow
          icon={Trash2}
          label="Supprimer définitivement"
          description="Vos conversations à son sujet sont conservées."
          tone="danger"
          name="action"
          value="supprimer"
        />
      </form>
    </Sheet>
  );
}
