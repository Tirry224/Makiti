import type { NextConfig } from "next";

/* L'hôte des photos est DÉDUIT de NEXT_PUBLIC_SUPABASE_URL plutôt que
   recopié ici. Écrit deux fois, il finirait par diverger le jour où le
   projet Supabase change — et la panne serait silencieuse : Next
   refuserait simplement d'afficher les images, sans rien casser d'autre.
   Une URL mal formée fait échouer le build, ce qui est le bon moment pour
   l'apprendre. Absente, on laisse la liste vide : `supabase.ts` s'arrêtera
   juste après avec un message qui explique quoi faire. */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  images: {
    /* Next refuse de servir une image distante dont l'hôte n'est pas
       déclaré ici : c'est volontaire de sa part, sinon n'importe quelle
       URL d'image trouvée dans les données ferait de notre serveur un
       optimiseur d'images gratuit pour le reste d'Internet. */
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: "https" as const,
            hostname: new URL(supabaseUrl).hostname,
            pathname: "/storage/v1/object/public/product-images/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
