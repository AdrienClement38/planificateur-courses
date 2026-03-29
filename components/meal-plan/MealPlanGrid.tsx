import { Badge } from "@/components/ui/badge";
import type { Meal } from "@/types";

interface MealPlanGridProps {
  meals: Meal[];
}

const MEALS_PER_WEEK = 7;

export function MealPlanGrid({ meals }: MealPlanGridProps) {
  const weeks: Meal[][] = [];
  for (let i = 0; i < meals.length; i += MEALS_PER_WEEK) {
    weeks.push(meals.slice(i, i + MEALS_PER_WEEK));
  }

  return (
    <div className="space-y-6">
      {weeks.map((week, wi) => (
        <div key={wi}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Semaine {wi + 1}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {week.map((meal, mi) => (
              <MealCard key={mi} meal={meal} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MealCard({ meal }: { meal: Meal }) {
  return (
    <div className="rounded-xl border bg-card p-4 transition-colors hover:border-primary/30">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {meal.day}
      </p>
      <p className="mb-3 font-semibold leading-tight">{meal.name}</p>
      <div className="flex flex-wrap gap-1">
        {meal.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-[10px]">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}
