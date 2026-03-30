import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

// Prisma 7 Setup with absolute path
const url = "C:/Users/conta/.gemini/antigravity/scratch/planificateur-courses/dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function scrapeLeclerc(query: string) {
  try {
    // Note: This is an example search URL. In a real scenario, we'd use the store-specific search.
    const searchUrl = `https://www.leclercdrive.fr/recherche.aspx?TexteRecherche=${encodeURIComponent(query)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Simplified scraping logic (example)
    const firstProduct = $(".un-produit").first();
    if (!firstProduct.length) return null;

    const name = firstProduct.find(".libelle-produit").text().trim();
    const priceText = firstProduct.find(".prix-produit").text().replace("€", ".").trim();
    const price = parseFloat(priceText);

    if (isNaN(price)) return null;

    return { name, price };
  } catch (error) {
    console.error(`Error scraping "${query}":`, error);
    return null;
  }
}

async function main() {
  console.log("Starting price update script...");
  
  // Find products that haven't been updated in 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const staleProducts = await prisma.product.findMany({
    where: {
      last_updated: { lt: sevenDaysAgo }
    },
    take: 10 // Limit for safety
  });

  console.log(`Found ${staleProducts.length} stale products.`);

  for (const product of staleProducts) {
    console.log(`Updating "${product.name}"...`);
    const result = await scrapeLeclerc(product.name);
    
    if (result) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          price_ttc: result.price,
          last_updated: new Date(),
          source: "scrape"
        }
      });
      console.log(`✅ Updated to ${result.price}€`);
    } else {
      console.log(`❌ No result found for "${product.name}"`);
    }
    
    // Throttle to avoid 429
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log("Update complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
