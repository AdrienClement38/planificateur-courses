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
  driveName = driveName.toLowerCase();

  const dbMatch = await prisma.product.findFirst({
    where: { name: { contains: query }, drive: driveName },
    orderBy: { last_updated: 'desc' }
  });

  if (dbMatch) {
    return [{
      title: `${dbMatch.name} (Source: DB)`,
      snippet: `Prix réel en base : ${dbMatch.price_ttc}€.`,
      link: dbMatch.search_url || "#",
      price: dbMatch.price_ttc,
      source: "db"
    }];
  }

  if (driveName === "leclerc") {
    const scraped = await scrapeLeclercProduct(query);
    if (scraped && !scraped.is_blocked) {
      await prisma.product.upsert({
        where: { name_drive_store_id: { name: scraped.name, drive: "leclerc", store_id: "echirolles-comboire" } },
        update: { price_ttc: scraped.price, last_updated: new Date(), source: "ajax_json" },
        create: { name: scraped.name, brand: scraped.brand, price_ttc: scraped.price, drive: "leclerc", store_id: "echirolles-comboire", category: "Epicerie", search_url: scraped.url, source: "ajax_json" }
      });

      return [{
        title: `${scraped.name} (Source: Scraped)`,
        snippet: `Relevé en direct : ${scraped.price}€.`,
        link: scraped.url,
        price: scraped.price,
        source: "db"
      }];
    }
    
    if (scraped?.is_blocked) {
       console.warn(`[/lib/search] Scraper blocked for "${query}". Attempting Serper fallback...`);
    }
  }


  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];
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

  // 2. Batch Scrape Missing
  if (missingItemQueries.length > 0 && driveLower === "leclerc") {
    const scrapedResults = await scrapeLeclercBatch(missingItemQueries);
    for (const item of allItems) {
      if (item.source === "db") continue;
      const res = scrapedResults[item.name];
      
      // Handle Success
      if (res && !res.is_blocked) {
        const multiplier = getSmartMultiplier(item.qty);
        const newProduct = await prisma.product.upsert({
          where: { name_drive_store_id: { name: res.name, drive: "leclerc", store_id: "echirolles-comboire" } },
          update: { price_ttc: res.price, last_updated: new Date(), source: "generate_auto" },
          create: { name: res.name, brand: res.brand, price_ttc: res.price, drive: "leclerc", store_id: "echirolles-comboire", category: "Epicerie", search_url: res.url, source: "generate_auto" }
        });
        item.unit_price = newProduct.price_ttc;
        item.total_price = item.unit_price * multiplier;
        item.link = newProduct.search_url;
        item.source = "db";
      } 
      // Handle 403 / Blockage with Serper Fallback
      else if (res?.is_blocked || (!res && missingItemQueries.includes(item.name))) {
         const serperResults = await searchPrices(item.name, "leclerc", "leclercdrive.fr");
         const webRes = serperResults.find(r => r.source === "web" || r.source === "db");
         if (webRes && webRes.price > 0) {
            item.unit_price = webRes.price;
            item.total_price = item.unit_price * getSmartMultiplier(item.qty);
            item.source = "web_estimate";
         }
      }
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
