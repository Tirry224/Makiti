import { FileText, LogOut, MapPin, MessageCircle, User } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { BottomNav } from "@/components/ui/BottomNav";
import { MenuItem, MenuList } from "@/components/ui/MenuList";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { SwitchSpaceCard } from "@/components/ui/SwitchSpaceCard";
import { TopBar } from "@/components/ui/TopBar";
import { merchantAissatou } from "@/lib/mock";

/** Mon compte — écran 17 de docs/ECRANS.md. */
export default function AccountPage() {
  return (
    <Screen>
      <TopBar title="Mon compte" />

      <ScreenBody>
        <Section className="gap-4">
          <div className="flex items-center gap-3.5">
            <Avatar name="Mariama Diallo" size={58} />
            <div className="flex flex-col gap-0.5">
              <span className="text-lg font-bold">Mariama Diallo</span>
              <span className="text-sm text-ink-soft">mariama@exemple.com</span>
            </div>
          </div>

          <MenuList>
            <MenuItem icon={User} label="Mes informations" href="/compte/informations" />
            {/* Sans `href` : ces entrées ouvriront une feuille au moment des
                actions. Un lien vers une page qui n'existe pas est un cul-de-sac. */}
            <MenuItem icon={MapPin} label="Ma ville" value="Ratoma" />
            <MenuItem icon={MessageCircle} label="Mes messages" value="3" href="/messages" />
          </MenuList>

          {/* Bascule vers le compte commerçant lié : jamais un item de menu
              parmi d'autres, toujours une action à part (voir docs/SPEC.md,
              décision 8). */}
          <SwitchSpaceCard
            label="Basculer vers mon espace commerçant"
            target={merchantAissatou.shopName}
            href="/vendeur"
          />

          <MenuList>
            <MenuItem icon={FileText} label="Conditions d'utilisation" />
          </MenuList>

          <MenuList>
            <MenuItem icon={LogOut} label="Se déconnecter" tone="danger" />
          </MenuList>
        </Section>
      </ScreenBody>

      <BottomNav active="account" />
    </Screen>
  );
}
