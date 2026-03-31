"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetBar } from "@/components/meal-plan/BudgetBar";
import { MealPlanGrid } from "@/components/meal-plan/MealPlanGrid";
import { ShoppingList } from "@/components/shopping/ShoppingList";
import { DRIVES } from "@/lib/drives";
import type { MealPlan, DriveKey } from "@/types";
import { ArrowLeft, ExternalLink, SearchCheck, Loader2, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { usePricing } from "@/hooks/usePricing";
import { Progress } from "@/components/ui/progress";

interface PlanResultsProps {
  plan: MealPlan;
  budget: number;
  driveKey: DriveKey;
  storeUrl?: string;
  storeId?: string;
  onReset: () => void;
}

export function PlanResults({ plan, budget, driveKey, storeUrl, storeId, onReset }: PlanResultsProps) {
  const drive = DRIVES[driveKey];
  const { pricingStatus, pricedCount, resolvedItems, startPricing } = usePricing();

  // Extract all item names from shopping list for pricing
  const allItems = useMemo(() => {
    return plan.shopping_list.flatMap(cat => cat.items.map(item => item.name));
  }, [plan]);

  useEffect(() => {
    if (allItems.length > 0 && pricingStatus === "idle") {
      startPricing(allItems, driveKey, storeId);
    }
  }, [allItems, driveKey, startPricing, pricingStatus, storeId]);

  // Calculate real total based on resolved prices + estimated for remaining
  const dynamicTotal = useMemo(() => {
    let total = 0;
    plan.shopping_list.forEach(cat => {
      cat.items.forEach(item => {
        const resolved = resolvedItems.get(item.name);
        if (resolved && resolved.price !== null) {
          total += resolved.price;
        } else {
          total += item.total_price; // Fallback to AI estimate
        }
      });
    });
    return total;
  }, [plan, resolvedItems]);

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
      <div className="space-y-4">
        {pricingStatus === "loading" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="h-3 w-3 animate-spin" />
                Vérification des prix réels...
              </div>
              <span className="text-muted-foreground">{pricedCount} / {allItems.length}</span>
            </div>
            <Progress value={(pricedCount / allItems.length) * 100} className="h-1.5" />
          </div>
        )}
        
        {pricingStatus === "done" && (
          <div className="flex items-center gap-2 text-xs font-medium text-green-500 bg-green-500/5 py-2 px-3 rounded-md border border-green-500/20">
            <CheckCircle2 className="h-4 w-4" />
            Prix réels vérifiés en base de données.
          </div>
        )}

        <BudgetBar estimated={dynamicTotal} budget={budget} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="meals">
        <TabsList className="w-full">
          <TabsTrigger value="meals" className="flex-1">
            🍽 Planning repas
          </TabsTrigger>
          <TabsTrigger value="shopping" className="flex-1">
            🛒 Liste de courses
          </TabsTrigger>
          <TabsTrigger value="research" className="flex-1">
            🔍 Preuves & Validation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meals" className="mt-6">
          <MealPlanGrid meals={plan.meals} />
        </TabsContent>

        <TabsContent value="shopping" className="mt-6">
          <ShoppingList 
            shoppingList={plan.shopping_list} 
            driveKey={driveKey} 
            resolvedItems={resolvedItems} 
            storeUrl={storeUrl}
          />
        </TabsContent>
        
        <TabsContent value="research" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-4">
              <SearchCheck className="h-4 w-4 text-primary" />
              Journal d&apos;audit de recherche IA
            </div>
            <div className="grid gap-3">
              {plan.research_audit?.map((step, i) => (
                <div 
                  key={i} 
                  className="p-3 rounded-lg border border-white/5 bg-white/[0.02] text-xs leading-relaxed text-white/70"
                >
                  {step}
                </div>
              )) || (
                <div className="p-8 text-center text-muted-foreground text-sm border border-dashed rounded-lg">
                  Aucun log de recherche disponible pour cette génération.
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
