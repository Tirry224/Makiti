import { cache } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type SessionProfile = {
  id: string;
  role: "client" | "merchant";
  fullName: string;
  phone: string;
  isSuspended: boolean;
  isDeleted: boolean;
};

/**
 * `auth.getUser()`, pas `auth.getSession()` : la première revalide le jeton
 * auprès de Supabase, la seconde se contente de lire le cookie sans le
 * vérifier — suffisant pour de l'affichage, pas pour une décision de sécurité.
 * Voir https://supabase.com/docs/guides/auth/server-side/nextjs.
 *
 * Cette revalidation est un aller-retour réseau, pas une simple lecture de
 * cookie — et plusieurs écrans de l'espace vendeur appellent cette fonction
 * (via `getMyProfile`/`getMyMerchant`) deux ou trois fois chacun. Sans
 * `cache()`, chaque appel refaisait ce même aller-retour : `cache()` de
 * React mémorise le résultat pour la durée d'UNE requête, donc le premier
 * appel paie le coût réseau et tous les suivants sont gratuits. Le
 * middleware (`src/lib/supabase/middleware.ts`) garde son propre appel,
 * séparé : il tourne dans une exécution différente (Edge, avant que la
 * page ne s'affiche), que ce cache ne couvre pas.
 */
export const getSessionUser = cache(async (supabase: SupabaseClient<Database>): Promise<User | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Les 1 ou 2 profils (client, commerçant) de la connexion active. Mis en
 * cache pour la même raison que `getSessionUser` : `getMyProfile("client")`
 * et `getMyProfile("merchant")` appelés sur la même page ne doivent
 * interroger `profiles` qu'une seule fois. */
export const getMyProfiles = cache(async (supabase: SupabaseClient<Database>): Promise<SessionProfile[]> => {
  const user = await getSessionUser(supabase);
  if (!user) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, phone, is_suspended, is_deleted")
    .eq("auth_user_id", user.id);
  if (error) throw error;
  return data.map((p) => ({
    id: p.id,
    role: p.role,
    fullName: p.full_name,
    phone: p.phone,
    isSuspended: p.is_suspended,
    isDeleted: p.is_deleted,
  }));
});

/** Le profil (client OU commerçant) de la connexion active pour ce rôle,
 * ou `null` si elle n'a pas encore ce compte-là. */
export async function getMyProfile(
  supabase: SupabaseClient<Database>,
  role: "client" | "merchant",
): Promise<SessionProfile | null> {
  const profiles = await getMyProfiles(supabase);
  return profiles.find((p) => p.role === role) ?? null;
}
