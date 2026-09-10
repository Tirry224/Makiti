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

**Avant de pousser :** `npm run typecheck` et `npm run build`.

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
| `/ecrans` | Index de tous les écrans. Page de travail, **à supprimer** quand la session existera. |
| `/styleguide` | Le design system à l'écran. |

---

## État au 10 septembre 2026

**Étape 1 — maquette : faite**, sauf l'écran de recherche (v2 proposée,
6 états, page « Recherche v2 » du canvas, **en attente de ton arbitrage**).

**Étape 2 — front et actions : à moitié.**

- ✅ 32 des 33 écrans codés, tous atteignables depuis `/ecrans`.
- ❌ **Écran 4 (fil hors ligne)** : maquetté, jamais codé. Seul écran manquant.
- ❌ **Aucune interactivité.** Zéro `"use client"` hors `error.tsx`, zéro
  `<form>`, zéro `onSubmit`. Tout l'état passe par l'URL (`?ville=`, `?q=`,
  `?vue=`, `?etat=`). Les boutons ne font rien. **C'est le gros du travail
  restant.**
- ✅ Recherche : filtrage en mémoire dans la page, sans accents ni casse —
  même règle que la fonction SQL `search_products` qui la remplacera.

**Étape 3 — Supabase : pas commencée, et c'est voulu.**
4 migrations écrites et testées, jamais exécutées. Aucun client Supabase dans
`src/`. Aucune variable d'environnement.

**Dette connue :** les catégories semées par `0003` sont celles d'avant le
repositionnement. Correctif décrit dans `REPRISE.md`, à appliquer à l'étape 3.

## Décisions en attente (les miennes sont des propositions, pas des choix)

| Sujet | Où | Ma proposition |
|---|---|---|
| Recherche v2 : les 6 états | canvas `Recherche v2` | À valider avant de coder. |
| Neuf / occasion | Ta liste le cite 2 fois | Un **filtre**, pas une catégorie. Coût : un champ obligatoire de plus. |
| Recherches récentes | Écran de recherche | Dans le navigateur : gratuit, marche sans compte. |
| Boutiques dans les résultats | Écran de recherche | Un bandeau « Boutique → » en tête. Pas encore dessiné. |
| Vêtements enfant, chaussures | Catégories | Absents de la liste. Oubli ou choix ? |
| Blocage entre personnes | Écran 32 | Aucune table ne le porte. |
| Motif de refus d'une boutique | Écran 21 | `merchants.status` ne dit pas pourquoi. |
| Suppression de compte | Écran 18 | Effacement réel ou anonymisation ? |

## Journal — cinq dernières entrées

- **10 sept.** Maquette : les 6 états de l'écran de recherche (page canvas
  « Recherche v2 »). Aucun code applicatif touché.
- **10 sept.** Retrait de la migration `0005` : elle enfreignait l'ordre de
  construction. Sa description est passée en dette dans `REPRISE.md`.
- **10 sept.** Nouvelle liste de 8 catégories : `SPEC.md`, `mock.ts`, écrans
  et maquettes réalignés. Catalogue de démonstration réécrit (téléphonie,
  mode, parfums, beauté) — il vendait encore du riz.
- **9 sept.** Document de reprise, inventaire des 33 écrans.
