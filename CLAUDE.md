# Makiti — règles de travail

## Ordre de construction (non négociable)

1. **Front et actions d'abord.** Écrans, composants, navigation, formulaires,
   états vides et d'erreur, sur données de démonstration (`src/lib/mock.ts`).
2. **Supabase ensuite**, une fois le front figé.

**Ne touche pas à `supabase/` tant que l'étape 1 n'est pas terminée** —
ni migration, ni schéma, ni politique RLS, ni test SQL. Une décision produit
(catégories, statuts, champs) se pose d'abord dans `docs/SPEC.md` et dans les
données de démonstration ; elle descend en base au moment du branchement,
pas avant. Un schéma écrit trop tôt se fait démentir par le premier écran
qui manquait.

Si un travail semble exiger une migration, écris ce qu'elle devra faire dans
`docs/REPRISE.md` (section « dette connue ») et arrête-toi là.

## Langue

Code, commentaires, commits, documentation et interface : **français**.
