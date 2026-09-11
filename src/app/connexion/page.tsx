import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, Input, MessageErreur } from "@/components/ui/Field";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { Wordmark } from "@/components/ui/TopBar";
import { seConnecter } from "@/lib/actions";

/** Connexion — écran 14 de docs/ECRANS.md. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { erreur, email } = await searchParams;

  return (
    <Screen>
      <ScreenBody className="justify-center">
        <Section className="gap-4 p-7">
          <form action={seConnecter} className="flex flex-col gap-4">
          <div className="mb-1 flex flex-col gap-2">
            <Wordmark size="lg" />
            <p className="text-base text-ink-soft">Achetez et vendez près de chez vous.</p>
          </div>

          <MessageErreur code={erreur} />

          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" defaultValue={email} required placeholder="mariama@exemple.com" />
          </Field>

          <Field label="Mot de passe" htmlFor="motdepasse">
            <Input id="motdepasse" name="motdepasse" type="password" autoComplete="current-password" required placeholder="••••••••" />
          </Field>

          <Link href="/mot-de-passe-oublie" className="-mt-1 self-end text-sm font-semibold text-accent">
            Mot de passe oublié ?
          </Link>

          <Button type="submit">Se connecter</Button>
          </form>

          <Button variant="secondary" href="/inscription">
            Créer un compte
          </Button>

          <p className="mt-1 text-center text-sm text-ink-soft">
            Vous pouvez <Link href="/" className="font-semibold text-accent">parcourir les produits</Link> sans compte.
          </p>
        </Section>
      </ScreenBody>
    </Screen>
  );
}
