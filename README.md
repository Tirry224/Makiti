# Makiti

Marketplace de mise en relation entre commerçants et clients, en Guinée.
Le commerçant publie ses produits, le client les parcourt librement et le
contacte par messagerie interne. **Aucun paiement en ligne** : la vente se
conclut hors de l'application.

- Spécification complète : [`docs/SPEC.md`](docs/SPEC.md)
- Base de données : [`supabase/migrations/`](supabase/migrations/)

## État d'avancement

- [x] Spécification validée
- [x] Schéma de base de données, règles métier et sécurité (RLS)
- [x] Tests de sécurité (34 vérifications, voir `supabase/tests/`)
- [ ] Projet Supabase créé et migrations exécutées
- [x] Design system et bibliothèque de composants (`src/styles/`, `src/components/`)
- [ ] Les 32 écrans (5 faits sur 32)
- [ ] Branchement des données et des actions
- [ ] Notification par email des nouveaux messages
- [ ] Déploiement Vercel

## Tests

Les règles de sécurité sont couvertes par des tests exécutables sur un
PostgreSQL local : voir [`supabase/tests/README.md`](supabase/tests/README.md).
À lancer après toute modification d'une policy.

## Démarrer l'application

```bash
npm install
npm run dev
```

- `/` fil d'accueil · `/produit/p-riz` fiche produit · `/inscription`
  · `/messages` · `/messages/t-mariama` fil de discussion
- **`/styleguide`** : tous les composants et tous les tokens sur une page.

Les écrans affichent des données de démonstration (`src/lib/mock.ts`).
Aucun bouton n'agit encore : c'est la prochaine étape.

Pour changer l'apparence de l'application, voir
[`src/styles/README.md`](src/styles/README.md).

## Mise en place de la base

1. Créer un projet sur [supabase.com](https://supabase.com) (offre gratuite),
   région Europe de l'Ouest — la plus proche de la Guinée.
2. Dans **SQL Editor**, exécuter les fichiers de `supabase/migrations/`
   **dans l'ordre numérique**, un par un. Lire les commentaires en même
   temps : ils expliquent chaque décision.
3. Dans **Authentication → Providers**, garder `Email` activé et désactiver
   la confirmation par email pendant le développement.
4. Vérifier dans **Database → Tables** que chaque table affiche bien
   « RLS enabled ». Si une seule ne l'est pas, ses données sont publiques.

## Variables d'environnement

À placer dans `.env.local`, **jamais** dans un fichier versionné :

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

La clé `anon` est conçue pour être exposée au navigateur : c'est le RLS qui
protège les données, pas le secret de cette clé. En revanche la clé
`service_role` ignore complètement le RLS et donne un accès total à la base.
Elle ne doit jamais apparaître dans le code du navigateur, ni dans Git.
