"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DriveSelector } from "@/components/drive/DriveSelector";
import { TagInput } from "@/components/drive/TagInput";
import type { DriveKey, MealType, Period, PlannerFormData } from "@/types";
import { Loader2, Sparkles, CheckCircle2, Star } from "lucide-react";
import { useEffect } from "react";

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  dinner: "Dîners uniquement",
  "lunch-dinner": "Midi + soir",
  all: "Petit-déj + midi + soir",
};

const PERIOD_LABELS: Record<Period, string> = {
  "1 week": "1 semaine",
  "2 weeks": "2 semaines",
  "3 weeks": "3 semaines",
  "1 month": "1 mois",
};

interface PlannerFormProps {
  onSubmit: (data: PlannerFormData) => void;
  isLoading: boolean;
}

export function PlannerForm({ onSubmit, isLoading }: PlannerFormProps) {
  const [budget, setBudget] = useState("");
  const [persons, setPersons] = useState("");
  const [mealType, setMealType] = useState<MealType>("dinner");
  const [period, setPeriod] = useState<Period>("1 month");
  const [drive, setDrive] = useState<DriveKey>("leclerc");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [zipCode, setZipCode] = useState("");
  const [stores, setStores] = useState<{ name: string; address: string; url: string; id: string }[]>([]);
  const [isSearchingStores, setIsSearchingStores] = useState(false);
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedStoreUrl, setSelectedStoreUrl] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [cuisineStyle, setCuisineStyle] = useState("");
  const [favorites, setFavorites] = useState<{ name: string; address: string; url: string; id: string; drive: DriveKey }[]>([]);

  // Load favorites from API on mount
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await fetch("/api/favorites");
        if (res.ok) {
          const data = await res.json();
          setFavorites(data);
        }
      } catch (err) {
        console.error("Failed to fetch favorites from DB:", err);
        // Fallback to localStorage if API fails
        const saved = localStorage.getItem("planner-drive-favorites");
        if (saved) setFavorites(JSON.parse(saved));
      }
    };
    fetchFavorites();
  }, []);

  // Save to localStorage as a secondary backup
  useEffect(() => {
    localStorage.setItem("planner-drive-favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = async (e: React.MouseEvent, store: { name: string; address: string; url: string; id: string }) => {
    e.stopPropagation();

    const isFavorite = favorites.some(f => f.url === store.url);

    // Optimistic Update
    if (isFavorite) {
      setFavorites(prev => prev.filter(f => f.url !== store.url));
    } else {
      setFavorites(prev => [...prev, { ...store, drive: drive as DriveKey }]);
    }

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...store, drive }),
      });

      if (!res.ok) {
        throw new Error("Failed to sync favorite with server");
      }

      // Refresh to ensure we have the server-side ID/data
      const refreshedRes = await fetch("/api/favorites");
      if (refreshedRes.ok) {
        const data = await refreshedRes.json();
        setFavorites(data);
      }
    } catch (err) {
      console.error("Sync error:", err);
      // Revert on error if needed (optional)
    }
  };

  const handleSearchStores = async () => {
    if (!zipCode || zipCode.length < 5) return;
    setIsSearchingStores(true);
    try {
      const res = await fetch(`/api/stores?drive=${drive}&zipCode=${zipCode}`);
      const data = await res.json();
      setStores(data.stores || []);
      // Reset selected store if not in new list (optional)
    } catch (err) {
      console.error("Failed to fetch stores:", err);
    } finally {
      setIsSearchingStores(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budget || !persons) return;

    onSubmit({
      budget: parseFloat(budget),
      persons: parseInt(persons),
      mealType,
      period,
      drive,
      zipCode,
      selectedStore,
      selectedStoreUrl,
      selectedStoreId,
      preferences,
      exclusions,
      cuisineStyle,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Drive selection */}
      <Card className="border-white/5 bg-white/[0.02]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Choix du drive
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DriveSelector value={drive} onChange={setDrive} />

          <div className="space-y-2">
            <Label htmlFor="zipCode">Code Postal (pour prix locaux)</Label>
            <div className="flex gap-2">
              <Input
                id="zipCode"
                placeholder="ex: 38000"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                className="max-w-[120px]"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSearchStores}
                disabled={isSearchingStores || zipCode.length < 5}
              >
                {isSearchingStores ? <Loader2 className="h-4 w-4 animate-spin" /> : "Trouver mon magasin"}
              </Button>
            </div>
          </div>

          {(favorites.length > 0 || stores.length > 0) && (
            <div className="space-y-4 pt-2">
              {favorites.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-wider text-primary/70 font-semibold flex items-center gap-2">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    Drives favoris
                  </Label>
                  <div className="grid gap-2 pr-2">
                    {favorites.map((s, i) => (
                      <div
                        key={`fav-${i}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setDrive(s.drive);
                          setSelectedStore(s.name);
                          setSelectedStoreUrl(s.url);
                          setSelectedStoreId(s.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setDrive(s.drive);
                            setSelectedStore(s.name);
                            setSelectedStoreUrl(s.url);
                            setSelectedStoreId(s.id);
                          }
                        }}
                        className={`text-left p-3 rounded-lg border transition-all relative group cursor-pointer ${selectedStoreUrl === s.url
                          ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                          : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className={`font-medium text-sm ${selectedStoreUrl === s.url ? "text-primary" : ""}`}>{s.name}</div>
                              <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/10 text-white/50 uppercase">{s.drive}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground line-clamp-1">{s.address}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/20"
                              onClick={(e) => toggleFavorite(e, s)}
                            >
                              <Star className="h-4 w-4 fill-primary" />
                            </Button>
                            {selectedStoreUrl === s.url && (
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 animate-in zoom-in duration-300" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stores.length > 0 && (
                <div className="space-y-2">
                  <Label>Résultats de recherche</Label>
                  <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {stores.map((s, i) => {
                      const isFav = favorites.some(f => f.url === s.url);
                      return (
                        <div
                          key={i}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setSelectedStore(s.name);
                            setSelectedStoreUrl(s.url);
                            setSelectedStoreId(s.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedStore(s.name);
                              setSelectedStoreUrl(s.url);
                              setSelectedStoreId(s.id);
                            }
                          }}
                          className={`text-left p-3 rounded-lg border transition-all relative group cursor-pointer ${selectedStoreUrl === s.url
                            ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                            : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                            }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className={`font-medium text-sm ${selectedStoreUrl === s.url ? "text-primary" : ""}`}>{s.name}</div>
                              <div className="text-[10px] text-muted-foreground line-clamp-1">{s.address}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={`h-7 w-7 transition-colors ${isFav ? "text-primary hover:bg-primary/20" : "text-muted-foreground/40 hover:text-primary hover:bg-primary/10"}`}
                                onClick={(e) => toggleFavorite(e, s)}
                              >
                                <Star className={`h-4 w-4 ${isFav ? "fill-primary" : ""}`} />
                              </Button>
                              {selectedStoreUrl === s.url && (
                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 animate-in zoom-in duration-300" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget & meals */}
      <Card className="border-white/5 bg-white/[0.02]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Budget & repas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="budget">Budget total (€)</Label>
            <Input
              id="budget"
              type="number"
              min={10}
              max={10000}
              placeholder="ex : 250"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="persons">Nombre de personnes</Label>
            <Input
              id="persons"
              type="number"
              min={1}
              max={20}
              placeholder="ex : 2"
              value={persons}
              onChange={(e) => setPersons(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Repas couverts</Label>
            <Select
              value={mealType}
              onValueChange={(v) => setMealType(v as MealType)}
            >
              <SelectTrigger>
                <SelectValue>{MEAL_TYPE_LABELS[mealType]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(MEAL_TYPE_LABELS) as [MealType, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Période</Label>
            <Select
              value={period}
              onValueChange={(v) => setPeriod(v as Period)}
            >
              <SelectTrigger>
                <SelectValue>{PERIOD_LABELS[period]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dietary constraints */}
      <Card className="border-white/5 bg-white/[0.02]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Contraintes alimentaires
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Régimes / préférences</Label>
            <TagInput
              value={preferences}
              onChange={setPreferences}
              placeholder="végétarien, halal, sans gluten… (Entrée)"
            />
          </div>

          <div className="space-y-2">
            <Label>Aliments à exclure</Label>
            <TagInput
              value={exclusions}
              onChange={setExclusions}
              placeholder="champignons, poisson… (Entrée)"
              variant="destructive"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuisine">Style de cuisine (optionnel)</Label>
            <Input
              id="cuisine"
              placeholder="ex : méditerranéen, rapide, fait-maison…"
              value={cuisineStyle}
              onChange={(e) => setCuisineStyle(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isLoading || !budget || !persons}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Génération en cours…
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Générer mon planning
          </>
        )}
      </Button>
    </form>
  );
}
