import { notFound } from "next/navigation";
import { Ban, Flag, User } from "lucide-react";
import { ActionRow } from "@/components/ui/ActionRow";
import { Sheet } from "@/components/ui/Sheet";
import { threads } from "@/lib/mock";
import { bloquer } from "@/lib/actions";

/**
 * Écran 32 — actions sur une conversation.
 *
 * « Bloquer cette personne » n'est encore porté par AUCUNE table de la
 * base : c'est l'un des trois manques relevés dans docs/ECRANS.md quand
 * l'inventaire des écrans a été fait. L'écran existe, la donnée non — il
 * faudra trancher avant de brancher les actions.
 */
export default async function ThreadActionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const thread = threads.find((t) => t.id === id);
  if (!thread) notFound();

  return (
    <Sheet title={thread.peerName} closeHref={`/messages/${thread.id}`}>
      <form action={bloquer}>
        <input type="hidden" name="fil" value={thread.id} />
        {/* Sans fiche publique pour une PERSONNE — seules les boutiques en
            ont une — cette ligne reste inerte. Mieux vaut une ligne qui
            n'agit pas qu'un lien vers une page qui n'existe pas. */}
        <ActionRow
          icon={User}
          label="Voir sa fiche"
          description="Ville, date d'inscription, produits concernés."
        />
        <ActionRow
          icon={Flag}
          label="Signaler cette conversation"
          description="Insultes, arnaque, spam. Notre équipe la lira."
          tone="danger"
          href={`/messages/${thread.id}/signaler`}
        />
        <ActionRow
          icon={Ban}
          label="Bloquer cette personne"
          description="Elle ne pourra plus vous écrire. Le fil reste consultable."
          tone="danger"
          name="action"
          value="bloquer"
        />
      </form>
    </Sheet>
  );
}
