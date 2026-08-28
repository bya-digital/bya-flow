import { ShoppingCart } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function CommandesPage() {
  return (
    <ModulePlaceholder
      icon={ShoppingCart}
      title="Commandes"
      description="Suivi des commandes, statuts et paiements."
      phase="Phase 5"
    />
  );
}
