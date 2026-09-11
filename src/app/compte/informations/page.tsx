import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, MessageErreur, MessageSucces } from "@/components/ui/Field";
import { Screen, ScreenBody, ScreenFooter, Section } from "@/components/ui/Screen";
import { TopBar } from "@/components/ui/TopBar";
import { mettreAJourProfil } from "@/lib/actions";
import { lireSession } from "@/lib/session";

/** Mes informations — écran 18 de docs/ECRANS.md. */
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { erreur, enregistre, nom, telephone } = await searchParams;
  const session = await lireSession();

  return (
    <Screen>
      <TopBar title="Mes informations" backHref="/compte" />
      <form action={mettreAJourProfil} className="flex min-h-0 flex-1 flex-col">
      <ScreenBody>
        <Section className="gap-4">
          <MessageErreur code={erreur} />
          {enregistre ? <MessageSucces>Vos informations sont à jour.</MessageSucces> : null}

          <Field label="Nom complet" htmlFor="nom">
            <Input id="nom" name="nom" autoComplete="name" required minLength={2} defaultValue={nom ?? session?.nom ?? ""} />
          </Field>
          <Field label="Téléphone" htmlFor="telephone">
            <Input id="telephone" name="telephone" type="tel" inputMode="tel" required pattern="[\s.\-()+0-9]{9,20}" defaultValue={telephone ?? "620 45 12 87"} />
          </Field>
          <Field label="Ville" htmlFor="ville">
            <Input id="ville" name="ville" defaultValue="Ratoma" />
          </Field>
          <Field
            label="Email"
            htmlFor="email"
            hint="L'email sert à vous connecter. Contactez-nous pour le changer."
          >
            <Input id="email" type="email" defaultValue={session?.email ?? ""} disabled />
          </Field>

          <div className="my-1 h-px bg-line" />

          <Field label="Mot de passe" htmlFor="motdepasse" hint="Laissez vide pour garder le mot de passe actuel.">
            <Input id="motdepasse" name="motdepasse" type="password" autoComplete="new-password" minLength={8} placeholder="••••••••" />
          </Field>

          {/* Hors du formulaire d'enregistrement, et pas par hasard : une
              suppression de compte ne doit jamais partir du même geste
              qu'un changement de numéro de téléphone. Elle mènera à un
              écran de confirmation quand la session existera. */}
          <span className="mt-1 flex items-center gap-2.5 text-base font-semibold text-danger">
            <Trash2 size={19} strokeWidth={2} aria-hidden />
            Supprimer mon compte
          </span>
        </Section>
      </ScreenBody>

      <ScreenFooter>
        <Button type="submit">Enregistrer</Button>
      </ScreenFooter>
      </form>
    </Screen>
  );
}
