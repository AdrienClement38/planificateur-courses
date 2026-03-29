"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetBar } from "@/components/meal-plan/BudgetBar";
import { MealPlanGrid } from "@/components/meal-plan/MealPlanGrid";
import { ShoppingList } from "@/components/shopping/ShoppingList";
import { DRIVES } from "@/lib/drives";
import type { MealPlan, DriveKey } from "@/types";
import { ArrowLeft, ExternalLink } from "lucide-react";

interface PlanResultsProps {
  plan: MealPlan;
  budget: number;
  driveKey: DriveKey;
  onReset: () => void;
}

export function PlanResults({ plan, budget, driveKey, onReset }: PlanResultsProps) {
  const drive = DRIVES[driveKey];

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onReset}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Nouveau planning
        </Button>
        <a
          href={drive.home}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="sm">
            <ExternalLink className="mr-2 h-4 w-4" />
            Ouvrir {drive.name}
          </Button>
        </a>
      </div>

      {/* Summary */}
      {plan.summary && (
        <p className="text-sm text-muted-foreground">{plan.summary}</p>
      )}

      {/* Budget */}
      <BudgetBar estimated={plan.estimated_total} budget={budget} />

      {/* Tabs */}
      <Tabs defaultValue="meals">
        <TabsList className="w-full">
          <TabsTrigger value="meals" className="flex-1">
            🍽 Planning repas
          </TabsTrigger>
          <TabsTrigger value="shopping" className="flex-1">
            🛒 Liste de courses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meals" className="mt-6">
          <MealPlanGrid meals={plan.meals} />
        </TabsContent>

        <TabsContent value="shopping" className="mt-6">
          <ShoppingList shoppingList={plan.shopping_list} driveKey={driveKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
