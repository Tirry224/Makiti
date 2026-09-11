import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Accès à Supabase.
 *
 * La clé publiable est faite pour être exposée au navigateur : ce n'est
 * pas elle qui protège les données, c'est le RLS écrit dans
 * `supabase/migrations/0002_rules_and_security.sql`. Un produit en
 * brouillon reste invisible ici parce que la BASE refuse de le renvoyer,
 * pas parce que le code oublie de le demander. C'est toute la différence
 * entre une donnée protégée et une donnée simplement non affichée.
 *
 * Un seul client suffit tant que personne n'est connecté : il n'y a aucun
 * état propre à un visiteur. Quand l'authentification arrivera (étape 4 de
 * docs/REPRISE.md), il faudra passer à `@supabase/ssr` et créer un client
 * PAR REQUÊTE, porteur des cookies de session — sinon deux visiteurs
 * partageraient la même session, ce qui est exactement la faille que le
 * RLS est censé rendre impossible.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  /* Échouer tout de suite et clairement. Sans ça, l'erreur n'apparaît
     qu'au premier appel réseau, sous la forme d'un « fetch failed » qui ne
     dit rien de la cause.
     Cet arrêt se produit aussi pendant `next build` : Next évalue les
     modules de chaque page pour en collecter la configuration. C'est
     voulu — mieux vaut un déploiement qui échoue qu'un site en ligne dont
     chaque page plante. Le message doit donc nommer LES DEUX endroits où
     ces variables se définissent, pas seulement celui du développement. */
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont manquantes.\n" +
      "  · en local      : les définir dans .env.local (voir README)\n" +
      "  · sur Vercel    : Project Settings → Environment Variables, puis relancer le déploiement\n" +
      "Les deux valeurs sont publiques : c'est le RLS qui protège les données, pas leur secret.",
  );
}

export const supabase = createClient<Database>(url, key);

/** Adresse publique d'une photo de produit dans le stockage. */
export function imageUrl(storagePath: string): string {
  return supabase.storage.from("product-images").getPublicUrl(storagePath).data.publicUrl;
}
