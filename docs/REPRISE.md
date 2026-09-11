# Reprendre le travail sur Makiti

Ce fichier est le point d'entrée pour continuer le projet dans une nouvelle
conversation. Il dit ce qui est fait, ce qui reste, et ce qui a déjà été
tranché pour ne pas rediscuter les mêmes choses deux fois.

Branche de travail : `claude/prochaine-etape-08nw5c`.

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

### Base de données — écrite et testée, PAS déployée
`supabase/migrations/` — 4 fichiers SQL à exécuter dans l'ordre :

- `0001_schema.sql` — 9 tables : profiles, merchants, cities, categories,
  products, product_images, conversations, messages, reports
- `0002_rules_and_security.sql` — **le fichier le plus important** :
  triggers métier et règles de sécurité au niveau des lignes (RLS)
- `0003_search_and_seed.sql` — fonction `search_products`, 10 catégories,
  12 villes
- `0004_storage.sql` — stockage des photos

`supabase/tests/` — 34 tests de sécurité, rejouables sur un PostgreSQL
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
Ne rien casser du RLS ni des 34 tests de `supabase/tests/` en avançant sur
les étapes précédentes. Pas une étape isolée : un réflexe à chaque
modification de schéma envisagée.

### Étape 8 — Administration, anticiper sans construire
Pas de page admin en v1, mais garder en tête qu'elle arrivera : éviter les
choix qui la rendraient difficile à ajouter plus tard (ex. le motif de
refus d'une boutique, point 2 de la section précédente).

### Étape 9 — Supabase réel (dernière étape)
Tout ce qui suit était avant en tête de liste ; c'est maintenant la toute
dernière étape, une fois le front stabilisé :

1. Trancher le schéma des comptes liés (point 4 de la section précédente)
2. Créer un projet sur supabase.com (offre gratuite, région Europe de
   l'Ouest)
3. Exécuter les migrations dans l'ordre, dans l'éditeur SQL (mettre à jour
   `0001_schema.sql` avec la décision du point 1 avant de les exécuter)
4. Vérifier dans Database → Tables que **chaque** table affiche « RLS enabled »
5. Mettre `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   dans `.env.local` (la clé `service_role` ne doit jamais entrer dans le
   code du navigateur ni dans Git : elle ignore le RLS)
6. Générer les types (`supabase gen types typescript` remplace
   `src/lib/types.ts`)
7. Brancher les données en lecture, écran par écran, à la place de
   `src/lib/mock.ts`
8. Brancher l'authentification (inscription, connexion, mot de passe
   oublié, déconnexion, écran « compte requis », bascule entre comptes liés)
9. Brancher les actions du commerçant (produit, photos avec compression
   via `browser-image-compression` puis affichage en `next/image`,
   marquer vendu, masquer, supprimer, modifier la boutique)
10. Brancher la messagerie (Supabase Realtime) : ouvrir un fil, envoyer,
    citer un produit, marquer comme lu, signaler, bloquer
11. Notifier le commerçant : badge de non-lus + email (Resend). **Sans
    cette étape, la messagerie est une boîte aux lettres que personne ne
    relève.**
12. Déployer sur Vercel (`.vercel.app` pour commencer)
13. Avant le lancement : rédiger des conditions d'utilisation — Makiti est
    un intermédiaire technique, non une partie à la vente ; à écrire avant
    le premier litige, pas après
14. Supprimer la page `/ecrans`, qui est une page de travail

---

## 4. Trois manques dans la base de données

Découverts en dessinant les écrans, jamais corrigés. À trancher avant
l'étape 5 :

1. **Le blocage entre personnes.** L'écran 32 propose « bloquer cette
   personne », mais aucune table ne porte cette information.
2. **Le motif de refus d'une boutique.** `merchants.status` peut valoir
   `rejected` mais ne dit pas pourquoi. Un refus sans explication est un
   vendeur perdu définitivement.
3. **La suppression de compte.** Effacement réel ou anonymisation ? Si on
   efface vraiment, les conversations de l'autre partie deviennent
   illisibles.
4. **Le lien entre les deux comptes d'une même personne.** Décision prise
   le 2026-09-11 (une connexion, deux comptes liés, bascule sans
   reconnexion) mais pas encore traduite en schéma. `profiles.id`
   référence aujourd'hui `auth.users.id` en 1:1 — une connexion ne peut
   porter qu'un seul profil. À concevoir avant l'étape Supabase : soit
   `profiles` référence un `auth_user_id` (plusieurs profils par
   connexion, unique sur `(auth_user_id, role)`), soit une table de
   liaison séparée. Choix à faire à ce moment-là, pas avant — inutile de
   trancher un détail de schéma tant que la base réelle n'existe pas.

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
  par client.

---

## 8. Le vrai risque

Le code est presque fait ; ce n'est pas là que le projet se joue.

Une marketplace vide n'attire aucun client, et sans clients aucun
commerçant ne reste. Recruter les vingt premiers commerçants est le travail
le plus difficile du projet, et il ne s'écrit pas en TypeScript.
