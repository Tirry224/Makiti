import { Flag, Plus, SendHorizontal, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Photo } from "@/components/ui/Photo";
import { Screen, ScreenBody, ScreenFooter } from "@/components/ui/Screen";
import { TopBar } from "@/components/ui/TopBar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ProductRef } from "@/components/chat/ProductRef";
import { conversationDuFil, tousLesFils, trouverProduit } from "@/lib/magasin";
import { envoyerMessage } from "@/lib/actions";
import Link from "next/link";
import { notFound } from "next/navigation";

/** Fil de discussion — écran 30 de docs/ECRANS.md. */
export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const { produit } = await searchParams;
  const cite = produit ? trouverProduit(produit) : undefined;
  const thread = tousLesFils().find((t) => t.id === id);
  if (!thread) notFound();

  return (
    <Screen>
      <TopBar
        backHref="/messages"
        title={
          <div className="flex items-center gap-3">
            <Avatar name={thread.peerName} kind={thread.peerKind} size={38} />
            <span className="flex flex-col">
              <span className="text-base font-semibold">{thread.peerName}</span>
              <span className="text-2xs text-ink-soft">Cliente · Ratoma</span>
            </span>
          </div>
        }
        right={
          <Link href={`/messages/${thread.id}/actions`} aria-label="Actions">
            <Flag size={19} strokeWidth={1.8} className="text-ink-soft" aria-hidden />
          </Link>
        }
      />

      {/* `justify-end` colle la conversation au bas de l'écran quand elle
          est courte : sinon les premiers messages flottent en haut, loin
          du champ de saisie, et l'écran paraît vide. */}
      <ScreenBody className="justify-end">
        <div className="flex flex-col gap-2.5 p-4">
          {conversationDuFil().map((message) => (
            <div key={message.id} className="contents">
              {message.product ? <ProductRef product={message.product} /> : null}
              <MessageBubble message={message} />
            </div>
          ))}
        </div>
      </ScreenBody>

      {/* Un formulaire, donc la touche « Envoyer » du clavier du téléphone
          fonctionne, et le message part même si le JavaScript n'est pas
          chargé. Le fil voyage en champ caché : l'action ne devine rien. */}
      <ScreenFooter className="flex flex-col gap-2.5">
        {/* Le produit choisi à l'écran 31 attend au-dessus du champ : il
            part avec le message, et on voit de quoi on parle avant
            d'écrire. */}
        {cite ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-line bg-paper p-2">
            <Photo ratio="free" className="size-9 shrink-0 rounded-sm" iconSize={15} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{cite.title}</span>
            <Link href={`/messages/${thread.id}`} aria-label="Retirer le produit" className="shrink-0 text-ink-soft">
              <X size={16} strokeWidth={2.2} aria-hidden />
            </Link>
          </div>
        ) : null}

        <form action={envoyerMessage} className="flex items-center gap-2.5">
          <input type="hidden" name="fil" value={thread.id} />
          {cite ? <input type="hidden" name="produit" value={cite.id} /> : null}
          <Link
            href={`/messages/${thread.id}/citer`}
            prefetch={false}
            aria-label="Joindre un produit"
            className="flex size-tap shrink-0 items-center justify-center rounded-full border border-line text-ink-soft"
          >
            <Plus size={21} strokeWidth={2} aria-hidden />
          </Link>
          <input
            name="message"
            className="h-tap min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-base"
            placeholder="Écrire un message…"
            aria-label="Votre message"
            autoComplete="off"
            required
          />
          <button
            type="submit"
            aria-label="Envoyer"
            className="flex size-tap shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent text-on-accent"
          >
            <SendHorizontal size={20} strokeWidth={1.9} aria-hidden />
          </button>
        </form>
      </ScreenFooter>
    </Screen>
  );
}
