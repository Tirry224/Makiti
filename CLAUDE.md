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

**Avant de pousser :** `npm run typecheck`, `npm run build`, `npm run poids`,
et `npm run parcours` (serveur lancé) — il rejoue les parcours **avec et
sans JavaScript**. C'est le passage sans JavaScript qui trouve les vrais
défauts.

## Contrainte n°1 : réseau médiocre, données facturées

Au même rang que « ça marche ». Doctrine complète et budgets chiffrés dans
`docs/PERFORMANCE.md` ; l'essentiel tient en six lignes :

1. **Les photos décident de tout.** Compression sur l'appareil avant envoi,
   deux tailles stockées (vignette 400 px q60, écran 1080 px q70), WebP,
   `loading="lazy"`. Aucune image décorative dans le projet.
2. **`prefetch={false}` sur tout lien de liste** — Next précharge sinon 24
   fiches pour une seule qui sera lue.
3. **Le JavaScript se juge au gramme, pas au principe.** Le défaut reste le
   composant serveur parce qu'il coûte zéro, mais un composant client est
   justifié dès qu'il économise plus qu'il ne pèse, qu'il donne une
   information que le serveur n'a pas, ou qu'il supprime un aller-retour.
   Exemple qui tranche : la compression des photos fait passer un envoi de
   **2 920 Ko à 185 Ko**. Les formulaires restent en Server Actions —
   ils marchent avant que le JS soit chargé, ce qui est gratuit.
4. **Aucune bibliothèque** de composants, d'état, d'animation, de carrousel.
5. **Pas de temps réel permanent, pas de sondage, pas de recherche à la
   frappe.** On rafraîchit à l'ouverture de l'écran.
6. **La panne réseau est un état normal**, pas une erreur : toute page reste
   lisible sans ses images.
7. **Jamais de `loading.tsx`** : la frontière de chargement exige le
   JavaScript du navigateur pour livrer le contenu. Mesuré : cinq écrans
   sur sept restaient des squelettes sans lui.
8. **Contraintes de formulaire natives** (`required`, `minLength`,
   `pattern`) : une faute de frappe ne doit coûter aucun aller-retour. Le
   serveur revalide tout — elles se contournent en trois secondes.

État mesuré : socle 169 Ko gzip, police 19,7 Ko, HTML 4 à 7 Ko par page.
Tous les budgets sont tenus ; `npm run poids` échoue si l'un se met à céder.

## Où vivent les choses

| Dossier | Contenu |
|---|---|
| `src/app/` | Une page par écran, en composants serveur. |
| `src/components/ui/` | 19 composants génériques (Screen, TopBar, Chip, Sheet…). |
| `src/components/product/`, `chat/` | Composants métier. |
| `src/lib/mock.ts` | Les données de départ — la GRAINE, jamais modifiée. |
| `src/lib/magasin.ts` | L'état qui CHANGE, en mémoire : produits, messages, fils. Pas une base de données (tout disparaît au redémarrage). Devient des requêtes Supabase à l'étape 3. |
| `src/lib/session.ts` | Qui est connecté — un cookie de démonstration, **signé de rien, vérifié par rien**. Remplacé par Supabase Auth. |
| `src/lib/actions.ts` | Les Server Actions des formulaires : valident, orientent, refusent. **N'enregistrent rien** (étape 3). |
| `src/lib/validation.ts` | Les règles de saisie, isolées pour être retraduites en contraintes SQL. |
| `src/lib/recherche.ts` | Filtres, tri, hors périmètre. Partagé par le fil et la recherche. |
| `scripts/` | `poids.mjs` (budgets), `parcours.mjs` (parcours avec et sans JavaScript). |
| `src/components/product/ChoixPhotos.tsx` | Compression des photos dans le navigateur. Le composant client le plus rentable du projet. |
| `src/lib/types.ts` | Types du domaine, à remplacer par les types générés. |
| `design/` | Maquette : un `.dc.html` par écran, `canvas.json` pour la disposition. |
| `supabase/` | 4 migrations écrites, **ni déployées ni branchées**. |
| `docs/SPEC.md` | Décisions produit. `ECRANS.md` : les 33 écrans. `REPRISE.md` : reprise à froid. |
| `docs/PERFORMANCE.md` | Budgets de poids et règles réseau. `scripts/poids.mjs` les vérifie. |
| `/ecrans` | Index de tous les écrans. Page de travail, **à supprimer** quand la session existera. |
| `/styleguide` | Le design system à l'écran. |

---

## État au 11 septembre 2026

**Étape 1 — maquette : faite.** La recherche v2 (6 états) est dessinée ET
codée ; ses artboards restent sur la page « Recherche v2 » du canvas.

**Étape 2 — front et actions : terminée.**

- ✅ Tous les écrans codés et atteignables depuis `/ecrans`, plus l'écran
  32b (signaler une conversation) qui était maquetté sans être codé.
- ✅ **Toutes les actions branchées** en Server Actions, et elles
  **ENREGISTRENT** dans `magasin.ts` : publier un produit le fait
  apparaître dans mes produits et dans la recherche, envoyer un message
  l'affiche dans le fil, marquer vendu barre le prix, s'inscrire ouvre une
  session que « Mon compte » reconnaît.
- ⚠️ **`magasin.ts` n'est pas une base** : état en mémoire, perdu au
  redémarrage, incohérent dès qu'il y a plusieurs machines, aucune règle de
  sécurité. Il rend le parcours JOUABLE, il ne le tient pas.
- ✅ **Erreurs sans JavaScript** : l'action redirige avec `?erreur=code`, la
  page affiche le message et réaffiche les valeurs saisies. **Jamais le mot
  de passe** — une URL traîne dans l'historique et les journaux.
- ✅ **Recherche** : quatre états, quatre filtres, champ de saisie réel
  (formulaire GET), historique local, bandeau boutique.
- ✅ **Écran 4** : bandeau « pas de connexion ». Le vrai fil hors ligne
  exige un service worker — étape 3.
- ✅ **Deux composants clients seulement**, et le socle n'a pas bougé :
  `BandeauReseau` (l'état du réseau n'existe que dans le navigateur) et
  `RecherchesRecentes` (`localStorage`).
- ✅ **Photos** : choix, aperçu et **compression dans le navigateur** avant
  l'envoi — 2 920 Ko ramenés à 185 Ko, mesuré. Sans JavaScript, le champ de
  fichier fonctionne quand même : la photo part lourde, mais elle part.
  Reste à brancher le stockage et la vignette de 300 px (étape 3).

## Prochain chantier retenu : le service worker

**Choisi le 11 septembre.** C'est le plus gros levier restant pour les
visites répétées sur un réseau médiocre : il garde la coquille de
l'application et les fiches déjà vues, ce qui fait tomber le coût d'un
retour sur Makiti à presque rien, et c'est la seule façon d'obtenir un vrai
écran 4 (fil hors ligne rempli des produits déjà consultés) — le bandeau
actuel prévient, il ne montre rien.

**Ce qu'il faudra décider en le commençant**, et qui n'est pas tranché :
sa place dans l'ordre. Ma recommandation : **après le branchement de
Supabase**. Un service worker écrit contre `mock.ts` serait à refaire, et
les vrais pièges — quoi mettre en cache, pour combien de temps, comment
retirer une version périmée sans laisser des téléphones sur du contenu
mort — ne se posent honnêtement qu'avec de vraies données. Le seul morceau
qui pourrait passer avant : la mise en cache de la coquille, qui ne dépend
d'aucune donnée.

**Ce qu'il ne faudra pas oublier :** un service worker mal retiré survit à
son application. Prévoir dès le premier jour comment le désinstaller.

L'envoi de message optimiste (l'autre option) n'est pas abandonné, juste
non retenu pour l'instant : moins de gain, moins de risque.

**Étape 3 — Supabase : pas commencée, et c'est voulu.**
4 migrations écrites et testées, jamais exécutées. Aucun client Supabase dans
`src/`. Aucune variable d'environnement.

**Dette connue :** les catégories semées par `0003` sont celles d'avant le
repositionnement. Correctif décrit dans `REPRISE.md`, à appliquer à l'étape 3.

## Le piège dans lequel je suis tombé (11 sept.)

J'ai annoncé « étape 2 terminée, toutes les actions branchées » alors que
**rien n'était enregistré**. Les 19 vérifications passaient : elles
regardaient où l'on ATTERRIT après un envoi, jamais ce que l'écran d'après
MONTRE. Vu de l'utilisateur, publier un produit renvoyait sur une liste où
il n'apparaissait pas — donc « rien n'a changé », et c'était exact.

Deux règles qui en sortent :

1. **Un formulaire qui accepte puis oublie est pire qu'un bouton mort** :
   il ment. Tant qu'une action n'a pas d'effet visible, elle n'est pas
   faite.
2. **Un test qui vérifie une redirection ne vérifie rien.** La batterie a
   maintenant une section « ce que l'action change à l'écran », qui relit
   l'écran d'après.

## Décisions prises (11 sept., délégation explicite)

- **Formulaires en Server Actions**, erreurs par l'URL, aucun
  `useActionState` : il exigerait un composant client, donc du JavaScript,
  donc l'inverse du but.
- **`loading.tsx` supprimés.** Ils rendaient cinq écrans sur sept
  inutilisables sans JavaScript. Trouvé en testant, pas en relisant.
- **Contraintes natives sur tous les champs**, `formNoValidate` sur le
  bouton « brouillon » — sinon `required` interdit justement ce que le
  brouillon permet.
- **`scripts/parcours.mjs`** : 19 vérifications dans un vrai navigateur,
  avec et sans JavaScript. Playwright reste hors du projet.

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
| Vêtements enfant, chaussures | Catégories | Absents de la liste. Oubli ou choix ? |
| Écran 3 (fil — chargement) | Retiré du code | À reposer autrement à l'étape 3, sans frontière de route. |
| Envoi des photos | Écran 24 | La compression est faite et mesurée ; restent le stockage et la vignette de 300 px. |
| Place du service worker | Chantier retenu | Après Supabase — un service worker écrit contre les données de démonstration serait à refaire. |
| Blocage entre personnes | Écran 32 | Aucune table ne le porte. |
| Motif de refus d'une boutique | Écran 21 | `merchants.status` ne dit pas pourquoi. |
| Suppression de compte | Écran 18 | Effacement réel ou anonymisation ? |

## Journal — cinq dernières entrées

- **11 sept.** Les actions enregistrent vraiment (`magasin.ts`) et la
  session existe (`session.ts`). Publier, écrire, vendre, s'inscrire, se
  déconnecter : chaque geste se voit à l'écran suivant. Six vérifications
  de plus, qui relisent l'écran au lieu de l'URL.
- **11 sept.** Service worker retenu comme prochain chantier (fin de
  session). Rien de commencé : la décision est ici pour ne pas se reperdre.
- **11 sept.** Règle R3 corrigée : « pas de JavaScript » n'était pas la
  consigne, la performance l'est. Un composant client est justifié s'il
  rend plus qu'il ne coûte. Premier cas : `ChoixPhotos`, qui compresse
  avant l'envoi (2 920 Ko → 185 Ko, mesuré) et complète la dernière action
  du front.
- **11 sept.** Étape 2 terminée : toutes les actions branchées en Server
  Actions, contraintes natives, écran 32b codé, bandeau réseau, historique
  de recherche. Les deux `loading.tsx` retirés — ils bloquaient cinq écrans
  sur sept sans JavaScript. `npm run parcours` : 19 vérifications, avec et
  sans JavaScript.
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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
