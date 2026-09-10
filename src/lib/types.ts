/**
 * Types du domaine.
 *
 * Ils reproduisent le schéma de `supabase/migrations/`. Quand le projet
 * Supabase existera, ce fichier sera REMPLACÉ par des types générés
 * automatiquement depuis la base (`supabase gen types typescript`), ce qui
 * garantit qu'ils ne pourront plus se désynchroniser du schéma réel.
 * En attendant, ils servent à typer les données de démonstration.
 */

export type ProductStatus = "draft" | "active" | "sold" | "hidden";
export type MerchantStatus = "pending" | "approved" | "rejected";
export type UserRole = "client" | "merchant";

export type Merchant = {
  id: string;
  shopName: string;
  description: string | null;
  city: string;
  addressHint: string | null;
  whatsappPhone: string | null;
  status: MerchantStatus;
};

export type Product = {
  id: string;
  merchant: Pick<Merchant, "id" | "shopName" | "city" | "addressHint">;
  category: string;
  title: string;
  description: string | null;
  priceGnf: number;
  isNegotiable: boolean;
  status: ProductStatus;
  isFeatured: boolean;
  contactCount: number;
  /** Nombre de photos. Aucune vraie image n'existe encore. */
  photoCount: number;
};

export type Message = {
  id: string;
  /** `true` si c'est l'utilisateur courant qui a écrit. */
  mine: boolean;
  /** Produit cité par ce message. Le premier message d'un fil en a toujours un. */
  product: Pick<Product, "id" | "title" | "priceGnf" | "status"> | null;
  body: string;
  sentAt: string;
};

export type Thread = {
  id: string;
  /** Nom affiché : la boutique côté client, la personne côté commerçant. */
  peerName: string;
  peerKind: "shop" | "person";
  lastProductTitle: string;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
};
