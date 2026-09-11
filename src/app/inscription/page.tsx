import { Package, Search, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, MessageErreur } from "@/components/ui/Field";
import { creerCompte } from "@/lib/actions";
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
  value,
  selected,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  value: string;
  selected: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5",
        "border-line bg-surface has-checked:border-accent has-checked:bg-accent-soft",
      )}
    >
      {/* Un vrai bouton radio, caché sous la carte : taper n'importe où
          sur la carte le coche, le clavier y accède, et le formulaire
          l'envoie sans JavaScript. `has-checked` habille la carte selon
          l'état réel de la case, pas selon une variable de rendu. */}
      <input type="radio" name="role" value={value} defaultChecked={selected} className="peer sr-only" />
      <Icon size={24} strokeWidth={1.7} className="mt-0.5 shrink-0 text-accent" aria-hidden />
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-base font-bold">{title}</span>
        <span className="text-xs leading-normal text-ink-soft">{description}</span>
      </div>
      <span
        aria-hidden
        className="mt-0.5 size-5.5 shrink-0 rounded-full border border-line peer-checked:border-6 peer-checked:border-accent"
      />
    </label>
  );
}

/**
 * Inscription — écran 12 de docs/ECRANS.md.
 *
 * Les valeurs déjà saisies reviennent par l'URL après un refus, pour ne
 * pas tout retaper sur un téléphone. Le mot de passe, lui, ne revient
 * jamais : une URL traîne dans l'historique et dans les journaux.
 */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { erreur, role, nom, telephone, email } = await searchParams;

  return (
    <Screen>
      <TopBar title="Créer un compte" backHref="/" />

      <ScreenBody>
        <Section className="gap-4">
          {/* Un vrai `<form>` : sans JavaScript, le navigateur l'envoie
              lui-même et l'action serveur s'exécute quand même. C'est ce
              qui rend l'inscription possible pendant les secondes où le
              socle n'est pas chargé. */}
          <form action={creerCompte} className="flex flex-col gap-4">
          <MessageErreur code={erreur} />
          <div className="flex flex-col gap-2.5">
            <SectionLabel>Je viens sur Makiti pour</SectionLabel>
            <RoleCard
              icon={Search}
              title="Acheter"
              description="Je parcours les produits et je contacte les vendeurs."
              value="client"
              selected={role !== "commercant"}
            />
            <RoleCard
              icon={Package}
              title="Vendre"
              description="Je publie mes produits et je reçois les messages des clients."
              value="commercant"
              selected={role === "commercant"}
            />
            <p className="flex items-start gap-2 rounded-lg bg-warn-soft px-3 py-2.5 text-xs leading-normal text-warn-ink">
              <TriangleAlert size={16} strokeWidth={2} className="mt-px shrink-0" aria-hidden />
              Ce choix est définitif : un compte est soit acheteur, soit vendeur.
            </p>
          </div>

          <Field label="Nom complet" htmlFor="nom">
            <Input id="nom" name="nom" autoComplete="name" defaultValue={nom} required minLength={2} placeholder="Mariama Diallo" />
          </Field>

          <Field
            label="Téléphone"
            htmlFor="telephone"
            hint="Utilisé uniquement pour vous contacter."
          >
            <Input
              id="telephone"
              name="telephone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              defaultValue={telephone}
              required
              pattern="[\s.\-()+0-9]{9,20}"
              title="Un numéro guinéen à 9 chiffres, commençant par 6."
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
              defaultValue={email}
              required
              placeholder="mariama@exemple.com"
            />
          </Field>

          {/* `required` et `minLength` ne sont pas une coquetterie : le
              navigateur refuse d'envoyer le formulaire, donc la faute de
              frappe ne coûte AUCUN aller-retour réseau — et le mot de
              passe n'est pas vidé, puisqu'il n'y a pas de rechargement.
              Le serveur revalide tout : ces attributs se contournent en
              trois secondes avec les outils de développement. */}
          <Field label="Mot de passe" htmlFor="motdepasse">
            <Input
              id="motdepasse"
              name="motdepasse"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="8 caractères minimum"
            />
          </Field>

          <Button type="submit">Créer mon compte</Button>

          <p className="text-center text-base text-ink-soft">
            Déjà un compte ?{" "}
            <Link href="/connexion" className="font-semibold text-accent">
              Se connecter
            </Link>
          </p>
          </form>
        </Section>
      </ScreenBody>
    </Screen>
  );
}
