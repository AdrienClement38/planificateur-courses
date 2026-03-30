import { DRIVES } from "@/lib/drives";
import type { PlannerFormData } from "@/types";

const MEAL_TYPE_LABELS: Record<string, string> = {
  dinner: "dîners uniquement",
  "lunch-dinner": "déjeuners + dîners",
  all: "petit-déjeuner + déjeuner + dîner",
};

export function buildMealPlanPrompt(data: PlannerFormData): string {
  const drive = DRIVES[data.drive];

  return `Tu es un assistant expert en planification de repas.
Génère un planning COMPLET et une liste de courses pour le drive.

PARAMÈTRES :
- Budget: ${data.budget}€ | Personnes: ${data.persons} | Période: ${data.period}
- Drive: ${drive.name}
- Régime: ${data.preferences.join(", ") || "standard"}
- Exclusions: ${data.exclusions.join(", ") || "aucune"}
- Localisation: ${data.selectedStore || drive.name} (${data.zipCode || "France"})
- Lien Magasin: ${data.selectedStoreUrl || drive.home}

RÈGLES D'OR :
1. RECHERCHE PRIORITAIRE : Utilise search_prices uniquement pour les 5 produits les plus chers. Inclus TOUJOURS le lieu exact dans ta recherche.
2. LIMITE DE RECHERCHE : ⚠️ Ne fais JAMAIS plus de 5 recherches au total. Si tu ne trouves pas rapidement, ARRÊTE de chercher et estime les prix restants avec cohérence.
3. NOM COURT : Pour le champ 'name', utilise TOUJOURS le nom générique et TRÈS court (ex: 'Steak haché', 'Poulet', 'Lait'). Mets les détails de marque ou de coupe dans 'qty' (ex: 'Férial x4 - 400g'). Cela garantit que les liens de recherche fonctionneront parfaitement.
4. LIENS OBLIGATOIRES : Chaque article DOIT avoir un lien valide. Si tu n'as pas de lien direct dans le snippet, mets EXACTEMENT "N/A" (le système se chargera de le corriger ensuite).
5. SÉQUENCE : Fais toutes tes recherches AVANT de commencer le JSON. Ne touche plus aux outils une fois le JSON démarré.
6. LIENS BRUTS : INTERDICTION ABSOLUE de simplifier ou "nettoyer" les URLs (ex: ne pas transformer un lien fd11-courses... en www.leclercdrive...). Utilise le lien EXACT fourni par l'outil.
7. AUDIT DE RECHERCHE : Remplis le champ "research_audit" avec des preuves textuelles de tes recherches (ex: "Produit X trouvé à 5.42€ sur le lien Y").
8. BUDGET : Reste SOUS ${data.budget}€.
9. FORMAT : Réponds UNIQUEMENT en JSON compact.

STRUCTURE JSON (ZÉRO TEXTE HORS DU JSON, finis par }) :
{
  "summary": "Court et précis",
  "estimated_total": 0.00,
  "meals": [{"day":"Jour","name":"Déj: Nom / Dîn: Nom","tags":["tag"]}],
  "shopping_list": [
    {
      "category": "Rayon", 
      "items": [{"name":"Produit","qty":"Q","unit_price":0.00,"total_price":0.00,"link":"URL"}]
    }
  ],
  "research_audit": ["Preuve 1", "Preuve 2"]
}`;
}
