import Link from "next/link";
import {
  Car,
  Droplet,
  Plug,
  ShoppingBag,
  Shirt,
  Smartphone,
  Sparkles,
  Venus,
} from "lucide-react";
import { categories } from "@/lib/mock";

/**
 * Les 8 catégories en pavés.
 *
 * Sert deux écrans : la recherche au repos, et la recherche hors périmètre.
 * Dans les deux cas la personne n'a rien à lire — elle a besoin d'une porte
 * d'entrée. Une liste de huit tient sur un écran de téléphone ; c'est
 * exactement ce que la liste courte à un seul niveau rend possible.
 */
const ICONES: Record<string, typeof Smartphone> = {
  telephones: Smartphone,
  accessoires: Plug,
  "mode-femme": Venus,
  "mode-homme": Shirt,
  sacs: ShoppingBag,
  parfums: Droplet,
  beaute: Sparkles,
  "pieces-auto": Car,
};

export function CategorieGrille() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {categories.map((c) => {
        const Icon = ICONES[c.slug];
        return (
          <Link
            key={c.slug}
            href={`/recherche?categorie=${c.slug}`}
            prefetch={false}
            className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-3 text-sm font-semibold"
          >
            <Icon size={18} strokeWidth={1.7} aria-hidden className="shrink-0 text-accent" />
            <span className="leading-tight">{c.court}</span>
          </Link>
        );
      })}
    </div>
  );
}
