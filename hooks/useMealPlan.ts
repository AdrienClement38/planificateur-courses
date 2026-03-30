import { useState } from "react";
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
  isLoading: boolean;
  error: ErrorInfo | null;
  generate: (formData: PlannerFormData) => Promise<void>;
  reset: () => void;
}

export function useMealPlan(): UseMealPlanReturn {
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorInfo | null>(null);

  const generate = async (formData: PlannerFormData) => {
    setIsLoading(true);
    setError(null);
    setPlan(null);

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

      setPlan(data.plan);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : "Erreur inconnue"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setPlan(null);
    setError(null);
  };

  return { plan, isLoading, error, generate, reset };
}
