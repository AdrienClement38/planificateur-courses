import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BudgetBarProps {
  estimated: number;
  budget: number;
}

export function BudgetBar({ estimated, budget }: BudgetBarProps) {
  const pct = Math.min((estimated / budget) * 100, 100);
  const remaining = budget - estimated;

  const colorClass =
    pct < 80
      ? "text-emerald-500"
      : pct < 100
        ? "text-amber-500"
        : "text-destructive";

  const progressColor =
    pct < 80 ? "[&>div]:bg-emerald-500" : pct < 100 ? "[&>div]:bg-amber-500" : "[&>div]:bg-destructive";

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Coût estimé</p>
          <p className={cn("text-3xl font-bold tabular-nums", colorClass)}>
            {estimated.toFixed(2)}€
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Reste</p>
          <p className={cn("text-xl font-semibold tabular-nums", remaining >= 0 ? "text-foreground" : "text-destructive")}>
            {remaining.toFixed(2)}€
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{pct.toFixed(0)}% du budget</span>
          <span>Budget : {budget}€</span>
        </div>
        <Progress value={pct} className={cn("h-2", progressColor)} />
      </div>
    </div>
  );
}
