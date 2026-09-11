import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { TopBar } from "@/components/ui/TopBar";

/** Mot de passe oublié — écran 15 de docs/ECRANS.md. */
export default function ForgotPasswordPage() {
  return (
    <Screen>
      <TopBar title="Mot de passe oublié" backHref="/connexion" />
      <ScreenBody>
        <Section className="gap-4 py-6">
          <p className="text-base leading-relaxed text-ink-soft">
            Entrez l&apos;email de votre compte. Vous recevrez un lien pour choisir un
            nouveau mot de passe.
          </p>

          <ForgotPasswordForm />
        </Section>
      </ScreenBody>
    </Screen>
  );
}
