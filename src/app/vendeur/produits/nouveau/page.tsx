import { redirect } from "next/navigation";
import { ProductForm } from "@/components/product/ProductForm";
import { Screen } from "@/components/ui/Screen";
import { TopBar } from "@/components/ui/TopBar";
import { createClient } from "@/lib/supabase/server";
import { getMyMerchant } from "@/lib/data/merchants";
import { getCategories } from "@/lib/data/reference";

/**
 * Écran 24 — ajouter un produit. Une boutique en attente peut déjà
 * préparer des produits (ils resteront en brouillon, voir
 * `/vendeur/attente`) ; seule la publication exige une boutique approuvée
 * — c'est `products_check_publishable` (0002) qui tranche, pas cet écran.
 */
export default async function NewProductPage() {
  const supabase = await createClient();
  const merchant = await getMyMerchant(supabase);
  if (!merchant) redirect("/inscription/boutique");

  const categories = await getCategories(supabase);

  return (
    <Screen>
      <TopBar title="Nouveau produit" backHref="/vendeur" />
      <ProductForm mode="create" merchantId={merchant.id} categories={categories} />
    </Screen>
  );
}
