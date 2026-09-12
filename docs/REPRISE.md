# Reprendre le travail sur Makiti

Ce fichier est le point d'entrée pour continuer le projet dans une nouvelle
conversation. Il dit ce qui est fait, ce qui reste, et ce qui a déjà été
tranché pour ne pas rediscuter les mêmes choses deux fois.

## Branches — à lire avant de coder

**`main` est le tronc.** C'est elle que Vercel déploie en production, et
c'est d'elle que part toute nouvelle branche de travail.

Cette règle est née d'une panne réelle, le 2026-09-11 : le dépôt n'avait
aucun tronc, seulement six branches `claude/*` issues de sessions
successives, et la branche « par défaut » pointait sur un état vieux de
plusieurs jours. Résultat : la production servait une version périmée du
site pendant que les déploiements de prévisualisation échouaient, et
personne ne comprenait pourquoi les deux disaient des choses opposées.

Un dépôt sans tronc ne se contente pas d'être désordonné : il rend
impossible la question « quelle version est en ligne ? ».

### La consolidation du 2026-09-11

Cinq lignes de travail avaient divergé du même commit (`07b8440`) sans
jamais converger. Elles sont réunies dans `main`. Base retenue :
`prochaine-etape`, la plus avancée (authentification, client Supabase par
requête, 46 tests). Y ont été portés :

- de `main` : les migrations 0005 à 0009 reconstituées depuis la base
  réellement déployée, le `.env` versionné, les correctifs du build
  Vercel, et les vraies photos (`Product.imageUrls` remplace un simple
  compte) ;
- de `kind-thompson` : `docs/PERFORMANCE.md` et ses mesures
  (`npm run poids`, `npm run parcours`), six maquettes de recherche ;
- de `wizardly-cannon` : `docs/ARCHITECTURE.md`, `npm run classes`, et le
  vocabulaire d'espacements nommés (`src/styles/tokens.css` et son
  README) — vérifié par `npm run classes`, qui vient de cette même
  branche : aucune classe fantôme sur 79 fichiers ;
- de `brave-pascal` : toutes ses maquettes, dont celle du compte
  commerçant.

`wizardly-cannon` et `brave-pascal` n'ont plus rien d'unique : elles sont
supprimables sans perte. Seule `kind-thompson` reste à conserver.

**Mise à jour du 2026-09-11 (fin de journée) — la cause de la panne était
encore active.** En voulant nettoyer les branches, on a découvert que le
réglage « branche par défaut » du dépôt GitHub pointait encore sur
`claude/ecstatic-wright-ed0bp3` — un arrêt sur image au commit `07b8440`,
soit exactement le point de divergence d'avant toute la consolidation.
Autrement dit, la panne décrite en tête de section n'était pas juste
racontée au passé : GitHub continuait, à cet instant, de désigner une
vieille branche comme référence. Un `git push --delete` échoue toujours
sur la branche par défaut (403, quels que soient les droits) : GitHub
protège cette branche contre la suppression, mais pas contre le fait de le
rester par erreur.

Corrigé : branche par défaut basculée sur `main` (Settings → General →
Default branch), puis suppression de `claude/ecstatic-wright-ed0bp3` et de
`claude/wizardly-cannon-kqr64e` (déjà sans contenu unique, voir plus haut).
Il ne reste que **`main`** et **`claude/kind-thompson-khl111`**.
`brave-pascal` avait déjà disparu (absorbée par une session antérieure).

**Deux pièges rencontrés, qui valent pour toute consolidation future** :
`prochaine-etape` avait réécrit `0001` et `0003` en y absorbant des
corrections postérieures. Résultat, la chaîne de migrations ne rejouait
plus depuis zéro — `0006` recréait un index déjà présent, `0005` tentait
de changer le type de retour d'une fonction. Les deux fichiers ont été
rétablis dans leur version fidèle à la base déployée. **Une migration ne
se réécrit jamais après avoir été appliquée** : elle décrit un pas déjà
franchi, pas l'état final.

### Ce qui reste à récupérer de `kind-thompson`

Cette branche a construit une **seconde implémentation du front** (4008
lignes, identifiants en français, `src/lib/magasin.ts`) sur un backend
fictif, en écartant délibérément Supabase. Ses fonctionnalités ne se
fusionnent donc pas : elles se réimplémentent sur la couche de données
réelle. À faire, par ordre de valeur décroissante :

1. ~~**Compression des photos dans le navigateur**~~ **Fait le
   2026-09-11**, réimplémenté contre la vraie base (`PhotoPicker`,
   section 3, étape 2) — pas une reprise de `ChoixPhotos`, qui supposait
   `mock.ts`.
2. **Formulaires fonctionnant sans JavaScript** — À MOITIÉ fait en même
   temps (voir étape 2, section 3) : les champs texte et les actions
   produit marchent sans script, `PhotoPicker` et le `Toggle` prix
   négociable non. Sur un réseau guinéen instable, un formulaire qui
   exige que le script soit chargé est un formulaire qui échoue.
3. **Recherche v2** : quatre états d'écran, filtres, recherches récentes
   (`recherche.ts`, `FiltreChip`, `RecherchesRecentes`).
4. **Bandeau de réseau dégradé** (`BandeauReseau`).
5. **Le catalogue de lancement à 8 catégories** plutôt que 10 : c'est une
   décision produit, à trancher avant de la traduire en migration.

Le budget de poids révèle déjà un dépassement sur cette branche :
**polices 60 Ko pour un budget de 40 Ko** (`npm run poids`).

---

## 1. Ce que Makiti est

Une marketplace de **mise en relation** en Guinée. Les commerçants publient
leurs produits avec un prix, les clients les parcourent et écrivent au
vendeur par une messagerie interne. **Aucun paiement, aucun panier, aucune
livraison** : la vente se conclut hors de l'application, en main propre.

Conséquence à garder en tête en permanence : le système ne sait jamais
qu'une vente a eu lieu. C'est pour cette raison qu'il n'y a **pas de
notation** — aucun avis ne serait vérifiable, donc tous seraient truqués.

Marché : Guinée · Devise : franc guinéen (GNF), en entiers · Langue : français.

---

## 2. Ce qui est fait

### Spécification
`docs/SPEC.md` — 18 décisions tranchées et figées.
`docs/ECRANS.md` — inventaire des 33 écrans.

### Base de données — écrite, testée, ET DÉPLOYÉE
Projet Supabase `Makiti` (région eu-west-3) créé et migré le 2026-09-11.
`supabase/migrations/` — 9 fichiers SQL, à exécuter dans l'ordre sur un
projet neuf :

- `0001_schema.sql` — 9 tables : profiles, merchants, cities, categories,
  products, product_images, conversations, messages, reports. Porte
  aussi, depuis une reprise de session, la décision des **comptes liés**
  (voir plus bas) : `profiles.id` n'est plus la clé de `auth.users`.
- `0002_rules_and_security.sql` — **le fichier le plus important** :
  triggers métier et règles de sécurité au niveau des lignes (RLS)
- `0003_search_and_seed.sql` — fonction `search_products`, 10 catégories,
  12 villes
- `0004_storage.sql` — stockage des photos
- `0005_advisor_fixes.sql` à `0009_profile_suspension_date.sql` — corrections
  postérieures (advisors Supabase, performance, produits vendus visibles,
  date de suspension). Voir le fichier de chaque migration pour le détail.

**Piège vécu, à ne pas reproduire** : ces 5 dernières migrations, et la
décision des comptes liés dans 0001/0002, avaient été appliquées
directement sur le projet Supabase (SQL Editor) sans jamais être commitées
dans `supabase/migrations/`. Le dépôt Git décrivait donc une base qui
n'existait plus. Reconstitué depuis `supabase_migrations.schema_migrations`
et revérifié migration par migration contre le SQL réellement en base —
voir section 7. **Règle à partir de maintenant : toute migration appliquée
au tableau de bord Supabase est commitée dans la même session, jamais
après.**

**Les 9 migrations rejouent depuis une base vierge** — vérifié, pas
supposé (`supabase/tests/README.md` donne la commande). C'est la seule
propriété qui compte pour une suite de migrations, et c'est celle qui
casse le plus discrètement.

`supabase/tests/` — 49 tests de sécurité, rejouables sur un PostgreSQL
local. Ils vérifient que les actions **interdites** échouent. Ils ont déjà
trouvé **trois** vraies failles (voir section 7).

### Maquette
Publiée : https://claude.ai/code/artifact/5640888b-3a8e-4f07-aa50-4da03a76aef2
Sources dans `design/` (33 écrans, direction visuelle « A — Marché »).

### Front-end
Next.js 16, React 19, TypeScript, Tailwind 4. 27 routes, ~33 composants.

- `src/styles/` — tokens (couleurs, typographie, rayons, **vocabulaire
  d'espacements nommés**) et un README expliquant comment modifier
  l'apparence. `npm run classes` détecte les classes Tailwind inexistantes,
  le défaut le plus silencieux du projet (voir section 7).
- `src/components/` — `ui/` sans métier, `product/`, `chat/`, `auth/`.
- `src/lib/supabase/` — client par requête : `server.ts` (composants
  serveur), `client.ts` (navigateur), `middleware.ts` (rafraîchit la
  session à chaque requête). **Un seul client global serait une faille** :
  deux visiteurs partageraient la même session.
- `src/lib/data/` — lecture : `products.ts`, `merchants.ts`,
  `reference.ts`, `session.ts`, `messages.ts`. Seul endroit qui connaît la
  forme de la base ; traduit vers les types de `src/lib/types.ts`.
- `src/lib/actions/` — écriture : `auth.ts` (inscription, connexion,
  déconnexion, mot de passe oublié et réinitialisation, création du second
  compte lié), `merchants.ts` (boutique), `products.ts` (produits),
  `messages.ts` (messagerie), `account.ts` (profil, suppression de
  compte — client `service_role` dans `src/lib/supabase/admin.ts`).
- `src/lib/mock.ts` — **ne sert plus que `/styleguide`** (galerie de
  composants) et la liste fixe des motifs de signalement
  (`reportReasons`). Plus aucun écran de l'application ne lit de fausses
  données pour fonctionner.

**Authentification : faite.** Inscription client et commerçant, connexion,
déconnexion, mot de passe oublié, réinitialisation, comptes liés.

**Toute l'application est branchée sur la vraie base** : catalogue public,
espace vendeur (étape 2), messagerie (étape 3), compte et suppression de
compte (étape 4). Il ne reste plus d'écran qui affiche des données
inventées — voir « Ce qui n'a JAMAIS été vérifié » ci-dessous : jamais vu
dans un navigateur ne veut pas dire jamais vérifié.

Deux adresses de travail : **`/ecrans`** liste les écrans avec un lien vers
chacun ; **`/styleguide`** affiche tous les composants et tous les tokens.

**Base vide au départ** : `supabase/seed_demo.sql` crée deux boutiques et
six produits pour avoir quelque chose à regarder. À supprimer avant le
lancement (commande en fin de fichier). Les lignes de photos qu'il crée ne
désignent aucun fichier réel : les vignettes s'afficheront cassées jusqu'à
ce qu'un vrai commerçant en dépose.

```bash
npm install && npm run dev     # nécessite .env.local — voir README
npm run typecheck && npm run build
npm run classes                # classes Tailwind fantômes
npm run poids                  # budgets de poids (docs/PERFORMANCE.md)
```

**Ce qui n'a JAMAIS été vérifié** : le rendu dans un navigateur. Les
environnements de travail successifs n'ont pas pu joindre `*.supabase.co`
(politique réseau : « host not in allowlist »). Tout a été vérifié
autrement — requêtes rejouées en base **en tant qu'anonyme réel**
(`set role anon`, pas via un outil qui contourne le RLS), migrations
rejouées sur un PostgreSQL vierge, 46/46 tests, build de production. Mais
personne n'a encore regardé un seul écran chargé avec de vraies données.
C'est la première chose à faire.

---

## 3. Ce qui reste à faire, dans l'ordre

*Cette section a été entièrement réécrite le 2026-09-11. Elle disait
auparavant que « Supabase réel passe en tout dernier » et rangeait
l'authentification parmi les tâches à venir — deux affirmations devenues
fausses : la base est déployée, le catalogue public la lit, et
l'authentification est écrite. Un plan qui décrit un projet qu'on n'a plus
est pire qu'une absence de plan.*

### Étape 1 — Regarder l'application dans un navigateur
**Avant tout le reste, et ce n'est pas une formalité.** Rien n'a jamais
été vu à l'écran avec de vraies données (voir la note de la section 2).
`npm run dev`, parcourir `/ecrans`, ouvrir chaque écran. Les vérifications
passées avaient trouvé une classe CSS inexistante, un prix illisible et un
badge étiré — aucun de ces défauts ne produit d'erreur au build.

Inutile de soigner une fonctionnalité sur un écran visuellement cassé.

### Étape 2 — Espace vendeur : les actions produit — FAIT le 2026-09-11

Branché : créer un produit (photos, publication immédiate ou brouillon),
le modifier, marquer vendu, masquer, republier, supprimer, modifier la
boutique, afficher le motif de refus (`merchants.rejection_reason`).
`/vendeur`, `/vendeur/attente`, `/vendeur/refusee` aiguillent maintenant
vers le bon écran selon `merchants.status` réel, plutôt que d'être trois
écrans isolés qu'il fallait deviner. Photos réellement affichées dans
« Mes produits » (`ProductRow` ne recevait jamais de `src` — corrigé).

**Compression et envoi des photos — décision 15 appliquée :**

- Librairie [`browser-image-compression`](https://www.npmjs.com/package/browser-image-compression),
  dans un web worker. Sortie forcée en **webp** (`fileType`), pas JPEG :
  plus léger à qualité égale, et c'est déjà l'extension que
  `0004_storage.sql` donnait en exemple dans son propre commentaire.
  Cible 0,5 Mo / 1280 px de côté max, à ajuster sur de vraies photos.
- **L'envoi vers Storage se fait depuis le navigateur**, pas via une
  action serveur qui n'aurait fait que relayer un fichier déjà prêt
  (`PhotoPicker`, client Supabase navigateur déjà présent mais inutilisé
  jusqu'ici). Seul le CHEMIN obtenu voyage dans le formulaire.
- `productId` est généré **côté navigateur** (`crypto.randomUUID()`) avant
  le premier envoi de photo, pour respecter la convention de chemin
  `product-images/{merchant_id}/{product_id}/{fichier}` sans attendre que
  la ligne `products` existe. Le insert se fait ensuite en deux temps —
  `draft` puis `update status = 'active'` — jamais en un seul : le trigger
  `products_check_publishable` refuse la publication tant qu'aucune ligne
  `product_images` ne référence le produit, ce qui est impossible à
  satisfaire dans l'insert qui le crée.

**Deux choses trouvées en cours de route, non résolues :**

1. **La promesse de « nouvelle vérification » de l'écran boutique était
   fausse.** Rien dans la base ne la mettait en œuvre. L'ajouter
   ferait disparaître du catalogue public les produits déjà en ligne
   (`products: catalogue public` exige `merchants.status = 'approved'`),
   ce qui contredit la seconde phrase du même écran (« vos produits
   restent en ligne pendant ce temps »). Le texte a été retiré plutôt que
   laissé à mentir ; `updateMerchantAction` ne touche jamais `status`. À
   trancher avec le porteur du projet avant de réintroduire un
   comportement ici.
2. **« Formulaires fonctionnant sans JavaScript »** (liste `kind-thompson`
   ci-dessus) n'est fait qu'À MOITIÉ. Les champs texte et les boutons
   d'action (marquer vendu, masquer, supprimer…) fonctionnent sans JS —
   ce sont de vraies `<form action={...}>` Next.js. Mais `PhotoPicker`
   (compression + envoi Storage) et le bouton « Prix négociable »
   (`Toggle`) exigent du JavaScript : aucun des deux n'a d'équivalent
   fonctionnel sans script pour l'instant.

### Étape 3 — Messagerie — FAIT le 2026-09-11

Branché : liste des fils (client ET commerçant, `?vue=` seulement quand les
deux comptes liés existent), fil de discussion, citer un produit, marquer
comme lu, bloquer, signaler (conversation et produit — ce dernier était
resté un bouton mort depuis le début, corrigé au passage). « Contacter le
vendeur » ouvre directement le fil pour une connexion déjà cliente
(trouvé ou créé), au lieu de toujours proposer un compte.

**Pas de temps réel.** Le fil se recharge à la navigation, pas à
l'arrivée d'un message pendant qu'on le lit. Supabase Realtime reste à
brancher — non fait faute de pouvoir le tester (voir la note sur
`*.supabase.co`, section 2).

**Un seul aller-retour pour toute la liste des fils**, jamais un par fil :
`getMyThreadsAsClient`/`AsMerchant` lisent tous les messages de tous les
fils d'un coup et agrègent en mémoire — même réflexe que la correction de
`auth.getUser()` de l'étape 2 (section 7).

**Le formulaire d'envoi exige du JavaScript**, contrairement aux actions
produit de l'étape 2 : sans `useActionState`, un message refusé (quota
dépassé, blocage) échouerait en silence — la page se rafraîchirait sans
rien dire. Le compromis choisi : le composant `Composer` seul est client,
tout le reste du fil reste serveur.

Rappel des règles que la base fait déjà respecter, pas redupliquées dans
l'interface : un seul fil par couple (client, boutique), le premier
message cite obligatoirement un produit, le produit cité appartient à la
boutique destinataire, quotas de 20 boutiques contactées et 100 messages
par jour — les messages d'erreur de ces triggers sont déjà en français,
écrits pour être affichés tels quels.

### Étape 4 — « Mon compte » et la suppression de compte — FAIT le 2026-09-11

Branché : nom, téléphone et ville de résidence modifiables, mot de passe,
suppression de compte (feuille de confirmation ajoutée, absente de la
maquette), bascule vers l'espace commerçant seulement si ce compte lié
existe.

**Ville de résidence ajoutée le 2026-09-11** (`profiles.city_id`,
0010_client_profile_city.sql) : un client peut désormais la choisir ou la
laisser vide depuis « Mes informations », indépendamment de la ville de
navigation du fil (`/recherche/ville`, un simple paramètre d'URL) —
résider quelque part n'empêche pas de chercher ailleurs, décision
explicite plutôt qu'un oubli.

Cette ville de résidence sert de **point de départ**, pas de filtre
permanent : sans `?ville=` dans l'URL, `src/app/page.tsx` l'utilise comme
défaut à la place de "Conakry" en dur (client non connecté, compte sans
profil client, ou ville non renseignée → "Conakry" reste le repli). Dès
que `ville` est explicite dans l'URL, il gagne toujours.

**Reste non harmonisé, signalé mais pas traité** : `/recherche` a son
propre défaut "Conakry" en dur, indépendant de celui du fil d'accueil, et
s'en sert pour calculer le badge « filtre actif » et le lien « Effacer
les filtres ». Un client qui arrive directement sur `/recherche` (pas
depuis le fil d'accueil) ne profite donc pas encore du même défaut. Choix
à trancher séparément : l'harmoniser casserait net le sens actuel
d'`activeFilterCount`.

**Un champ de la maquette retiré, pas simulé** : le mot de passe affiché
en clair (Supabase ne le rend jamais lisible). Le motif de suspension
affiché sur `/compte/suspendu`
(« à la suite de signalements ») a été retiré pour la même raison :
`profiles` n'a que `suspended_at`, pas de colonne de motif.

**Pas d'Edge Function : une action serveur Next.js avec un client
`service_role`** (`src/lib/supabase/admin.ts`, `src/lib/actions/account.ts`).
Le code ne quitte pas plus le serveur qu'avec une Edge Function séparée,
avec un aller-retour réseau de moins et un seul système à déployer.

**Piège évité en écrivant cette fonction** : le plan initial parlait de
« couper l'accès à `auth.users` », lu d'abord comme « supprimer la ligne ».
Or `profiles.auth_user_id` référence `auth.users(id) on delete cascade`
(0001_schema.sql) : supprimer `auth.users` aurait tenté de supprimer aussi
`profiles`, que `messages.sender_id` référence SANS cascade — la
suppression aurait échoué sur une contrainte de clé étrangère, au moment
précis où quelqu'un clique sur « Supprimer mon compte ». La bonne
opération est un **bannissement** (`admin.auth.admin.updateUserById` avec
`ban_duration`) : la connexion devient inutilisable, la ligne survit,
`profiles` aussi. Trouvé en lisant les contraintes avant d'écrire la
fonction, pas en la cassant d'abord.

Décision prise sur le point resté ouvert (merchants.status au moment de
la suppression) : **les produits passent à `hidden`, `merchants.status`
ne bouge pas.** Aucune valeur de l'énumération (`pending`/`approved`/
`rejected`) ne veut dire « fermée par son propriétaire », et masquer les
produits suffit à vider le catalogue public de cette boutique (la policy
"products: catalogue public" exige déjà `status = 'active'`).

### Étape 4 bis — Quatre bugs trouvés en relisant le projet — FAIT le 2026-09-12

Relecture complète du projet, avec exécution réelle de tout ce qui est
vérifiable : `typecheck`, `build`, `classes`, `poids`, et les migrations
plus les tests de sécurité rejoués sur un PostgreSQL 16 local recréé de
zéro. Les quatre défauts ci-dessous sont tous dans la couche
APPLICATIVE — la base, elle, est ressortie intacte (49/49).

Ce n'est pas un hasard : la discipline de test du projet s'arrêtait à la
frontière du SQL. **Aucun de ces quatre bugs ne produisait d'erreur au
build, et aucun n'aurait survécu à un test.** Le projet a 49 tests sur sa
partie la plus solide et zéro sur celle qui casse.

**1. Un produit publié pouvait se retrouver sans aucune photo.**
`products_check_publishable` (0002) est posé sur `products` : il ne voit
pas les photos partir par `product_images`. Or `updateProductAction`
remplace la liste des photos par un `delete` de toutes les lignes suivi
d'un `insert` — si la liste finale arrive vide, le produit restait
`active` dans le catalogue public sans vignette. Reproduit en base avant
de corriger :

```
produit actif avec 1 photo → delete from product_images
→ photos restantes = 0, statut = active
```

Fermé par `0011_active_product_keeps_an_image.sql` : un trigger
`after delete on product_images` (au niveau instruction, avec table de
transition) repasse en `draft` tout produit `active` qui n'a plus de
photo. Il repasse en brouillon plutôt que de refuser la suppression : la
suppression est légitime, c'est l'état « publié sans photo » qui ne l'est
pas. `updateProductAction` refuse en plus l'enregistrement avec un
message lisible — la base garantit l'invariant, le message explique.
Trois vérifications ajoutées à `security_test.sql` (tests 47 à 49).

**2. Six actions échouaient en silence.** `markSold`, `hide`,
`republish`, `delete`, `blockPeer` et `reportConversation` ne lisaient
pas le résultat de leur écriture et redirigeaient comme si tout allait
bien. Le cas le plus probable était le pire : « Republier » est refusé par
le trigger quand la boutique n'est plus approuvée — c'était écrit dans ce
document, et l'utilisateur n'en voyait rien.

**Deux façons distinctes d'échouer, et une seule est une erreur** :

- une exception remontée dans `error` (le trigger de republication) ;
- **aucune erreur, mais zéro ligne touchée** : quand le RLS écarte une
  ligne, PostgREST renvoie un SUCCÈS portant zéro ligne. « Pas d'erreur »
  ne veut donc jamais dire « c'est fait ». D'où le `.select("id")` ajouté
  partout : c'est la seule façon de savoir ce qui a réellement changé.

Les messages voyagent dans l'URL (`?erreur=`, `?info=`) et s'affichent via
le nouveau composant `Notice`, sur `/vendeur` et `/messages/[id]`. Ce
choix préserve la propriété « fonctionne sans JavaScript » des feuilles
d'actions : `useActionState` aurait imposé de les rendre clientes.

**3. L'onglet « Compte » renvoyait un commerçant connecté vers l'écran de
connexion.** `BottomNav` a bien un `accountHref`, mais les écrans publics
(`/`, `/recherche`, `/boutique/[id]`, `loading.tsx` qui est synchrone) ne
le passaient pas. Un commerçant sans compte client lié qui parcourt
l'accueil et touche « Compte » atterrissait sur `/connexion` alors qu'il
était déjà connecté — et `signInAction` renvoyant vers `/`, il pouvait
tourner en rond.

Corrigé à la DESTINATION, pas chez chaque appelant : `clientSpaceFallback`
(`src/lib/data/session.ts`) distingue « personne n'est connecté » →
`/connexion` de « connexion sans compte client » → `/vendeur/boutique`.
Rendre `accountHref` obligatoire aurait forcé les pages les plus
consultées à résoudre la session pour rien, et `loading.tsx` ne peut pas
le faire du tout. Corriger la destination couvre en plus les URL mises en
favori, qui ne passent par aucun `BottomNav`.

**4. `/ecrans` et `/styleguide` partaient en production.** Le build les
prérendait (`○`), donc elles étaient en ligne, ouvertes à tous, alors que
le README prévoyait de les supprimer « quand l'authentification
existera » — chose faite depuis le 2026-09-11.

**Elles ne sont pas supprimées pour autant**, et c'est volontaire :
l'étape 1 ci-dessus — ouvrir les 33 écrans dans un navigateur — se fait
précisément depuis `/ecrans`. On ne jette pas l'outil la veille de s'en
servir. Elles sont donc gardées en développement et rendues introuvables
en production (`notFound()` sous `NODE_ENV`, `force-dynamic` pour que la
garde s'évalue à la requête). **À supprimer pour de bon quand l'étape 1
sera terminée.**

**Limite connue, vérifiée au `curl` et non supposée** : la réponse est un
**200** portant le contenu « Cette page n'existe pas », pas un vrai 404.
C'est le comportement documenté de Next 16 (`node_modules/next/dist/docs/`
`01-app/03-api-reference/04-functions/not-found.md`) : le `loading.tsx` de
la racine ouvre une frontière `<Suspense>` sur chaque route, donc la
réponse a commencé à partir avant l'évaluation de la garde, et un statut
ne se change plus une fois le flux ouvert. Next injecte à la place
`<meta name="robots" content="noindex">` — présent sur ces deux adresses,
absent des pages légitimes, vérifié. Le risque réel (une page de travail
trouvée par un moteur de recherche) est donc fermé. Pour un vrai 404, la
garde doit vivre dans `proxy` : à faire avec la migration
`middleware` → `proxy` que le build réclame déjà, pas au milieu d'une
correction de bugs.

### Ce qui reste ouvert, trouvé en même temps mais NON corrigé

Signalé ici pour ne pas le redécouvrir dans six mois. Aucun n'est
bloquant, les deux premiers sont visibles par un utilisateur :

- **« Conditions d'utilisation » est une ligne morte** (`compte/page.tsx`,
  `vendeur/boutique/page.tsx`) : un `MenuItem` sans `href` ni `action`.
  Non corrigé parce qu'il manque le TEXTE, pas le lien — et ce texte est
  une décision du porteur du projet (Makiti est un intermédiaire
  technique, non une partie à la vente). Voir étape 7.
- **Après connexion, un commerçant arrive sur `/`**, le fil client, jamais
  sur `/vendeur`. Défendable (le catalogue est public) mais probablement
  pas voulu. Décision produit, pas bug.
- **Budget des polices : 60 Ko pour 40 Ko.** Deux familles Google
  (`Bricolage_Grotesque` + `Figtree`), toutes deux préchargées. La police
  d'affichage ne sert que les titres : `preload: false` dessus suffirait
  peut-être. À mesurer, pas à supposer.
- **`middleware` est déprécié en Next 16**, le build le dit à chaque
  fois : `npx @next/codemod@canary middleware-to-proxy .`
- **`postcss` n'est pas déclaré dans `package.json`** alors que
  `scripts/verifier-classes.mjs` l'importe. Ça marche aujourd'hui par
  dépendance transitive de `@tailwindcss/postcss` : le jour où Tailwind
  change sa chaîne, `npm run classes` casse sans rapport avec le code.
- **`requestPasswordResetAction` construit son URL de retour depuis
  l'en-tête `Host`**, contrôlé par le client. Non exploitable
  aujourd'hui — Supabase filtre `redirectTo` contre sa liste d'URL
  autorisées — mais la protection vit alors dans un réglage de tableau de
  bord, pas dans le dépôt. Un `NEXT_PUBLIC_SITE_URL` la remettrait sous
  contrôle de version.
- **Un refus de boutique sans motif reste accepté** par la base :
  `check (status <> 'rejected' or rejection_reason is not null)` manque
  toujours (voir section 4). Confirmé en base pendant cette relecture.
- **Aucun test automatisé côté front.** C'est le déséquilibre de fond
  rappelé en tête de section, et il n'est pas corrigé ici.

### Étape 5 — Emails
Deux besoins distincts, un seul fournisseur (Resend) :

1. **Notification de nouveau message** — badge de non-lus dans l'app +
   email. **Sans cette étape, la messagerie est une boîte aux lettres que
   personne ne relève.**
2. **Emails d'authentification** — réinitialisation de mot de passe, et
   confirmation d'inscription si elle est réactivée. L'écran
   `/mot-de-passe-oublie` promet noir sur blanc « vous recevrez un lien » :
   aujourd'hui cette promesse dépend du serveur mail intégré de Supabase,
   que leur propre documentation déclare « non destiné à un usage en
   production » (quelques envois par heure, au mieux). Un SMTP externe est
   donc nécessaire **avant** le lancement, pas après.

### Étape 6 — Déploiement en production
`main` est la branche de production. Voir le README pour les variables
d'environnement Vercel. Le `.env` versionné ne porte que des valeurs
`NEXT_PUBLIC_`, publiques par construction — tout secret va dans le
tableau de bord, jamais dans un fichier suivi.

### Étape 7 — Avant d'ouvrir à de vrais commerçants
- Supprimer le jeu de démonstration :
  `delete from auth.users where email like '%@demo.makiti.local';`
- Rédiger des conditions d'utilisation — Makiti est un intermédiaire
  technique, non une partie à la vente. À écrire avant le premier litige.
- Décider si la confirmation d'email est réactivée. Argument pour :
  l'email est à la fois l'identifiant de connexion **et** le canal des
  notifications ; sans confirmation, quelqu'un peut s'inscrire avec
  l'adresse d'un tiers, qui recevra les messages d'un inconnu. Argument
  contre : une friction de plus à l'inscription, sur un marché où il faut
  déjà arracher les vingt premiers commerçants. **Aucun écran de type
  « vérifiez votre boîte mail » n'existe dans la maquette** : le
  réactiver demande d'en dessiner un.
- Supprimer la page `/ecrans`, page de travail.
- Fermer le dernier trou de schéma connu : `check (status <> 'rejected' or
  rejection_reason is not null)` — voir section 4.
- Corriger le dépassement de budget signalé par `npm run poids` :
  **polices 60 Ko pour 40 Ko**.

### En parallèle — récupérer ce qui reste de `kind-thompson`
Voir la liste en tête de document. La compression des photos est faite ;
restent la recherche v2, le bandeau réseau dégradé, le catalogue à 8
catégories, et compléter les formulaires sans JavaScript (`PhotoPicker`,
`Toggle`) commencés à l'étape 2.

### Sécurité — un réflexe, pas une étape
Ne rien casser du RLS ni des 49 tests de `supabase/tests/` en avançant.
`npm run` les tests après **toute** modification de policy : c'est ainsi
que trois failles ont été trouvées, et aucune ne produisait d'erreur.

---

## 4. Manques dans la base de données

Découverts en dessinant les écrans. Les quatre sont maintenant tranchés et
écrits dans `0001_schema.sql` / `0002_rules_and_security.sql`, vérifiés
par les tests 17 à 19 de `supabase/tests/security_test.sql`. Décisions
prises le 2026-09-11, à la demande du porteur du projet.

1. ~~**Le blocage entre personnes.**~~ **Résolu.** `conversations.blocked_by`
   (nullable, référence `profiles`). Porté par la conversation plutôt que
   par une table séparée : avec un seul fil par couple (client, boutique),
   c'est déjà le seul endroit où bloquer aurait un sens. La personne visée
   perd le droit d'écrire dans CE fil (RLS) ; le fil reste lisible pour les
   deux. Pas de déblocage en v1 : aucun écran ne le propose.
2. ~~**Le motif de refus d'une boutique.**~~ **Résolu** :
   `merchants.rejection_reason` (colonne texte, écriture réservée à
   l'administrateur — voir `0001_schema.sql` et `0002_rules_and_security.sql`).
   Un refus sans explication est un vendeur perdu définitivement ; ça reste
   à brancher côté écran (`/vendeur/refusee`) quand la vraie base existera.
3. ~~**La suppression de compte.**~~ **Résolu : anonymisation, jamais un
   vrai DELETE.** Les `on delete cascade` de `0001_schema.sql` auraient
   effacé les messages envoyés dans TOUTES les conversations de la
   personne, y compris ceux que lit encore l'autre partie — c'est ce qui
   tranche la question, pas une préférence. `profiles.is_deleted` +
   `deleted_at`, colonnes admin-only comme `rejection_reason` : le
   navigateur ne peut pas les écrire directement. Raison précise, pas
   seulement « par cohérence avec le reste » : « supprimer mon compte »
   doit AUSSI couper l'accès à `auth.users`, que RLS ne gère jamais — les
   deux doivent arriver ensemble via une Edge Function (`service_role`),
   sinon un profil pourrait se retrouver marqué supprimé avec la connexion
   encore active. Cette fonction reste à écrire à l'étape 9 ; elle devra
   aussi décider si `merchants.status` doit sortir de `'approved'` quand
   son commerçant supprime son compte (sinon la boutique resterait visible
   dans le catalogue public) — pas tranché ici, à faire à ce moment-là.
4. ~~**Le lien entre les deux comptes d'une même personne.**~~ **Résolu.**
   `profiles.id` ne partage plus la clé de `auth.users` : `auth_user_id`
   fait le lien, `unique (auth_user_id, role)` limite à un profil par rôle
   et par connexion. Option retenue plutôt qu'une table de liaison séparée
   — celle-ci n'aurait eu de sens qu'avec deux connexions distinctes,
   contraire à « une seule connexion, bascule sans reconnexion » déjà
   décidé.
   Conséquence dans TOUT `0002_rules_and_security.sql` : `auth.uid()`
   identifie désormais une CONNEXION, plus un profil précis — chaque
   policy qui comparait directement une colonne à `auth.uid()` est passée
   par une fonction (`my_profile_id(role)`, `owns_profile(id)`,
   `is_active_profile(id)`) qui résout « lequel de MES profils ». Testé de
   bout en bout (46 tests, RLS activé, sur un PostgreSQL local recréé de
   zéro) plutôt que déduit par lecture du code.

**Un reste, mineur mais réel, sur le point 2** : aucune contrainte n'empêche de passer `status = 'rejected'` en laissant `rejection_reason` vide. La base accepte donc un refus sans motif — exactement ce que la colonne devait éviter. Un `check (status <> 'rejected' or rejection_reason is not null)` le fermerait ; pas fait faute d'un vrai parcours de refus à tester dessus.

---

## 5. Questions ouvertes, à poser au porteur du projet

- **Sur quel critère concret une boutique est-elle validée ?** Un numéro qui
  répond ? Une photo de la boutique ? Une rencontre ? Sans critère, la
  validation manuelle coûte du temps sans rien filtrer.
- **Confirmation du canal de notification** : compteur + email en v1.
- **Zone de lancement** : viser une vingtaine de commerçants sur un seul
  marché plutôt que d'être dispersé. La densité bat le volume.

---

## 6. Décisions déjà prises — ne pas les rediscuter

- Catalogue **ouvert sans compte** ; compte exigé uniquement pour écrire.
- **Un seul fil par couple (client, boutique)** ; chaque message peut citer
  un produit, et le premier message d'un fil en cite obligatoirement un.
- **Une personne peut avoir deux comptes liés** (client et commerçant)
  derrière **une seule connexion** (un email, un mot de passe). Bascule
  rapide entre les deux depuis l'app, sans se reconnecter. **Jamais les
  deux mélangés sur un même écran** : à tout instant, un seul contexte est
  actif. *(Décision mise à jour le 2026-09-11 — remplace l'ancienne règle
  « un compte = un seul rôle, changeable uniquement par l'admin ».)*
- **Validation manuelle des boutiques**, depuis le tableau de bord Supabase.
  Aucune page d'administration en v1.
- **Publication immédiate des produits**, avec bouton « signaler » et
  masquage possible par l'administrateur.
- **Disponibilité binaire** : disponible ou vendu. Pas de gestion de stock.
- **Filtre de ville manuel**, jamais automatique.
- **Pas de notation** tant que la transaction reste hors du système.
- **Aucune monétisation** en v1 (choix assumé).
- Direction visuelle **« A — Marché »** : fond papier chaud, accent terre
  cuite, bordures plutôt qu'ombres.

---

## 7. Pièges rencontrés, à ne pas refaire

- **Révoquer un privilège sur une colonne ne sert à rien** si le privilège
  `UPDATE` existe au niveau de la table — ce que Supabase accorde par
  défaut. Il faut révoquer la table entière puis ré-accorder colonne par
  colonne. C'est ce qui permettait à un commerçant de s'auto-valider.
- **Le RLS filtre des lignes, jamais des colonnes.** Les deux questions se
  posent séparément à chaque table. C'est ce qui permettait à un
  participant de réécrire le message de son interlocuteur.
- **Une classe Tailwind qui n'existe pas ne produit aucune erreur.** Un
  token oublié dans `tokens.css` fait disparaître un style en silence.
- **`Intl.NumberFormat` en français** sépare les milliers par une espace
  fine insécable, illisible sur mobile. Elle est remplacée par une espace
  insécable ordinaire dans `src/lib/format.ts`.
- **Quand un modèle de données change, les protections écrites pour
  l'ancien deviennent souvent décoratives** sans qu'aucun test ne le
  signale. C'est arrivé au quota anti-spam lors du passage à un fil unique
  par client, et une seconde fois au fichier de test lui-même lors du
  passage aux comptes liés (section 4) : `security_test.sql` continuait à
  utiliser l'UUID de connexion comme s'il était aussi l'identifiant du
  profil, et ne tournait plus du tout depuis ce changement.
- **Un avertissement de sécurité se vérifie, il ne se croit pas — dans les
  deux sens.** L'audit Supabase a signalé onze fonctions `security
  definer` « appelables en RPC par un inconnu ». Sept étaient de faux
  positifs : des fonctions de trigger (`returns trigger`), que PostgreSQL
  refuse structurellement d'exécuter autrement qu'en trigger — vérifié en
  les appelant, pas déduit. Mais une était une vraie fuite :
  `is_active_profile(pid)` révélait si un profil ARBITRAIRE était suspendu
  ou supprimé. Corrigée en 0005 en vérifiant la propriété à l'intérieur de
  la fonction ; aucun appel légitime n'en change, puisque chaque policy
  vérifiait déjà cette propriété juste avant. Trier les onze demandait de
  lire chaque fonction : ni « tout corriger » ni « tout ignorer » n'aurait
  donné le bon résultat.
- **Le RLS ne se teste pas avec un outil qui le contourne.** La policy
  `products: catalogue public` masquait les produits vendus au public,
  défaut resté invisible tant qu'il était testé via un accès
  administrateur. Trouvé en rejouant les requêtes en `set role anon`, sans
  connexion — comme un vrai visiteur.
- **`auth.getUser()` est un aller-retour réseau, pas une lecture de
  cookie — l'appeler plusieurs fois par page l'additionne plusieurs
  fois.** `/vendeur/boutique`, en sortant de l'étape 2, appelait
  `getMyProfile`/`getMyMerchant` trois fois (une fois par information
  affichée), donc `auth.getUser()` trois fois, plus les mêmes lignes de
  `profiles` relues trois fois — sur une page qui n'en avait besoin
  qu'une. Trouvé en cherchant pourquoi l'application semblait lente.
  Corrigé en mettant `getSessionUser` et `getMyProfiles` en cache par
  requête (`cache()` de React, `src/lib/data/session.ts`) et
  `createClient` avec (`src/lib/supabase/server.ts`) : sans ce dernier,
  deux appels à `createClient()` produisent deux clients différents, donc
  deux clés de cache différentes, et la mise en cache des deux autres ne
  sert à rien. Le middleware garde son propre appel (`updateSession`) :
  il tourne dans une exécution séparée, que ce cache ne couvre pas.
- **Une migration appliquée au tableau de bord Supabase n'existe nulle
  part tant qu'elle n'est pas commitée.** Le SQL Editor de Supabase
  n'écrit dans aucun fichier du dépôt : cinq migrations (0005 à 0009) et
  une décision d'architecture entière (comptes liés) ont vécu uniquement
  dans `supabase_migrations.schema_migrations`, invisibles depuis Git,
  pendant que `docs/SPEC.md` et `docs/REPRISE.md` continuaient de décrire
  l'ancien modèle comme la vérité « figée ». Reconstitué en lisant le SQL
  réellement stocké côté serveur (`select statements from
  supabase_migrations.schema_migrations`) et en le comparant fichier par
  fichier à ce qui était commité.

---

## 8. Le vrai risque

Le code est presque fait ; ce n'est pas là que le projet se joue.

Une marketplace vide n'attire aucun client, et sans clients aucun
commerçant ne reste. Recruter les vingt premiers commerçants est le travail
le plus difficile du projet, et il ne s'écrit pas en TypeScript.
