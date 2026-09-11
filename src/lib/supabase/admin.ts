import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Client `service_role` : ignore le RLS, à utiliser UNIQUEMENT depuis du
 * code serveur qui ne dépend d'aucune session (ex. suppression de compte,
 * `src/lib/actions/account.ts`) — jamais depuis un composant client, jamais
 * transmis au navigateur. `SUPABASE_SERVICE_ROLE_KEY` (sans préfixe
 * `NEXT_PUBLIC_`) n'est donc jamais inclus dans le bundle envoyé au
 * navigateur ; il vit uniquement dans les variables d'environnement du
 * serveur (tableau de bord Vercel), jamais dans un fichier versionné.
 *
 * Un plan initial envisageait une Edge Function Supabase séparée pour ce
 * genre d'opération. Une action serveur Next.js fait exactement la même
 * chose — le code ne quitte jamais le serveur non plus — avec un aller-
 * retour réseau de moins (pas de saut Next → Edge Function → Postgres) et
 * un seul système à déployer.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY manquante : à ajouter dans les variables d'environnement du serveur (jamais dans .env, jamais avec le préfixe NEXT_PUBLIC_).",
    );
  }
  return createSupabaseClient<Database>(url, serviceRoleKey);
}
