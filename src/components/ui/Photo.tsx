import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Photo de produit, ou son emplacement quand il n'y en a pas.
 *
 * Les deux cas vivent dans le même composant à dessein : un produit sans
 * photo ne doit pas casser la grille, il doit occuper exactement la même
 * place. Sans `src`, on affiche une plaque grise honnête plutôt qu'un vide.
 *
 * `next/image` n'est pas un luxe ici : il redimensionne l'image côté
 * serveur et ne charge que ce qui est visible. Sur un téléphone en 3G à
 * Conakry, servir la photo d'origine de 2 Mo pour l'afficher dans une
 * vignette de 160 px, c'est la différence entre un fil qui s'ouvre et un
 * fil qu'on abandonne.
 */
export function Photo({
  ratio = "square",
  src,
  alt = "",
  label,
  className,
  iconSize = 26,
  priority = false,
}: {
  ratio?: "square" | "card" | "hero" | "free";
  src?: string;
  alt?: string;
  label?: string;
  className?: string;
  iconSize?: number;
  priority?: boolean;
}) {
  const RATIOS = {
    square: "aspect-square",
    card: "h-33",       /* 132px, la vignette du fil */
    hero: "h-75",       /* 300px, la photo de la fiche produit */
    free: "",
  } as const;

  /* Ce que le navigateur doit télécharger selon l'emplacement : la fiche
     produit occupe toute la largeur, la vignette du fil une colonne sur
     deux. Sans cette indication, Next sert la plus grande taille possible. */
  const SIZES = {
    square: "100vw",
    card: "50vw",
    hero: "100vw",
    free: "112px",
  } as const;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-1.5 overflow-hidden bg-placeholder text-ink-soft/60",
        RATIOS[ratio],
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={SIZES[ratio]}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <>
          <ImageIcon size={iconSize} strokeWidth={1.5} aria-hidden />
          {label ? <span className="text-2xs font-medium">{label}</span> : null}
        </>
      )}
    </div>
  );
}
