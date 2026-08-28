import { CreditCard } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function FacturationPage() {
  return (
    <ModulePlaceholder
      icon={CreditCard}
      title="Facturation"
      description="Abonnement, plan et moyens de paiement."
      phase="Phase 12"
    />
  );
}
