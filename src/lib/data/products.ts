import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { Product } from "@/lib/types";

type SearchRow = Database["public"]["Functions"]["search_products"]["Returns"][number];

/**
 * Traduit une ligne de `search_products` (schéma réel, snake_case) vers
 * le type `Product` que lisent les écrans (camelCase). Un seul endroit qui
 * connaît les deux formes : si demain la fonction SQL change de forme, ce
 * fichier est le seul à corriger, pas les ~15 écrans qui affichent un produit.
 */
function mapRow(row: SearchRow): Product {
  return {
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
    photoCount: row.image_path ? 1 : 0,
  };
}

/**
 * Fil d'accueil et recherche partagent la même fonction SQL (voir
 * 0003_search_and_seed.sql) ; ce module partage donc le même point d'entrée
 * côté app. `cityId` est obligatoire : contrairement à la catégorie, il n'y
 * a pas de fil « toutes villes » — décision 9 de docs/SPEC.md.
 */
export async function searchProducts(
  supabase: SupabaseClient<Database>,
  opts: {
    query?: string;
    cityId: number;
    categoryId?: number | null;
    sort?: "recent" | "popular";
    limit?: number;
  },
): Promise<Product[]> {
  const { data, error } = await supabase.rpc("search_products", {
    p_query: opts.query || undefined,
    p_city_id: opts.cityId,
    p_category_id: opts.categoryId ?? undefined,
    p_sort: opts.sort ?? "recent",
    p_limit: opts.limit ?? 24,
  });
  if (error) throw error;
  return data.map(mapRow);
}
