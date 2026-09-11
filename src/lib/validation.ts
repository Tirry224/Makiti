/**
 * Les règles de saisie, séparées des actions qui les appliquent.
 *
 * Pourquoi un fichier à part : ces fonctions seront rejouées **en base**
 * (contraintes SQL, triggers) à l'étape 3. Une règle écrite ici et nulle
 * part ailleurs est une règle qu'un client mal intentionné contourne en
 * envoyant la requête directement. Les garder isolées et lisibles rend la
 * traduction en SQL évidente au lieu d'obliger à relire huit formulaires.
 *
 * Aucune dépendance, aucune bibliothèque de validation : ces règles
 * tiennent en trente lignes et une bibliothèque pèserait plus lourd
 * qu'elles (docs/PERFORMANCE.md, règle R3).
 */

/** Codes d'erreur transportés par l'URL, faute de JavaScript côté client. */
export type CodeErreur =
  | "nom"
  | "telephone"
  | "email"
  | "motdepasse"
  | "identifiants"
  | "role"
  | "boutique"
  | "ville"
  | "adresse"
  | "whatsapp"
  | "titre"
  | "categorie"
  | "prix"
  | "photo"
  | "message"
  | "motif";

/**
 * Le texte montré à la personne. Il dit QUOI FAIRE, pas ce qui est faux :
 * « Champ invalide » n'aide personne à avancer.
 */
export const MESSAGES: Record<CodeErreur, string> = {
  nom: "Entrez votre nom complet, au moins deux lettres.",
  telephone: "Entrez un numéro guinéen à 9 chiffres, commençant par 6.",
  email: "Cette adresse email ne semble pas valide.",
  motdepasse: "Choisissez un mot de passe d'au moins 8 caractères.",
  identifiants: "Email ou mot de passe incorrect.",
  role: "Choisissez si vous venez acheter ou vendre.",
  boutique: "Donnez un nom à votre boutique, au moins deux lettres.",
  ville: "Choisissez votre ville.",
  adresse: "Indiquez où vos clients peuvent vous trouver.",
  whatsapp: "Entrez un numéro WhatsApp guinéen à 9 chiffres.",
  titre: "Donnez un titre d'au moins 5 caractères — c'est ce que le client lit en premier.",
  categorie: "Choisissez une catégorie.",
  prix: "Entrez un prix en francs guinéens, supérieur à zéro.",
  photo: "Ajoutez au moins une photo : sans photo, un produit ne se vend pas.",
  message: "Écrivez votre message avant de l'envoyer.",
  motif: "Choisissez un motif de signalement.",
};

/** Retire espaces, points et tirets d'un numéro saisi à la main. */
export function nettoyerTelephone(valeur: string): string {
  return valeur.replace(/[\s.\-()]/g, "").replace(/^\+224/, "").replace(/^00224/, "");
}

/**
 * Un mobile guinéen : neuf chiffres commençant par 6.
 *
 * Volontairement strict sur la forme, et volontairement AUCUNE preuve
 * d'identité : le numéro n'est pas vérifié par SMS (décision 1 de
 * SPEC.md). Il sert à joindre quelqu'un, pas à l'authentifier.
 */
export function estTelephone(valeur: string): boolean {
  return /^6\d{8}$/.test(nettoyerTelephone(valeur));
}

/**
 * Une adresse plausible, pas une adresse prouvée.
 *
 * Aucune expression régulière ne dit si un email existe : seule la
 * réception d'un message le dit. On écarte donc les fautes de frappe
 * évidentes, et c'est tout ce qu'on peut honnêtement faire ici.
 */
export function estEmail(valeur: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valeur.trim());
}

export function estTexte(valeur: string, minimum: number): boolean {
  return valeur.trim().length >= minimum;
}

/** Un prix en GNF : entier positif. Les centimes n'existent pas ici. */
export function lirePrix(valeur: string): number | null {
  const nombre = Number(valeur.replace(/[\s.]/g, ""));
  if (!Number.isInteger(nombre) || nombre <= 0) return null;
  return nombre;
}
