import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { deleteAccountAction } from "@/lib/actions/account";

/**
 * Confirmation de suppression — la maquette n'avait qu'un bouton direct,
 * sans étape intermédiaire. Une suppression de compte reste irréversible
 * en pratique (anonymisation + bannissement) : une feuille qui redit les
 * conséquences avant le geste final coûte un tap, pas plus, et évite un
 * clic accidentel sur une action qu'on ne peut pas défaire.
 */
export default function ConfirmDeleteAccountPage() {
  return (
    <Sheet
      title="Supprimer votre compte ?"
      description="Votre nom et votre téléphone seront effacés. Vos conversations restent lisibles par vos interlocuteurs, sans votre identité. Si vous avez une boutique, vos produits seront retirés du catalogue. Cette action est irréversible."
      closeHref="/compte/informations"
      tone="danger"
    >
      <form action={deleteAccountAction}>
        <Button type="submit" variant="danger">
          Supprimer définitivement mon compte
        </Button>
      </form>
    </Sheet>
  );
}
