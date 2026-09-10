/**
 * La recherche, à un seul endroit.
 *
 * Le fil d'accueil et l'écran de recherche appliquent exactement les mêmes
 * règles. Les écrire deux fois, c'est garantir qu'elles divergeront le jour
 * où l'une des deux sera corrigée.
 *
 * Ce fichier disparaîtra quand la page appellera `search_products` en base
 * — mais les règles, elles, ne changeront pas : c'est pour ça qu'elles sont
 * isolées ici plutôt que dispersées dans les pages.
 */

import { categories, products, featuredProduct } from "./mock";
import type { Product } from "./types";

/** Sans accents et sans majuscules : « telephone » doit trouver « Téléphone ». */
export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export type Tri = "recent" | "populaire";

export type Filtres = {
  q: string;
  ville: string | null;
  categorie: string | null; // slug
  etat: "neuf" | "occasion" | null;
  tri: Tri;
};

/** Lit les filtres depuis l'URL. Une valeur inconnue est ignorée, jamais fatale. */
export function lireFiltres(params: Record<string, string | undefined>): Filtres {
  const cat = params.categorie ?? null;
  const etat = params.etat === "neuf" || params.etat === "occasion" ? params.etat : null;
  return {
    q: params.q ?? "",
    ville: params.ville ?? null,
    categorie: categories.some((c) => c.slug === cat) ? cat : null,
    etat,
    tri: params.tri === "populaire" ? "populaire" : "recent",
  };
}

/** Reconstruit l'URL de recherche en changeant UN filtre. */
export function lien(f: Filtres, patch: Partial<Filtres>): string {
  const n = { ...f, ...patch };
  const p = new URLSearchParams();
  if (n.q) p.set("q", n.q);
  if (n.ville) p.set("ville", n.ville);
  if (n.categorie) p.set("categorie", n.categorie);
  if (n.etat) p.set("etat", n.etat);
  if (n.tri !== "recent") p.set("tri", n.tri);
  const s = p.toString();
  return s ? `/recherche?${s}` : "/recherche";
}

const catalogue = () => [featuredProduct, ...products];

/** Un produit est visible s'il est publié : ni brouillon, ni masqué. */
const publie = (p: Product) => p.status === "active" || p.status === "sold";

function correspond(p: Product, mot: string): boolean {
  if (!mot) return true;
  return [p.title, p.description ?? "", p.merchant.shopName].some((champ) =>
    normalize(champ).includes(mot),
  );
}

/**
 * Applique tous les filtres SAUF un, nommé.
 *
 * Sert à compter ce que donnerait chaque choix d'un filtre sans l'appliquer
 * — le « 2 » à côté de « Téléphones » dans la feuille de filtre. Compter à
 * l'ouverture de la feuille évite un aller-retour réseau pour découvrir
 * qu'une catégorie est vide.
 */
export function chercher(f: Filtres, sauf?: keyof Filtres): Product[] {
  const mot = normalize(f.q);
  const nomCategorie = categories.find((c) => c.slug === f.categorie)?.nom;

  return catalogue()
    .filter(publie)
    .filter((p) => sauf === "q" || correspond(p, mot))
    .filter((p) => sauf === "ville" || !f.ville || p.merchant.city === f.ville)
    .filter((p) => sauf === "categorie" || !nomCategorie || p.category === nomCategorie)
    .filter((p) => sauf === "etat" || !f.etat || p.condition === f.etat)
    .sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      if (f.tri === "populaire") return b.contactCount - a.contactCount;
      return 0; // « récent » : l'ordre du catalogue fait foi tant qu'il n'y a pas de date
    });
}

/**
 * Mots qui désignent ce que Makiti ne vend pas.
 *
 * Heuristique volontairement bête et volontairement courte. Elle ne sert
 * qu'à distinguer deux échecs très différents : « personne ne vend ça
 * ENCORE » et « ça ne se vend PAS ici ». Se tromper coûte peu — on affiche
 * l'écran vide ordinaire — alors que ne rien distinguer coûte trois essais
 * inutiles à la personne.
 *
 * À nourrir avec les vraies recherches infructueuses une fois en ligne :
 * c'est la seule source fiable, et elle dira aussi quelles catégories
 * manquent.
 */
const HORS_PERIMETRE: { mots: string[]; famille: string }[] = [
  { famille: "d'électroménager", mots: ["frigo", "refrigerateur", "congelateur", "climatiseur", "clim", "machine a laver", "micro-onde", "cuisiniere", "ventilateur", "television", "tele", "tv"] },
  { famille: "de nourriture", mots: ["riz", "huile", "sucre", "lait", "farine", "poisson", "viande", "manioc", "attieke"] },
  { famille: "de matériaux de construction", mots: ["ciment", "fer a beton", "brique", "tole", "sable", "gravier", "peinture", "carrelage"] },
  { famille: "de meubles", mots: ["canape", "matelas", "lit", "armoire", "table", "chaise", "salon"] },
  { famille: "de véhicules", mots: ["voiture", "moto", "taxi", "camion", "velo", "scooter"] },
  { famille: "d'animaux", mots: ["mouton", "chevre", "poulet", "boeuf", "chien", "chat"] },
  { famille: "de terrains ni de logements", mots: ["terrain", "parcelle", "maison", "villa", "appartement", "chambre", "location"] },
];

/**
 * Renvoie la famille de produits demandée si elle est hors périmètre.
 *
 * Ne se déclenche que sur un mot ENTIER : « television » sort du périmètre,
 * « telephone » n'a rien à voir malgré les lettres communes.
 */
export function horsPerimetre(q: string): string | null {
  const mot = normalize(q);
  if (!mot) return null;
  const mots = mot.split(/[^a-z0-9]+/).filter(Boolean);
  for (const { mots: liste, famille } of HORS_PERIMETRE) {
    for (const candidat of liste) {
      const morceaux = candidat.split(" ");
      const present = morceaux.every((m) => mots.includes(m));
      if (present) return famille;
    }
  }
  return null;
}
