import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Assemble des classes CSS.
 *
 * Deux problèmes résolus d'un coup :
 *
 * 1. `clsx` accepte des conditions, des tableaux et des valeurs nulles, ce
 *    qui évite les concaténations de chaînes illisibles.
 *
 * 2. `twMerge` règle un piège réel de Tailwind. Si un composant applique
 *    `bg-accent` et qu'on lui passe `bg-danger` de l'extérieur, les deux
 *    classes se retrouvent sur l'élément — et c'est l'ORDRE DANS LA
 *    FEUILLE DE STYLE qui décide, pas l'ordre dans lequel tu les as
 *    écrites. Le résultat paraît alors aléatoire. `twMerge` sait que ces
 *    deux classes sont en conflit et ne garde que la dernière.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
