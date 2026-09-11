import Link from "next/link";
import { ChevronRight, MapPin, Search, Store, X } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FiltreChip, type OptionFiltre } from "@/components/ui/FiltreChip";
import { Screen, ScreenBody, Section } from "@/components/ui/Screen";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TopBar } from "@/components/ui/TopBar";
import { CategorieGrille } from "@/components/product/CategorieGrille";
import { ProductCard } from "@/components/product/ProductCard";
import { RecherchesRecentes } from "@/components/product/RecherchesRecentes";
import { PAR_ECRAN, categories, cities } from "@/lib/mock";
import { boutiques, chercher, horsPerimetre, lien, lireFiltres, normalize } from "@/lib/recherche";

/** Ajoute le nombre de produits demandés à une URL de recherche. */
function plus(url: string, n: number): string {
  return `${url}${url.includes("?") ? "&" : "?"}n=${n}`;
}

/**
 * Recherche — écrans 5 et 6 de docs/ECRANS.md.
 *
 * Une seule page, quatre états, tous atteignables par une URL :
 *
 *   /recherche                       repos — rien à afficher, tout à proposer
 *   /recherche?q=iphone              résultats
 *   /recherche?q=frigo               hors périmètre : Makiti ne vend pas ça
 *   /recherche?q=…&ville=Boké        zéro ici, mais des résultats ailleurs
 *
 * Zéro JavaScript : les filtres sont des liens, l'ouverture des menus est
 * un `<details>` natif, l'état vit dans l'URL. La page fonctionne donc
 * pendant les secondes où le socle n'est pas encore chargé — le moment
 * exact où une connexion lente fait abandonner (docs/PERFORMANCE.md, R3).
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filtres = lireFiltres(params);
  const { q } = filtres;

  /* Pagination sans JavaScript : « Voir plus » recharge la même page en
     demandant douze produits de plus. Plafonnée pour que personne ne
     réclame le catalogue entier d'une traite — ni le serveur, ni le
     forfait de données du visiteur. */
  const demandes = Math.min(Math.max(Number(params.n) || PAR_ECRAN, PAR_ECRAN), 60);

  const resultats = chercher(filtres);
  const affiches = resultats.slice(0, demandes);

  /* Ce que donnerait chaque choix, sans l'appliquer. Compté ici, à
     l'affichage : la page est déjà rendue sur le serveur, ces comptes ne
     coûtent aucune requête de plus. */
  const parVille = chercher(filtres, "ville");
  const parCategorie = chercher(filtres, "categorie");
  const parEtat = chercher(filtres, "etat");

  const villeOptions: OptionFiltre[] = [
    { label: "Toutes les villes", href: lien(filtres, { ville: null }), compte: parVille.length, selected: !filtres.ville },
    ...cities
      .filter((v) => v !== "Toutes les villes")
      .map((v) => ({
        label: v,
        href: lien(filtres, { ville: v }),
        compte: parVille.filter((p) => p.merchant.city === v).length,
        selected: filtres.ville === v,
      })),
  ];

  const categorieOptions: OptionFiltre[] = [
    { label: "Toutes catégories", href: lien(filtres, { categorie: null }), compte: parCategorie.length, selected: !filtres.categorie },
    ...categories.map((c) => ({
      label: c.nom,
      href: lien(filtres, { categorie: c.slug }),
      compte: parCategorie.filter((p) => p.category === c.nom).length,
      selected: filtres.categorie === c.slug,
    })),
  ];

  const etatOptions: OptionFiltre[] = [
    { label: "Neuf et occasion", href: lien(filtres, { etat: null }), compte: parEtat.length, selected: !filtres.etat },
    { label: "Neuf", href: lien(filtres, { etat: "neuf" }), compte: parEtat.filter((p) => p.condition === "neuf").length, selected: filtres.etat === "neuf" },
    { label: "Occasion", href: lien(filtres, { etat: "occasion" }), compte: parEtat.filter((p) => p.condition === "occasion").length, selected: filtres.etat === "occasion" },
  ];

  const triOptions: OptionFiltre[] = [
    { label: "Les plus récents", href: lien(filtres, { tri: "recent" }), selected: filtres.tri === "recent" },
    { label: "Les plus demandés", href: lien(filtres, { tri: "populaire" }), selected: filtres.tri === "populaire" },
  ];

  /* Le catalogue ne vend pas ça du tout : le dire franchement évite trois
     essais infructueux. On ne le dit que si aucun résultat ne contredit
     l'heuristique — un mot mal classé ne doit jamais cacher un vrai produit. */
  const famille = resultats.length === 0 ? horsPerimetre(q) : null;

  /* Zéro résultat ici, mais le filtre est en cause : on chiffre la sortie
     plutôt que de conseiller dans le vide. */
  const ailleurs = resultats.length === 0 && !famille ? chercher(filtres, "ville").length : 0;

  const repos = !q && !filtres.ville && !filtres.categorie && !filtres.etat;

  /* La recherche porte aussi sur le nom de boutique (décision 14 de
     SPEC.md). Taper « Tech Kaloum » sortait donc une liste de produits sans
     qu'on comprenne pourquoi. Quand la requête désigne une boutique, on le
     dit et on offre la porte d'entrée. */
  const boutique = q
    ? boutiques().find((m) => normalize(m.shopName).includes(normalize(q)))
    : undefined;

  return (
    <Screen>
      <TopBar
        backHref="/"
        title={
          /* Un formulaire GET, pas un champ décoratif : la recherche part
             avec la touche « Rechercher » du clavier du téléphone, la
             requête atterrit dans l'URL (`?q=…`), donc elle se partage et
             le bouton retour la défait. Et surtout : aucune recherche à la
             frappe — une requête par recherche, pas huit par mot
             (docs/PERFORMANCE.md, règle R5). */
          <form
            method="get"
            action="/recherche"
            className="flex h-tap flex-1 items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5"
          >
            {/* Les autres filtres survivent à une nouvelle recherche. Sans
                ces champs cachés, chercher un mot remettrait la ville et la
                catégorie à zéro sans prévenir. */}
            {filtres.ville ? <input type="hidden" name="ville" value={filtres.ville} /> : null}
            {filtres.categorie ? <input type="hidden" name="categorie" value={filtres.categorie} /> : null}
            {filtres.etat ? <input type="hidden" name="etat" value={filtres.etat} /> : null}
            {filtres.tri !== "recent" ? <input type="hidden" name="tri" value={filtres.tri} /> : null}

            <button type="submit" aria-label="Rechercher" className="shrink-0 cursor-pointer text-ink-soft">
              <Search size={18} strokeWidth={1.8} aria-hidden />
            </button>
            <input
              name="q"
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              defaultValue={q}
              placeholder="Rechercher un produit"
              aria-label="Rechercher un produit"
              className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:font-normal placeholder:text-ink-soft"
            />
            {q ? (
              <Link href="/recherche" prefetch={false} aria-label="Effacer la recherche" className="shrink-0 text-ink-soft">
                <X size={17} strokeWidth={2} aria-hidden />
              </Link>
            ) : null}
          </form>
        }
      />

      <ScreenBody>
        {repos ? (
          /* ── État de repos ────────────────────────────────────────────
             Aucun produit affiché ici, volontairement : le fil d'accueil
             est à un tap. Montrer des produits sur un écran de recherche
             vide ferait croire à des résultats. */
          <Section className="gap-4">
            <RecherchesRecentes q="" afficher />
            <SectionLabel>Parcourir</SectionLabel>
            <CategorieGrille />
            <p className="pt-1 text-sm leading-relaxed text-ink-soft">
              Cherchez par marque ou par modèle — « iPhone 11 », « bazin riche »,
              « plaquettes de frein ».
            </p>
          </Section>
        ) : (
          <Section className="gap-3">
            {/* Le même composant, muet : c'est ici qu'une recherche mérite
                d'être retenue, puisqu'elle a été réellement lancée. */}
            <RecherchesRecentes q={q} afficher={false} />

            {/* Une seule rangée de filtres : chaque puce porte sa valeur
                courante ET sert à la changer. Puce foncée = filtre appliqué.
                Masquée hors périmètre : aucun filtre ne fera apparaître un
                réfrigérateur, les proposer serait une fausse piste. */}
            <div className={famille ? "hidden" : "flex flex-wrap gap-2"}>
              <FiltreChip
                label={filtres.ville ?? "Ville"}
                actif={Boolean(filtres.ville)}
                icon={MapPin}
                options={villeOptions}
              />
              <FiltreChip
                label={categories.find((c) => c.slug === filtres.categorie)?.court ?? "Catégorie"}
                actif={Boolean(filtres.categorie)}
                options={categorieOptions}
              />
              <FiltreChip
                label={filtres.etat === "neuf" ? "Neuf" : filtres.etat === "occasion" ? "Occasion" : "État"}
                actif={Boolean(filtres.etat)}
                options={etatOptions}
              />
              <FiltreChip
                label={filtres.tri === "populaire" ? "Demandés" : "Récents"}
                actif={filtres.tri !== "recent"}
                options={triOptions}
              />
            </div>

            {famille ? (
              /* ── Hors périmètre ─────────────────────────────────────────
                 Le catalogue est spécialisé : « aucun résultat » veut
                 souvent dire « on ne vend pas ça ». Répondre « essayez un
                 mot plus court » ferait réessayer trois fois. */
              <div className="flex flex-col gap-5 py-6">
                <div className="flex flex-col items-center gap-3 px-3 text-center">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-placeholder text-ink-soft">
                    <Search size={30} strokeWidth={1.7} aria-hidden />
                  </div>
                  <h2 className="text-xl font-bold">Makiti ne vend pas {famille}</h2>
                  <p className="text-base leading-relaxed text-ink-soft">
                    Le catalogue couvre la téléphonie, la mode, les sacs, les
                    parfums, la beauté et les pièces automobiles.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <SectionLabel>Ce que vous trouverez ici</SectionLabel>
                  <CategorieGrille />
                </div>
              </div>
            ) : resultats.length === 0 ? (
              <EmptyState
                icon={Search}
                title={filtres.ville ? `Aucun résultat à ${filtres.ville}` : `Aucun résultat pour « ${q} »`}
                description={
                  ailleurs > 0
                    ? `${ailleurs} produit${ailleurs > 1 ? "s" : ""} correspond${ailleurs > 1 ? "ent" : ""} ailleurs en Guinée. C'est le filtre de ville qui bloque, pas votre recherche.`
                    : "Aucune boutique ne vend encore ça sur Makiti. Essayez un mot plus court, ou parcourez les catégories."
                }
              >
                {ailleurs > 0 ? (
                  <Button href={lien(filtres, { ville: null })}>Chercher dans toute la Guinée</Button>
                ) : null}
                <Button variant="secondary" href={q ? `/recherche?q=${encodeURIComponent(q)}` : "/recherche"}>
                  Effacer les filtres
                </Button>
              </EmptyState>
            ) : (
              <>
                {boutique ? (
                  <Link
                    href={`/boutique/${boutique.id}`}
                    prefetch={false}
                    className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
                  >
                    <Store size={20} strokeWidth={1.8} className="shrink-0 text-accent" aria-hidden />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-base font-semibold">{boutique.shopName}</span>
                      <span className="text-2xs text-ink-soft">
                        Boutique · {boutique.city}
                      </span>
                    </span>
                    <ChevronRight size={18} strokeWidth={2} className="shrink-0 text-ink-soft" aria-hidden />
                  </Link>
                ) : null}

                <p className="text-sm text-ink-soft">
                  <b className="text-ink">
                    {resultats.length} produit{resultats.length > 1 ? "s" : ""}
                  </b>{" "}
                  trouvé{resultats.length > 1 ? "s" : ""}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {affiches.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                {resultats.length > affiches.length ? (
                  <Button variant="secondary" href={plus(lien(filtres, {}), demandes + PAR_ECRAN)}>
                    Voir plus de produits
                  </Button>
                ) : null}
              </>
            )}
          </Section>
        )}
      </ScreenBody>

      <BottomNav active="search" />
    </Screen>
  );
}
