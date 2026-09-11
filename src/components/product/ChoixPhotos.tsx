"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Plus, X } from "lucide-react";

/**
 * Choisir ses photos, et les COMPRESSER avant de les envoyer.
 *
 * ── Le meilleur emploi du JavaScript de tout le projet ──────────────────
 *
 * Une photo prise avec un téléphone pèse 3 à 6 Mo. Envoyée telle quelle
 * depuis Madina en 3G, elle coûte au commerçant plusieurs minutes et une
 * part de son forfait — pour une image que personne ne verra jamais à plus
 * de 1080 px de large. Redimensionnée et réencodée ici, dans son
 * navigateur, elle tombe autour de 100 Ko. Ce sont les octets les plus
 * rentables du projet, et AUCUN rendu serveur ne peut les économiser :
 * pour compresser sur le serveur, il faut d'abord y envoyer l'original.
 *
 * ── Amélioration progressive, pas dépendance ────────────────────────────
 *
 * Le champ de fichier est un vrai `<input type="file">`. Sans JavaScript,
 * il fonctionne : le commerçant envoie ses photos d'origine, lourdement,
 * mais il les envoie. Avec JavaScript, on remplace les fichiers choisis
 * par leurs versions compressées — le formulaire ne sait même pas que
 * quelque chose s'est passé.
 *
 * ── Ce qui est envoyé ───────────────────────────────────────────────────
 *
 * Une seule taille pour l'instant : 1080 px de large, qualité 0,72, en
 * WebP (repli JPEG pour les navigateurs anciens). La vignette de 300 px
 * sera produite au même endroit quand le stockage existera — mieux vaut
 * une passe de plus ici qu'un redimensionnement facturé à chaque
 * affichage. Voir docs/PERFORMANCE.md, règle R1.
 */

const MAX_PHOTOS = 3;
const LARGEUR_MAX = 1080;
const QUALITE = 0.72;

type Vignette = { url: string; nom: string; avant: number; apres: number };

/** Redimensionne et réencode une image dans le navigateur. */
async function compresser(fichier: File): Promise<File> {
  const bitmap = await createImageBitmap(fichier);
  const ratio = Math.min(1, LARGEUR_MAX / bitmap.width);
  const largeur = Math.round(bitmap.width * ratio);
  const hauteur = Math.round(bitmap.height * ratio);

  const toile = document.createElement("canvas");
  toile.width = largeur;
  toile.height = hauteur;
  toile.getContext("2d")?.drawImage(bitmap, 0, 0, largeur, hauteur);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resoudre) => {
    /* WebP compresse 25 à 35 % de mieux que JPEG à qualité égale. Un
       navigateur qui ne sait pas l'encoder renvoie silencieusement du
       PNG — d'où la vérification du type plutôt qu'une confiance aveugle. */
    toile.toBlob((b) => resoudre(b), "image/webp", QUALITE);
  });

  if (!blob || blob.type !== "image/webp") {
    const repli = await new Promise<Blob | null>((resoudre) =>
      toile.toBlob((b) => resoudre(b), "image/jpeg", QUALITE),
    );
    if (!repli) return fichier;
    return new File([repli], fichier.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  }

  /* Une petite photo déjà légère n'a rien à gagner : on garde l'originale
     plutôt que de la réencoder — un réencodage dégrade toujours un peu. */
  if (blob.size >= fichier.size) return fichier;

  return new File([blob], fichier.name.replace(/\.\w+$/, ".webp"), { type: "image/webp" });
}

const ko = (octets: number) => `${Math.round(octets / 1024)} Ko`;

export function ChoixPhotos() {
  const champ = useRef<HTMLInputElement>(null);
  const [vignettes, setVignettes] = useState<Vignette[]>([]);
  const [occupe, setOccupe] = useState(false);

  async function choisir(evenement: React.ChangeEvent<HTMLInputElement>) {
    const choisis = [...(evenement.target.files ?? [])].slice(0, MAX_PHOTOS);
    if (choisis.length === 0) return;

    setOccupe(true);
    try {
      const compresses: File[] = [];
      const apercus: Vignette[] = [];

      for (const fichier of choisis) {
        let final = fichier;
        try {
          final = await compresser(fichier);
        } catch {
          /* Image exotique, mémoire insuffisante sur un vieux téléphone :
             on envoie l'originale. Rater la compression ne doit jamais
             empêcher de publier. */
        }
        compresses.push(final);
        apercus.push({
          url: URL.createObjectURL(final),
          nom: fichier.name,
          avant: fichier.size,
          apres: final.size,
        });
      }

      /* On REMPLACE les fichiers du champ par les versions compressées :
         c'est ce que le formulaire enverra, sans rien savoir de tout ça. */
      const transfert = new DataTransfer();
      for (const f of compresses) transfert.items.add(f);
      if (champ.current) champ.current.files = transfert.files;

      setVignettes((anciennes) => {
        for (const v of anciennes) URL.revokeObjectURL(v.url);
        return apercus;
      });
    } finally {
      setOccupe(false);
    }
  }

  function retirer(index: number) {
    const restantes = vignettes.filter((_, i) => i !== index);
    URL.revokeObjectURL(vignettes[index].url);

    const transfert = new DataTransfer();
    const fichiers = [...(champ.current?.files ?? [])];
    fichiers.forEach((f, i) => i !== index && transfert.items.add(f));
    if (champ.current) champ.current.files = transfert.files;

    setVignettes(restantes);
  }

  const totalAvant = vignettes.reduce((n, v) => n + v.avant, 0);
  const totalApres = vignettes.reduce((n, v) => n + v.apres, 0);
  const gain = totalAvant > 0 ? Math.round((1 - totalApres / totalAvant) * 100) : 0;

  return (
    <div className="flex flex-col gap-2.5">
      <input
        ref={champ}
        type="file"
        name="photos"
        id="photos"
        accept="image/*"
        multiple
        onChange={choisir}
        className="sr-only"
      />

      <div className="flex gap-3">
        {vignettes.map((v, i) => (
          <div key={v.url} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={v.url}
              alt={v.nom}
              className="size-25 rounded-lg border border-line object-cover"
            />
            <button
              type="button"
              onClick={() => retirer(i)}
              aria-label={`Retirer ${v.nom}`}
              className="absolute -top-1.5 -right-1.5 flex size-6 cursor-pointer items-center justify-center rounded-full bg-ink text-paper"
            >
              <X size={13} strokeWidth={2.6} aria-hidden />
            </button>
          </div>
        ))}

        {Array.from({ length: MAX_PHOTOS - vignettes.length }, (_, i) => (
          <label
            key={i}
            htmlFor="photos"
            className="flex size-25 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-ink-soft"
          >
            {occupe && i === 0 ? (
              <Loader2 size={22} strokeWidth={2} aria-hidden className="animate-spin" />
            ) : vignettes.length === 0 && i === 0 ? (
              <>
                <ImageIcon size={22} strokeWidth={1.6} aria-hidden />
                <span className="text-2xs font-medium">Ajouter</span>
              </>
            ) : (
              <Plus size={24} strokeWidth={2} aria-hidden />
            )}
          </label>
        ))}
      </div>

      {/* Le commerçant voit ce que la compression lui fait gagner. Sur un
          forfait payé au mégaoctet, ce n'est pas un détail technique :
          c'est de l'argent. */}
      {occupe ? (
        <p className="text-xs text-ink-soft">Préparation des photos…</p>
      ) : vignettes.length > 0 && gain > 0 ? (
        <p className="text-xs text-ink-soft">
          {ko(totalAvant)} réduits à <b className="text-ink">{ko(totalApres)}</b> — {gain} % de
          données en moins à l&apos;envoi.
        </p>
      ) : null}
    </div>
  );
}
