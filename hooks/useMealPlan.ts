import { useState } from "react";
import type { MealPlan, PlannerFormData } from "@/types";

interface UseMealPlanReturn {
  plan: MealPlan | null;
  isLoading: boolean;
  error: string | null;
  generate: (formData: PlannerFormData) => Promise<void>;
  reset: () => void;
}

export function useMealPlan(): UseMealPlanReturn {
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error(data.error ?? "Erreur serveur");
      }

      setPlan(data.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
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
