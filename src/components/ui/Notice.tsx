/**
 * Bandeau d'erreur affiché EN HAUT d'un écran, après une action qui a
 * échoué sur un autre écran (une feuille d'actions, typiquement).
 *
 * Pourquoi passer par l'URL plutôt que par `useActionState` comme les
 * formulaires de `src/components/auth/` : les lignes de la feuille
 * d'actions (`ActionRow`) sont de vraies `<form action={...}>` de
 * composants serveur, et elles doivent le rester — c'est ce qui les fait
 * fonctionner sans JavaScript, une propriété qui compte sur un réseau
 * guinéen instable (voir docs/REPRISE.md, étape 2). `useActionState`
 * imposerait de rendre chaque feuille cliente.
 *
 * Le compromis retenu : l'action redirige vers l'écran de destination en
 * portant son message dans `?erreur=`, et cet écran l'affiche. Le message
 * survit donc à une navigation complète, sans une ligne de JavaScript.
 *
 * Contrainte qui en découle, à garder en tête : ce texte vient de l'URL,
 * donc de l'utilisateur. React l'échappe à l'affichage (aucun risque
 * d'injection), mais n'importe qui peut fabriquer un lien qui affiche le
 * message de son choix. C'est acceptable ici — le bandeau ne décide de
 * rien, il informe — et ce ne le serait PAS pour une valeur qui
 * déclencherait une action.
 */
export function Notice({ children, tone = "danger" }: { children: React.ReactNode; tone?: "danger" | "success" }) {
  if (!children) return null;

  return (
    <p
      role="status"
      className={
        tone === "danger"
          ? "rounded-md border border-danger bg-danger-soft px-3.5 py-3 text-sm text-danger"
          : "rounded-md border border-success bg-success-soft px-3.5 py-3 text-sm text-success-ink"
      }
    >
      {children}
    </p>
  );
}
