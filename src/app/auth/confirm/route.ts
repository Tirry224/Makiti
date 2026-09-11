import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Route technique, absente de docs/ECRANS.md : le lien envoyé par
 * `resetPasswordForEmail` pointe ici avec un `code` PKCE. L'échange
 * code → session doit se faire dans un Route Handler (seul endroit où
 * `next/headers` peut vraiment écrire des cookies) — un composant serveur
 * ne le peut pas, voir le commentaire de `createClient` dans
 * `src/lib/supabase/server.ts`.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/reinitialiser-mot-de-passe";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/mot-de-passe-oublie?erreur=lien_invalide`);
}
