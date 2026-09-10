# Makiti — fichier de repère

**Ce fichier est ma mémoire de travail.** Il est lu automatiquement au début
de chaque session ; il évite d'avoir à relire `SPEC.md`, `ECRANS.md` et
`REPRISE.md` pour savoir où on en est.

**Je le mets à jour à la fin de chaque changement**, dans le même commit que
le changement — sinon il ment, et un repère qui ment coûte plus cher que pas
de repère du tout. Il ne contient que ce qui ne se déduit PAS du code en
quelques secondes : décisions, arbitrages en attente, pièges. Jamais une
copie de ce que le code dit déjà.

---

## Le produit en trois lignes

Place de marché guinéenne de **mise en relation** : des commerçants publient,
des clients contactent par messagerie interne. **Aucun paiement, aucun panier,
aucune livraison.** Devise GNF, langue française, mobile d'abord (390 px).

Catalogue **spécialisé**, 8 catégories sur un seul niveau : téléphones,
accessoires téléphone, vêtements femme, vêtements homme, sacs, parfums,
produits de beauté, pièces automobiles. Pas de « Autre ».

## Règles de travail

**Ordre de construction, non négociable :**

1. **Maquette** (`design/*.dc.html`) — valider l'écran avant de le coder.
2. **Front et actions** — écrans, navigation, formulaires, sur les données de
   démonstration de `src/lib/mock.ts`.
3. **Supabase** — seulement une fois l'étape 2 terminée.

**Ne touche pas à `supabase/` avant la fin de l'étape 2** : ni migration, ni
schéma, ni RLS, ni test SQL. Une décision produit se pose d'abord dans
`SPEC.md` et dans les données de démonstration ; elle descend en base au
branchement. Si un travail semble exiger une migration, écris ce qu'elle
devra faire dans `REPRISE.md` (dette connue) et arrête-toi là.

**Langue :** code, commentaires, commits, documentation, interface — français.

**Avant de pousser :** `npm run typecheck`, `npm run build`, `npm run poids`.

## Contrainte n°1 : réseau médiocre, données facturées

Au même rang que « ça marche ». Doctrine complète et budgets chiffrés dans
`docs/PERFORMANCE.md` ; l'essentiel tient en six lignes :

1. **Les photos décident de tout.** Compression sur l'appareil avant envoi,
   deux tailles stockées (vignette 400 px q60, écran 1080 px q70), WebP,
   `loading="lazy"`. Aucune image décorative dans le projet.
2. **`prefetch={false}` sur tout lien de liste** — Next précharge sinon 24
   fiches pour une seule qui sera lue.
3. **Composants serveur par défaut.** Chaque `"use client"` grossit le socle.
   Formulaires en Server Actions : ils marchent avant que le JS soit chargé.
4. **Aucune bibliothèque** de composants, d'état, d'animation, de carrousel.
5. **Pas de temps réel permanent, pas de sondage, pas de recherche à la
   frappe.** On rafraîchit à l'ouverture de l'écran.
6. **La panne réseau est un état normal**, pas une erreur : toute page reste
   lisible sans ses images.

État mesuré : socle 169 Ko gzip, police 19,7 Ko, HTML 4 à 7 Ko par page.
Tous les budgets sont tenus ; `npm run poids` échoue si l'un se met à céder.

## Où vivent les choses

| Dossier | Contenu |
|---|---|
| `src/app/` | Une page par écran, en composants serveur. |
| `src/components/ui/` | 19 composants génériques (Screen, TopBar, Chip, Sheet…). |
| `src/components/product/`, `chat/` | Composants métier. |
| `src/lib/mock.ts` | Toutes les données de démonstration. Un seul fichier. |
| `src/lib/types.ts` | Types du domaine, à remplacer par les types générés. |
| `design/` | Maquette : un `.dc.html` par écran, `canvas.json` pour la disposition. |
| `supabase/` | 4 migrations écrites, **ni déployées ni branchées**. |
| `docs/SPEC.md` | Décisions produit. `ECRANS.md` : les 33 écrans. `REPRISE.md` : reprise à froid. |
| `docs/PERFORMANCE.md` | Budgets de poids et règles réseau. `scripts/poids.mjs` les vérifie. |
| `/ecrans` | Index de tous les écrans. Page de travail, **à supprimer** quand la session existera. |
| `/styleguide` | Le design system à l'écran. |

---

## État au 10 septembre 2026

**Étape 1 — maquette : faite.** La recherche v2 (6 états) est dessinée ET
codée ; ses artboards restent sur la page « Recherche v2 » du canvas.

**Étape 2 — front et actions : à moitié.**

- ✅ 32 des 33 écrans codés, tous atteignables depuis `/ecrans`.
- ✅ **Recherche refaite** : quatre états servis par une seule page (repos,
  résultats, hors périmètre, zéro-ici-mais-ailleurs), filtres ville /
  catégorie / état / tri, pagination « Voir plus ». Zéro JavaScript : les
  filtres sont des liens, les menus des `<details>` natifs, l'état vit dans
  l'URL. Les règles sont isolées dans `src/lib/recherche.ts`, partagées avec
  le fil, et calquées sur la future fonction SQL `search_products`.
- ❌ **Écran 4 (fil hors ligne)** : maquetté, jamais codé. Seul écran
  manquant — et il coûtera le premier `"use client"` du projet.
- ❌ **Formulaires : rien.** Zéro `<form>`, zéro `onSubmit`. Inscription,
  connexion, ajout de produit, envoi de message : les boutons ne font
  toujours rien. **C'est le gros du travail restant**, en Server Actions.

**Étape 3 — Supabase : pas commencée, et c'est voulu.**
4 migrations écrites et testées, jamais exécutées. Aucun client Supabase dans
`src/`. Aucune variable d'environnement.

**Dette connue :** les catégories semées par `0003` sont celles d'avant le
repositionnement. Correctif décrit dans `REPRISE.md`, à appliquer à l'étape 3.

## Décisions prises (10 sept., délégation explicite)

- **Neuf / occasion** : un attribut du produit (`Product.condition`) et un
  filtre de recherche, pas une catégorie — sinon la liste doublait. Affiché
  seulement quand il vaut « occasion » : le neuf est l'hypothèse par défaut,
  et une carte ne porte qu'une étiquette à la fois.
- **12 produits par écran**, « Voir plus » par tranches de 12, plafond 60.
- **Une seule police.** −40 Ko.
- **Vignettes 300 px.**
- **Filtres en `<details>` natif**, pas en composant client.
- **Recherche v2 validée et codée** telle que maquettée, à deux corrections
  près, constatées à l'écran : le menu de filtre ne peut pas vivre dans une
  barre défilante (`overflow-x` rogne aussi la verticale — il est donc dans
  le flux et pousse les résultats), et les filtres sont masqués sur l'écran
  hors périmètre, où aucun d'eux ne ferait apparaître un réfrigérateur.

## Décisions encore en attente

| Sujet | Où | Ma proposition |
|---|---|---|
| Recherches récentes | Écran de recherche | Reporté : c'est le seul morceau de la recherche qui exige du JavaScript. À reprendre avec l'écran hors ligne, qui en demande aussi. |
| Boutiques dans les résultats | Écran de recherche | Un bandeau « Boutique → » en tête de résultats. Ni dessiné ni codé. |
| Vêtements enfant, chaussures | Catégories | Absents de la liste. Oubli ou choix ? |
| Blocage entre personnes | Écran 32 | Aucune table ne le porte. |
| Motif de refus d'une boutique | Écran 21 | `merchants.status` ne dit pas pourquoi. |
| Suppression de compte | Écran 18 | Effacement réel ou anonymisation ? |

## Journal — cinq dernières entrées

- **10 sept.** Recherche v2 codée (4 états, 4 filtres, pagination), sans une
  ligne de JavaScript. Police unique (−40 Ko), `prefetch={false}` sur tous
  les liens de liste, `PAR_ECRAN` à 12, `Product.condition`. Budgets tenus.
- **10 sept.** Contrainte réseau posée en `docs/PERFORMANCE.md` : mesures
  réelles, budgets chiffrés, six règles, et `npm run poids` qui échoue quand
  un budget est dépassé — ce qu'il fait déjà à cause des polices.
- **10 sept.** Maquette : les 6 états de l'écran de recherche (page canvas
  « Recherche v2 »). Aucun code applicatif touché.
- **10 sept.** Retrait de la migration `0005` : elle enfreignait l'ordre de
  construction. Sa description est passée en dette dans `REPRISE.md`.
- **10 sept.** Nouvelle liste de 8 catégories : `SPEC.md`, `mock.ts`, écrans
  et maquettes réalignés. Catalogue de démonstration réécrit (téléphonie,
  mode, parfums, beauté) — il vendait encore du riz.
- **9 sept.** Document de reprise, inventaire des 33 écrans.
