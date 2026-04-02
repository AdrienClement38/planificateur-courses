import { DRIVES } from "@/lib/drives";
import type { PlannerFormData } from "@/types";

const MEAL_TYPE_LABELS: Record<string, string> = {
  dinner: "dîners uniquement",
  "lunch-dinner": "déjeuners + dîners",
  all: "petit-déjeuner + déjeuner + dîner",
};

export function buildMealPlanPrompt(
  data: PlannerFormData, 
  favorites: any[] = [], 
  favoriteMeals: any[] = [],
  bannedProducts: any[] = []
): string {
  const drive = DRIVES[data.drive];

  const bannedPrompt = bannedProducts.length > 0
    ? `\n\nPRODUITS INTERDITS (LISTE NOIRE) :\nTu as l'INTERDICTION ABSOLUE de proposer les produits ou ingrédients suivants dans les recettes ou la liste de courses. Si une recette classique en contient, trouve une alternative ou propose un autre plat :\n${bannedProducts.map(b => `- ${b.name}`).join("\n")}`
    : "";

  const favoritesPrompt = favorites.length > 0
    ? `\n\nARTICLES OBLIGATOIRES (FAVORIS) :\nTu DOIS IMPÉRATIVEMENT ajouter les produits suivants dans la "shopping_list" finale, peu importe les recettes générées :\n${favorites.map(f => `- ${f.name} (Marque: ${f.brand || "N/A"}, Format: ${f.quantity || "N/A"}, Prix: ${f.price_ttc}€)`).join("\n")}\n\nAssure-toi de les placer dans la bonne catégorie de rayon.`
    : "";

  const favoriteMealsPrompt = favoriteMeals.length > 0
    ? `\n\nREPAS FAVORIS (INCONTOURNABLES) :\nL'utilisateur APPRÉCIE BEAUCOUP les plats suivants. Inclus-les judicieusement au moins une fois dans le planning complet (en priorité là où ils étaient prévus : petit-déjeuner, déjeuner ou dîner), mais sans répétition excessive :\n${favoriteMeals.map(m => {
        const parts = [];
        if (m.breakfast) parts.push(`[Petit-déjeuner] ${m.breakfast}`);
        if (m.lunch) parts.push(`[Déjeuner] ${m.lunch}`);
        if (m.dinner) parts.push(`[Dîner] ${m.dinner}`);
        return `- ${parts.join(" / ")}`;
      }).join("\n")}`
    : "";

  // Dynamic meal example based on type
  const mealExample: any = { day: "Jour 1" };
  if (data.mealType === "all") {
    mealExample.breakfast = "Tartines beurre confiture";
    mealExample.breakfast_ingredients = ["Pain de mie", "Beurre", "Confiture fraise"];
  }
  if (data.mealType === "all" || data.mealType === "lunch-dinner") {
    mealExample.lunch = "Salade thon maïs";
    mealExample.lunch_ingredients = ["Thon", "Maïs", "Salade verte", "Vinaigrette"];
  }
  mealExample.dinner = "Lasagnes bolognaise";
  mealExample.dinner_ingredients = ["Pâtes lasagnes", "Viande hachée", "Sauce tomate", "Fromage râpé"];
  mealExample.tags = ["eco", "familial"];

  const isLongPeriod = data.period === "2 weeks" || data.period === "3 weeks" || data.period === "1 month";
  const maxIng = isLongPeriod ? 5 : 10;
  const concisionWarning = isLongPeriod 
    ? "\n⚠️ ATTENTION (PLAN LONG TERME) : Tu génères un plan sur plusieurs semaines. Pour éviter que ta réponse ne soit coupée, sois EXTRÊMEMENT CONCIS. Limite-toi à 5 ingrédients essentiels par repas et groupe les articles de la liste de courses par catégories larges." 
    : "";

  return `Tu es un assistant expert en planification de repas.
Génère un planning COMPLET et une liste de courses pour le drive.${bannedPrompt}${favoritesPrompt}${favoriteMealsPrompt}${concisionWarning}

PARAMÈTRES :
- Budget: ${data.budget}€ | Personnes: ${data.persons} | Période: ${data.period}
- Repas à générer: ${MEAL_TYPE_LABELS[data.mealType] || "tous"}
- Drive: ${drive.name}
- Régime: ${data.preferences?.join(", ") || "standard"}
- Exclusions: ${data.exclusions?.join(", ") || "aucune"}
- Localisation: ${data.selectedStore || drive.name} (${data.zipCode || "France"})
- Lien Magasin: ${data.selectedStoreUrl || drive.home}

RÈGLES D'OR :
1. RECHERCHE DE PRIX : Utilise search_prices pour obtenir des prix RÉELS. L'outil privilégie automatiquement notre base de données locale pour plus de rapidité.
2. LIMITE DE RECHERCHE : ⚠️ Ne fais jamais plus de 10 requêtes au total. Si un produit est introuvable, estime son prix avec cohérence.
3. NOM COURT : Pour le champ 'name', utilise TOUJOURS le nom générique et TRÈS court (ex: 'Steak haché', 'Poulet', 'Lait'). Mets les détails de marque ou de coupe dans 'qty' (ex: 'Férial x4 - 400g'). Cela garantit que les liens de recherche fonctionneront parfaitement.
4. LIENS OBLIGATOIRES : Chaque article DOIT avoir un lien valide. Si tu n'as pas de lien direct dans le snippet, mets EXACTEMENT "N/A".
5. SÉQUENCE : Fais toutes tes recherches AVANT de commencer le JSON.
6. LIENS BRUTS : INTERDICTION ABSOLUE de simplifier ou "nettoyer" les URLs.
7. AUDIT DE RECHERCHE : Remplis "research_audit" avec des preuves textuelles.
8. BUDGET : Reste SOUS ${data.budget}€.
9. FILTRAGE DES REPAS : Respecte STRICTEMENT la directive 'Repas à générer'. Si le petit-déjeuner n'est pas demandé, ne mets pas la clé "breakfast" dans le JSON.
10. STRUCTURE DES REPAS (TRÈS IMPORTANT) : ⚠️ Sépare le NOM du plat de ses INGRÉDIENTS. 
    - Le champ 'breakfast', 'lunch' ou 'dinner' ne doit contenir QUE le nom court de la recette (ex: "Poulet basquaise"). INTERDICTION d'y mettre des commentaires, des [tags] ou des listes d'ingrédients.
    - Le champ correspondant '_ingredients' (ex: 'lunch_ingredients') doit contenir la liste réelle des ingrédients utilisés pour ce plat spécifique.
    - ⚠️ LIMITE DE ${maxIng} INGRÉDIENTS par repas. Choisis les plus importants.
    - ⚠️ INTERDICTION ABSOLUE DE RÉPÉTER LES MÊMES INGRÉDIENTS (ex: pas 50 fois "Sel (pantry)"). Listes chaque ingrédient UNE SEULE FOIS.
    - TAGS AUTORISÉS : Utilise une variété de tags pertinents dans le champ 'tags' : 'eco', 'rapide', 'santé', 'pro-budget', 'famille', 'gourmand', 'végétarien', 'léger'.
11. FORMAT : Réponds UNIQUEMENT en JSON compact, SANS retour à la ligne ni markdown \`\`\`json. Pas d'explications après le JSON.
12. ⚠️ FAVORIS : Inclus tes "REPAS FAVORIS" listés ci-dessus au moins une fois, mais respectant la règle d'anti-répétition ci-dessous.
13. ⚠️ ANTI-RÉPÉTITION : Ne propose jamais le même plat exact (même nom) plus d'UNE fois par semaine, et pas plus de DEUX fois au total sur tout le planning. Varie les recettes même pour les favoris.
14. ⚠️ PRÉVENTION DE BOUCLE : Si tu commences à générer une liste répétitive (ex: le même ingrédient encore et encore), ARRÊTE-TOI IMMÉDIATEMENT et passe au repas suivant. NE GÉNÈRE JAMAIS plus de 30000 caractères par réponse totale. ⚠️ LE JSON DOIT ÊTRE COMPLET ET FINIR PAR "}". MÊME SI TU DOIS RÉDUIRE LE CONTENU, NE COUPE JAMAIS AU MILIEU D'UNE PHRASE OU D'UN OBJET. TOUTES LES ACCOLADES ET CROCHETS DOIVENT ÊTRE FERMÉS.

STRUCTURE JSON (ZÉRO TEXTE HORS DU JSON, finis par }) :
{
  "summary": "Court et précis",
  "estimated_total": 0.00,
  "meals": [${JSON.stringify(mealExample)}],
  "shopping_list": [
    {
      "category": "Rayon", 
      "items": [{"name":"Produit","qty":"Q","unit_price":0.00,"total_price":0.00,"link":"URL"}]
    }
  ],
  "research_audit": ["Preuve 1", "Preuve 2"]
}`;
}
