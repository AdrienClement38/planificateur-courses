"use client"

import { Star } from "lucide-react";
import { useState, useTransition } from "react";
import { toggleFavorite } from "@/app/admin/products/actions";
import { toast } from "sonner";

export function FavoriteStar({ product }: { product: { id: number, is_favorite: boolean, name: string } }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticFav, setOptimisticFav] = useState(product.is_favorite);

  const handleClick = () => {
    const newValue = !optimisticFav;
    setOptimisticFav(newValue);
    
    startTransition(async () => {
      const res = await toggleFavorite(product.id, product.is_favorite);
      if (res?.error) {
        setOptimisticFav(!newValue); // Revert on failure
        toast.error(`Erreur: impossible d'ajouter ${product.name} aux favoris`);
      } else {
        if (newValue) {
          toast.success(`${product.name} est maintenant un favori garanti !`);
        } else {
          toast.info(`${product.name} retiré des favoris`);
        }
      }
    });
  };

  return (
    <button 
      onClick={handleClick} 
      disabled={isPending} 
      className="p-1 -ml-1 mr-2 rounded-full hover:bg-white/10 transition-colors shrink-0 outline-none focus:ring-2 focus:ring-yellow-500/50"
      title={optimisticFav ? "Retirer des indispensables" : "Marquer comme indispensable (favori)"}
    >
      <Star className={`h-4 w-4 transition-all duration-300 ${optimisticFav ? "fill-yellow-500 text-yellow-500 scale-110 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" : "text-muted-foreground hover:text-yellow-500"}`} />
    </button>
  );
}
