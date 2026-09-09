# Tests de sécurité

Ces tests vérifient que le Row Level Security fait vraiment son travail.
Ils s'exécutent sur un PostgreSQL local, sans toucher au projet Supabase.

`_supabase_stub.sql` reproduit le strict minimum de l'environnement Supabase
(le schéma `auth`, la fonction `auth.uid()`, les rôles `anon` et
`authenticated`, le stockage) pour que les migrations puissent tourner
ailleurs que chez Supabase. Ce fichier ne fait pas partie de l'application.

## Lancer les tests

```bash
createdb makiti_test
psql -d makiti_test -f supabase/tests/_supabase_stub.sql
for f in supabase/migrations/*.sql; do psql -v ON_ERROR_STOP=1 -d makiti_test -f "$f"; done
psql -d makiti_test -f supabase/tests/security_test.sql
```

Chaque vérification affiche `OK`. La première qui échoue interrompt tout
avec `ECHEC`.

## Ce que ces tests protègent

Un test de sécurité utile ne vérifie pas que les actions autorisées
fonctionnent — ça, le premier utilisateur s'en apercevra. Il vérifie que les
actions **interdites** échouent. C'est la partie qu'on ne découvre jamais en
utilisant l'application normalement, et celle qui fait les fuites de données.

Ces tests ont déjà servi : ils ont détecté qu'un commerçant pouvait
s'auto-valider, parce que révoquer un privilège au niveau colonne est sans
effet quand le privilège existe au niveau table. La correction est
documentée dans la partie 4 de `0002_rules_and_security.sql`.

**Règle : toute nouvelle policy s'accompagne d'un test qui prouve qu'elle
bloque bien ce qu'elle prétend bloquer.**
