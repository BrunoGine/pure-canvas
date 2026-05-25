import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: number | string | undefined;
  icon?: LucideIcon;
  hint?: string;
  loading?: boolean;
  tone?: "default" | "success" | "warning" | "danger";
}

const toneMap: Record<NonNullable<Props["tone"]>, string> = {
  default: "text-foreground",
  success: "text-emerald-500",
  warning: "text-amber-500",
  danger: "text-destructive",
};

const MetricCard = ({ label, value, icon: Icon, hint, loading, tone = "default" }: Props) => (
  <Card className="relative overflow-hidden border-border/60 bg-card/60 p-4 backdrop-blur">
    <div className="flex items-start justify-between gap-2">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      {Icon && <Icon className={cn("h-4 w-4", toneMap[tone])} />}
    </div>
    {loading ? (
      <Skeleton className="mt-3 h-7 w-20" />
    ) : (
      <p className={cn("mt-2 text-2xl font-bold tabular-nums", toneMap[tone])}>
        {typeof value === "number" ? value.toLocaleString("pt-BR") : value ?? "—"}
      </p>
    )}
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </Card>
);

export default MetricCard;
