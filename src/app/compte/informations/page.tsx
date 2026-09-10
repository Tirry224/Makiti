import { Trash2 } from "lucide-react";
import { Field, Input } from "@/components/ui/Field";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { TopBar } from "@/components/ui/TopBar";

/** Mes informations — écran 18 de docs/ECRANS.md. */
export default function ProfilePage() {
  return (
    <Screen>
      <TopBar
        title="Mes informations"
        backHref="/compte"
        right={<span className="text-base font-semibold text-accent">Enregistrer</span>}
      />
      <ScreenBody>
        <Section className="gap-4">
          <Field label="Nom complet" htmlFor="name">
            <Input id="name" autoComplete="name" defaultValue="Mariama Diallo" />
          </Field>
          <Field label="Téléphone" htmlFor="phone">
            <Input id="phone" type="tel" inputMode="tel" defaultValue="620 45 12 87" />
          </Field>
          <Field label="Ville" htmlFor="city">
            <Input id="city" defaultValue="Ratoma" />
          </Field>
          <Field
            label="Email"
            htmlFor="email"
            hint="L'email sert à vous connecter. Contactez-nous pour le changer."
          >
            <Input id="email" type="email" defaultValue="mariama@exemple.com" disabled />
          </Field>

          <div className="my-1 h-px bg-line" />

          <Field label="Mot de passe" htmlFor="password">
            <Input id="password" type="password" defaultValue="••••••••" />
          </Field>

          <button
            type="button"
            className="mt-1 flex cursor-pointer items-center gap-2.5 text-base font-semibold text-danger"
          >
            <Trash2 size={19} strokeWidth={2} aria-hidden />
            Supprimer mon compte
          </button>
        </Section>
      </ScreenBody>
    </Screen>
  );
}
