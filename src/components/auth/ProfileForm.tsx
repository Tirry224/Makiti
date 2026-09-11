"use client";

import { useActionState } from "react";
import { Field, Input } from "@/components/ui/Field";
import { updateProfileAction } from "@/lib/actions/account";
import type { ActionState } from "@/lib/actions/auth";

/** Nom et téléphone — écran 18. Le bouton « Enregistrer » vit dans la
 * barre du haut de la page (relié par l'attribut HTML `form`), pas ici :
 * la page affiche aussi le mot de passe et la suppression du compte, qui
 * ne doivent pas se retrouver DANS ce formulaire. */
export function ProfileForm({
  id,
  fullName,
  phone,
}: {
  id: string;
  fullName: string;
  phone: string;
}) {
  const [state, formAction] = useActionState<ActionState | null, FormData>(updateProfileAction, null);

  return (
    <form id={id} action={formAction} className="flex flex-col gap-4">
      <Field label="Nom complet" htmlFor="fullName">
        <Input id="fullName" name="fullName" autoComplete="name" defaultValue={fullName} />
      </Field>
      <Field label="Téléphone" htmlFor="phone">
        <Input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={phone} />
      </Field>
      {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
    </form>
  );
}
