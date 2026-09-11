import { cookies } from "next/headers";
import type { UserRole } from "./types";

/**
 * Qui est connecté — version de démonstration.
 *
 * ── Pourquoi un cookie et pas une vraie session ─────────────────────────
 *
 * Sans authentification, l'application ne savait pas qui la regardait :
 * s'inscrire menait à un accueil identique, et « Mon compte » affichait
 * toujours Mariama Diallo. Trois écrans sur dix ne servaient donc à rien.
 *
 * Ce cookie fait semblant, juste assez pour que le parcours se joue : il
 * retient un nom et un rôle. Il est **signé de rien, vérifié par rien** —
 * n'importe qui peut l'écrire à la main dans son navigateur et se déclarer
 * commerçant. C'est sans conséquence tant qu'il n'y a aucune donnée réelle
 * derrière, et ce serait une faille béante le jour où il y en aura.
 *
 * À l'étape 3, Supabase Auth le remplace entièrement : jeton signé,
 * vérifié côté serveur, et les règles RLS qui décident ce que chacun voit.
 * Ce fichier disparaîtra — il ne doit surtout pas servir de base.
 */

const NOM_COOKIE = "makiti_demo";

export type Session = { nom: string; email: string; role: UserRole };

export async function lireSession(): Promise<Session | null> {
  const brut = (await cookies()).get(NOM_COOKIE)?.value;
  if (!brut) return null;
  try {
    const donnees: unknown = JSON.parse(brut);
    if (
      typeof donnees === "object" &&
      donnees !== null &&
      "nom" in donnees &&
      "role" in donnees
    ) {
      return donnees as Session;
    }
  } catch {
    /* Cookie abîmé : on fait comme s'il n'y en avait pas. Planter à cause
       d'un cookie serait la pire façon de rendre l'application inutilisable. */
  }
  return null;
}

export async function ouvrirSession(session: Session): Promise<void> {
  (await cookies()).set(NOM_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function fermerSession(): Promise<void> {
  (await cookies()).delete(NOM_COOKIE);
}
