import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

/** Filtre ou catégorie sélectionnable : « Conakry », « Alimentation ». */
export function Chip({
  children,
  selected = false,
  icon: Icon,
  className,
}: {
  children: React.ReactNode;
  selected?: boolean;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-2 text-sm font-medium",
        selected
          ? "border-ink bg-ink text-paper"
          : "border-line bg-surface text-ink",
        className,
      )}
    >
      {Icon ? <Icon size={15} strokeWidth={1.8} aria-hidden /> : null}
      {children}
    </span>
  );
}
