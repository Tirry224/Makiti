import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /* Les photos des produits vivent dans Supabase Storage. Next refuse de
       servir une image distante dont l'hôte n'est pas déclaré ici : c'est
       volontaire de sa part, sinon n'importe quelle URL d'image trouvée
       dans les données ferait de notre serveur un optimiseur d'images
       gratuit pour le reste d'Internet. */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bfmsruzyrgbndbueikcb.supabase.co",
        pathname: "/storage/v1/object/public/product-images/**",
      },
    ],
  },
};

export default nextConfig;
