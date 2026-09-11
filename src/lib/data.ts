import { imageUrl, supabase } from "./supabase";
import type { Merchant, Product } from "./types";

/**
 * Lecture du catalogue.
 *
 * C'est le SEUL fichier qui connaît la forme de la base. Les pages et les
 * composants parlent les types du domaine (`types.ts`), en camelCase, et
 * ignorent tout de PostgREST. Deux raisons de tenir cette frontière :
 *
 *   1. une migration qui renomme une colonne casse UN fichier, pas trente ;
 *   2. les composants restent testables sans base de données.
 *
 * Ce que ce fichier ne fait PAS : vérifier qui a le droit de voir quoi.
 * C'est le RLS qui s'en charge, dans la base. Un brouillon n'apparaît pas
 * dans le fil parce que la base refuse de le renvoyer à un visiteur — pas
 * parce qu'un filtre est écrit ici. Les filtres qu'on trouve plus bas
 * (`status in ('active','sold')` sur la boutique) sont des choix
 * d'AFFICHAGE, pas des barrières de sécurité : les deux existent, et il
 * faut savoir lequel est lequel.
 */

export type City = { id: number; name: string };
export type Category = { id: number; name: string; slug: string };

export async function getCities(): Promise<City[]> {
  const { data, error } = await supabase
    .from("cities")
    .select("id, name")
    .order("position");

  if (error) throw error;
  return data;
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("position");

  if (error) throw error;
  return data;
}

/**
 * Le fil d'accueil et la recherche sont la MÊME requête.
 *
 * Les deux écrans passent par `search_products`, la fonction SQL de
 * `0003_search_and_seed.sql` : l'accueil est simplement une recherche sans
 * mot-clé. Écrire deux requêtes séparées ferait inévitablement diverger le
 * tri des deux écrans — un produit « à la une » remonterait à un endroit et
 * pas à l'autre, sans que personne ne comprenne pourquoi.
 *
 * `cityName` et `categorySlug` sont des libellés lisibles parce qu'ils
 * viennent de l'URL (`/?ville=Boké`) : un lien partagé par WhatsApp doit
 * rester compréhensible. Ils sont traduits en identifiants ici.
 */
export async function searchCatalogue({
  query,
  cityName,
  categorySlug,
  sort = "recent",
  limit = 24,
}: {
  query?: string;
  cityName?: string;
  categorySlug?: string;
  sort?: "recent" | "popular";
  limit?: number;
}): Promise<Product[]> {
  let cityId: number | undefined;
  if (cityName) {
    const city = await findCityByName(cityName);
    /* Ville inconnue dans l'URL : on renvoie une liste vide plutôt que
       d'ignorer le filtre. Ignorer silencieusement un filtre demandé est
       le pire des deux mondes — l'écran affiche des produits d'ailleurs en
       prétendant montrer ceux d'ici. */
    if (!city) return [];
    cityId = city.id;
  }

  let categoryId: number | undefined;
  if (categorySlug) {
    const category = await findCategoryBySlug(categorySlug);
    if (!category) return [];
    categoryId = category.id;
  }

  const { data, error } = await supabase.rpc("search_products", {
    p_query: query?.trim() || undefined,
    p_city_id: cityId,
    p_category_id: categoryId,
    p_sort: sort,
    p_limit: limit,
  });

  if (error) throw error;

  return data.map((row) => ({
    id: row.product_id,
    merchant: {
      id: row.merchant_id,
      shopName: row.shop_name,
      city: row.city_name,
      addressHint: null,
    },
    category: row.category_name,
    title: row.title,
    description: null,
    priceGnf: row.price_gnf,
    isNegotiable: row.is_negotiable,
    status: row.status,
    isFeatured: row.is_featured,
    contactCount: row.contact_count,
    /* `image_path` est déclaré non-nul par les types générés, alors que la
       jointure SQL est un LEFT JOIN : un produit sans photo renvoie NULL.
       On garde donc le test, que le type juge inutile. */
    imageUrls: row.image_path ? [imageUrl(row.image_path)] : [],
  }));
}

/** Fiche produit. `null` si elle n'existe pas ou n'est pas visible. */
export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, title, description, price_gnf, is_negotiable, status, is_featured, contact_count,
       categories!inner ( name ),
       merchants!inner ( id, shop_name, address_hint, cities!inner ( name ) ),
       product_images ( storage_path, position )`,
    )
    .eq("id", id)
    .maybeSingle();

  /* Une erreur ici veut dire « identifiant impossible » (`/produit/abc` :
     Postgres refuse un UUID mal formé) et non « panne ». Dans les deux cas
     le visiteur doit voir la page « introuvable », pas un écran d'erreur. */
  if (error || !data) return null;

  return {
    id: data.id,
    merchant: {
      id: data.merchants.id,
      shopName: data.merchants.shop_name,
      city: data.merchants.cities.name,
      addressHint: data.merchants.address_hint,
    },
    category: data.categories.name,
    title: data.title,
    description: data.description,
    priceGnf: data.price_gnf,
    isNegotiable: data.is_negotiable,
    status: data.status,
    isFeatured: data.is_featured,
    contactCount: data.contact_count,
    imageUrls: data.product_images
      .sort((a, b) => a.position - b.position)
      .map((image) => imageUrl(image.storage_path)),
  };
}

/** Boutique publique et son catalogue. `null` si elle n'est pas visible. */
export async function getShop(
  id: string,
): Promise<{ merchant: Merchant; catalogue: Product[] } | null> {
  const { data, error } = await supabase
    .from("merchants")
    .select(
      `id, shop_name, description, address_hint, whatsapp_phone, status,
       cities!inner ( name )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const merchant: Merchant = {
    id: data.id,
    shopName: data.shop_name,
    description: data.description,
    city: data.cities.name,
    addressHint: data.address_hint,
    whatsappPhone: data.whatsapp_phone,
    status: data.status,
  };

  const { data: rows, error: catalogueError } = await supabase
    .from("products")
    .select(
      `id, title, description, price_gnf, is_negotiable, status, is_featured, contact_count,
       categories!inner ( name ),
       product_images ( storage_path, position )`,
    )
    .eq("merchant_id", id)
    /* Choix d'affichage, pas de sécurité : la boutique publique montre ce
       qui est en vente et ce qui est vendu (un rayon vide fait fuir), mais
       pas les brouillons du commerçant — même quand c'est lui qui regarde,
       il a `/vendeur/produits` pour ça. */
    .in("status", ["active", "sold"])
    .order("created_at", { ascending: false });

  if (catalogueError) throw catalogueError;

  const catalogue: Product[] = rows.map((row) => ({
    id: row.id,
    merchant: {
      id: merchant.id,
      shopName: merchant.shopName,
      city: merchant.city,
      addressHint: merchant.addressHint,
    },
    category: row.categories.name,
    title: row.title,
    description: row.description,
    priceGnf: row.price_gnf,
    isNegotiable: row.is_negotiable,
    status: row.status,
    isFeatured: row.is_featured,
    contactCount: row.contact_count,
    imageUrls: row.product_images
      .sort((a, b) => a.position - b.position)
      .map((image) => imageUrl(image.storage_path)),
  }));

  return { merchant, catalogue };
}

async function findCityByName(name: string): Promise<City | null> {
  const { data } = await supabase
    .from("cities")
    .select("id, name")
    .eq("name", name)
    .maybeSingle();

  return data;
}

async function findCategoryBySlug(slug: string): Promise<Category | null> {
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  return data;
}
