import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ChoiceRow } from "@/components/ui/ChoiceRow";
import { Textarea } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { signaler } from "@/lib/actions";
import { conversationReportReasons } from "@/lib/mock";
import { tousLesFils } from "@/lib/magasin";

/**
 * Signaler une conversation — l'écran que la maquette
 * (design/SignalerConversation.dc.html) prévoyait et que le code n'avait
 * jamais reçu.
 *
 * Les motifs ne sont PAS ceux d'un produit : on ne signale pas une
 * personne pour « photo trompeuse ». Reprendre la même liste aurait été
 * plus court à écrire et incompréhensible à lire.
 */
export default async function ReportThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const thread = tousLesFils().find((t) => t.id === id);
  if (!thread) notFound();

  return (
    <Sheet
      title="Signaler cette conversation"
      description="Votre signalement est envoyé à l'équipe Makiti. La personne n'est pas prévenue."
      closeHref={`/messages/${thread.id}`}
    >
      <form action={signaler} className="flex flex-col gap-3.5">
        <input type="hidden" name="retour" value={`/messages/${thread.id}`} />
        <div>
          {conversationReportReasons.map((motif) => (
            <ChoiceRow key={motif} name="motif" label={motif} requis />
          ))}
        </div>
        <Textarea
          name="precisions"
          rows={3}
          placeholder="Précisez si besoin (facultatif)…"
          aria-label="Précisions"
        />
        <Button type="submit">Envoyer le signalement</Button>
      </form>
    </Sheet>
  );
}
