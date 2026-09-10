/** Intitulé de section : « À la une », « Récents », « Mes produits ». */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold tracking-wider text-ink-soft uppercase">{children}</h2>
  );
}
