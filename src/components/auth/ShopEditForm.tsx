"use client";

import { useActionState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { updateMerchantAction } from "@/lib/actions/merchants";
import type { ActionState } from "@/lib/actions/auth";
import type { CityOption } from "@/lib/data/reference";
import type { Merchant } from "@/lib/types";

/**
 * Écran 26 — modifier ma boutique. `merchant.status` ne change jamais ici :
 * voir le commentaire de `updateMerchantAction` sur la promesse de
 * « nouvelle vérification » retirée de cet écran.
 *
 * Pas de `<ScreenBody>`/`<ScreenFooter>` ici : la page a besoin d'afficher
 * d'autres blocs (bascule d'espace, déconnexion) APRÈS ce formulaire mais
 * dans le même `<main>` — et ces blocs sont eux-mêmes de petites `<form>`
 * (voir `MenuItem`), qu'on ne peut pas imbriquer dans celle-ci. Le bouton
 * « Enregistrer » vit donc dans la barre du haut de la page, relié à ce
 * formulaire par l'attribut HTML `form`, pas par l'imbrication du JSX.
 */
export function ShopEditForm({
  merchant,
  cityId,
  cities,
}: {
  merchant: Merchant;
  cityId: number;
  cities: CityOption[];
}) {
  const [state, formAction] = useActionState<ActionState | null, FormData>(updateMerchantAction, null);

  return (
    <form id="shop-edit-form" action={formAction} className="flex flex-col gap-4">
      <div className="flex items-center gap-3.5">
        <Avatar name={merchant.shopName} kind="shop" size={64} />
      </div>

      <Field label="Nom de la boutique" htmlFor="shopName">
        <Input id="shopName" name="shopName" defaultValue={merchant.shopName} />
      </Field>

      <Field label="Ville" htmlFor="cityId">
        <Select id="cityId" name="cityId" defaultValue={cityId}>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Où vous trouver" htmlFor="addressHint">
        <Input id="addressHint" name="addressHint" defaultValue={merchant.addressHint ?? ""} />
      </Field>

      <Field label="Numéro WhatsApp" htmlFor="whatsappPhone">
        <Input
          id="whatsappPhone"
          name="whatsappPhone"
          type="tel"
          inputMode="tel"
          defaultValue={merchant.whatsappPhone ?? ""}
        />
      </Field>

      <Field label="Description" htmlFor="description">
        <Textarea id="description" name="description" rows={3} defaultValue={merchant.description ?? ""} />
      </Field>

      {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
    </form>
  );
}
