"use client";

import { ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DRIVES } from "@/lib/drives";
import type { ShoppingList as ShoppingListType, DriveKey } from "@/types";

interface ShoppingListProps {
  shoppingList: ShoppingListType;
  driveKey: DriveKey;
}

export function ShoppingList({ shoppingList, driveKey }: ShoppingListProps) {
  const drive = DRIVES[driveKey];

  const handleExport = () => {
    let text = `LISTE DE COURSES — ${drive.name.toUpperCase()}\n`;
    text += `${"=".repeat(40)}\n\n`;

    for (const [category, items] of Object.entries(shoppingList)) {
      if (!items?.length) continue;
      text += `\n== ${category} ==\n`;
      for (const item of items) {
        text += `• ${item.name} — ${item.qty} — ${item.total_price.toFixed(2)}€\n`;
      }
    }

    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `liste-courses-${driveKey}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const nonEmptyCategories = Object.entries(shoppingList).filter(
    ([, items]) => items?.length > 0
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Exporter .txt
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {nonEmptyCategories.map(([category, items]) => (
          <div key={category} className="rounded-xl border bg-card p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
              {category}
            </p>
            <div className="divide-y">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 py-2 text-sm"
                >
                  <span className="flex-1 font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {item.qty}
                  </span>
                  <span className="w-14 text-right font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                    {item.total_price.toFixed(2)}€
                  </span>
                  <a
                    href={drive.buildSearchUrl(item.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-md border p-1 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    title={`Chercher sur ${drive.name}`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
