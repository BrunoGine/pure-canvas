import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PlanKey } from "@/lib/plans";

const map: Record<PlanKey, { label: string; className: string }> = {
  free: { label: "Free", className: "bg-muted text-muted-foreground border-border" },
  premium: { label: "Premium", className: "bg-primary/15 text-primary border-primary/30" },
  enterprise: { label: "Empresa", className: "bg-purple-500/15 text-purple-500 border-purple-500/30" },
};

const PlanBadge = ({ plan }: { plan: PlanKey }) => {
  const m = map[plan] ?? map.free;
  return (
    <Badge variant="outline" className={cn("font-medium", m.className)}>
      {m.label}
    </Badge>
  );
};

export default PlanBadge;
