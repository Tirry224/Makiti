import { ArrowLeftRight, Package, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TopBar } from "@/components/ui/TopBar";
import { cn } from "@/lib/cn";
import Link from "next/link";

/**
 * Carte de choix du rôle.
 *
 * Elle n'est utilisée que sur cet écran, donc elle reste dans ce fichier.
 * On extrait un composant quand il sert AILLEURS, pas par principe : un
 * dossier plein de composants à un seul usage est plus dur à lire qu'une
 * page un peu longue.
 */
function RoleCard({
  icon: Icon,
  title,
  description,
  selected,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3.5",
        selected ? "border-accent bg-accent-soft" : "border-line bg-surface",
      )}
    >
      <Icon size={24} strokeWidth={1.7} className="mt-0.5 shrink-0 text-accent" aria-hidden />
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-base font-bold">{title}</span>
        <span className="text-xs leading-normal text-ink-soft">{description}</span>
      </div>
      <span
        aria-hidden
        className={cn(
          "mt-0.5 size-5.5 shrink-0 rounded-full border",
          selected ? "border-6 border-accent" : "border-line",
        )}
      />
    </div>
  );
}

/** Inscription — écran 12 de docs/ECRANS.md. */
export default function SignupPage() {
  return (
    <Screen>
      <TopBar title="Créer un compte" backHref="/" />

      <ScreenBody>
        <Section className="gap-4">
          <div className="flex flex-col gap-2.5">
            <SectionLabel>Je viens sur Makiti pour</SectionLabel>
            <RoleCard
              icon={Search}
              title="Acheter"
              description="Je parcours les produits et je contacte les vendeurs."
              selected
            />
            <RoleCard
              icon={Package}
              title="Vendre"
              description="Je publie mes produits et je reçois les messages des clients."
              selected={false}
            />
            <p className="flex items-start gap-2 rounded-lg bg-accent-soft px-3 py-2.5 text-xs leading-normal text-accent-hover">
              <ArrowLeftRight size={16} strokeWidth={2} className="mt-px shrink-0" aria-hidden />
              Vous pourrez créer l&apos;autre compte plus tard et basculer entre les deux : ce
              choix n&apos;est pas définitif.
            </p>
          </div>

          <Field label="Nom complet" htmlFor="name">
            <Input id="name" name="name" autoComplete="name" placeholder="Mariama Diallo" />
          </Field>

          <Field
            label="Téléphone"
            htmlFor="phone"
            hint="Utilisé uniquement pour vous contacter."
          >
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="620 00 00 00"
            />
          </Field>

          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="mariama@exemple.com"
            />
          </Field>

          <Field label="Mot de passe" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="8 caractères minimum"
            />
          </Field>

          <Button href="/inscription/boutique">Créer mon compte</Button>

          <p className="text-center text-base text-ink-soft">
            Déjà un compte ?{" "}
            <Link href="/connexion" className="font-semibold text-accent">
              Se connecter
            </Link>
          </p>
        </Section>
      </ScreenBody>
    </Screen>
  );
}
