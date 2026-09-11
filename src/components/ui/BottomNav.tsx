import Link from "next/link";
import { House, MessageCircle, Search, User } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { key: "home", label: "Accueil", href: "/", icon: House },
  { key: "search", label: "Rechercher", href: "/recherche", icon: Search },
  { key: "messages", label: "Messages", href: "/messages", icon: MessageCircle },
  { key: "account", label: "Compte", href: "/compte", icon: User },
] as const;

export type NavTab = (typeof TABS)[number]["key"];

/**
 * `aria-current="page"` dit à un lecteur d'écran quel onglet est actif.
 * La couleur seule ne le dirait pas — et une information portée
 * uniquement par la couleur est invisible pour une partie des utilisateurs.
 *
 * `accountHref` distingue l'espace actif : un compte client et un compte
 * commerçant sont deux comptes liés mais jamais mélangés, donc l'onglet
 * Compte ne pointe pas vers le même écran selon l'espace où l'on se trouve
 * (voir `/compte` et `/vendeur/boutique`, qui fait aussi office de compte
 * côté commerçant).
 */
export function BottomNav({ active, accountHref = "/compte" }: { active: NavTab; accountHref?: string }) {
  return (
    <nav className="sticky bottom-0 flex shrink-0 border-t border-line bg-surface">
      {TABS.map(({ key, label, href: defaultHref, icon: Icon }) => {
        const href = key === "account" ? accountHref : defaultHref;
        const isActive = key === active;
        return (
          <Link
            key={key}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex h-nav flex-1 flex-col items-center justify-center gap-0.5 text-2xs",
              isActive ? "font-semibold text-accent" : "font-medium text-ink-soft",
            )}
          >
            <Icon size={22} strokeWidth={isActive ? 2 : 1.8} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
