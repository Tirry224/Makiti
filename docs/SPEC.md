# Makiti — Spécification de la v1

Marketplace de mise en relation : des commerçants publient leurs produits,
des clients les parcourent et contactent le commerçant par messagerie interne.
**Aucun paiement, aucun panier, aucune livraison** : la transaction se fait hors
de l'application.

Marché : Guinée · Devise : franc guinéen (GNF) · Langue : français.

---

## 1. Décisions validées

| # | Sujet | Décision |
|---|-------|----------|
| 1 | Authentification | Email + mot de passe. Téléphone obligatoire mais **non vérifié** (pas de SMS, pas de coût). |
| 2 | Navigation | Catalogue **libre sans compte**. Compte obligatoire uniquement pour envoyer un message. |
| 3 | Catégories | Liste **fixe** de 10 catégories, gérée par l'administrateur. |
| 4 | Classement du fil | Pas de notation. Tri : *à la une* (manuel) → *populaires* (nb de conversations) → *récents*. |
| 5 | Notification commerçant | v1 : badge de non-lus + email. Push web reporté en v2. |
| 5b | Structure des fils | **Un seul fil par couple (client, boutique).** Chaque message référence le produit dont il parle ; le premier message d'un fil en porte obligatoirement un. |
| 6 | Modération produits | Publication immédiate, bouton « signaler », masquage possible par l'admin. |
| 7 | Volume cible | 500 commerçants **à un an**. Densité avant volume au lancement. |
| 8 | Rôles | Un compte = un seul rôle (client **ou** commerçant). Rôle modifiable à la main par l'admin. |
| 9 | Ville | Filtre **manuel** choisi par le client. Jamais de filtrage automatique. |
| 10 | Disponibilité | Binaire (disponible / vendu). **Pas de gestion de stock.** |
| 11 | Validation commerçant | Manuelle, via le tableau de bord Supabase. Aucune page admin en v1. |
| 12 | Commerçant en attente | Voit un message d'attente, peut préparer sa boutique et ses produits en **brouillon**. |
| 13 | Abus | Bouton « signaler » + suspension de compte + deux quotas : 20 boutiques contactées/jour et 100 messages/jour par compte. |
| 14 | Recherche | Sur le titre, la description et le nom de la boutique. Insensible aux accents. |
| 15 | Photos | 1 minimum, 3 maximum. Compression avant envoi. Coûts assumés par le porteur du projet. |
| 16 | Litige | Suspension du compte vendeur. |
| 17 | Monétisation | Aucune en v1 (choix assumé). |
| 18 | Hébergement | Vercel, sous-domaine `.vercel.app`. |

## 2. Hors périmètre de la v1

Paiement en ligne · panier · livraison · gestion de stock · notation et avis ·
notifications push · application mobile native · page d'administration ·
multi-boutiques par commerçant · plusieurs langues.

## 3. Parcours utilisateurs

**Visiteur** — arrive sur le fil, filtre par ville et catégorie, recherche,
ouvre une fiche produit. Pour écrire, on lui demande de créer un compte.

**Client** — s'inscrit (nom, email, téléphone, mot de passe), ouvre une
conversation sur un produit, échange avec le commerçant, peut signaler.

**Commerçant** — s'inscrit, renseigne sa boutique (nom, ville, téléphone
WhatsApp), attend la validation en préparant ses produits en brouillon. Une
fois approuvé, il publie, reçoit les messages et répond.

**Administrateur** — travaille directement dans le tableau de bord Supabase :
approuve les commerçants, masque un produit, suspend un compte, met un
produit à la une.

## 4. Risques identifiés

1. **Amorçage** — une marketplace vide n'attire personne. Priorité au
   recrutement des premiers commerçants sur une zone unique, pas au volume.
2. **Réactivité des commerçants** — un message sans réponse tue la confiance.
   C'est la raison d'être de la notification par email.
3. **Confiance** — aucune vérification des vendeurs au-delà d'un contrôle
   humain sommaire. Prévoir des conditions d'utilisation avant le lancement.

## 5. Questions encore ouvertes

- Sur quel **critère concret** un commerçant est-il approuvé ?
- Liste définitive des **10 catégories** et des **villes**.
- Conditions générales d'utilisation à rédiger avant la mise en ligne.
