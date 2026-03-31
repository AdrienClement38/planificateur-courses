"use client"

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";

export function ProductSearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q")?.toString() || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQ = searchParams.get("q")?.toString() || "";
      if (query !== currentQ) {
        const params = new URLSearchParams(searchParams.toString());
        if (query) {
          params.set("q", query);
        } else {
          params.delete("q");
        }
        startTransition(() => {
          router.replace(`${pathname}?${params.toString()}`);
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, pathname, router, searchParams]);

  return (
    <div className="relative w-full min-w-[250px] transition-all duration-300 focus-within:min-w-[350px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Rechercher un produit..."
        className="pl-9 pr-10 bg-white/5 border-white/10 w-full"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {isPending && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
      )}
    </div>
  );
}
