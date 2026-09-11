import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";

/**
 * Bascule entre les deux comptes liés d'une même personne (client et
 * commerçant). Volontairement une carte à part, jamais un item de menu
 * comme les autres : changer d'espace change tout le contexte (données,
 * navigation), ce n'est pas un réglage parmi d'autres.
 */
export function SwitchSpaceCard({
  label,
  target,
  href,
}: {
  /** Ex. « Basculer vers mon espace commerçant » */
  label: string;
  /** Ex. « Chez Aïssatou » — dit vers QUEL compte on bascule. */
  target: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-accent bg-accent-soft px-3.5 py-3.5"
    >
      <ArrowLeftRight size={20} strokeWidth={1.8} className="shrink-0 text-accent-hover" aria-hidden />
      <span className="flex flex-1 flex-col">
        <span className="text-base font-semibold text-accent-hover">{label}</span>
        <span className="text-sm text-ink-soft">{target}</span>
      </span>
    </Link>
  );
}
