"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyMerchant } from "@/lib/data/merchants";
import type { ActionState } from "@/lib/actions/auth";

/** Un commerçant approuvé ou non peut préparer des produits (ils resteront
 * en brouillon) ; seule la PUBLICATION est bloquée par le trigger
 * `products_check_publishable` tant que la boutique n'est pas approuvée. */
async function requireMerchantId(): Promise<{ merchantId: string } | { error: string }> {
  const supabase = await createClient();
  const merchant = await getMyMerchant(supabase);
  if (!merchant) return { error: "Vous devez d'abord créer une boutique." };
  return { merchantId: merchant.id };
}

function readProductFields(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    categoryId: Number(formData.get("categoryId") ?? 0),
    priceGnf: Number(formData.get("priceGnf") ?? 0),
    isNegotiable: formData.get("isNegotiable") === "on",
    description: String(formData.get("description") ?? "").trim(),
    imagePaths: formData.getAll("imagePaths").map(String).filter(Boolean),
  };
}

function validateProductFields(fields: ReturnType<typeof readProductFields>): string | null {
  if (fields.title.length < 3 || fields.title.length > 120) {
    return "Le titre doit faire entre 3 et 120 caractères.";
  }
  if (!fields.categoryId) return "Choisissez une catégorie.";
  if (!Number.isFinite(fields.priceGnf) || fields.priceGnf < 0) return "Le prix n'est pas valide.";
  if (fields.description.length > 2000) return "La description est trop longue.";
  return null;
}

/**
 * Nouveau produit — écran 24. `productId` est généré côté navigateur
 * (`ProductForm`) AVANT l'appel : c'est le même identifiant que
 * `PhotoPicker` utilise déjà pour construire le chemin de chaque photo
 * envoyée dans Storage, donc les photos existent en base (`storage.objects`)
 * avant même que la ligne `products` ne soit créée.
 *
 * Insertion en deux temps, jamais en un seul : le trigger
 * `products_check_publishable` (0002) refuse `status = 'active'` tant
 * qu'aucune ligne `product_images` ne référence CE produit — impossible à
 * satisfaire dans le insert qui crée justement ce produit. On insère donc
 * toujours en `draft`, on rattache les photos, puis on publie si demandé.
 */
export async function createProductAction(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const owner = await requireMerchantId();
  if ("error" in owner) return owner;

  const productId = String(formData.get("productId") ?? "");
  if (!productId) return { error: "Formulaire invalide, rechargez la page." };

  const fields = readProductFields(formData);
  const fieldError = validateProductFields(fields);
  if (fieldError) return { error: fieldError };

  const publish = formData.get("intent") === "publish";
  if (publish && fields.imagePaths.length === 0) {
    return { error: "Ajoutez au moins une photo avant de publier." };
  }

  const supabase = await createClient();

  const { error: insertError } = await supabase.from("products").insert({
    id: productId,
    merchant_id: owner.merchantId,
    category_id: fields.categoryId,
    title: fields.title,
    description: fields.description || null,
    price_gnf: fields.priceGnf,
    is_negotiable: fields.isNegotiable,
    status: "draft",
  });
  if (insertError) return { error: insertError.message };

  if (fields.imagePaths.length > 0) {
    const { error: imagesError } = await supabase.from("product_images").insert(
      fields.imagePaths.map((storage_path, position) => ({ product_id: productId, storage_path, position })),
    );
    if (imagesError) return { error: imagesError.message };
  }

  if (publish) {
    const { error: publishError } = await supabase
      .from("products")
      .update({ status: "active" })
      .eq("id", productId);
    if (publishError) return { error: publishError.message };
  }

  redirect("/vendeur");
}

/**
 * Modifier un produit — écran 25 (« Modifier le produit »). Ne touche
 * jamais `status` : un produit vendu ou masqué le reste après une
 * correction de prix, ce sont des actions séparées (voir plus bas).
 */
export async function updateProductAction(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return { error: "Formulaire invalide, rechargez la page." };

  const fields = readProductFields(formData);
  const fieldError = validateProductFields(fields);
  if (fieldError) return { error: fieldError };

  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("products")
    .update({
      category_id: fields.categoryId,
      title: fields.title,
      description: fields.description || null,
      price_gnf: fields.priceGnf,
      is_negotiable: fields.isNegotiable,
    })
    .eq("id", productId);
  if (updateError) return { error: updateError.message };

  // Remplace toutes les lignes `product_images` par la liste finale envoyée
  // par `PhotoPicker`, plutôt que de comparer ancien/nouveau photo par
  // photo : `unique (product_id, position)` rendrait ce calcul fragile dès
  // qu'une photo du milieu est retirée (les positions suivantes se
  // décalent). Les fichiers dans Storage, eux, sont déjà supprimés par
  // `PhotoPicker` au moment du clic sur « retirer » — voir ce fichier.
  await supabase.from("product_images").delete().eq("product_id", productId);
  if (fields.imagePaths.length > 0) {
    const { error: imagesError } = await supabase.from("product_images").insert(
      fields.imagePaths.map((storage_path, position) => ({ product_id: productId, storage_path, position })),
    );
    if (imagesError) return { error: imagesError.message };
  }

  redirect("/vendeur");
}

async function setProductStatus(formData: FormData, status: "active" | "sold" | "hidden") {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;
  const supabase = await createClient();
  await supabase.from("products").update({ status }).eq("id", productId);
  redirect("/vendeur");
}

/** Marquer vendu — le produit reste visible, barré (écran 25). */
export async function markSoldAction(formData: FormData) {
  await setProductStatus(formData, "sold");
}

/** Masquer du catalogue — réversible, contrairement à la suppression. */
export async function hideProductAction(formData: FormData) {
  await setProductStatus(formData, "hidden");
}

/** Republier un produit masqué. Repasse par le même trigger que la
 * publication initiale : refusé si la boutique n'est plus approuvée. */
export async function republishProductAction(formData: FormData) {
  await setProductStatus(formData, "active");
}

/** Suppression définitive — les conversations qui citent ce produit sont
 * conservées : `messages.product_id` référence `products` en
 * `on delete set null` (0001_schema.sql), donc la ligne du produit
 * disparaît mais pas les messages qui le citaient. */
export async function deleteProductAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", productId);
  redirect("/vendeur");
}
