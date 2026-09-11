import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TopBar, Wordmark } from "@/components/ui/TopBar";

/**
 * Index des écrans — page de TRAVAIL, pas de produit.
 *
 * Elle existe parce qu'il n'y a pas encore d'authentification : rien ne
 * dit si l'on est client ou commerçant, et plusieurs écrans (boutique
 * refusée, compte suspendu, hors ligne) ne s'atteignent pas en naviguant
 * normalement. Cette page les rend tous accessibles pour relecture.
 *
 * À SUPPRIMER quand la session existera. Une page de débogage qu'on oublie
 * de retirer finit toujours par être trouvée par un utilisateur.
 */

const GROUPS: { title: string; screens: [string, string, string?][] }[] = [
  {
    title: "Client",
    screens: [
      ["1", "Fil d'accueil", "/"],
      ["2", "Fil — ville sans produit", "/?ville=Boké"],
      ["3", "Fil — chargement", undefined], // retiré : exigeait du JavaScript
      ["4", "Fil — hors ligne", "/?reseau=hors-ligne"],
      ["5", "Recherche — au repos", "/recherche"],
      ["5b", "Recherche — résultats", "/recherche?q=iphone"],
      ["5c", "Recherche — filtrée", "/recherche?categorie=telephones&etat=occasion"],
      ["6", "Recherche — 0 ici, ailleurs oui", "/recherche?q=parfum&ville=Boké"],
      ["6b", "Recherche — hors périmètre", "/recherche?q=frigo"],
      ["7", "Fiche produit", "/produit/p-parfum"],
      ["8", "Fiche produit — vendu", "/produit/p-perruque"],
      ["9", "Galerie photo", "/produit/p-parfum/photos"],
      ["10", "Signaler un produit", "/produit/p-parfum/signaler"],
      ["11", "Boutique publique", "/boutique/m-aissatou"],
    ],
  },
  {
    title: "Compte & accès",
    screens: [
      ["12", "Inscription — choix du rôle", "/inscription"],
      ["13", "Inscription — ma boutique", "/inscription/boutique"],
      ["14", "Connexion", "/connexion"],
      ["15", "Mot de passe oublié", "/mot-de-passe-oublie"],
      ["16", "Compte requis", "/produit/p-parfum/contacter"],
      ["17", "Mon compte", "/compte"],
      ["18", "Mes informations", "/compte/informations"],
      ["19", "Compte suspendu", "/compte/suspendu"],
    ],
  },
  {
    title: "Commerçant",
    screens: [
      ["20", "Boutique en attente", "/vendeur/attente"],
      ["21", "Boutique refusée", "/vendeur/refusee"],
      ["22", "Mes produits", "/vendeur"],
      ["23", "Mes produits — vide", "/vendeur?etat=vide"],
      ["24", "Ajouter un produit", "/vendeur/produits/nouveau"],
      ["25", "Actions produit", "/vendeur/produits/p-parfum/actions"],
      ["26", "Modifier ma boutique", "/vendeur/boutique"],
    ],
  },
  {
    title: "Messagerie",
    screens: [
      ["27", "Messages — commerçant", "/messages"],
      ["28", "Messages — client", "/messages?vue=client"],
      ["29", "Messages — vide", "/messages?vue=vide"],
      ["30", "Fil de discussion", "/messages/t-mariama"],
      ["31", "Citer un produit", "/messages/t-mariama/citer"],
      ["32", "Actions conversation", "/messages/t-mariama/actions"],
      ["32b", "Signaler une conversation", "/messages/t-mariama/signaler"],
    ],
  },
  {
    title: "Transverse",
    screens: [
      ["33", "Page introuvable", "/adresse-qui-nexiste-pas"],
      ["—", "Design system", "/styleguide"],
    ],
  },
];

export default function ScreensIndexPage() {
  return (
    <Screen>
      <TopBar title={<Wordmark />} right={<span className="text-sm text-ink-soft">33 écrans</span>} />

      <ScreenBody>
        <Section className="gap-2 pb-0">
          <p className="rounded-lg bg-warn-soft px-3.5 py-3 text-xs leading-normal text-warn-ink">
            Page de travail, à supprimer quand l&apos;authentification existera. Les écrans 3 et 4
            n&apos;ont pas de lien : ils s&apos;affichent tout seuls, l&apos;un pendant le
            chargement des données, l&apos;autre quand celui-ci échoue.
          </p>
        </Section>

        {GROUPS.map((group) => (
          <Section key={group.title} className="gap-2">
            <SectionLabel>{group.title}</SectionLabel>
            <Card className="px-3.5">
              {group.screens.map(([number, label, href]) => {
                const inner = (
                  <>
                    <span className="w-6 shrink-0 text-sm text-ink-soft tabular-nums">{number}</span>
                    <span className="flex-1 text-base">{label}</span>
                    {href ? (
                      <ChevronRight size={18} strokeWidth={2} className="shrink-0 text-ink-soft" aria-hidden />
                    ) : (
                      <span className="text-2xs text-ink-soft">automatique</span>
                    )}
                  </>
                );
                const className =
                  "flex h-tap items-center gap-3 border-b border-line last:border-b-0";
                return href ? (
                  <Link key={number + label} href={href} className={className}>
                    {inner}
                  </Link>
                ) : (
                  <div key={number + label} className={`${className} text-ink-soft`}>
                    {inner}
                  </div>
                );
              })}
            </Card>
          </Section>
        ))}
      </ScreenBody>
    </Screen>
  );
}
