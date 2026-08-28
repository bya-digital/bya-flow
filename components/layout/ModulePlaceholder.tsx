import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  phase: string;
}

export function ModulePlaceholder({ title, description, icon, phase }: ModulePlaceholderProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title="Module en cours de construction"
        description={`Cette section sera développée en ${phase}, selon la feuille de route BYA Flow.`}
      />
    </>
  );
}
