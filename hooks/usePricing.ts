import { useState, useCallback } from "react";

export interface PricingResult {
  price: number | null;
  source: string;
  matched?: string;
}

export function usePricing() {
  const [pricingStatus, setPricingStatus] = useState<"idle" | "loading" | "done">("idle");
  const [pricedCount, setPricedCount] = useState(0);
  const [resolvedItems, setResolvedItems] = useState<Map<string, PricingResult>>(new Map());

  const startPricing = useCallback(async (items: string[], drive: string, storeId?: string) => {
    if (items.length === 0) {
      setPricingStatus("done");
      return;
    }

    setPricingStatus("loading");
    setPricedCount(0);
    setResolvedItems(new Map());

    try {
      const response = await fetch("/api/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, drive, storeId }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            
            if (dataStr.trim() === "[DONE]") {
              setPricingStatus("done");
              continue;
            }

            try {
              const result = JSON.parse(dataStr);
              setResolvedItems(prev => {
                const next = new Map(prev);
                next.set(result.item, {
                  price: result.price,
                  source: result.source,
                  matched: result.matched
                });
                return next;
              });
              setPricedCount(prev => prev + 1);
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }
    } catch (err) {
      console.error("Pricing error:", err);
      setPricingStatus("done");
    }
  }, []);

  const resetPricing = useCallback(() => {
    setPricingStatus("idle");
    setPricedCount(0);
    setResolvedItems(new Map());
  }, []);

  return { pricingStatus, pricedCount, resolvedItems, startPricing, resetPricing };
}
