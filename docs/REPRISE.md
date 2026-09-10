# Reprendre le travail sur Makiti

> Ce document sert à reprendre le projet **à froid** : installation,
> déploiement, architecture. L'état d'avancement au jour le jour vit dans
> `CLAUDE.md`, à la racine — un seul endroit pour éviter que les deux
> divergent.

Ce fichier est le point d'entrée pour continuer le projet dans une nouvelle
conversation. Il dit ce qui est fait, ce qui reste, et ce qui a déjà été
tranché pour ne pas rediscuter les mêmes choses deux fois.

Branche de travail : voir `git branch`. Elle change à chaque série de
travaux, la noter ici la rendrait fausse une semaine plus tard.

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
- `0003_search_and_seed.sql` — fonction `search_products`, catégories,
  12 villes
- `0004_storage.sql` — stockage des photos

> **Dette connue, à régler au moment du branchement Supabase et pas avant :**
> les catégories semées par `0003` (alimentation, maison, bricolage…) ne sont
> plus celles du produit. La liste retenue est celle de `SPEC.md` §1.3 et de
> `src/lib/mock.ts`. Elle demandera une migration `0005` qui : sème les 8
> catégories, ajoute une colonne `examples` (les listes d'exemples affichées
> sous le sélecteur), et ne supprime les anciennes que si aucun produit ne
> les référence — `products.category_id` est une clé étrangère, un `delete`
> non gardé ferait échouer toute la migration.

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

### Étape 0 — Relire les 21 derniers écrans
**À faire en premier.** Les 12 premiers écrans ont été vérifiés dans un
navigateur ; les 21 derniers ne l'ont pas été, faute de temps. Le build et
les types passent, mais cela ne dit rien du rendu. Les vérifications
précédentes avaient trouvé une classe CSS inexistante, un prix illisible et
un badge étiré — aucun de ces défauts ne produisait d'erreur.

Ouvrir `/ecrans`, parcourir les 33, corriger ce qui cloche.

### Étape 1 — Créer le projet Supabase
Bloque tout le reste.

1. Créer un projet sur supabase.com (offre gratuite, région Europe de l'Ouest)
2. Exécuter les 4 migrations dans l'ordre, dans l'éditeur SQL
3. Vérifier dans Database → Tables que **chaque** table affiche « RLS enabled »
4. Mettre `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   dans `.env.local`

La clé `service_role` ne doit jamais entrer dans le code du navigateur ni
dans Git : elle ignore le RLS et donne un accès total à la base.

### Étape 2 — Générer les types depuis la base
`supabase gen types typescript` remplace `src/lib/types.ts`. Les types ne
peuvent alors plus se désynchroniser du schéma réel.

### Étape 3 — Brancher les données en lecture
Remplacer `src/lib/mock.ts` écran par écran : fil d'accueil, fiche produit,
boutique publique, recherche (via la fonction `search_products`).

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
- **Un compte = un seul rôle**, client ou commerçant, modifiable
  uniquement à la main par l'administrateur.
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
