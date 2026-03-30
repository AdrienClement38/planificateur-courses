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
  storeId?: string
): Promise<{ price_ttc: number; source: string; matched_name: string } | null> {
  const normInput = normalize(productName);
  if (!normInput) return null;
  
  const inputWords = normInput.split(" ");

  // Fetch products for this drive (optionally filtered by store_id)
  const dbProducts = await prisma.product.findMany({
    where: { 
      drive: driveKey,
      ...(storeId ? { store_id: storeId } : {})
    }
  });

  // 1. Try Exact Normalized Match
  const exactMatch = dbProducts.find(p => normalize(p.name) === normInput);
  if (exactMatch) {
    return {
      price_ttc: exactMatch.price_ttc,
      source: "db",
      matched_name: exactMatch.name
    };
  }

  // 2. Try Partial Match: if all significant words of the input are in the DB product name
  // This helps matching "filet de poulet" to "filet de poulet blanc"
  const partialMatch = dbProducts.find(p => {
    const dbNorm = normalize(p.name);
    return inputWords.every(word => dbNorm.includes(word));
  });

  if (partialMatch) {
    return {
      price_ttc: partialMatch.price_ttc,
      source: "db",
      matched_name: partialMatch.name
    };
  }

  // 3. Reverse Partial Match: if the DB name is a subset of the input name
  // Helps matching "yaourt skyr stracci" to "yaourt skyr stracciatella" (if normalized words match)
  const reverseMatch = dbProducts.find(p => {
    const dbNorm = normalize(p.name);
    const dbWords = dbNorm.split(" ");
    return dbWords.every(word => normInput.includes(word));
  });

  if (reverseMatch) {
    return {
      price_ttc: reverseMatch.price_ttc,
      source: "db",
      matched_name: reverseMatch.name
    };
  }

  return null;
}
