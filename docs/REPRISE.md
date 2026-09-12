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
`supabase/migrations/` — 12 fichiers SQL, à exécuter dans l'ordre sur un
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
- `0005_advisor_fixes.sql` à `0010_client_profile_city.sql` — corrections
  postérieures (advisors Supabase, performance, produits vendus visibles,
  date de suspension, ville de résidence du client).
- `0011_active_product_keeps_an_image.sql` — un produit publié ne peut pas
  perdre toutes ses photos : `products_check_publishable` était posé sur
  `products` et ne voyait pas les photos partir par `product_images`.
- `0012_approve_a_merchant_in_one_gesture.sql` — changer la seule cellule
  `merchants.status` suffit désormais à valider ou refuser une boutique :
  la date se pose seule, un refus sans motif est refusé, un motif périmé
  s'effrace.

Voir le fichier de chaque migration pour le raisonnement complet : ils sont
écrits pour être lus.

**Piège vécu, à ne pas reproduire** : ces 5 dernières migrations, et la
décision des comptes liés dans 0001/0002, avaient été appliquées
directement sur le projet Supabase (SQL Editor) sans jamais être commitées
dans `supabase/migrations/`. Le dépôt Git décrivait donc une base qui
n'existait plus. Reconstitué depuis `supabase_migrations.schema_migrations`
et revérifié migration par migration contre le SQL réellement en base —
voir section 7. **Règle à partir de maintenant : toute migration appliquée
au tableau de bord Supabase est commitée dans la même session, jamais
après.** Et l'inverse est vrai aussi, vécu le 2026-09-12 avec `0011` :
une migration commitée sans être appliquée laisse le dépôt décrire une
base qui n'existe pas encore. Les deux sens produisent le même écart.

**Les 12 migrations rejouent depuis une base vierge** — vérifié, pas
supposé (`supabase/tests/README.md` donne la commande). C'est la seule
propriété qui compte pour une suite de migrations, et c'est celle qui
casse le plus discrètement.

`supabase/tests/` — 55 tests de sécurité, rejouables sur un PostgreSQL
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

**Toute l'application est branchée sur la vraie base** : catalogue
public, espace vendeur, messagerie, compte et suppression de compte.
Aucun écran n'affiche de données inventées.

Deux adresses de travail : **`/ecrans`** liste les écrans avec un lien vers
chacun ; **`/styleguide`** affiche tous les composants et tous les tokens.

**Base vide, et c'est l'état réel.** Le jeu de démonstration a été
**supprimé le 2026-09-12** à la demande du porteur du projet, pour tester
avec de vraies données : 0 boutique de démo, 0 produit de démo, 0
conversation. `supabase/seed_demo.sql` reste dans le dépôt pour pouvoir
le rejouer — il crée deux boutiques et six produits, dont les lignes de
photos ne désignent aucun fichier réel (vignettes cassées jusqu'à ce
qu'un vrai commerçant en dépose).

```bash
npm install && npm run dev     # nécessite .env.local — voir README
npm run typecheck && npm run build
npm run classes                # classes Tailwind fantômes
npm run poids                  # budgets de poids (docs/PERFORMANCE.md)
```

**Déployé sur Vercel** (une adresse de la forme
`<hash>-tiirry.vercel.app` ; l'URL exacte est dans le tableau de bord
Vercel, la connexion de travail ne voit pas les projets personnels).
`main` est la branche de production : **ce qu'on y pousse part en ligne.**

**Premier vrai passage dans un navigateur : le 2026-09-12**, sur
téléphone. Ce paragraphe disait auparavant que le rendu n'avait JAMAIS
été vérifié — les environnements de travail successifs ne pouvant pas
joindre `*.supabase.co` (« host not in allowlist »), tout avait été
vérifié autrement : requêtes rejouées **en tant qu'anonyme réel**
(`set role anon`, pas via un outil qui contourne le RLS), migrations
rejouées sur un PostgreSQL vierge, tests, build de production.

**Ce premier passage a trouvé en quelques minutes quatre défauts que rien
de tout cela n'avait signalés** : neuf liens morts sur `/ecrans`, la barre
d'onglets du client servie au commerçant, le fil client comme écran
d'ouverture d'un commerçant, et une cellule Supabase qui échouait en
silence. **C'est la leçon la plus rentable de ce projet** : la vérification
automatique et le fait de regarder ne trouvent pas les mêmes défauts, et
aucune des deux ne remplace l'autre. Le parcours complet des écrans reste
à finir — voir l'étape 1.

---

## 3. Ce qui reste à faire, dans l'ordre

*Cette section ne contient QUE ce qui reste. Tout ce qui est fait est
daté dans le journal de la section 8 — un plan dont les quatre
cinquièmes racontent le passé ne se lit plus, et c'est ce qui lui était
arrivé le 2026-09-12 (six sous-étapes « 4 bis » à « 4 sexies » empilées
en une journée).*

### Étape 1 — Finir de regarder l'application dans un navigateur
**Commencée le 2026-09-12, pas finie.** Le premier vrai passage sur
téléphone, via le déploiement Vercel, a trouvé en quelques minutes
quatre défauts que ni le build, ni le typecheck, ni 55 tests de sécurité
n'avaient signalés : neuf liens morts sur `/ecrans`, la barre d'onglets
du client servie au commerçant, le fil client comme écran d'ouverture
d'un commerçant, et une cellule Supabase qui échouait en silence.

Il reste à parcourir les écrans un par un — `/ecrans` en développement
les liste et allume chaque lien dès que l'enregistrement correspondant
existe. **Noter les défauts au fil de l'eau plutôt que les corriger un
par un** : ils se traitent mieux en lot.

Ce qui n'a encore JAMAIS été vu à l'écran : la messagerie entre deux
comptes réels, l'envoi d'une photo depuis un téléphone, et le parcours
de refus d'une boutique.

### Étape 2 — Emails (Resend)
**Le seul point bloquant pour un lancement.** Deux besoins distincts, un
seul fournisseur :

1. **Notification de nouveau message** — compteur de non-lus dans l'app
   + email. Sans ça, la messagerie est une boîte aux lettres que
   personne ne relève, et un commerçant qui n'est jamais prévenu ne
   revient pas.
2. **Emails d'authentification** — réinitialisation de mot de passe, et
   confirmation d'inscription si elle est réactivée. `/mot-de-passe-oublie`
   promet noir sur blanc « vous recevrez un lien » : cette promesse
   dépend aujourd'hui du serveur mail intégré de Supabase, que leur
   propre documentation déclare non destiné à la production (quelques
   envois par heure, au mieux). **Un écran qui promet ce que le système
   ne tient pas est un bug, pas une approximation.**

### Étape 3 — Temps réel de la messagerie
Le fil se recharge à la navigation, pas à l'arrivée d'un message pendant
qu'on le lit. Supabase Realtime reste à brancher. Non bloquant : une
marketplace de mise en relation n'est pas une messagerie instantanée.

### Étape 4 — Avant d'ouvrir à de vrais commerçants
- **Rédiger les conditions d'utilisation.** La ligne existe dans deux
  écrans (`/compte`, `/vendeur/boutique`) mais ne fait rien : il manque
  le TEXTE, pas le code. Makiti est un intermédiaire technique, non une
  partie à la vente — à écrire avant le premier litige.
- **Trancher le critère de validation d'une boutique** (voir section 5).
  La mécanique est prête depuis `0012` ; sans critère écrit, tu
  approuveras tout en y passant du temps.
- **Décider de la confirmation d'email.** Pour : l'email est à la fois
  identifiant de connexion ET canal de notification, donc sans
  confirmation quelqu'un peut s'inscrire avec l'adresse d'un tiers, qui
  recevra les messages d'un inconnu. Contre : une friction de plus, sur
  un marché où il faut déjà arracher les vingt premiers commerçants.
  **Aucun écran « vérifiez votre boîte mail » n'existe dans la
  maquette** : le réactiver demande d'en dessiner un.
- **Supprimer `/ecrans` et `/styleguide`** pour de bon, une fois
  l'étape 1 terminée. Elles sont déjà introuvables en production, mais
  une page de travail qu'on oublie de retirer finit par être trouvée.
- **Regarder le projet Supabase « Fillo »** du 2026-08-25, qui tourne
  encore à côté de `Makiti` sans qu'on sache s'il sert.

### Étape 5 — Regarder le parcours vers le compte lié
Pas un bug, une observation de terrain : le porteur du projet lui-même,
en testant, a créé DEUX CONNEXIONS distinctes au lieu d'un second profil
lié sur la même connexion. L'écran d'inscription ne propose le compte lié
qu'à une personne DÉJÀ connectée — ce qui n'est pas le réflexe de
quelqu'un qui veut « aussi vendre ». À arbitrer : c'est une décision de
parcours, pas une correction technique.

### En parallèle — ce qui reste de `kind-thompson`
Voir la liste en tête de document. La compression des photos est faite ;
restent la recherche v2, le bandeau de réseau dégradé, le catalogue à 8
catégories (décision produit à trancher d'abord), et compléter les
formulaires sans JavaScript (`PhotoPicker`, `Toggle`) commencés le
2026-09-11.

### Dettes techniques connues, aucune bloquante
- **Aucun test automatisé côté front.** 55 tests couvrent le SQL, zéro
  couvre la couche applicative — où se trouvaient les quatre bugs du
  2026-09-12. C'est le déséquilibre de fond du projet.
- **Polices : 60 Ko pour un budget de 40** (`npm run poids`). Deux
  familles Google, toutes deux préchargées ; `preload: false` sur celle
  des titres suffirait peut-être. À mesurer, pas à supposer.
- **`middleware` est déprécié en Next 16** : `npx @next/codemod@canary
  middleware-to-proxy .`. Le faire débloquerait aussi un vrai 404 sur
  `/ecrans` (aujourd'hui un 200 portant la page « n'existe pas », voir
  le fichier).
- **`postcss` n'est pas déclaré dans `package.json`** alors que
  `scripts/verifier-classes.mjs` l'importe : ça marche par dépendance
  transitive de `@tailwindcss/postcss`, donc par accident.
- **L'en-tête `Host` n'est pas validé** dans
  `requestPasswordResetAction`. Non exploitable — Supabase filtre
  `redirectTo` — mais la protection vit dans un réglage de tableau de
  bord plutôt que dans le dépôt ; un `NEXT_PUBLIC_SITE_URL` la
  ramènerait sous contrôle de version.
- **`/recherche` a son propre défaut « Conakry » en dur**, indépendant
  de celui du fil d'accueil, et s'en sert pour calculer le badge
  « filtre actif ». L'harmoniser casserait le sens actuel
  d'`activeFilterCount` : à trancher séparément.
- **`/inscription/boutique` hérite du squelette de chargement client**
  et affiche donc brièvement « Conakry » pendant l'inscription
  commerçant.
- **Trois branches à nettoyer** : `claude/fillo-project-review-0ky4ei`
  et `claude/profile-city-edit-5cxvjb` n'ont plus rien d'unique (vérifié
  par `git diff`), **`claude/kind-thompson-khl111` doit être gardée**
  (10 commits absents de `main`).

### Sécurité — un réflexe, pas une étape
Ne rien casser du RLS ni des 55 tests de `supabase/tests/` en avançant.
Les relancer après **toute** modification de policy : c'est ainsi que
trois failles ont été trouvées, et aucune ne produisait d'erreur.

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
   deux doivent arriver ensemble, avec `service_role`, sinon un profil
   pourrait se retrouver marqué supprimé avec la connexion encore active.

   **Écrit le 2026-09-11** : pas une Edge Function mais une action serveur
   Next.js (`src/lib/actions/account.ts`, client `service_role` dans
   `src/lib/supabase/admin.ts`) — même isolation, un aller-retour réseau
   de moins, un seul système à déployer. Et un BANNISSEMENT plutôt qu'un
   `deleteUser` : `profiles.auth_user_id` référence `auth.users` en
   cascade, et `messages.sender_id` référence `profiles` SANS cascade, donc
   supprimer la ligne `auth.users` aurait échoué sur une contrainte au
   moment précis du clic. La question laissée ouverte ici est tranchée :
   **les produits passent à `hidden`, `merchants.status` ne bouge pas** —
   aucune valeur de l'énumération ne veut dire « fermée par son
   propriétaire », et masquer les produits vide déjà le catalogue public.
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

~~**Un reste, mineur mais réel, sur le point 2**~~ **Fermé le 2026-09-12** (`0012_approve_a_merchant_in_one_gesture.sql`) : la contrainte `merchants_rejection_needs_reason` refuse désormais `status = 'rejected'` avec un motif vide. Posée en CHECK et non en trigger — une CHECK est vérifiée APRÈS les triggers `before`, donc rien ne peut la contourner en inventant un motif par défaut.

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

- **« Pas d'erreur » ne veut jamais dire « c'est fait ».** Quand le RLS
  écarte une ligne, PostgREST ne renvoie pas d'erreur : il renvoie un
  SUCCÈS portant zéro ligne. Six actions du projet (`markSold`, `hide`,
  `republish`, `delete`, `blockPeer`, `reportConversation`) ne lisaient
  pas leur résultat et redirigeaient comme si tout allait bien — le cas
  d'échec le plus probable, « Republier » refusé par le trigger quand la
  boutique n'est plus validée, était donc le plus silencieux. La seule
  façon de savoir ce qui a changé est un `.select("id")` sur l'écriture.
- **Une règle métier posée sur la table A ne voit pas les écritures sur
  la table B.** `products_check_publishable` interdit de publier un
  produit sans photo, mais il est posé sur `products` : rien ne se
  déclenchait quand les photos partaient par `product_images`, et c'est
  exactement le chemin que le code emprunte (remplacement en `delete`
  puis `insert`). Une protection se vérifie sur le chemin réel du code,
  pas sur celui qu'on avait en tête en l'écrivant.
- **Un paramètre qui rattrape une différence de structure est le signe
  qu'il en faut deux.** `BottomNav` servait les deux espaces avec une
  liste unique de quatre onglets plus un `accountHref` pour corriger le
  dernier. Le commerçant voyait donc deux onglets qui n'existent pas chez
  lui. Le correctif n'était pas un meilleur paramètre, c'était deux
  listes.
- **Une décision écrite en plusieurs clauses se vérifie clause par
  clause.** `design/README.md` dit que les deux rôles n'ont ni la même
  barre d'onglets, ni le même écran d'ouverture, ni le même « Mon
  compte ». Une seule clause a été traitée, et le travail a été annoncé
  comme « les deux espaces ne se mélangent plus ». C'est le porteur du
  projet qui a dû demander « et la barre ? ».
- **Un correctif peut créer un défaut ailleurs.** Router un commerçant
  vers `/vendeur` a rendu l'onglet « Accueil » MORT dans son espace : on
  le touchait, on revenait au même écran. Un onglet qui ne fait rien est
  pire qu'un onglet absent — on réessaie, on croit l'application bloquée.
- **Un squelette de chargement qui ne ressemble pas à la vraie page fait
  sauter la page.** `loading.tsx` montrait encore la barre de recherche
  retirée de l'accueil, et affichait le squelette du fil CLIENT devant
  tout, espace commerçant compris. Un `loading.tsx` placé dans un dossier
  prend le pas sur celui du parent : c'est la réponse.
- **Une action dont on ne peut pas savoir si elle a réussi est une action
  cassée, même quand elle fonctionne.** Vécu dans les deux sens le
  2026-09-12 : le Table Editor de Supabase changeait un statut sans rien
  confirmer (le porteur du projet a cru l'écriture refusée), et les six
  actions ci-dessus faisaient l'inverse. Une commande qui renvoie la
  ligne modifiée vaut mieux qu'une grille qu'on édite à l'aveugle.
- **Un confort administratif est le moment exact où l'on rouvre une
  faille.** En rendant la validation d'une boutique plus simple
  (`0012`), mettre les fonctions en `security definer` les aurait rendues
  appelables en RPC par n'importe quel visiteur — c'est-à-dire
  l'auto-validation d'un commerçant, la première faille trouvée par les
  tests. `security invoker` est écrit en clair dans le fichier pour que
  ce soit un choix visible, pas un défaut subi.
- **Un identifiant de démonstration survit à la donnée de
  démonstration.** Neuf liens de `/ecrans` pointaient sur `p-riz`,
  `m-aissatou`, `t-mariama` — les identifiants de l'ancien `mock.ts` —
  alors que la base crée des UUID. Ils étaient morts depuis le
  branchement sur la vraie base, et invisibles parce que personne n'avait
  ouvert la page. Un index d'écrans dont un tiers des liens échoue ne
  sert pas à relire les écrans : il fait croire que l'application est
  cassée.


## 8. Journal — ce qui a été fait, et quand

Le détail du raisonnement de chaque décision vit dans les fichiers
eux-mêmes (migrations et commentaires de code, écrits pour être lus) et
les leçons durables dans la section 7. Ce journal ne sert qu'à répondre
à « quand, et pourquoi maintenant ? ».

### 2026-09-11 — la base, l'authentification, les actions
- Projet Supabase créé et migré ; les 5 migrations appliquées au tableau
  de bord sans être commitées sont reconstituées depuis la base.
- Consolidation de cinq lignes de travail divergentes dans `main`, et
  correction du réglage « branche par défaut » de GitHub qui pointait
  encore sur un arrêt sur image.
- Authentification complète (inscription, connexion, mot de passe oublié,
  comptes liés) et décision des comptes liés portée dans le schéma.
- Espace vendeur, messagerie, « Mon compte » et suppression de compte
  branchés sur la vraie base ; compression des photos dans le navigateur.
- Quatre manques de schéma tranchés : blocage, motif de refus,
  suppression de compte par anonymisation, lien entre les deux comptes.

### 2026-09-12 — la première confrontation à la réalité
Relecture complète du projet avec exécution de tout ce qui est
vérifiable, puis premier vrai passage dans un navigateur. **Six commits,
deux migrations, et 9 vérifications de sécurité de plus.**

- **Quatre bugs de la couche applicative** (`1bc7f89`) : un produit
  publié pouvait perdre toutes ses photos (fermé par `0011`), six actions
  échouaient en silence, l'onglet « Compte » renvoyait un commerçant
  connecté vers l'écran de connexion, et `/ecrans`/`/styleguide`
  partaient en production.
- **`0011` appliquée sur le projet Supabase** (`2110db5`) — elle était
  commitée sans être appliquée, l'écart inverse de celui de la veille.
- **Jeu de démonstration supprimé** (`20b7f81`), et neuf liens morts de
  `/ecrans` réparés : ils portaient les identifiants de l'ancien
  `mock.ts` et ne fonctionnaient plus depuis le branchement sur la vraie
  base.
- **`0012` — valider une boutique en un seul geste** (`d82019b`) : la
  demande était « une colonne pour approuver », la colonne existait déjà
  (`status`, lue à neuf endroits) ; ce qui manquait c'était que la
  changer SUFFISE. Ferme au passage le dernier trou de schéma connu.
- **Routage par rôle** (`dfe3a11`) : un commerçant atterrissait sur le
  fil client après connexion, contre une décision écrite depuis la
  maquette.
- **Deux barres d'onglets** (`3db6ee2`) : le commerçant voyait celle du
  client, `/vendeur` marquait le mauvais onglet actif, et le squelette de
  chargement client s'affichait devant tout.
- **Maquette republiée à l'état réel** : 36 écrans, 5 corrigés (la
  maquette promettait des choses que l'application ne fait pas), 3
  ajoutés (l'application les fait, la maquette ne les montrait pas).

**Trois erreurs d'analyse commises et corrigées en route**, notées parce
qu'elles se reproduiront : avoir affirmé qu'aucun déploiement Vercel
n'existait (il existait) ; avoir classé le routage par rôle comme
« décision produit ouverte » alors qu'une décision écrite en faisait un
bug ; avoir annoncé un travail terminé alors qu'un tiers seulement de la
règle était traité.

---

## 9. Le vrai risque

Le code est presque fait ; ce n'est pas là que le projet se joue.

Une marketplace vide n'attire aucun client, et sans clients aucun
commerçant ne reste. Recruter les vingt premiers commerçants est le travail
le plus difficile du projet, et il ne s'écrit pas en TypeScript.
