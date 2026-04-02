"use client";

import { ExternalLink, Download, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DRIVES } from "@/lib/drives";
import type { ShoppingList as ShoppingListType, DriveKey } from "@/types";
import type { PricingResult } from "@/hooks/usePricing";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ShoppingListProps {
  shoppingList: ShoppingListType;
  driveKey: DriveKey;
  resolvedItems?: Map<string, PricingResult>;
  storeUrl?: string;
  storeId?: string;
}

export function ShoppingList({ shoppingList, driveKey, resolvedItems, storeUrl, storeId }: ShoppingListProps) {
  const drive = DRIVES[driveKey];
  const [favoriteProductNames, setFavoriteProductNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/favorites/products")
      .then(res => res.json())
      .then(data => {
        setFavoriteProductNames(new Set(data.map((p: any) => p.name)));
      })
      .catch(err => console.error("Failed to fetch favorite products", err));
  }, []);

  const handleExport = () => {
    let text = `LISTE DE COURSES — ${drive.name.toUpperCase()}\n`;
    text += `${"=".repeat(40)}\n\n`;
    for (const categoryData of shoppingList) {
      const { category, items } = categoryData;
      if (!items?.length) continue;
      text += `\n== ${category} ==\n`;
      for (const item of items) {
        const resolved = resolvedItems?.get(item.name);
        const price = resolved?.price ?? item.total_price;
        const source = resolved?.source === "db" ? "(Réel)" : "(Est.)";
        const url = drive.buildSearchUrl(item.name, storeUrl);
        text += `• ${item.name} — ${item.qty} — ${price.toFixed(2)}€ ${source} — ${url}\n`;
      }
    }
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `liste-courses-${driveKey}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const toggleFavoriteProduct = async (name: string) => {
    const isFavorite = favoriteProductNames.has(name);

    // Optimistic
    setFavoriteProductNames(prev => {
      const next = new Set(prev);
      if (isFavorite) next.delete(name);
      else next.add(name);
      return next;
    });

    try {
      const res = await fetch("/api/favorites/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, drive: driveKey, store_id: storeId, is_favorite: !isFavorite })
      });
      if (res.ok) {
        toast.success(isFavorite ? "Produit retiré des favoris" : "Produit ajouté aux favoris");
      }
    } catch (err) {
      console.error("Failed to toggle favorite product", err);
      // Revert
      setFavoriteProductNames(prev => {
        const next = new Set(prev);
        if (isFavorite) next.add(name);
        else next.delete(name);
        return next;
      });
    }
  };

  const nonEmptyCategories = shoppingList.filter((c) => c.items?.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Exporter .txt
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {nonEmptyCategories.map(({ category, items }) => (
          <div key={category} className="rounded-xl border bg-card p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
              {category}
            </p>
            <div className="divide-y divide-white/5">
              {items.map((item, i) => {
                const resolved = resolvedItems?.get(item.name);
                const isReal = resolved?.source === "db" || (item as any).source === "db";
                const displayPrice = resolved?.price ?? item.total_price;
                const isFavorite = favoriteProductNames.has(item.name);

                return (
                  <div key={i} className="group flex items-center gap-3 py-3 text-sm">
                    <button
                      onClick={() => toggleFavoriteProduct(item.name)}
                      className={cn(
                        "p-1.5 rounded-md transition-all duration-300",
                        isFavorite ? "text-red-500 bg-red-500/10" : "text-white/20 hover:text-white/40 hover:bg-white/5"
                      )}
                    >
                      <Heart className={cn("h-3.5 w-3.5", isFavorite ? "fill-current" : "")} />
                    </button>

                    <div className="flex flex-1 flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{item.name}</span>
                        {isReal ? (
                          <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-black uppercase tracking-tighter bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            Réel
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-black uppercase tracking-tighter bg-orange-500/10 text-orange-500 border-orange-500/20">
                            Est.
                          </Badge>
                        )}
                      </div>
                      {(resolved?.matched || (item as any).db_match_name) && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground italic truncate">
                          <span className="shrink-0 opacity-50">Match:</span>
                          <span className="truncate">{resolved?.matched || (item as any).db_match_name}</span>
                        </div>
                      )}
                    </div>

                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {item.qty}
                    </span>

                    <span className="w-16 text-right font-bold text-foreground tabular-nums whitespace-nowrap">
                      {displayPrice.toFixed(2)}€
                    </span>

                    <a
                      href={(() => {
                        const baseLink = resolved?.link || (item as any).link;
                        // If link is empty, or just a generic store homepage, use search
                        const isGeneric = !baseLink || (baseLink.includes(".aspx") && !baseLink.includes("recherche") && !baseLink.includes("produit-"));
                        return isGeneric ? drive.buildSearchUrl(item.name, storeUrl) : baseLink;
                      })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-md border border-white/5 bg-white/[0.03] p-1.5 text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
