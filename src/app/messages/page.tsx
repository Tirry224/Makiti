import { MessageCircle } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { TopBar } from "@/components/ui/TopBar";
import { ThreadRow } from "@/components/chat/ThreadRow";
import { clientThreads, threads } from "@/lib/mock";

/**
 * Messages — écrans 27, 28 et 29 de docs/ECRANS.md.
 *
 * Le même écran sert aux deux rôles : côté client, la liste montre des
 * BOUTIQUES ; côté commerçant, des PERSONNES. Un seul composant
 * `ThreadRow` couvre les deux, parce que la seule différence est la nature
 * de l'interlocuteur.
 *
 * `?vue=` est un interrupteur TEMPORAIRE : sans authentification, rien ne
 * dit encore qui regarde. Il disparaîtra avec la session.
 */
export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string }>;
}) {
  const { vue = "commercant" } = await searchParams;
  const list = vue === "vide" ? [] : vue === "client" ? clientThreads : threads;

  return (
    <Screen>
      <TopBar title={vue === "client" ? "Mes messages" : "Messages"} />

      <ScreenBody>
        {list.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="Aucune conversation"
            description="Quand un produit vous intéresse, écrivez au vendeur depuis sa fiche. Vos échanges apparaîtront ici."
          >
            <Button href="/">Parcourir les produits</Button>
          </EmptyState>
        ) : (
          <Section className="gap-0 pt-0.5">
            {list.map((thread) => (
              <ThreadRow key={thread.id} thread={thread} />
            ))}
          </Section>
        )}
      </ScreenBody>

      <BottomNav active="messages" />
    </Screen>
  );
}
