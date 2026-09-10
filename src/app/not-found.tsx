import { Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen, ScreenBody } from "@/components/ui/Screen";
import { TopBar, Wordmark } from "@/components/ui/TopBar";

/**
 * Page affichée quand une adresse n'existe pas.
 *
 * Sans ce fichier, Next affiche sa propre page : fond blanc, texte anglais,
 * aucun moyen de repartir. Un utilisateur qui tombe dessus croit que
 * l'application est cassée. Une adresse fausse arrivera toujours — un lien
 * partagé sur WhatsApp qui traîne, un produit supprimé, une faute de
 * frappe — alors autant que ce moment ressemble à Makiti et propose une
 * sortie.
 */
export default function NotFound() {
  return (
    <Screen>
      <TopBar title={<Wordmark />} />
      <ScreenBody>
        <EmptyState
          icon={Compass}
          title="Cette page n'existe pas"
          description="Le lien est peut-être ancien, ou le produit a été retiré par son vendeur."
        >
          <Button href="/">Voir les produits</Button>
          <Button variant="secondary" href="/recherche">
            Rechercher
          </Button>
        </EmptyState>
      </ScreenBody>
    </Screen>
  );
}
