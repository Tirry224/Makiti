"use server";

/**
 * Les actions des formulaires.
 *
 * ── Pourquoi des Server Actions et pas du JavaScript de navigateur ──────
 *
 * Un `<form action={uneAction}>` est d'abord un formulaire HTML ordinaire.
 * Si le JavaScript n'est pas encore chargé — les longues secondes d'une
 * connexion à 50 kbit/s — le navigateur envoie le formulaire lui-même et
 * l'action s'exécute quand même. La page ne dépend donc jamais du réseau
 * pour être utilisable, seulement pour être jolie.
 *
 * ── Comment une erreur revient à l'écran sans JavaScript ────────────────
 *
 * Pas de `useActionState` : il exige un composant client, donc du
 * JavaScript, donc l'inverse de ce qu'on cherche. L'action redirige vers
 * la même page avec `?erreur=code`, la page lit le code et affiche le
 * message. L'URL porte l'état, comme partout ailleurs dans ce projet.
 *
 * Les valeurs déjà saisies repartent dans l'URL pour éviter de tout
 * retaper — SAUF les mots de passe, jamais, à aucun prix : une URL finit
 * dans l'historique du navigateur, dans les journaux du serveur et dans
 * le presse-papier de qui partage un lien.
 *
 * ── Ce que ces actions ne font PAS encore ───────────────────────────────
 *
 * Elles ne ENREGISTRENT rien : la base n'est pas branchée (étape 3). Elles
 * valident, elles orientent, elles refusent. Au branchement, une seule
 * ligne s'ajoute par action — l'appel à Supabase — et tout le reste, qui
 * est le travail réel, sera déjà écrit et déjà éprouvé à l'écran.
 */

import { redirect } from "next/navigation";
import {
  estEmail,
  estTelephone,
  estTexte,
  lirePrix,
  nettoyerTelephone,
  type CodeErreur,
} from "./validation";
import { categories } from "./mock";

/** Renvoie vers le formulaire avec le code d'erreur et les valeurs à garder. */
function refuser(page: string, code: CodeErreur, garder: Record<string, string> = {}): never {
  const params = new URLSearchParams({ erreur: code });
  for (const [cle, valeur] of Object.entries(garder)) {
    if (valeur) params.set(cle, valeur);
  }
  redirect(`${page}?${params}`);
}

const texte = (data: FormData, champ: string) => String(data.get(champ) ?? "").trim();

/* ─────────────────────────────────────────────────────────────────────
   Compte
   ───────────────────────────────────────────────────────────────────── */

/** Écran 12 — création de compte. Le rôle choisi décide de la suite. */
export async function creerCompte(data: FormData) {
  const role = texte(data, "role");
  const nom = texte(data, "nom");
  const telephone = texte(data, "telephone");
  const email = texte(data, "email");
  const motDePasse = String(data.get("motdepasse") ?? "");

  /* Les valeurs à réafficher en cas de refus. Le mot de passe n'y est
     jamais : il serait écrit en clair dans la barre d'adresse. */
  const garder = { role, nom, telephone, email };

  if (role !== "client" && role !== "commercant") refuser("/inscription", "role", garder);
  if (!estTexte(nom, 2)) refuser("/inscription", "nom", garder);
  if (!estTelephone(telephone)) refuser("/inscription", "telephone", garder);
  if (!estEmail(email)) refuser("/inscription", "email", garder);
  if (motDePasse.length < 8) refuser("/inscription", "motdepasse", garder);

  // TODO étape 3 : créer le compte Supabase et le profil.

  /* Un vendeur a une étape de plus ; un acheteur peut acheter tout de
     suite. Envoyer un acheteur sur un formulaire de boutique serait la
     meilleure façon de le perdre. */
  redirect(role === "commercant" ? "/inscription/boutique" : "/");
}

/** Écran 13 — la boutique du commerçant, vérifiée à la main ensuite. */
export async function creerBoutique(data: FormData) {
  const boutique = texte(data, "boutique");
  const ville = texte(data, "ville");
  const adresse = texte(data, "adresse");
  const whatsapp = texte(data, "whatsapp");
  const description = texte(data, "description");

  const garder = { boutique, ville, adresse, whatsapp, description };

  if (!estTexte(boutique, 2)) refuser("/inscription/boutique", "boutique", garder);
  if (!ville) refuser("/inscription/boutique", "ville", garder);
  if (!estTexte(adresse, 4)) refuser("/inscription/boutique", "adresse", garder);
  /* Le WhatsApp est facultatif, mais s'il est donné il doit être joignable :
     un numéro faux affiché sur la fiche produit coûte des clients au
     commerçant sans qu'il comprenne pourquoi. */
  if (whatsapp && !estTelephone(whatsapp)) refuser("/inscription/boutique", "whatsapp", garder);

  // TODO étape 3 : créer la boutique avec le statut « en attente ».
  redirect("/vendeur/attente");
}

/** Écran 14 — connexion. */
export async function seConnecter(data: FormData) {
  const email = texte(data, "email");
  const motDePasse = String(data.get("motdepasse") ?? "");

  if (!estEmail(email)) refuser("/connexion", "email", { email });
  if (motDePasse.length < 8) refuser("/connexion", "identifiants", { email });

  // TODO étape 3 : authentifier. Un échec renverra le code « identifiants »,
  // qui ne dit jamais lequel des deux est faux — sinon on offre à un
  // inconnu le moyen de découvrir quels emails ont un compte.
  redirect("/");
}

/** Écran 15 — mot de passe oublié. */
export async function envoyerLienMotDePasse(data: FormData) {
  const email = texte(data, "email");
  if (!estEmail(email)) refuser("/mot-de-passe-oublie", "email", { email });

  // TODO étape 3 : demander l'email de réinitialisation.

  /* La confirmation ne dit PAS si le compte existe, et l'action réussit
     donc toujours : c'est ce qui empêche de tester des adresses une par
     une pour savoir qui est inscrit. */
  redirect("/mot-de-passe-oublie?envoye=1");
}

/** Écran 18 — mise à jour de ses informations. */
export async function mettreAJourProfil(data: FormData) {
  const nom = texte(data, "nom");
  const telephone = texte(data, "telephone");

  if (!estTexte(nom, 2)) refuser("/compte/informations", "nom", { nom, telephone });
  if (!estTelephone(telephone)) refuser("/compte/informations", "telephone", { nom, telephone });

  // TODO étape 3 : mettre à jour le profil.
  redirect("/compte/informations?enregistre=1");
}

/* ─────────────────────────────────────────────────────────────────────
   Commerçant
   ───────────────────────────────────────────────────────────────────── */

/** Écran 24 — publier un produit. */
export async function publierProduit(data: FormData) {
  const titre = texte(data, "titre");
  const categorie = texte(data, "categorie");
  const prixSaisi = texte(data, "prix");
  const description = texte(data, "description");
  const negociable = data.get("negociable") === "on" ? "1" : "";
  const brouillon = data.get("brouillon") !== null;

  const garder = { titre, categorie, prix: prixSaisi, description, negociable };
  const page = "/vendeur/produits/nouveau";

  /* Un brouillon échappe aux règles : il sert justement à s'arrêter en
     cours de route. Seul le titre est exigé, pour retrouver son brouillon
     dans la liste. */
  if (!estTexte(titre, 5)) refuser(page, "titre", garder);
  if (brouillon) {
    // TODO étape 3 : enregistrer le brouillon.
    redirect("/vendeur");
  }

  if (!categories.some((c) => c.slug === categorie)) refuser(page, "categorie", garder);
  if (lirePrix(prixSaisi) === null) refuser(page, "prix", garder);

  /* 1 photo minimum, 3 maximum (décision 15 de SPEC.md). La règle est
     dite à l'écran avant d'agir, et revérifiée ici : les contraintes du
     navigateur se contournent. */
  const photos = data.getAll("photos").filter((f) => f instanceof File && f.size > 0);
  if (photos.length === 0) refuser(page, "photo", garder);
  if (photos.length > 3) refuser(page, "photo", garder);

  // TODO étape 3 : créer le produit, envoyer les photos, publier.
  redirect("/vendeur");
}

/** Écran 25 — vendu, masqué, supprimé. */
export async function changerEtatProduit(data: FormData) {
  const id = texte(data, "id");
  const action = texte(data, "action");
  if (!id) redirect("/vendeur");

  // TODO étape 3 : appliquer le changement de statut.
  void action;
  redirect("/vendeur");
}

/** Écran 26 — modifier sa boutique. */
export async function modifierBoutique(data: FormData) {
  const boutique = texte(data, "boutique");
  const ville = texte(data, "ville");
  const adresse = texte(data, "adresse");
  const whatsapp = texte(data, "whatsapp");
  const description = texte(data, "description");

  const garder = { boutique, ville, adresse, whatsapp, description };
  const page = "/vendeur/boutique";

  if (!estTexte(boutique, 2)) refuser(page, "boutique", garder);
  if (!ville) refuser(page, "ville", garder);
  if (!estTexte(adresse, 4)) refuser(page, "adresse", garder);
  if (whatsapp && !estTelephone(whatsapp)) refuser(page, "whatsapp", garder);

  /* Changer de nom ou de ville renvoie la boutique en vérification : sans
     ça, une boutique approuvée pourrait devenir n'importe quoi d'autre le
     lendemain de son approbation. */
  // TODO étape 3 : enregistrer, et repasser en « en attente » si le nom
  // ou la ville ont changé.
  redirect("/vendeur?enregistre=1");
}

/* ─────────────────────────────────────────────────────────────────────
   Messagerie et signalements
   ───────────────────────────────────────────────────────────────────── */

/** Écran 30 — envoyer un message dans un fil. */
export async function envoyerMessage(data: FormData) {
  const fil = texte(data, "fil");
  const corps = texte(data, "message");

  if (!fil) redirect("/messages");
  if (!estTexte(corps, 1)) refuser(`/messages/${fil}`, "message");

  // TODO étape 3 : insérer le message, marquer le fil comme non lu pour
  // l'autre partie, déclencher l'email de notification.
  redirect(`/messages/${fil}`);
}

/**
 * Écran 31 — joindre un produit au fil.
 *
 * C'est la pièce qui rend viable « un seul fil par client » : le fil ne
 * porte pas de produit, chaque message dit de quoi il parle. Le produit
 * choisi revient par l'URL et le champ de saisie s'ouvre avec lui en
 * tête — sans JavaScript, c'est la seule façon de porter ce choix d'un
 * écran à l'autre.
 */
export async function citerProduit(data: FormData) {
  const fil = texte(data, "fil");
  const produit = texte(data, "produit");

  if (!fil) redirect("/messages");
  if (!produit) redirect(`/messages/${fil}/citer`);

  redirect(`/messages/${fil}?produit=${encodeURIComponent(produit)}`);
}

/** Écrans 10 et 32 — signaler un produit ou une conversation. */
export async function signaler(data: FormData) {
  const motif = texte(data, "motif");
  const retour = texte(data, "retour") || "/";

  if (!motif) refuser(retour === "/" ? "/" : retour, "motif");

  // TODO étape 3 : enregistrer le signalement pour la modération.
  redirect(`${retour}${retour.includes("?") ? "&" : "?"}signale=1`);
}

/** Écran 32 — bloquer quelqu'un. */
export async function bloquer(data: FormData) {
  const fil = texte(data, "fil");
  if (!fil) redirect("/messages");

  // TODO étape 3 : le blocage n'a AUCUNE table à ce jour (voir CLAUDE.md,
  // décisions en attente). Il faudra la créer avant que ce bouton compte.
  redirect("/messages?bloque=1");
}
