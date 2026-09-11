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

**Les 9 migrations rejouent depuis une base vierge** — vérifié, pas
supposé (`supabase/tests/README.md` donne la commande). C'est la seule
propriété qui compte pour une suite de migrations, et c'est celle qui
casse le plus discrètement.

`supabase/tests/` — 46 tests de sécurité, rejouables sur un PostgreSQL
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
  `reference.ts`, `session.ts`. Seul endroit qui connaît la forme de la
  base ; traduit vers les types de `src/lib/types.ts`.
- `src/lib/actions/` — écriture : `auth.ts` (inscription, connexion,
  déconnexion, mot de passe oublié et réinitialisation, création du second
  compte lié), `merchants.ts` (création de boutique).
- `src/lib/mock.ts` — **encore utilisé** par les écrans qui n'ont pas de
  données réelles derrière : messagerie, espace vendeur, « mon compte ».
  Voir section 3.

**Authentification : faite.** Inscription client et commerçant, connexion,
déconnexion, mot de passe oublié, réinitialisation, comptes liés.

**Catalogue public : branché sur la vraie base.** `/`, `/recherche`, fiche
produit, galerie photo, boutique publique, contacter, signaler.

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

### Étape 2 — Espace vendeur : les actions produit
Le plus gros bloc restant. Écrans encore sur `mock.ts` : `/vendeur`,
`/vendeur/produits/[id]/actions`, `/vendeur/boutique`, `/vendeur/refusee`.

À brancher : créer et modifier un produit, envoyer les photos, marquer
vendu, masquer, supprimer, modifier la boutique, afficher le motif de
refus (`merchants.rejection_reason`, déjà en base).

**Compression des photos — déjà tranché, à appliquer ici :**

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
- **Affichage** : `next/image` (déjà en place dans `Photo`), jamais un
  `<img>` brut.
- Convention de chemin imposée par `0004_storage.sql` :
  `product-images/{merchant_id}/{product_id}/{n}.webp`. Le RLS du stockage
  vérifie le premier dossier — un commerçant ne peut écrire que chez lui.

### Étape 3 — Messagerie
Quatre écrans sur `mock.ts` : `/messages`, `/messages/[id]`, `+/citer`,
`+/actions`. Ouvrir un fil, envoyer un message, citer un produit, marquer
comme lu, signaler, bloquer (`conversations.blocked_by`, déjà en base —
section 4, point 1). Temps réel via Supabase Realtime.

Rappel des règles que la base fait déjà respecter, inutile de les
redupliquer dans l'interface : un seul fil par couple (client, boutique),
le premier message cite obligatoirement un produit, le produit cité
appartient à la boutique destinataire, quotas de 20 boutiques contactées
et 100 messages par jour.

### Étape 4 — « Mon compte » et la suppression de compte
`/compte` est encore sur `mock.ts`. Et il manque l'**Edge Function de
suppression** (`service_role`) : elle doit anonymiser `profiles`
(`full_name`, `phone`, `is_deleted`, `deleted_at`) **et** couper l'accès à
`auth.users` dans la MÊME opération — sinon un profil se retrouve marqué
supprimé avec une connexion encore active. Voir section 4, point 3.

À trancher à ce moment-là : est-ce que `merchants.status` doit sortir de
`'approved'` quand le commerçant supprimé avait une boutique publique ?

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
Voir la liste en tête de document. La compression des photos (étape 2) et
les formulaires fonctionnant sans JavaScript en sont les deux morceaux les
plus utiles.

### Sécurité — un réflexe, pas une étape
Ne rien casser du RLS ni des 46 tests de `supabase/tests/` en avançant.
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
