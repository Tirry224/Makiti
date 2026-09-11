import { Check, ChevronDown, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import { MESSAGES, type CodeErreur } from "@/lib/validation";

/**
 * Enveloppe d'un champ : intitulé au-dessus, aide en dessous.
 *
 * L'intitulé est un vrai `<label>` relié au champ par `htmlFor`, ce qui
 * fait deux choses : un lecteur d'écran annonce « Nom complet, zone de
 * saisie », et taper sur l'intitulé place le curseur dans le champ. Un
 * simple `<div>` stylé en gras ne fait ni l'un ni l'autre.
 */
export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink-soft">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-ink-soft">{hint}</p> : null}
    </div>
  );
}

const CONTROL = "w-full rounded-lg border border-line bg-surface px-3.5 text-base text-ink";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(CONTROL, "h-control", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(CONTROL, "resize-none py-3 leading-normal", className)} {...props} />;
}

/**
 * Liste déroulante NATIVE.
 *
 * Le `<select>` du système est laid, et c'est son seul défaut. En échange
 * il ne coûte pas un octet de JavaScript, il s'ouvre en roue crantée sur
 * un téléphone, il se navigue au clavier, il se lit à la voix, et il
 * fonctionne avant que la page soit « réanimée ». Un sélecteur maison
 * ferait l'inverse sur tous les points (docs/PERFORMANCE.md, règle R3).
 */
export function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(CONTROL, "h-control w-full appearance-none pr-10", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={18}
        strokeWidth={2}
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-ink-soft"
      />
    </div>
  );
}

/**
 * Le message d'erreur d'un formulaire, lu depuis l'URL.
 *
 * `role="alert"` le fait annoncer par un lecteur d'écran à l'arrivée sur
 * la page — sans quoi une personne aveugle ne saurait pas pourquoi son
 * formulaire est revenu vide de sens.
 */
export function MessageErreur({ code }: { code?: string }) {
  if (!code || !(code in MESSAGES)) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2.5 rounded-lg bg-danger-soft px-3.5 py-3 text-sm leading-normal text-danger"
    >
      <TriangleAlert size={17} strokeWidth={2} className="mt-px shrink-0" aria-hidden />
      {MESSAGES[code as CodeErreur]}
    </p>
  );
}

/** Confirmation après une action réussie. Même mécanique, autre couleur. */
export function MessageSucces({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      className="flex items-start gap-2.5 rounded-lg bg-success-soft px-3.5 py-3 text-sm leading-normal text-success-ink"
    >
      <Check size={18} strokeWidth={2.4} className="mt-px shrink-0 text-success" aria-hidden />
      {children}
    </p>
  );
}

/**
 * Champ purement décoratif : il ressemble à un champ mais n'en est pas un.
 * Sert aux zones qui ouvrent autre chose au tap — le champ de recherche du
 * fil ouvre l'écran de recherche, il ne reçoit pas de frappe.
 */
export function FakeInput({
  children,
  className,
  trailing,
}: {
  children: React.ReactNode;
  className?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className={cn(CONTROL, "h-control flex items-center gap-2.5", className)}>
      <span className="flex flex-1 items-center gap-2.5 truncate">{children}</span>
      {trailing}
    </div>
  );
}
