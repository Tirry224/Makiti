/**
 * Le magasin de démonstration : des données qui CHANGENT.
 *
 * ── Pourquoi ce fichier existe ──────────────────────────────────────────
 *
 * Les actions validaient, orientaient, refusaient — et n'enregistraient
 * rien. Vu du code, « tout était branché ». Vu de l'écran, publier un
 * produit renvoyait sur une liste où il n'apparaissait pas : exactement la
 * sensation que rien n'a changé. Un formulaire qui accepte puis oublie est
 * pire qu'un bouton mort : il ment.
 *
 * Ce magasin garde les changements EN MÉMOIRE, le temps que la base
 * arrive. Il rend le parcours complet jouable : je publie, je vois mon
 * produit ; j'écris, je vois mon message ; je marque vendu, la liste le
 * dit.
 *
 * ── Ce qu'il n'est PAS ──────────────────────────────────────────────────
 *
 * Ce n'est pas une base de données, et il ne doit jamais le devenir :
 *
 * - tout disparaît au redémarrage du serveur ;
 * - sur un hébergement qui répartit les requêtes entre plusieurs machines
 *   (Vercel, par exemple), deux visiteurs ne verraient pas la même chose ;
 * - aucune règle de sécurité : n'importe qui modifie n'importe quoi.
 *
 * Il sert à JOUER le parcours, pas à le tenir. À l'étape 3, chaque
 * fonction d'ici devient une requête Supabase, et ce fichier disparaît.
 *
 * ── Le `globalThis` ─────────────────────────────────────────────────────
 *
 * En développement, Next recharge les modules à chaque enregistrement de
 * fichier. Un simple `let` serait remis à zéro toutes les dix secondes et
 * on croirait à un bug. L'état est donc accroché à `globalThis`, qui
 * survit aux rechargements.
 */

import {
  conversation as conversationInitiale,
  products as produitsInitiaux,
  featuredProduct,
  threads as filsInitiaux,
} from "./mock";
import type { Message, Product, ProductStatus, Thread } from "./types";

type Etat = {
  produits: Product[];
  messages: Message[];
  fils: Thread[];
  /** Numéro incrémental pour fabriquer des identifiants lisibles. */
  compteur: number;
};

const CLE = Symbol.for("makiti.magasin");

function etat(): Etat {
  const global = globalThis as unknown as Record<symbol, Etat | undefined>;
  if (!global[CLE]) {
    global[CLE] = {
      produits: [featuredProduct, ...produitsInitiaux],
      messages: [...conversationInitiale],
      fils: filsInitiaux.map((f) => ({ ...f })),
      compteur: 1,
    };
  }
  return global[CLE];
}

/* ─────────────────────────────────────────────────────────────────────
   Lecture
   ───────────────────────────────────────────────────────────────────── */

export function tousLesProduits(): Product[] {
  return etat().produits;
}

export function trouverProduit(id: string): Product | undefined {
  return etat().produits.find((p) => p.id === id);
}

/** Les produits d'une boutique, brouillons compris — la vue du commerçant. */
export function produitsDeLaBoutique(merchantId: string): Product[] {
  return etat().produits.filter((p) => p.merchant.id === merchantId);
}

export function conversationDuFil(): Message[] {
  return etat().messages;
}

export function tousLesFils(): Thread[] {
  return etat().fils;
}

/* ─────────────────────────────────────────────────────────────────────
   Écriture
   ───────────────────────────────────────────────────────────────────── */

export type NouveauProduit = {
  titre: string;
  categorie: string;
  prixGnf: number;
  description: string | null;
  negociable: boolean;
  condition: Product["condition"];
  photos: number;
  brouillon: boolean;
};

export function ajouterProduit(p: NouveauProduit): Product {
  const e = etat();
  const produit: Product = {
    /* Le commerçant de démonstration est toujours le même : sans session,
       on ne sait pas qui publie. La session viendra avec l'authentification. */
    id: `p-${++e.compteur}`,
    merchant: produitsInitiaux[0].merchant,
    category: p.categorie,
    condition: p.condition,
    title: p.titre,
    description: p.description,
    priceGnf: p.prixGnf,
    isNegotiable: p.negociable,
    status: p.brouillon ? "draft" : "active",
    isFeatured: false,
    contactCount: 0,
    photoCount: Math.max(1, p.photos),
  };
  /* En tête de liste : le commerçant vient de le publier, il doit le voir
     sans chercher. */
  e.produits.unshift(produit);
  return produit;
}

export function changerStatutProduit(id: string, statut: ProductStatus): boolean {
  const produit = trouverProduit(id);
  if (!produit) return false;
  produit.status = statut;
  return true;
}

export function supprimerProduit(id: string): boolean {
  const e = etat();
  const avant = e.produits.length;
  e.produits = e.produits.filter((p) => p.id !== id);
  return e.produits.length !== avant;
}

export function ajouterMessage(filId: string, corps: string, produitId?: string): void {
  const e = etat();
  const produit = produitId ? trouverProduit(produitId) : undefined;

  e.messages.push({
    id: `msg-${++e.compteur}`,
    /* `mine` vaut toujours vrai : sans session, l'expéditeur ne peut être
       que « moi ». C'est la limite honnête de la démonstration. */
    mine: true,
    product: produit
      ? { id: produit.id, title: produit.title, priceGnf: produit.priceGnf, status: produit.status }
      : null,
    body: corps,
    sentAt: heure(),
  });

  /* La liste des conversations doit suivre : un fil dont le dernier
     message n'est pas le dernier message envoyé est un fil qui ment. */
  const fil = e.fils.find((f) => f.id === filId);
  if (fil) {
    fil.lastMessage = corps;
    fil.lastAt = heure();
    fil.unreadCount = 0;
    if (produit) fil.lastProductTitle = produit.title;
  }
}

function heure(): string {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
