import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
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

          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder="mariama@exemple.com" />
          </Field>

          <Button>Envoyer le lien</Button>

          {/* Le message ne dit jamais si le compte existe : sinon
              n'importe qui pourrait tester des adresses une par une pour
              découvrir qui est inscrit sur Makiti. */}
          <p className="flex gap-2.5 rounded-lg bg-success-soft px-3.5 py-3 text-sm leading-normal text-success-ink">
            <Check size={19} strokeWidth={2.4} className="shrink-0 text-success" aria-hidden />
            Si un compte existe avec cet email, le lien a été envoyé. Pensez à regarder
            dans les courriers indésirables.
          </p>
        </Section>
      </ScreenBody>
    </Screen>
  );
}
