import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "warning" | "danger";

const toneConfig: Record<Tone, { classes: string; icon: typeof Info }> = {
  info: { classes: "bg-brand-50 text-brand-800 border-brand-200", icon: Info },
  success: {
    classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
  },
  warning: {
    classes: "bg-amber-50 text-amber-800 border-amber-200",
    icon: AlertTriangle,
  },
  danger: { classes: "bg-red-50 text-red-800 border-red-200", icon: XCircle },
};

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  title: string;
  description?: string;
}

export function Alert({ className, tone = "info", title, description, ...props }: AlertProps) {
  const { classes, icon: Icon } = toneConfig[tone];
  return (
    <div
      className={cn("flex gap-3 rounded-lg border p-4 text-sm", classes, className)}
      {...props}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold">{title}</p>
        {description && <p className="mt-0.5 opacity-90">{description}</p>}
      </div>
    </div>
  );
}
