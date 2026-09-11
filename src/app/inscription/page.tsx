import { redirect } from "next/navigation";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { TopBar } from "@/components/ui/TopBar";
import { SignupForm } from "@/components/auth/SignupForm";
import { createClient } from "@/lib/supabase/server";
import { getMyProfiles } from "@/lib/data/session";

/** Inscription — écran 12 de docs/ECRANS.md. */
export default async function SignupPage() {
  const supabase = await createClient();
  const profiles = await getMyProfiles(supabase);

  // Déjà les deux comptes liés : rien à créer de plus ici.
  if (profiles.length >= 2) redirect("/compte");

  const mode = profiles.length > 0 ? "linked" : "new";
  const existing = profiles[0];

  return (
    <Screen>
      <TopBar title="Créer un compte" backHref="/" />

      <ScreenBody>
        <Section className="gap-4">
          <SignupForm
            mode={mode}
            excludeRole={existing?.role}
            defaultFullName={existing?.fullName}
            defaultPhone={existing?.phone}
          />
        </Section>
      </ScreenBody>
    </Screen>
  );
}
