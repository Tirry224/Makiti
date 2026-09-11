import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "@/styles/index.css";

/**
 * Next héberge les polices lui-même : le navigateur ne contacte jamais
 * Google au chargement. C'est une question de vitesse — un aller-retour
 * réseau de moins sur une connexion mobile lente — et de vie privée.
 *
 * `variable` publie chaque police comme variable CSS, que tokens.css
 * récupère dans --font-sans et --font-display. Les composants ne
 * connaissent donc jamais le nom d'une police.
 */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display-src",
  display: "swap",
});

const body = Figtree({
  subsets: ["latin"],
  variable: "--font-body-src",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Makiti — Trouvez des produits et des commerçants près de chez vous",
  description:
    "Makiti aide à trouver des produits et les commerçants qui les vendent, en Guinée. Parcourez le catalogue librement et contactez le vendeur pour conclure la vente.",
};

export const viewport: Viewport = {
  themeColor: "#fdfbf7",
  /* `maximum-scale` n'est pas verrouillé : empêcher le zoom rend
     l'application inutilisable pour qui voit mal. */
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
