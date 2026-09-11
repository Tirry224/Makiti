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

1. **Compression des photos dans le navigateur** (`ChoixPhotos`) — déjà
   une décision actée (SPEC, décision 15), indispensable avant que des
   commerçants envoient des photos de 4 Mo depuis un téléphone.
2. **Formulaires fonctionnant sans JavaScript** — sur un réseau guinéen
   instable, un formulaire qui exige que le script soit chargé est un
   formulaire qui échoue.
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

`supabase/tests/` — 46 tests de sécurité, rejouables sur un PostgreSQL
local. Ils vérifient que les actions **interdites** échouent. Ils ont déjà
trouvé deux vraies failles pendant l'écriture.

### Maquette
Publiée : https://claude.ai/code/artifact/5640888b-3a8e-4f07-aa50-4da03a76aef2
Sources dans `design/` (33 écrans, direction visuelle « A — Marché »).

### Front-end — les 33 écrans existent, aucune action n'est branchée
Next.js 16, React 19, TypeScript, Tailwind 4.

- `src/styles/` — tokens (couleurs, typographie, rayons, espacements),
  styles de base, et un README expliquant comment modifier l'apparence
- `src/components/` — ~24 composants : `ui/` sans métier, `product/` et
  `chat/` pour le domaine
- `src/app/` — les 33 écrans
- `src/lib/mock.ts` — données de démonstration, à remplacer par Supabase

Deux adresses utiles : **`/ecrans`** liste les 33 écrans avec un lien vers
chacun ; **`/styleguide`** affiche tous les composants et tous les tokens.

```bash
npm install && npm run dev
```

---

## 3. Ce qui reste à faire, dans l'ordre

Ordre revu le 2026-09-11 avec le porteur du projet : on pousse le front
(textes, parcours, architecture des comptes, performance) le plus loin
possible sur le mock, et **Supabase réel passe en tout dernier** plutôt
qu'en bloquant, comme c'était le cas avant. Raison : la plupart du travail
qui reste est indépendant de la base, et repousser Supabase évite de
déployer un schéma qu'on sait déjà incomplet (voir point 4 de la section
précédente — le lien entre les deux comptes d'une même personne).

### Étape 1 — Corrections : relire les 21 derniers écrans
Les 12 premiers écrans ont été vérifiés dans un navigateur ; les 21
derniers ne l'ont pas été, faute de temps. Le build et les types passent,
mais cela ne dit rien du rendu. Les vérifications précédentes avaient
trouvé une classe CSS inexistante, un prix illisible et un badge étiré —
aucun de ces défauts ne produisait d'erreur.

Ouvrir `/ecrans`, parcourir les 33, corriger ce qui cloche. À faire avant
tout le reste : inutile de soigner des textes ou un parcours sur un écran
visuellement cassé.

### Étape 2 — Positionnement et textes
Makiti = trouver des produits et des commerçants (côté acheteur). Relire
les textes de l'app avec cette phrase en tête ; corriger toute formulation
ambiguë ou orientée « gestion / vente » sur les écrans côté acheteur.

### Étape 3 — Parcours principal
Découvrir → produit → commerçant → contacter. Vérifier que ce chemin est
direct sur les 33 écrans : rien ne doit détourner l'utilisateur de cette
suite d'actions.

### Étape 4 — Architecture des comptes liés
Une personne peut avoir un compte client et un compte commerçant, liés à
une seule connexion, avec bascule rapide et sans mélange à l'écran (voir
section 6). Concevoir et intégrer aux maquettes/écrans le mécanisme de
bascule (menu, indicateur de contexte actif). Le schéma réel (comment lier
deux profils à une seule connexion Supabase) reste à trancher à l'étape 9
— ne pas l'anticiper en base tant qu'elle n'existe pas.

### Étape 5 — Performance
Compression forte des photos avant envoi, attention au poids des pages sur
mobile.

*Correction du 2026-09-11 : la phrase d'origine proposait de préparer dès
maintenant « l'UI de sélection/prévisualisation des photos ». C'est faux —
`src/components/README.md` est explicite : aucun composant ne bascule côté
client avant d'avoir une vraie action à brancher (« un par un, pas avant »).
Un sélecteur de photos avec aperçu est déjà de l'interactivité réelle ; sans
stockage où envoyer le fichier, ce serait exactement l'inverse de la règle
du projet. Cette UI attend l'étape 9, comme la compression elle-même.*

Ce qui PEUT se décider avant, sans écrire de code client prématuré :

- **Librairie retenue : [`browser-image-compression`](https://www.npmjs.com/package/browser-image-compression).**
  Alternative envisagée : Canvas API native (zéro dépendance), écartée
  parce qu'elle ne gère pas seule l'orientation EXIF des photos prises au
  téléphone — un produit qui apparaît de travers dans son propre catalogue
  est le genre de défaut qui ruine la confiance d'un commerçant dès son
  premier envoi. La librairie s'en charge, et tourne dans un web worker
  (ne bloque pas l'interface sur un téléphone d'entrée de gamme).
- **Paramètres cibles** : dimension max ~1280 px, qualité JPEG ~0,75,
  taille visée sous 300–500 Ko par photo. À ajuster une fois les premières
  vraies photos de commerçants vues.
- **Affichage** : utiliser `next/image` pour les vraies photos (pas de
  `<img>` brut) — redimensionnement responsive et lazy loading inclus,
  sans travail supplémentaire.

Le reste de la « performance » (poids du bundle, nombre de composants
client) n'est pas un problème aujourd'hui : l'app est encore 100 % rendue
côté serveur avec des données factices, donc rien à optimiser tant que les
vraies photos n'existent pas. Le vrai risque de poids arrive avec elles.

### Étape 6 — Recherche (UX, sur le mock)
Affiner l'expérience de recherche et de filtre (catégories, villes) sur les
données de démonstration, en cohérence avec ce que fera plus tard la
fonction `search_products`. Le branchement à la vraie base attend l'étape 9.

### Étape 7 — Sécurité, en continu
Ne rien casser du RLS ni des 46 tests de `supabase/tests/` en avançant sur
les étapes précédentes. Pas une étape isolée : un réflexe à chaque
modification de schéma envisagée.

### Étape 8 — Administration, anticiper sans construire
Pas de page admin en v1, mais garder en tête qu'elle arrivera : éviter les
choix qui la rendraient difficile à ajouter plus tard (ex. le motif de
refus d'une boutique, point 2 de la section précédente).

### Étape 9 — Supabase réel (dernière étape)
Tout ce qui suit était avant en tête de liste ; c'est maintenant la toute
dernière étape, une fois le front stabilisé :

1. ~~Trancher le schéma des comptes liés~~ **Fait le 2026-09-11** (point 4
   de la section précédente) — les migrations sont déjà à jour.
2. ~~Créer un projet sur supabase.com~~ **Fait le 2026-09-10.** Projet
   `Makiti`, réf. `bfmsruzyrgbndbueikcb`, région `eu-west-3` (Paris — la
   plus proche de la Guinée). Un premier projet créé par erreur en
   `us-east-2` a été supprimé puis recréé dans la bonne région : ça ne se
   change pas après coup sur un projet existant.
3. ~~Exécuter les migrations dans l'ordre~~ **Fait**, via l'API Supabase
   plutôt que l'éditeur SQL à la main (MCP Supabase, disponible dans cette
   session). Trois avertissements de l'audit de sécurité corrigés dans la
   foulée et reportés dans les fichiers sources (pas seulement appliqués en
   direct) : `search_path` manquant sur deux fonctions, et surtout
   `is_active_profile(pid)` qui, appelable en RPC direct par un inconnu
   (conséquence normale de `security definer`), révélait si un profil
   ARBITRAIRE — pas forcément celui de l'appelant — était suspendu ou
   supprimé. Corrigé en vérifiant aussi la propriété à l'intérieur de la
   fonction ; aucun appel légitime ne change de comportement, puisque
   chaque policy vérifiait déjà cette propriété juste avant de l'appeler.
   Sept autres fonctions signalées « callable en RPC » sont de faux
   positifs : ce sont des fonctions de trigger (`returns trigger`), que
   PostgreSQL refuse structurellement d'exécuter autrement qu'en trigger —
   vérifié en l'appelant directement, pas supposé.
   Avertissements de performance : trois clés étrangères sans index
   ajoutées (`messages.sender_id`, `reports.reporter_id`,
   `conversations.blocked_by`), et `auth.uid()` enveloppé dans
   `(select auth.uid())` sur les policies de `profiles` qui l'appelaient
   nu. « Multiple permissive policies » et « unused index » laissés tels
   quels — la seconde ne veut rien dire sur une base qui vient de naître,
   la première est un choix de lisibilité déjà justifié ailleurs (voir la
   note sur `search_products` en 0003).
4. ~~Vérifier que RLS est activé partout~~ **Fait** : les 9 tables de
   `public` affichent `rls_enabled: true`.
5. ~~Mettre les clés dans `.env.local`~~ **Fait** (fichier non versionné,
   déjà dans `.gitignore`). Clé `publishable` (nouveau format
   `sb_publishable_...`), pas l'ancienne clé `anon` JWT — recommandation
   Supabase actuelle pour un nouveau projet.
6. ~~Générer les types~~ **Fait, mais pas comme prévu.** `src/lib/types.ts`
   n'est PAS remplacé : la base réelle est en snake_case
   (`price_gnf`, `shop_name`…), les ~30 écrans lisent du camelCase
   (`priceGnf`, `shopName`…). Réécrire tous les écrans pour suivre la
   casse de la base aurait été un chantier mécanique énorme pour un
   bénéfice cosmétique. À la place : `src/lib/database.types.ts` (généré,
   à regénérer après toute migration qui touche au schéma — ne pas éditer
   à la main) sert uniquement à la couche de lecture (`src/lib/data/`),
   qui traduit vers les types applicatifs de `src/lib/types.ts`, inchangés.
   Un seul endroit connaît les deux formes.
7. ~~Brancher les données en lecture~~ **Fait pour tout ce qui est public
   (catalogue, sans compte) — le reste attend l'étape 8 (authentification),
   voir plus bas pourquoi.**
   - `src/lib/data/reference.ts` (villes, catégories), `src/lib/data/products.ts`
     (`search_products` pour les listes, `getProduct` pour une fiche) et
     `src/lib/data/merchants.ts` (`getMerchant`, `getMerchantProducts`).
   - Écrans branchés : `/` (accueil), `/recherche`, fiche produit (écrans 7
     et 8), galerie photo, signaler un produit, compte requis, boutique
     publique.
   - Deux écarts réels trouvés en branchant, pas supposés :
     `search_products` ne renvoyait que les produits `active` (pas
     `sold`, pourtant affiché grisé depuis l'écran 8) ni le nom de la
     catégorie — corrigée en 0003. Plus grave : la policy RLS `products:
     catalogue public` avait le MÊME trou, invisible tant que je testais
     avec un outil qui contourne le RLS. Retesté en simulant un vrai
     visiteur anonyme (`set role anon`, sans connexion) plutôt qu'en
     `execute_sql` brut — deux nouveaux tests dans
     `supabase/tests/security_test.sql` (46 contre 44) couvrent
     maintenant ce cas précisément.
   - Écrans encore sur `src/lib/mock.ts`, et pourquoi ce n'est pas un
     oubli : « Mon compte », « Mes produits », les messages, les actions
     commerçant… affichent tous des données qui appartiennent à UNE
     personne connectée. Sans authentification (étape 8, pas encore
     faite), il n'existe aucune vraie session à qui rattacher ces
     données — les brancher maintenant aurait forcé soit une session
     inventée, soit un formulaire de connexion qui ne connecte
     personne. Les deux auraient été un simulacre, pas un branchement.

   **Note de vérification** — le bac à sable de cette session ne peut pas
   joindre `*.supabase.co` en HTTPS direct (politique réseau de
   l'environnement, hors de mon contrôle : « host not in allowlist »).
   Vérifié autrement, à chaque écran branché : des données de test
   insérées dans la vraie base (puis supprimées après coup — le `on
   delete cascade` en a profité pour se vérifier lui aussi à chaque fois)
   confirment que les requêtes renvoient exactement la forme attendue,
   testées **en tant qu'anonyme réel** (`set role anon`) et non via un
   outil qui contourne le RLS — c'est cette différence qui a trouvé le
   trou sur les produits vendus. `npm run build` passe. Ce qui n'est PAS
   vérifié : le rendu réel dans un navigateur. À confirmer par le porteur
   du projet en lançant `npm run dev` sur sa machine, ou une fois déployé
   sur Vercel.
8. Brancher l'authentification (inscription, connexion, mot de passe
   oublié, déconnexion, écran « compte requis », bascule entre comptes liés)
9. Écrire l'Edge Function de suppression de compte (`service_role`) :
   anonymise `profiles` (`full_name`, `phone`, `is_deleted`, `deleted_at`)
   ET coupe l'accès à `auth.users` dans la MÊME opération — voir section 4,
   point 3. Décider à ce moment-là si `merchants.status` doit sortir de
   `'approved'` quand le commerçant supprimé avait une boutique publique.
10. Brancher les actions du commerçant (produit, photos avec compression
    via `browser-image-compression` puis affichage en `next/image`,
    marquer vendu, masquer, supprimer, modifier la boutique)
11. Brancher la messagerie (Supabase Realtime) : ouvrir un fil, envoyer,
    citer un produit, marquer comme lu, signaler, bloquer (déjà en base :
    `conversations.blocked_by`, voir section 4, point 1)
12. Notifier le commerçant : badge de non-lus + email (Resend). **Sans
    cette étape, la messagerie est une boîte aux lettres que personne ne
    relève.**
13. Déployer sur Vercel (`.vercel.app` pour commencer)
14. Avant le lancement : rédiger des conditions d'utilisation — Makiti est
    un intermédiaire technique, non une partie à la vente ; à écrire avant
    le premier litige, pas après
15. Supprimer la page `/ecrans`, qui est une page de travail

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
   bout en bout (44 tests, RLS activé, sur un PostgreSQL local recréé de
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
