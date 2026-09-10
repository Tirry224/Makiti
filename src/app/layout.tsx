import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "@/styles/index.css";

/**
 * UNE SEULE police, et c'est une décision de performance assumée.
 *
 * Le projet en chargeait deux : Figtree pour le texte, Bricolage Grotesque
 * pour les titres. 60 Ko à la première visite, dont 40 pour les seuls
 * titres — un quart du poids de l'application pour une nuance que personne
 * ne remarque sur 390 px de large. Les titres gardent leur présence par la
 * graisse et l'interlettrage, pas par une seconde famille.
 *
 * Next héberge la police lui-même : le navigateur ne contacte jamais
 * Google au chargement. Un aller-retour réseau de moins, et rien qui fuit.
 *
 * `variable` la publie comme variable CSS, que tokens.css récupère dans
 * --font-sans et --font-display. Les composants ne connaissent donc jamais
 * le nom d'une police : le jour où l'on rouvre la question, un seul fichier
 * change.
 */
const body = Figtree({
  subsets: ["latin"],
  variable: "--font-body-src",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Makiti — Achetez et vendez près de chez vous",
  description:
    "Makiti met en relation les commerçants de Guinée et leurs clients. Publiez vos produits, contactez les vendeurs.",
};

export const viewport: Viewport = {
  themeColor: "#fdfbf7",
  /* `maximum-scale` n'est pas verrouillé : empêcher le zoom rend
     l'application inutilisable pour qui voit mal. */
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={body.variable}>
      <body>{children}</body>
    </html>
  );
}
