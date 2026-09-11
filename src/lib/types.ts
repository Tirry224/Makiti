/**
 * Types du domaine — ce que les écrans et les composants manipulent.
 *
 * Ils ne sont volontairement PAS les types générés depuis la base : ceux-là
 * vivent dans `database.types.ts`, en snake_case, et décrivent des tables.
 * Ici on décrit ce qu'un écran affiche, ce qui n'est pas la même chose : la
 * vignette du fil n'a pas besoin de `category_id`, elle a besoin du NOM de
 * la catégorie, et elle veut l'adresse des photos, pas des chemins de
 * stockage.
 *
 * `data.ts` est le seul endroit qui traduit entre les deux. Le jour où une
 * colonne est renommée, les types générés changent, `data.ts` refuse de
 * compiler, et les composants ne bougent pas — c'est le but.
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
  /** Adresses publiques des photos, dans l'ordre d'affichage. */
  imageUrls: string[];
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
