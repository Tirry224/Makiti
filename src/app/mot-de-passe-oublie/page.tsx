import { Button } from "@/components/ui/Button";
import { Field, Input, MessageErreur, MessageSucces } from "@/components/ui/Field";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { TopBar } from "@/components/ui/TopBar";
import { envoyerLienMotDePasse } from "@/lib/actions";

/** Mot de passe oublié — écran 15 de docs/ECRANS.md. */
export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { erreur, email, envoye } = await searchParams;

  return (
    <Screen>
      <TopBar title="Mot de passe oublié" backHref="/connexion" />
      <ScreenBody>
        <Section className="gap-4 py-6">
          <form action={envoyerLienMotDePasse} className="flex flex-col gap-4">
          <p className="text-base leading-relaxed text-ink-soft">
            Entrez l&apos;email de votre compte. Vous recevrez un lien pour choisir un
            nouveau mot de passe.
          </p>

          <MessageErreur code={erreur} />

          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" defaultValue={email} required placeholder="mariama@exemple.com" />
          </Field>

          <Button type="submit">Envoyer le lien</Button>
          </form>

          {/* La confirmation ne dit JAMAIS si le compte existe, et
              s'affiche donc à tous les coups : sinon n'importe qui
              pourrait tester des adresses une par une pour découvrir qui
              est inscrit sur Makiti. */}
          {envoye ? (
            <MessageSucces>
              Si un compte existe avec cet email, le lien a été envoyé. Pensez à
              regarder dans les courriers indésirables.
            </MessageSucces>
          ) : null}
        </Section>
      </ScreenBody>
    </Screen>
  );
}
