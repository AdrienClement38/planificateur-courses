import { prisma } from "./db";

const STOPWORDS = ["de", "du", "des", "le", "la", "les", "à", "au", "aux", "et", "en", "un", "une", "x", "kg", "g", "ml", "l", "cl"];

/**
 * Normalizes text for better matching:
 * - Lowercase
 * - Remove accents
 * - Remove punctuation
 * - Remove stopwords
 */
function normalize(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ") // Remove punctuation
    .split(/\s+/)
    .filter(word => word && !STOPWORDS.includes(word))
    .join(" ")
    .trim();
}

/**
 * Search for a product price in the local database with fuzzy matching.
 */
export async function findProductPrice(
  productName: string,
  driveKey: string = "leclerc",
  storeId?: string,
  quantity?: string
): Promise<{ price_ttc: number; source: string; matched_name: string; search_url: string | null } | null> {
  const normInput = normalize(productName);
  if (!normInput) return null;
  
  const inputWords = normInput.split(" ");
  const normQuantity = quantity ? normalize(quantity) : null;

  // Fetch products for this drive (optionally filtered by store_id)
  const dbProducts = await prisma.product.findMany({
    where: { 
      drive: driveKey,
      ...(storeId ? { store_id: storeId } : {})
    }
  });

  // Helper to check quantity match
  const isQuantityMatch = (q1?: string | null, q2?: string | null) => {
    if (!q1 && !q2) return true;
    if (!q1 || !q2) return false;
    return normalize(q1) === normalize(q2);
  };

  // 1. Try Exact Normalized Match (Name + Quantity)
  const exactMatch = dbProducts.find((p: any) => {
    const dbNorm = normalize(p.name);
    const nameMatch = dbNorm === normInput;
    const qtyMatch = isQuantityMatch(p.quantity, quantity);
    return nameMatch && qtyMatch;
  });
  
  if (exactMatch) {
    return {
      price_ttc: exactMatch.price_ttc,
      source: "db",
      matched_name: exactMatch.name,
      search_url: exactMatch.search_url
    };
  }

  // 1b. Try Exact Name Match (Quantity ignored as fallback)
  const nameOnlyMatch = dbProducts.find((p: any) => normalize(p.name) === normInput);
  if (nameOnlyMatch && !quantity) {
    return {
      price_ttc: nameOnlyMatch.price_ttc,
      source: "db",
      matched_name: nameOnlyMatch.name,
      search_url: nameOnlyMatch.search_url
    };
  }

  // 2. Try Partial Match: if all significant words of the input are in the DB product name
  // This helps matching "filet de poulet" to "filet de poulet blanc"
  const partialMatch = dbProducts.find((p: any) => {
    const dbNorm = normalize(p.name);
    const isMatch = inputWords.every(word => dbNorm.includes(word));
    if (p.name.includes("œuf")) {
        console.log(`[Pricing] Partial check: DB="${p.name}" (norm="${dbNorm}") vs inputWords=${JSON.stringify(inputWords)} -> ${isMatch}`);
    }
    return isMatch;
  });

  if (partialMatch) {
    return {
      price_ttc: partialMatch.price_ttc,
      source: "db",
      matched_name: partialMatch.name,
      search_url: partialMatch.search_url
    };
  }

  // 3. Reverse Partial Match: if the DB name is a subset of the input name
  // Helps matching "yaourt skyr stracci" to "yaourt skyr stracciatella" (if normalized words match)
  const reverseMatch = dbProducts.find((p: any) => {
    const dbNorm = normalize(p.name);
    const dbWords = dbNorm.split(" ");
    return dbWords.every(word => normInput.includes(word));
  });

  if (reverseMatch) {
    return {
      price_ttc: reverseMatch.price_ttc,
      source: "db",
      matched_name: reverseMatch.name,
      search_url: reverseMatch.search_url
    };
  }

  return null;
}
