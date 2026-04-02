import { useState, useEffect } from "react";
import type { MealPlan, PlannerFormData } from "@/types";

interface ErrorInfo {
  message: string;
  details?: any;
  rawResponse?: string;
  stop_reason?: string;
  json?: any;
}

interface UseMealPlanReturn {
  plan: MealPlan | null;
  lastFormData: PlannerFormData | null;
  isLoading: boolean;
  isInitialLoading: boolean;
  error: ErrorInfo | null;
  generate: (formData: PlannerFormData) => Promise<void>;
  reset: () => void;
}

export function useMealPlan(): UseMealPlanReturn {
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [lastFormData, setLastFormData] = useState<PlannerFormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<ErrorInfo | null>(null);

  // Load latest plan on mount
  useEffect(() => {
    async function loadLatest() {
      try {
        const res = await fetch("/api/meal-plan/latest");
        if (res.ok) {
          const data = await res.json();
          if (data.plan) {
            setPlan(data.plan);
            setLastFormData(data.formData);
          }
        }
      } catch (err) {
        console.error("Failed to load latest plan:", err);
      } finally {
        setIsInitialLoading(false);
      }
    }
    loadLatest();
  }, []);

  const generate = async (formData: PlannerFormData) => {
    setIsLoading(true);
    setError(null);
    setPlan(null);
    setLastFormData(formData);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError({
          message: data.message || data.error || "Erreur serveur",
          details: data.details,
          rawResponse: data.rawResponse,
          stop_reason: data.stop_reason,
          json: data.json
        });
        return;
      }

      if (data.plan) {
        setPlan(data.plan);
      }
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : "Erreur inconnue"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reset = async () => {
    setPlan(null);
    setLastFormData(null);
    setError(null);
    // Persistently clear the plan
    try {
      await fetch("/api/meal-plan/latest", { method: "DELETE" });
    } catch (err) {
      console.error("Failed to clear saved plan:", err);
    }
  };

  return { plan, lastFormData, isLoading, isInitialLoading, error, generate, reset };
}
