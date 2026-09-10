import { Search } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { Card } from "@/components/ui/Card";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { Skeleton } from "@/components/ui/Skeleton";
import { TopBar } from "@/components/ui/TopBar";

/**
 * Recherche — attente des résultats.
 *
 * Next l'affiche automatiquement pendant que la page cherche. Il reproduit
 * la grille à venir plutôt qu'un tourniquet : la page ne saute pas quand
 * les résultats arrivent, et l'attente paraît plus courte parce qu'on voit
 * déjà où les choses vont se placer.
 *
 * Six gabarits et non douze : au-delà de la moitié de l'écran, personne ne
 * les voit, et chacun coûte du HTML à transférer.
 */
export default function Loading() {
  return (
    <Screen>
      <TopBar
        backHref="/"
        title={
          <div className="flex h-tap flex-1 items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5">
            <Search size={18} strokeWidth={1.8} className="shrink-0 text-ink-soft" aria-hidden />
            <Skeleton className="h-3.5 w-32" />
          </div>
        }
      />

      <ScreenBody>
        <Section className="gap-3">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-36 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-28" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Card key={i} className="flex flex-col">
                <Skeleton className="h-33 rounded-none" />
                <div className="flex flex-col gap-2 px-3 pt-2.5 pb-3">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/5" />
                  <Skeleton className="h-3.5 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        </Section>
      </ScreenBody>

      <BottomNav active="search" />
    </Screen>
  );
}
