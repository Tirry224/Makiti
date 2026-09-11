import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type CityOption = { id: number; name: string };
export type CategoryOption = { id: number; name: string };

/** Les 12 villes de 0003_search_and_seed.sql, dans l'ordre d'affichage voulu. */
export async function getCities(supabase: SupabaseClient<Database>): Promise<CityOption[]> {
  const { data, error } = await supabase.from("cities").select("id, name").order("position");
  if (error) throw error;
  return data;
}

/** Les 10 catégories de 0003_search_and_seed.sql. */
export async function getCategories(supabase: SupabaseClient<Database>): Promise<CategoryOption[]> {
  const { data, error } = await supabase.from("categories").select("id, name").order("position");
  if (error) throw error;
  return data;
}
