import { cn } from "@/lib/cn";

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
