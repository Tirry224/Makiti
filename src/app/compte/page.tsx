import { FileText, LogIn, LogOut, MapPin, MessageCircle, Package, User } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { MenuItem, MenuList } from "@/components/ui/MenuList";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { TopBar } from "@/components/ui/TopBar";
import { seDeconnecter } from "@/lib/actions";
import { lireSession } from "@/lib/session";

/**
 * Mon compte — écran 17 de docs/ECRANS.md.
 *
 * L'écran change selon qu'on est connecté ou non. Avant, il affichait
 * toujours Mariama Diallo, y compris pour un visiteur qui n'avait jamais
 * créé de compte : c'était le signe le plus visible que l'inscription ne
 * servait à rien.
 */
export default async function AccountPage() {
  const session = await lireSession();

  if (!session) {
    return (
      <Screen>
        <TopBar title="Mon compte" />
        <ScreenBody>
          <EmptyState
            icon={LogIn}
            title="Vous n'êtes pas connecté"
            description="Le catalogue est libre. Le compte sert à écrire aux vendeurs et à retrouver vos échanges."
          >
            <Button href="/connexion">Se connecter</Button>
            <Button variant="secondary" href="/inscription">
              Créer un compte
            </Button>
          </EmptyState>
        </ScreenBody>
        <BottomNav active="account" />
      </Screen>
    );
  }

  const commercant = session.role === "merchant";

  return (
    <Screen>
      <TopBar title="Mon compte" />

      <ScreenBody>
        <Section className="gap-4">
          <div className="flex items-center gap-3.5">
            <Avatar name={session.nom} size={58} />
            <div className="flex flex-col gap-0.5">
              <span className="text-lg font-bold">{session.nom}</span>
              <span className="text-sm text-ink-soft">{session.email}</span>
            </div>
          </div>

          <MenuList>
            <MenuItem icon={User} label="Mes informations" href="/compte/informations" />
            {/* Sans `href` : ces entrées ouvriront une feuille au moment des
                actions. Un lien vers une page qui n'existe pas est un cul-de-sac. */}
            <MenuItem icon={MapPin} label="Ma ville" value="Ratoma" />
            <MenuItem icon={MessageCircle} label="Mes messages" value="3" href="/messages" />
          </MenuList>

          {/* « Ma boutique » n'a de sens que pour un commerçant. L'afficher à
              un acheteur, c'est lui proposer une porte qui ne s'ouvre pas. */}
          {commercant ? (
            <MenuList>
              <MenuItem icon={Package} label="Ma boutique" href="/vendeur" />
              <MenuItem icon={FileText} label="Conditions d'utilisation" />
            </MenuList>
          ) : (
            <MenuList>
              <MenuItem icon={FileText} label="Conditions d'utilisation" />
            </MenuList>
          )}

          <form action={seDeconnecter}>
            <MenuList>
              <MenuItem icon={LogOut} label="Se déconnecter" tone="danger" submit />
            </MenuList>
          </form>
        </Section>
      </ScreenBody>

      <BottomNav active="account" />
    </Screen>
  );
}
