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
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";

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
  const [stores, setStores] = useState<{name: string; address: string; url: string}[]>([]);
  const [isSearchingStores, setIsSearchingStores] = useState(false);
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedStoreUrl, setSelectedStoreUrl] = useState("");
  const [cuisineStyle, setCuisineStyle] = useState("");

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

          {stores.length > 0 && (
            <div className="space-y-2 pt-2">
              <Label>Sélectionnez votre magasin</Label>
              <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {stores.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    title={s.url}
                    onClick={() => {
                      setSelectedStore(s.name);
                      setSelectedStoreUrl(s.url);
                    }}
                    className={`text-left p-3 rounded-lg border transition-all relative group ${
                      selectedStore === s.name 
                        ? "border-primary bg-primary/10 ring-1 ring-primary/20" 
                        : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                       <div className="flex-1">
                          <div className={`font-medium text-sm ${selectedStore === s.name ? "text-primary" : ""}`}>{s.name}</div>
                          <div className="text-[10px] text-muted-foreground line-clamp-1">{s.address}</div>
                          <div className="text-[9px] text-muted-foreground/40 mt-1 truncate">🔗 {s.url}</div>
                       </div>
                       {selectedStore === s.name && (
                         <CheckCircle2 className="h-4 w-4 text-primary shrink-0 animate-in zoom-in duration-300" />
                       )}
                    </div>
                  </button>
                ))}
              </div>
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinner">Dîners uniquement</SelectItem>
                <SelectItem value="lunch-dinner">Midi + soir</SelectItem>
                <SelectItem value="all">Petit-déj + midi + soir</SelectItem>
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1 week">1 semaine</SelectItem>
                <SelectItem value="2 weeks">2 semaines</SelectItem>
                <SelectItem value="3 weeks">3 semaines</SelectItem>
                <SelectItem value="1 month">1 mois</SelectItem>
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
