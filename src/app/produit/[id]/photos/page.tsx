import Link from "next/link";
import { notFound } from "next/navigation";
import { Image as ImageIcon, X } from "lucide-react";
import { findProduct } from "@/lib/mock";
import { cn } from "@/lib/cn";

/**
 * Écran 9 — galerie plein écran.
 *
 * Seul écran de l'application sur fond sombre : quand on regarde une
 * photo, tout le reste doit disparaître. Les couleurs sont donc écrites
 * ici en clair et non prises dans les tokens — c'est une exception
 * assumée, pas un oubli. Si elle se reproduisait ailleurs, il faudrait en
 * faire des tokens.
 */
export default async function GalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ photo?: string }>;
}) {
  const { id } = await params;
  const { photo = "1" } = await searchParams;
  const product = findProduct(id);
  if (!product) notFound();

  const current = Math.min(Math.max(Number(photo) || 1, 1), product.photoCount);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-[#12100e]">
      <div className="flex shrink-0 items-center justify-between p-4">
        <Link href={`/produit/${product.id}`} aria-label="Fermer" className="text-white">
          <X size={24} strokeWidth={2} />
        </Link>
        <span className="text-sm font-medium text-white/65">
          {current} / {product.photoCount}
        </span>
        <span className="w-6" />
      </div>

      <div className="flex flex-1 items-center justify-center text-white/25">
        <ImageIcon size={56} strokeWidth={1.2} aria-hidden />
      </div>

      <div className="flex shrink-0 gap-2.5 p-4">
        {Array.from({ length: product.photoCount }, (_, i) => i + 1).map((n) => (
          <Link
            key={n}
            href={`/produit/${product.id}/photos?photo=${n}`}
            aria-label={`Photo ${n}`}
            className={cn(
              "size-16 rounded-md bg-white/10",
              n === current && "ring-2 ring-white",
            )}
          />
        ))}
      </div>
    </div>
  );
}
