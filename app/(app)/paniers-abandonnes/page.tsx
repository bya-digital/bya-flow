import { ShoppingBasket } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function PaniersAbandonnesPage() {
  return (
    <ModulePlaceholder
      icon={ShoppingBasket}
      title="Paniers abandonnés"
      description="Détection et relance des paniers non finalisés."
      phase="Phase 7"
    />
  );
}
