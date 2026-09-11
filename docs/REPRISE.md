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

`supabase/tests/` — 34 tests de sécurité, rejouables sur un PostgreSQL
local (voir `supabase/tests/README.md`). Ils vérifient que les actions
**interdites** échouent. Ils ont déjà trouvé deux vraies failles pendant
l'écriture, et une troisième plus tard : le fichier de test lui-même
supposait encore l'ancien modèle (`profiles.id = auth.users.id`) et ne
tournait plus depuis le passage aux comptes liés. Corrigé et rejoué
intégralement (34/34 OK) le 2026-09-11.

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

### Étape 0 — Relire les 21 derniers écrans
**À faire en premier.** Les 12 premiers écrans ont été vérifiés dans un
navigateur ; les 21 derniers ne l'ont pas été, faute de temps. Le build et
les types passent, mais cela ne dit rien du rendu. Les vérifications
précédentes avaient trouvé une classe CSS inexistante, un prix illisible et
un badge étiré — aucun de ces défauts ne produisait d'erreur.

Ouvrir `/ecrans`, parcourir les 33, corriger ce qui cloche.

### Étape 1 — Créer le projet Supabase — FAIT (2026-09-11)
Projet `Makiti` créé, 9 migrations exécutées, RLS activé sur chaque table
(vérifié via les advisors Supabase). Reste à faire, si ce n'est déjà en
place : mettre `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
dans `.env.local` (jamais dans Git). La clé `service_role` ne doit jamais
entrer dans le code du navigateur ni dans Git : elle ignore le RLS et donne
un accès total à la base.

### Étape 2 — Générer les types depuis la base — FAIT (2026-09-11)
`src/lib/database.types.ts` est généré depuis la base réelle et ne doit
jamais être modifié à la main (la commande de régénération est en tête du
fichier).

Une correction par rapport au plan initial, qui disait « remplace
`src/lib/types.ts` » : les types générés ne remplacent PAS les types du
domaine, ils s'ajoutent à côté. Les remplacer aurait obligé à réécrire les
24 composants en snake_case pour parler le langage des tables au lieu de
celui des écrans. `src/lib/data.ts` est le seul point de contact entre les
deux mondes — c'est lui qui casse à la compilation quand une colonne est
renommée, et les composants ne bougent pas.

### Étape 3 — Brancher les données en lecture — FAIT pour le public
Branchés sur la vraie base : fil d'accueil, recherche (via
`search_products`), fiche produit, galerie photo, boutique publique.

Toujours sur `src/lib/mock.ts`, et ça ne changera qu'à l'étape 4 : les
écrans de messagerie et tout l'espace vendeur. Ce n'est pas un oubli — ces
écrans demandent de savoir QUI regarde, et le RLS ne renverra rien tant
qu'il n'y a pas de session.

**Jeu de démonstration** : la base était vide, donc invérifiable.
`supabase/seed_demo.sql` crée deux boutiques et six produits (dont un
vendu et un brouillon, pour voir les deux cas). À supprimer avant le
lancement — commande en fin de fichier.

**Limite connue** : les lignes de `product_images` du jeu de démonstration
ne désignent aucun fichier réel (l'environnement où le branchement a été
fait n'a pas accès au réseau Supabase). Les vignettes s'afficheront donc
cassées tant qu'une vraie photo n'aura pas été déposée. Le code, lui, gère
les deux cas : sans photo, `Photo` affiche son emplacement gris.

### Étape 4 — Brancher l'authentification
Inscription (avec le rôle dans les métadonnées, le trigger crée le profil),
connexion, mot de passe oublié, déconnexion, écran « compte requis ».

### Étape 5 — Brancher les actions du commerçant
Créer et modifier un produit, envoyer les photos vers le stockage (avec
compression côté navigateur avant l'envoi), marquer vendu, masquer,
supprimer, modifier la boutique.

### Étape 6 — Brancher la messagerie
Ouvrir un fil, envoyer un message, citer un produit, marquer comme lu,
signaler, bloquer. Le temps réel passe par Supabase Realtime.

### Étape 7 — Notifier le commerçant
**Sans cette étape, la messagerie est une boîte aux lettres que personne ne
relève.** Plan retenu : compteur de non-lus dans l'application + email à
chaque nouveau message (via Resend, offre gratuite suffisante). Le push web
est reporté : il ne fonctionne pas de façon fiable sur iPhone sans
installation de la PWA.

### Étape 8 — Déployer
Vercel, sur une adresse `.vercel.app` pour commencer.

### Étape 9 — Avant le lancement
Rédiger des conditions d'utilisation. Makiti est un intermédiaire technique
et non une partie à la vente ; cette distinction doit être écrite avant le
premier litige, pas après.

Puis **supprimer la page `/ecrans`**, qui est une page de travail.

---

## 4. Trois manques dans la base de données — RÉSOLUS (2026-09-11)

Découverts en dessinant les écrans. Les trois ont depuis été tranchés et
sont dans le schéma déployé (0001/0002) ; ce qui suit documente la décision
prise pour chacun, pas un travail restant.

1. **Le blocage entre personnes.** Résolu par `conversations.blocked_by` :
   avec un seul fil par couple (client, boutique), il n'existe qu'UN
   endroit où bloquer a un sens. `blocked_by` dit qui a bloqué ; l'AUTRE
   participant perd le droit d'écrire (RLS), le fil reste lisible pour les
   deux. Pas de déblocage en v1. **Reste un trou mineur** : rien n'empêche
   qu'un participant retiré du fil (aucun cas prévu en v1) laisse
   `blocked_by` pointer vers un profil qui n'est plus partie prenante — non
   bloquant, à surveiller si un jour on ajoute le départ d'un participant.
2. **Le motif de refus d'une boutique.** Résolu par
   `merchants.rejection_reason`, rempli par l'administrateur. **Reste un
   trou réel, pas juste cosmétique** : aucune contrainte n'empêche de
   passer `status = 'rejected'` en laissant `rejection_reason` vide — la
   base accepte un refus sans motif, exactement le problème que la colonne
   devait éviter. Un `check` (`status <> 'rejected' or rejection_reason is
   not null`) le fermerait proprement ; pas fait faute d'avoir un vrai
   parcours de refus à tester dessus.
3. **La suppression de compte.** Résolu : anonymisation, jamais un vrai
   `delete`. `profiles.is_deleted` / `deleted_at` marquent le compte ;
   `full_name` et `phone` sont écrasés par une Edge Function avec
   `service_role` au moment de la suppression (étape 9) plutôt que par une
   colonne séparée. Les conversations de l'autre partie restent lisibles.
   **Cette Edge Function n'existe pas encore** — c'est elle, pas le schéma,
   qui reste à écrire.

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
- **Comptes liés** (révise une décision antérieure, voir docs/SPEC.md,
  décision 8) : une connexion peut porter un profil client ET un profil
  commerçant, chacun modéré indépendamment (suspendre l'un ne gèle pas
  l'autre). Le second compte se crée depuis l'app, sans re-passer par
  l'inscription — pas d'intervention admin nécessaire.
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
