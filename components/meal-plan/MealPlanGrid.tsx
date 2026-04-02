"use client";

import { Badge } from "@/components/ui/badge";
import type { Meal } from "@/types";
import { Heart, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MealPlanGridProps {
  meals: Meal[];
}

const MEALS_PER_WEEK = 7;

export function MealPlanGrid({ meals }: MealPlanGridProps) {
  const [favoriteMealIds, setFavoriteMealIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/favorites/meals")
      .then(res => res.json())
      .then(data => {
        const ids = new Set<string>();
        data.forEach((m: any) => {
          if (m.breakfast) ids.add(`breakfast:${m.breakfast}`);
          if (m.lunch) ids.add(`lunch:${m.lunch}`);
          if (m.dinner) ids.add(`dinner:${m.dinner}`);
        });
        setFavoriteMealIds(ids);
      })
      .catch(err => console.error("Failed to fetch favorite meals", err));
  }, []);

  // Grouper les repas par 'day' au cas où l'IA les aurait séparés
  const groupedMealsMap = new Map<string, Meal>();
  for (const meal of meals) {
    const existing = groupedMealsMap.get(meal.day);
    if (existing) {
      if (meal.breakfast) existing.breakfast = meal.breakfast;
      if (meal.breakfast_ingredients) existing.breakfast_ingredients = meal.breakfast_ingredients;
      if (meal.lunch) existing.lunch = meal.lunch;
      if (meal.lunch_ingredients) existing.lunch_ingredients = meal.lunch_ingredients;
      if (meal.dinner) existing.dinner = meal.dinner;
      if (meal.dinner_ingredients) existing.dinner_ingredients = meal.dinner_ingredients;
      if (meal.tags) {
        existing.tags = Array.from(new Set([...(existing.tags || []), ...meal.tags]));
      }
    } else {
      groupedMealsMap.set(meal.day, { ...meal });
    }
  }
  const mergedMeals = Array.from(groupedMealsMap.values());

  const weeks: Meal[][] = [];
  for (let i = 0; i < mergedMeals.length; i += MEALS_PER_WEEK) {
    weeks.push(mergedMeals.slice(i, i + MEALS_PER_WEEK));
  }

  const toggleFavorite = async (type: 'breakfast' | 'lunch' | 'dinner', name: string, ingredients?: string[], tags?: string[]) => {
    if (!name) return;
    const key = `${type}:${name}`;
    const isFavorite = favoriteMealIds.has(key);

    // Optimistic
    setFavoriteMealIds(prev => {
      const next = new Set(prev);
      if (isFavorite) next.delete(key);
      else next.add(key);
      return next;
    });

    try {
      const res = await fetch("/api/favorites/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          [type]: name, 
          [`${type}_ingredients`]: ingredients,
          tags 
        })
      });
      if (res.ok) {
        toast.success(isFavorite ? "Retiré des favoris" : "Ajouté aux favoris");
      }
    } catch (err) {
      console.error("Failed to toggle favorite meal", err);
      // Revert
      setFavoriteMealIds(prev => {
        const next = new Set(prev);
        if (isFavorite) next.add(key);
        else next.delete(key);
        return next;
      });
    }
  };

  return (
    <div className="space-y-12">
      {weeks.map((week, wi) => (
        <div key={wi} className="week-wrapper">
          <h3 className="mb-6 text-sm font-black uppercase tracking-[0.3em] text-primary/40 border-b border-primary/10 pb-2">
            Semaine {wi + 1}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {week.map((meal, mi) => (
              <MealCard
                key={mi}
                meal={meal}
                favoriteMealIds={favoriteMealIds}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MealCard({ 
  meal, 
  favoriteMealIds, 
  onToggleFavorite 
}: { 
  meal: Meal; 
  favoriteMealIds: Set<string>; 
  onToggleFavorite: (type: 'breakfast' | 'lunch' | 'dinner', name: string, ingredients?: string[], tags?: string[]) => void 
}) {
  // Use native fields from the new Gemini schema
  const sanitize = (text?: string) => {
    if (!text) return "";
    return text
      .replace(/^(?:petit[- ]?d[ée]j(?:euner)?|d[ée]j(?:euner)?|d[îi]ner)\s*[:]\s*/i, "")
      .replace(/^(?:breakfast|lunch|dinner)\s*[:]\s*/i, "")
      .trim();
  };

  const breakfast = sanitize(meal.breakfast);
  const lunch = sanitize(meal.lunch);
  const dinner = sanitize(meal.dinner);

  const [showIngredients, setShowIngredients] = useState<string | null>(null);

  const renderSegment = (type: 'breakfast' | 'lunch' | 'dinner', label: string, title: string, colorClass: string, ingredients?: string[]) => {
    if (!title) return null;
    const isShowing = showIngredients === type;
    const isFavorite = favoriteMealIds.has(`${type}:${title}`);

    return (
      <div className="meal-segment">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className={cn("text-[9px] font-bold uppercase tracking-widest", colorClass)}>{label}</span>
            <button 
              onClick={() => onToggleFavorite(type, title, meal[`${type}_ingredients`] as string[], meal.tags)}
              className={cn(
                "transition-colors",
                isFavorite ? "text-red-500" : "text-white/20 hover:text-white/60"
              )}
            >
              <Heart className={cn("h-3 w-3", isFavorite ? "fill-current" : "")} />
            </button>
          </div>
          {ingredients && ingredients.length > 0 && (
            <button 
              onClick={() => setShowIngredients(isShowing ? null : type)}
              className="p-1 rounded-md hover:bg-white/10 text-white/30 hover:text-primary transition-colors"
              title="Voir les ingrédients"
            >
              <Plus className={cn("h-3 w-3 transition-transform duration-200", isShowing ? "rotate-45 text-primary" : "")} strokeWidth={3} />
            </button>
          )}
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed font-medium">{title}</p>
        
        {isShowing && ingredients && (
          <div className="mt-2 p-2 rounded-lg bg-black/40 border border-white/5 text-[11px] text-white/60 animate-in fade-in slide-in-from-top-1 duration-200">
            <ul className="list-disc list-inside space-y-0.5">
              {ingredients.map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="day-card group relative rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04] hover:border-primary/20">
      <div className="mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 block mb-3">
          {meal.day}
        </span>

        <div className="meal-segments space-y-4">
          {renderSegment('breakfast', 'Petit-DÉJEUNER', breakfast, 'text-orange-500/70', meal.breakfast_ingredients)}
          {renderSegment('lunch', 'DÉJEUNER', lunch, 'text-blue-400/70', meal.lunch_ingredients)}
          {renderSegment('dinner', 'DÎNER', dinner, 'text-pink-500/70', meal.dinner_ingredients)}
        </div>
      </div>

      {meal.tags && meal.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-4 pt-4 border-t border-white/5">
          {meal.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[9px] font-medium bg-white/5 text-white/50 border-none px-2 h-5">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
