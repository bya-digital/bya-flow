import { Ticket } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function PromotionsPage() {
  return (
    <ModulePlaceholder
      icon={Ticket}
      title="Promotions & coupons"
      description="Codes promo, remises et offres."
      phase="Phase 7"
    />
  );
}
