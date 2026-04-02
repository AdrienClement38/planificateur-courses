"use client";

import { PlannerForm } from "@/components/layout/PlannerForm";
import { PlanResults } from "@/components/layout/PlanResults";
import { useMealPlan } from "@/hooks/useMealPlan";
import type { PlannerFormData } from "@/types";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Home() {
  const { 
    plan, 
    lastFormData, 
    isLoading, 
    isInitialLoading, 
    error, 
    generate, 
    reset 
  } = useMealPlan();

  const handleSubmit = async (data: PlannerFormData) => {
    await generate(data);
  };

  if (isInitialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      <main className="mx-auto max-w-5xl px-6 py-16">
        {!plan && !isLoading && (
          <div className="mb-16 space-y-6">
            <h2 className="max-w-3xl text-6xl font-black leading-[0.9] tracking-tighter uppercase sm:text-7xl">
              Ton menu du mois,{" "}
              <br />
              <span className="text-primary italic">sans prise de tête.</span>
            </h2>
            <p className="max-w-xl text-lg text-muted-foreground">
              Donne ton budget, tes contraintes et le nombre de repas. L'IA génère le planning et la liste de courses prête pour le drive.
            </p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6 flex items-start gap-4">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <AlertDescription className="font-semibold text-base leading-tight">
                {error.message}
              </AlertDescription>
              {(error.details || error.rawResponse || error.json) && (
                <details className="group">
                  <summary className="cursor-pointer text-[10px] font-bold tracking-widest text-white/50 uppercase transition-colors hover:text-white">
                    Détails techniques
                  </summary>
                  <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed text-white/70">
                    <pre className="max-h-60 overflow-auto whitespace-pre-wrap">
                      {JSON.stringify({
                        details: error.details,
                        stop_reason: error.stop_reason,
                        rawResponse: error.rawResponse,
                        json: error.json
                      }, null, 2)}
                    </pre>
                  </div>
                </details>
              )}
            </div>
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
            storeUrl={lastFormData.selectedStoreUrl}
            storeId={lastFormData.selectedStoreId}
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
