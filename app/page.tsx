"use client";

import { useState } from "react";
import { PlannerForm } from "@/components/layout/PlannerForm";
import { PlanResults } from "@/components/layout/PlanResults";
import { useMealPlan } from "@/hooks/useMealPlan";
import type { PlannerFormData } from "@/types";
import { ShoppingCart, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Home() {
  const { plan, isLoading, error, generate, reset } = useMealPlan();
  const [lastFormData, setLastFormData] = useState<PlannerFormData | null>(null);

  const handleSubmit = async (data: PlannerFormData) => {
    setLastFormData(data);
    await generate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none">Drive Planner</h1>
            <p className="text-xs text-muted-foreground">Planification repas & courses</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {!plan && !isLoading && (
          <div className="mb-10">
            <h2 className="mb-2 text-3xl font-bold tracking-tight">
              Ton menu du mois,{" "}
              <span className="text-primary">sans prise de tête.</span>
            </h2>
            <p className="text-muted-foreground">
              Renseigne ton budget, tes contraintes et ton drive. L&apos;IA génère
              le planning et la liste de courses prête à commander.
            </p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-border border-t-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Génération en cours…</p>
              <p className="text-sm text-muted-foreground">
                L&apos;IA compose ton planning et optimise le budget
              </p>
            </div>
          </div>
        )}

        {plan && lastFormData && !isLoading && (
          <PlanResults
            plan={plan}
            budget={lastFormData.budget}
            driveKey={lastFormData.drive}
            onReset={reset}
          />
        )}

        {!plan && !isLoading && (
          <PlannerForm onSubmit={handleSubmit} isLoading={isLoading} />
        )}
      </main>
    </div>
  );
}
