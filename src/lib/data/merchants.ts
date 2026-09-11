import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { Merchant, Product } from "@/lib/types";

type MerchantRow = {
  id: string;
  shop_name: string;
  description: string | null;
  address_hint: string | null;
  whatsapp_phone: string | null;
  status: Database["public"]["Enums"]["merchant_status"];
  rejection_reason: string | null;
  cities: { name: string } | null;
};

function mapMerchant(row: MerchantRow): Merchant {
  return {
    id: row.id,
    shopName: row.shop_name,
    description: row.description,
    city: row.cities?.name ?? "",
    addressHint: row.address_hint,
    whatsappPhone: row.whatsapp_phone,
    status: row.status,
    rejectionReason: row.rejection_reason,
  };
}

/**
 * Boutique publique (écran 11). RLS ne laisse un visiteur lire qu'une
 * boutique `approved` — une boutique en attente ou refusée renvoie donc
 * `null` ici, exactement comme si elle n'existait pas. C'est voulu : ce
 * n'est pas à ce visiteur de savoir qu'une boutique existe mais attend
 * une validation.
 */
export async function getMerchant(supabase: SupabaseClient<Database>, id: string): Promise<Merchant | null> {
  const { data, error } = await supabase
    .from("merchants")
    .select("id, shop_name, description, address_hint, whatsapp_phone, status, rejection_reason, cities(name)")
    .eq("id", id)
    .maybeSingle<MerchantRow>();
  if (error) throw error;
  if (!data) return null;
  return mapMerchant(data);
}

type MerchantProductRow = {
  id: string;
  title: string;
  price_gnf: number;
  is_negotiable: boolean;
  status: Database["public"]["Enums"]["product_status"];
  is_featured: boolean;
  contact_count: number;
  categories: { name: string } | null;
};

/** Catalogue d'une boutique (écran 11) : RLS filtre déjà les brouillons et
 * les produits masqués, y compris pour un visiteur non connecté. */
export async function getMerchantProducts(
  supabase: SupabaseClient<Database>,
  merchant: Merchant,
): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, title, price_gnf, is_negotiable, status, is_featured, contact_count, categories(name)")
    .eq("merchant_id", merchant.id)
    .order("created_at", { ascending: false })
    .returns<MerchantProductRow[]>();
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    merchant: { id: merchant.id, shopName: merchant.shopName, city: merchant.city, addressHint: merchant.addressHint },
    category: row.categories?.name ?? "",
    title: row.title,
    description: null,
    priceGnf: row.price_gnf,
    isNegotiable: row.is_negotiable,
    status: row.status,
    isFeatured: row.is_featured,
    contactCount: row.contact_count,
    photoCount: 0,
  }));
}
