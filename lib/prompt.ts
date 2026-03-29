import { DRIVES } from "@/lib/drives";
import type { PlannerFormData } from "@/types";

const MEAL_TYPE_LABELS: Record<string, string> = {
  dinner: "dîners uniquement",
  "lunch-dinner": "déjeuners + dîners",
  all: "petit-déjeuner + déjeuner + dîner",
};

export function buildMealPlanPrompt(data: PlannerFormData): string {
  const drive = DRIVES[data.drive];

  return `Tu es un assistant expert en planification de repas et en optimisation de courses.
Génère un planning de repas complet et une liste de courses optimisée pour le drive.

PARAMÈTRES :
- Budget total : ${data.budget}€
- Nombre de personnes : ${data.persons}
- Repas à couvrir : ${MEAL_TYPE_LABELS[data.mealType]}
- Période : ${data.period}
- Enseigne drive : ${drive.name}
- Préférences alimentaires : ${data.preferences.length ? data.preferences.join(", ") : "aucune"}
- Aliments exclus : ${data.exclusions.length ? data.exclusions.join(", ") : "aucun"}
- Style de cuisine : ${data.cuisineStyle || "varié et équilibré"}

RÈGLES STRICTES :
1. Le coût total estimé doit rester SOUS le budget de ${data.budget}€
2. Favorise la réutilisation d'ingrédients entre plusieurs repas (anti-gaspillage)
3. Prix réalistes selon les tarifs ${drive.name} en France en 2024
4. Temps de préparation max 45 minutes par repas
5. Variété obligatoire : aucun plat répété
6. Adapte les quantités au nombre de personnes (${data.persons})

STRUCTURE JSON OBLIGATOIRE (réponds uniquement en JSON valide, zéro markdown) :
{
  "summary": "Phrase courte et engageante résumant le planning",
  "estimated_total": 0.00,
  "meals": [
    {
      "day": "Lundi soir",
      "name": "Nom du repas",
      "tags": ["rapide", "équilibré", "végétarien"]
    }
  ],
  "shopping_list": {
    "Féculents & céréales": [
      {
        "name": "Pâtes spaghetti 500g",
        "qty": "2 paquets",
        "unit_price": 1.20,
        "total_price": 2.40
      }
    ],
    "Viandes & protéines": [],
    "Légumes & fruits": [],
    "Produits laitiers & œufs": [],
    "Épicerie & condiments": [],
    "Surgelés": [],
    "Boissons": [],
    "Petit-déjeuner": []
  }
}`;
}
