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
import { Loader2, Sparkles } from "lucide-react";

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
  const [cuisineStyle, setCuisineStyle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budget || !persons) return;

    onSubmit({
      budget: parseFloat(budget),
      persons: parseInt(persons),
      mealType,
      period,
      drive,
      preferences,
      exclusions,
      cuisineStyle,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Drive selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Enseigne drive
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DriveSelector value={drive} onChange={setDrive} />
        </CardContent>
      </Card>

      {/* Budget & meals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
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
                <SelectItem value="1 month">1 mois</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dietary constraints */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
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
