import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

/** Ligne d'action dans une feuille : un intitulé, sa conséquence en dessous. */
export function ActionRow({
  icon: Icon,
  label,
  description,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full cursor-pointer items-start gap-3.5 border-b border-line py-3.5 text-left last:border-b-0",
        tone === "danger" ? "text-danger" : "text-ink",
      )}
    >
      <Icon size={20} strokeWidth={1.8} aria-hidden className="mt-px shrink-0" />
      <span className="flex flex-col gap-0.5">
        <span className="text-base font-semibold">{label}</span>
        {/* La conséquence est écrite sous chaque action. « Masquer » et
            « Supprimer » se ressemblent ; ce qu'ils font à tes données,
            non. C'est là que se joue la confiance. */}
        <span className="text-xs leading-normal text-ink-soft">{description}</span>
      </span>
    </button>
  );
}
