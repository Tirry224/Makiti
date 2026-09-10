import { notFound } from "next/navigation";
import { Check, Flag, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { Screen, ScreenBody, ScreenFooter, Section } from "@/components/ui/Screen";
import { PriceTag } from "@/components/product/PriceTag";
import { MerchantCard } from "@/components/product/MerchantCard";
import { findProduct } from "@/lib/mock";
import Link from "next/link";

/** Fiche produit — écrans 7 et 8 de docs/ECRANS.md. */
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  /* Depuis Next 15, `params` est une promesse : la page peut commencer à
     s'afficher avant que le routeur ait fini de résoudre l'URL. */
  const { id } = await params;
  const product = findProduct(id);
  if (!product) notFound();

  const sold = product.status === "sold";

  return (
    <Screen>
      <ScreenBody>
        <div className="relative">
          <Link href={`/produit/${product.id}/photos`} aria-label="Voir les photos">
            <Photo
              ratio="hero"
              label={`Photo 1 sur ${product.photoCount}`}
              className={sold ? "grayscale" : ""}
            />
          </Link>
          <Link
            href="/"
            aria-label="Retour"
            className="absolute top-3.5 left-3.5 flex size-10 items-center justify-center rounded-full bg-surface/90"
          >
            <span className="text-lg leading-none">←</span>
          </Link>
          {sold ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-ink px-4 py-2 text-sm font-bold tracking-wide text-paper">
                VENDU
              </span>
            </div>
          ) : null}
        </div>

        <Section>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">{product.title}</h1>
            <div className="flex items-center gap-2.5">
              <PriceTag amount={product.priceGnf} size="lg" struck={sold} />
              {product.isNegotiable && !sold ? <Badge tone="accent">Négociable</Badge> : null}
            </div>
            {sold ? null : (
              <p className="flex items-center gap-1.5 text-sm font-semibold text-success">
                <Check size={16} strokeWidth={2.4} aria-hidden />
                Disponible
              </p>
            )}
          </div>

          {product.description ? (
            <p className="text-base leading-relaxed text-ink-soft">{product.description}</p>
          ) : null}

          <MerchantCard merchant={product.merchant} />

          <Link
            href={`/produit/${product.id}/signaler`}
            className="flex items-center gap-1.5 text-sm text-ink-soft"
          >
            <Flag size={16} strokeWidth={1.8} aria-hidden />
            Signaler ce produit
          </Link>
        </Section>
      </ScreenBody>

      <ScreenFooter className="flex gap-2.5">
        {sold ? (
          <Button variant="secondary">Ce produit n&apos;est plus disponible</Button>
        ) : (
          <>
            <Button icon={MessageCircle} href={`/produit/${product.id}/contacter`}>
              Contacter le vendeur
            </Button>
            <Button
              variant="secondary"
              fullWidth={false}
              aria-label="Contacter sur WhatsApp"
              className="w-control shrink-0 text-success"
            >
              WA
            </Button>
          </>
        )}
      </ScreenFooter>
    </Screen>
  );
}
