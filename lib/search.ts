import { prisma } from "@/lib/db";
import { scrapeLeclercProduct, scrapeLeclercBatch } from "@/lib/leclerc";
import { Prisma } from "@prisma/client";

/**
 * Helper to calculate a safe multiplier from a quantity string.
 * Prevents "720g" from being treated as 720x.
 */
function getSmartMultiplier(qty: string): number {
  const norm = qty.toLowerCase().trim();
  if (!norm) return 1;

  // If it's a simple number like "2" or "x2"
  const countMatch = norm.match(/^x?\s*(\d+)$/);
  if (countMatch) {
    const val = parseInt(countMatch[1]);
    return (val > 0 && val <= 20) ? val : 1;
  }

  // If it contains weight/volume units, it's a pack description, not a multiplier
  if (norm.includes("g") || norm.includes("kg") || norm.includes("l") || norm.includes("ml") || norm.includes("cl")) {
    return 1;
  }

  // Fallback to parseFloat but capped at 10 for safety
  const val = parseFloat(norm);
  return (val > 0 && val <= 10) ? val : 1;
}

export async function searchPrices(query: string, driveName: string, driveDomain?: string, location?: string) {
  if (!query || query === "undefined") return [];
  driveName = driveName.toLowerCase();

  // 1. Strict & Banned Check
  const exactMatch = await prisma.product.findFirst({
    where: { name: { contains: query }, drive: driveName },
    orderBy: { last_updated: 'desc' }
  });

  if (exactMatch) {
    if (exactMatch.is_banned) {
      return [{
        title: `${exactMatch.name} (Banni)`,
        snippet: `ATTENTION : Ce produit est dans votre liste noire. VOUS DEVEZ LE SUBSTITUER.`,
        link: "#",
        price: exactMatch.price_ttc,
        source: "banned"
      }];
    }

    return [{
      title: `${exactMatch.name} (Source: DB)`,
      snippet: `Prix habituel : ${exactMatch.price_ttc}€.`,
      link: exactMatch.search_url || "#",
      price: exactMatch.price_ttc,
      source: "db"
    }];
  }

  // 2. Fuzzy/Broad Match in DB
  const fuzzyMatch = await prisma.product.findFirst({
    where: { 
      OR: [
        { name: { contains: query.split(" ")[0] } },
        { category: { contains: query } }
      ],
      drive: driveName,
      is_banned: false 
    },
    orderBy: { last_updated: 'desc' }
  });

  if (fuzzyMatch) {
    return [{
      title: `${fuzzyMatch.name} (Estimation DB)`,
      snippet: `Estimation basée sur un produit similaire (${fuzzyMatch.category}) : ~${fuzzyMatch.price_ttc}€.`,
      link: "#",
      price: fuzzyMatch.price_ttc,
      source: "db_estimate"
    }];
  }

  // 3. Web Fallback (Serper) - Only if enabled and not during heavy batch
  // We keep Serper as it doesn't open a browser (it's an API)
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [{ title: query, snippet: "Prix estimé (Défaut) : 3.00€", price: 3.0, source: "estimate" }];
  
  const queryStr = driveDomain ? `site:${driveDomain} ${query}` : `${query} prix drive`;
  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ q: queryStr, gl: "fr", hl: "fr", num: 3 }),
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.organic?.map((res: any) => ({ title: res.title, snippet: res.snippet, link: res.link, source: "web" })) || [];
}

export async function resolveShoppingListPrices(shoppingList: any[], driveName: string = "leclerc") {
  const resolvedList = JSON.parse(JSON.stringify(shoppingList));
  const driveLower = driveName.toLowerCase();

  const allItems: any[] = [];
  resolvedList.forEach((cat: any) => cat.items?.forEach((item: any) => allItems.push(item)));
  if (allItems.length === 0) return resolvedList;

  const missingItemQueries: string[] = [];

  // 1. Universal Sanitization & DB Check
  for (const item of allItems) {
    // CRITICAL FIX: Always ensure total_price starts from a sane multiplier
    const multiplier = getSmartMultiplier(item.qty);

    const dbMatch = await prisma.product.findFirst({
      where: { name: { contains: item.name }, drive: driveLower },
      orderBy: { last_updated: "desc" }
    });

    if (dbMatch) {
      item.unit_price = dbMatch.price_ttc;
      item.total_price = item.unit_price * multiplier;
      item.link = dbMatch.search_url || item.link;
      item.source = "db";
      item.db_match_name = dbMatch.name;
    } else {
      // Even if NOT in DB, sanitize the AI's hallucinated total_price
      item.total_price = item.unit_price * multiplier;
      missingItemQueries.push(item.name);
    }
  }

  // 2. Resolve Missing via Fuzzy Match or Estimates (NO BROWSER)
  for (const item of allItems) {
    if (item.source === "db") continue;

    const multiplier = getSmartMultiplier(item.qty);

    // Try a broad DB search for something similar to avoid scraping
    const fuzzyMatch = await prisma.product.findFirst({
      where: {
        OR: [
          { name: { contains: item.name.split(" ")[0] } },
          { category: { contains: item.category || "" } }
        ],
        is_banned: false
      },
      orderBy: { last_updated: 'desc' }
    });

    if (fuzzyMatch) {
      item.unit_price = fuzzyMatch.price_ttc;
      item.total_price = item.unit_price * multiplier;
      item.source = "db_fuzzy";
    } else {
      // Default fallback for brand new items
      item.unit_price = item.unit_price || 3.50; 
      item.total_price = item.unit_price * multiplier;
      item.source = "estimate";
    }

    // Flag for later asynchronous scraping in the background (night job)
    try {
      await prisma.product.upsert({
        where: { name_drive_store_id: { name: item.name, drive: driveLower, store_id: "echirolles-comboire" } },
        update: { needs_scraping: true },
        create: { 
          name: item.name, 
          price_ttc: item.unit_price, 
          drive: driveLower, 
          store_id: "echirolles-comboire", 
          category: item.category || "Inconnu", 
          needs_scraping: true,
          source: "placeholder"
        }
      });
    } catch (e) {
      console.warn(`[/lib/search] Failed to create placeholder for ${item.name}`);
    }
  }

  return resolvedList;
}

export async function findStores(drive: string, zipCode: string) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) throw new Error("SERPER_API_KEY missing");
  const q = `magasins drive ${drive} ${zipCode}`;
  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ q, gl: "fr", hl: "fr", num: 10 }),
  });
  if (!response.ok) throw new Error(`Serper error: ${response.status}`);
  const data = await response.json();
  return data.organic?.map((res: any) => ({ name: res.title.split("-")[0].trim(), address: res.snippet || "", url: res.link, id: res.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") })) || [];
}
