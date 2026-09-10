/**
 * Formate un montant en francs guinéens : 450000 → « 450 000 GNF ».
 *
 * Le montant est un ENTIER de francs, jamais un nombre à virgule : on ne
 * représente pas de l'argent avec un flottant (voir le commentaire de
 * `products.price_gnf` dans la migration 0001).
 */
export function formatGnf(amount: number): string {
  return (
    new Intl.NumberFormat("fr-FR")
      .format(amount)
      /* En français, Intl sépare les milliers par une espace FINE insécable
         (U+202F). Sur un écran de téléphone elle est si étroite que
         « 450 000 » se lit « 450000 » — sur une marketplace, c'est
         l'information la plus importante de l'écran qui devient illisible.
         On la remplace par une espace insécable ordinaire (U+00A0) :
         visible, et le montant ne se coupe toujours pas en fin de ligne.
         Défaut invisible dans le code, trouvé en regardant l'écran. */
      .replace(/\u202F/g, "\u00A0") + "\u00A0GNF"
  );
}

/** « 620 45 12 87 » à partir de « 620451287 ». */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 9) return raw;
  return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
}
