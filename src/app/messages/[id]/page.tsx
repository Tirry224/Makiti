import { Flag, Plus, SendHorizontal } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Screen, ScreenBody, ScreenFooter } from "@/components/ui/Screen";
import { TopBar } from "@/components/ui/TopBar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ProductRef } from "@/components/chat/ProductRef";
import { conversation, threads } from "@/lib/mock";
import { notFound } from "next/navigation";

/** Fil de discussion — écran 30 de docs/ECRANS.md. */
export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const thread = threads.find((t) => t.id === id);
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
        right={<Flag size={19} strokeWidth={1.8} className="text-ink-soft" aria-hidden />}
      />

      {/* `justify-end` colle la conversation au bas de l'écran quand elle
          est courte : sinon les premiers messages flottent en haut, loin
          du champ de saisie, et l'écran paraît vide. */}
      <ScreenBody className="justify-end">
        <div className="flex flex-col gap-2.5 p-4">
          {conversation.map((message) => (
            <div key={message.id} className="contents">
              {message.product ? <ProductRef product={message.product} /> : null}
              <MessageBubble message={message} />
            </div>
          ))}
        </div>
      </ScreenBody>

      <ScreenFooter className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label="Joindre un produit"
          className="flex size-tap shrink-0 items-center justify-center rounded-full border border-line text-ink-soft"
        >
          <Plus size={21} strokeWidth={2} aria-hidden />
        </button>
        <input
          className="h-tap flex-1 rounded-full border border-line bg-surface px-4 text-base"
          placeholder="Écrire un message…"
          aria-label="Votre message"
        />
        <button
          type="button"
          aria-label="Envoyer"
          className="flex size-tap shrink-0 items-center justify-center rounded-full bg-accent text-on-accent"
        >
          <SendHorizontal size={20} strokeWidth={1.9} aria-hidden />
        </button>
      </ScreenFooter>
    </Screen>
  );
}
