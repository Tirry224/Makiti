"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpLeft, Clock } from "lucide-react";

const CLE = "makiti.recherches";
const MAX = 5;

function lire(): string[] {
  try {
    const brut = localStorage.getItem(CLE);
    const liste: unknown = brut ? JSON.parse(brut) : [];
    return Array.isArray(liste) ? liste.filter((v): v is string => typeof v === "string") : [];
  } catch {
    /* Navigation privée, stockage plein, cookies refusés : on n'a pas
       d'historique, et ce n'est pas une raison pour casser l'écran. */
    return [];
  }
}

/**
 * Les dernières recherches, gardées DANS LE NAVIGATEUR.
 *
 * ── Pourquoi pas en base ────────────────────────────────────────────────
 *
 * Le catalogue se consulte sans compte : lier l'historique à un compte le
 * priverait de la moitié des gens. `localStorage` ne coûte ni requête, ni
 * table, ni octet de réseau, et ne quitte jamais l'appareil — donc rien à
 * protéger, rien à supprimer sur demande.
 *
 * ── Pourquoi un composant client ────────────────────────────────────────
 *
 * `localStorage` n'existe pas sur le serveur. Le premier rendu affiche
 * donc une liste vide, remplie juste après par l'effet. C'est voulu : le
 * contraire ferait clignoter une liste puis disparaître.
 *
 * Le composant sert aussi de MÉMOIRE silencieuse (`afficher={false}`) sur
 * l'écran de résultats : c'est là qu'une recherche mérite d'être retenue,
 * puisqu'elle a été réellement lancée.
 */
export function RecherchesRecentes({ q, afficher }: { q: string; afficher: boolean }) {
  const [recentes, setRecentes] = useState<string[]>([]);

  useEffect(() => {
    const precedentes = lire();
    const mot = q.trim();
    if (!mot) {
      setRecentes(precedentes);
      return;
    }
    /* La recherche relancée remonte en tête au lieu d'être dupliquée. */
    const liste = [mot, ...precedentes.filter((r) => r !== mot)].slice(0, MAX);
    setRecentes(liste);
    try {
      localStorage.setItem(CLE, JSON.stringify(liste));
    } catch {
      /* Rien à faire : ne pas pouvoir se souvenir n'empêche pas de chercher. */
    }
  }, [q]);

  function effacer() {
    setRecentes([]);
    try {
      localStorage.removeItem(CLE);
    } catch {
      /* Idem. */
    }
  }

  if (!afficher || recentes.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-ink-soft uppercase">
          Recherches récentes
        </span>
        <button type="button" onClick={effacer} className="cursor-pointer text-sm font-semibold text-accent">
          Effacer
        </button>
      </div>
      <div>
        {recentes.map((mot) => (
          <Link
            key={mot}
            href={`/recherche?q=${encodeURIComponent(mot)}`}
            prefetch={false}
            className="flex h-11 items-center gap-3 border-b border-line last:border-b-0"
          >
            <Clock size={18} strokeWidth={1.7} className="shrink-0 text-ink-soft" aria-hidden />
            <span className="flex-1 truncate text-base">{mot}</span>
            <ArrowUpLeft size={17} strokeWidth={2} className="shrink-0 text-ink-soft" aria-hidden />
          </Link>
        ))}
      </div>
    </div>
  );
}
