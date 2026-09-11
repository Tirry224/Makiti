import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

/**
 * Client Supabase pour les composants serveur (l'immense majorité de
 * l'app — voir src/components/README.md). Un client PAR REQUÊTE, jamais
 * un singleton module-level : les cookies de session diffèrent d'une
 * requête à l'autre, un client partagé mélangerait les utilisateurs.
 *
 * `setAll` peut échouer dans un composant serveur pur (pas de réponse à
 * écrire) : c'est normal et sans conséquence tant qu'un middleware
 * rafraîchit la session ailleurs. On avale l'erreur plutôt que de faire
 * planter la page pour ça.
 *
 * `cache()` de React mémorise le résultat pour la durée d'UNE requête :
 * une page qui appelle `createClient()` plusieurs fois (directement, ou
 * indirectement via plusieurs fonctions de `src/lib/data/`) reçoit le
 * MÊME client déjà construit, au lieu d'en fabriquer un nouveau à chaque
 * fois. Sans ce partage, `getSessionUser` (cache lui aussi, voir
 * `src/lib/data/session.ts`) ne peut pas dédupliquer ses appels : deux
 * clients différents sont deux clés de cache différentes.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Appelé depuis un composant serveur sans réponse à écrire.
          }
        },
      },
    },
  );
});
