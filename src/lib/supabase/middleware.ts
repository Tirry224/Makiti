import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

/**
 * Rafraîchit le cookie de session à chaque requête. Sans ça, un jeton
 * expiré ne se renouvelle jamais tout seul et une session finit par se
 * couper silencieusement au milieu d'une visite. Appelé depuis
 * `src/middleware.ts`, sur (presque) toutes les routes.
 *
 * `supabaseResponse` est reconstruit après `getUser()` plutôt que réutilisé
 * tel quel : `setAll` doit écrire sur la MÊME réponse que celle envoyée au
 * navigateur, sinon les cookies rafraîchis ne partent jamais.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    },
  );

  // Ne PAS retirer cet appel, même si son résultat n'est pas lu ici : c'est
  // lui qui déclenche le rafraîchissement du jeton auprès de Supabase.
  await supabase.auth.getUser();

  return supabaseResponse;
}
