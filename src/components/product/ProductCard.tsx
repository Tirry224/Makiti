import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Photo } from "@/components/ui/Photo";
import { PriceTag } from "./PriceTag";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

/**
 * La vignette du fil, en grille de deux colonnes.
 *
 * Elle ne reçoit qu'un `Product` : tout ce qu'elle affiche vient de cet
 * objet. Si demain la carte doit montrer la date, on change ce fichier et
 * les quarante endroits qui l'utilisent suivent.
 */
export function ProductCard({ product }: { product: Product }) {
  const sold = product.status === "sold";

  return (
    <Link href={`/produit/${product.id}`} prefetch={false} className="block">
      <Card className={cn("flex h-full flex-col", sold && "opacity-60")}>
        <Photo ratio="card" />
        <div className="flex flex-col gap-1.5 px-3 pt-2.5 pb-3">
          <h3 className="text-sm leading-snug font-semibold">{product.title}</h3>
          <PriceTag amount={product.priceGnf} struck={sold} />
          <p className="text-2xs text-ink-soft">
            {product.merchant.shopName} · {product.merchant.city}
          </p>
          {/* Une seule étiquette par carte. Deux, et la grille devient
              un damier illisible ; l'ordre dit laquelle compte le plus.
              « Neuf » n'apparaît jamais : c'est l'hypothèse par défaut,
              c'est « Occasion » qui est une information. */}
          {sold ? (
            <Badge>Vendu</Badge>
          ) : product.condition === "occasion" ? (
            <Badge>Occasion</Badge>
          ) : product.isNegotiable ? (
            <Badge tone="accent">Négociable</Badge>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}
