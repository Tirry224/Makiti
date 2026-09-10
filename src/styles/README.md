# Styles

Trois fichiers, trois rôles distincts. Le découpage n'est pas décoratif :
il répond à la question « où est-ce que je dois aller pour changer ça ? ».

| Fichier | Contient | Tu y vas pour… |
|---|---|---|
| `tokens.css` | Les **valeurs** : couleurs, tailles de texte, rayons, espacements | Changer l'apparence de toute l'application |
| `base.css` | Ce qui s'applique **partout** : fond, police, titres, focus | Modifier un comportement global |
| `index.css` | L'**ordre** des imports | Presque jamais |

## Comment changer quelque chose

**Changer la couleur de l'application** — une seule ligne dans `tokens.css` :

```css
--color-accent: oklch(0.55 0.15 42);   /* terre cuite */
--color-accent: oklch(0.55 0.15 150);  /* vert */
--color-accent: oklch(0.55 0.15 250);  /* bleu */
```

Le troisième nombre est la teinte, sur un cercle de 0 à 360. Garde les deux
premiers (clarté et saturation) : c'est ce qui fait que la couleur reste
lisible en texte blanc dessus, et cohérente avec les couleurs d'état.

**Rendre l'interface plus aérée** — les espacements suivent l'échelle de
Tailwind par pas de 4 px. Remplace `p-4` par `p-5` dans le composant
concerné. Il n'y a qu'un composant par élément, donc un seul endroit.

**Grossir tout le texte** — les tailles de `--text-*` sont en `rem`, donc
relatives à la taille de base du navigateur. Pour tout grossir de 10 %,
ajoute `font-size: 110%` sur `html` dans `base.css`. Ne touche pas aux
huit valeurs une par une.

**Ajouter une couleur** — pose-toi d'abord la question : est-ce un nouveau
*rôle* (une information nouvelle à transmettre) ou juste une envie ? Si
c'est un rôle, ajoute-le dans `tokens.css` avec un nom qui dit son rôle
(`--color-info`, pas `--color-violet`). Sinon, réutilise l'existant.

## La règle qui protège tout le système

**Aucune valeur de couleur, de taille de texte ou de rayon ne doit
apparaître ailleurs que dans `tokens.css`.**

Pour vérifier qu'elle est respectée :

```bash
grep -rnE '#[0-9a-fA-F]{3,6}|oklch\(|rgb\(' src/components src/app
```

Cette commande ne doit rien renvoyer. Le jour où elle renvoie quelque
chose, le design system a commencé à fuir.

## Pourquoi la palette par défaut de Tailwind est effacée

`tokens.css` contient `--color-*: initial;`, qui supprime les couleurs
livrées avec Tailwind. Écrire `bg-blue-500` ne produit donc plus rien du
tout. C'est voulu : on ne peut pas introduire une couleur hors charte par
distraction, et le jour où on veut voir toutes les couleurs de
l'application, elles sont dans un seul fichier de 170 lignes.
