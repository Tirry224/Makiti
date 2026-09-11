"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/data/session";
import type { ActionState } from "@/lib/actions/auth";

/** Écran 13 — création de la boutique, étape 2 de l'inscription commerçant.
 * La policy "merchants: je cree ma boutique" (0002) vérifie déjà que
 * `profile_id` appartient au commerçant connecté ; inutile de le
 * revérifier ici, mais on a besoin de l'id pour l'insertion. */
export async function createMerchantAction(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const shopName = String(formData.get("shopName") ?? "").trim();
  const cityId = Number(formData.get("cityId") ?? 0);
  const addressHint = String(formData.get("addressHint") ?? "").trim();
  const whatsappPhone = String(formData.get("whatsappPhone") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!shopName || !cityId) {
    return { error: "Le nom de la boutique et la ville sont obligatoires." };
  }

  const supabase = await createClient();
  const merchantProfile = await getMyProfile(supabase, "merchant");
  if (!merchantProfile) return { error: "Vous devez d'abord créer un compte commerçant." };

  const { error } = await supabase.from("merchants").insert({
    profile_id: merchantProfile.id,
    shop_name: shopName,
    city_id: cityId,
    address_hint: addressHint || null,
    whatsapp_phone: whatsappPhone || null,
    description: description || null,
  });
  if (error) {
    if (error.code === "23505") return { error: "Vous avez déjà une boutique." };
    return { error: error.message };
  }

  redirect("/vendeur/attente");
}
