import { BottomNav } from "@/components/ui/BottomNav";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { TopBar } from "@/components/ui/TopBar";
import { ThreadRow } from "@/components/chat/ThreadRow";
import { threads } from "@/lib/mock";

/** Liste des messages — écran 27 de docs/ECRANS.md. */
export default function MessagesPage() {
  return (
    <Screen>
      <TopBar title="Messages" />
      <ScreenBody>
        <Section className="gap-0 pt-0.5">
          {threads.map((thread) => (
            <ThreadRow key={thread.id} thread={thread} />
          ))}
        </Section>
      </ScreenBody>
      <BottomNav active="messages" />
    </Screen>
  );
}
