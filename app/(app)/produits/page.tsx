import { Package } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function ProduitsPage() {
  return (
    <ModulePlaceholder
      icon={Package}
      title="Produits"
      description="Catalogue produits, variantes, stock et prix."
      phase="Phase 4"
    />
  );
}
