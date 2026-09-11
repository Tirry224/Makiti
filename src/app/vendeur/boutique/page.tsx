import { redirect } from "next/navigation";
import { FileText, LogOut } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { MenuItem, MenuList } from "@/components/ui/MenuList";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { SwitchSpaceCard } from "@/components/ui/SwitchSpaceCard";
import { TopBar } from "@/components/ui/TopBar";
import { ShopEditForm } from "@/components/auth/ShopEditForm";
import { createClient } from "@/lib/supabase/server";
import { getMyMerchant } from "@/lib/data/merchants";
import { getMyProfile } from "@/lib/data/session";
import { getCities } from "@/lib/data/reference";
import { signOutAction } from "@/lib/actions/auth";

/**
 * Écran 26 — modifier ma boutique. Accessible quel que soit le statut de
 * la boutique (approuvée, en attente, refusée) : c'est aussi par ici
 * qu'on corrige une boutique refusée avant de la renvoyer.
 */
export default async function EditShopPage() {
  const supabase = await createClient();
  const merchant = await getMyMerchant(supabase);
  if (!merchant) redirect("/inscription/boutique");

  const merchantProfile = await getMyProfile(supabase, "merchant");
  const { data: row } = await supabase
    .from("merchants")
    .select("city_id")
    .eq("profile_id", merchantProfile!.id)
    .single();

  const [cities, clientProfile] = await Promise.all([getCities(supabase), getMyProfile(supabase, "client")]);

  return (
    <Screen>
      <TopBar
        title="Ma boutique"
        backHref="/vendeur"
        right={
          <button
            type="submit"
            form="shop-edit-form"
            className="cursor-pointer text-base font-semibold text-accent"
          >
            Enregistrer
          </button>
        }
      />

      <ScreenBody>
        <Section className="gap-5">
          <ShopEditForm merchant={merchant} cityId={row!.city_id} cities={cities} />

          {clientProfile ? (
            <SwitchSpaceCard
              label="Basculer vers mon espace client"
              target={clientProfile.fullName}
              href="/compte"
            />
          ) : null}

          <MenuList>
            <MenuItem icon={FileText} label="Conditions d'utilisation" />
          </MenuList>

          <MenuList>
            <MenuItem icon={LogOut} label="Se déconnecter" tone="danger" action={signOutAction} />
          </MenuList>
        </Section>
      </ScreenBody>

      <BottomNav active="account" accountHref="/vendeur/boutique" />
    </Screen>
  );
}
