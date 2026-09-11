"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { updatePasswordAction, type ActionState } from "@/lib/actions/auth";

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState<ActionState | null, FormData>(updatePasswordAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Nouveau mot de passe" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="new-password" placeholder="8 caractères minimum" />
      </Field>

      {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer le mot de passe"}
      </Button>
    </form>
  );
}
