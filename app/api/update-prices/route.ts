import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { searchPrices } from "@/lib/search";
import { scrapeLeclercBatch } from "@/lib/leclerc";

export const dynamic = "force-dynamic";

/**
 * Main batch processor utilizing the unified leclerc library.
 */
async function updateBatch(batchProducts: any[], sendEvent: any, startCounter: number) {
  let [updated, unchanged, errors] = [0, 0, 0];
  let localCounter = startCounter;

  try {
    const productData = batchProducts.map(p => ({ name: p.name, quantity: p.quantity }));
    // This call uses the unified scraper in lib/leclerc.ts (Stealth + Headless config + Smart Matching)
    const results = await scrapeLeclercBatch(productData);

    for (const product of batchProducts) {
      localCounter++;
      const scraped = results[product.name];
      
      let targetPrice = product.price_ttc;
      let sourceTag = "ajax_json";
      let status: string = "unchanged";

      if (!scraped || scraped.price === 0 || scraped.is_blocked) {
        console.warn(`[/api/update-prices] Direct scrape failed for ${product.name}. Trying Web Fallback...`);
        const webResults = await searchPrices(product.name, "leclerc", "leclercdrive.fr");
        const bestMatch = webResults.find((r: any) => r.source === "web" || r.source === "db");
        
        if (bestMatch && bestMatch.price) {
          targetPrice = bestMatch.price;
          sourceTag = "web_estimate";
          status = (targetPrice !== product.price_ttc) ? "updated_estimate" : "unchanged_estimate";
          sendEvent({ product: product.name, status: "web_fallback", new_price: targetPrice });
        } else {
          sendEvent({ product: product.name, status: "error", reason: "not_found", product_id: product.id });
          errors++;
          continue;
        }
      } else {
        targetPrice = scraped.price;
        sourceTag = scraped.is_blocked ? "web_estimate" : "ajax_json"; 
        status = (targetPrice !== product.price_ttc) ? "updated" : "unchanged";
      }

      await prisma.product.update({ 
        where: { id: product.id }, 
        data: { price_ttc: targetPrice, last_updated: new Date(), source: sourceTag } 
      });

      sendEvent({ 
        product: product.name, 
        old_price: product.price_ttc, 
        new_price: targetPrice, 
        status: status 
      });

      if (targetPrice !== product.price_ttc) updated++; else unchanged++;
    }
  } catch (err: any) {
    console.error(`[/api/update-prices] Batch error:`, err);
    sendEvent({ status: "error", message: `Erreur de lot: ${err.message}` });
    errors += batchProducts.length;
  }

  return { updated, unchanged, errors, counter: localCounter };
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        // Fetch products to update (oldest first)
        const products = await prisma.product.findMany({
          orderBy: { last_updated: "asc" },
          take: 50 // Limit to 50 items for safety
        });

        if (products.length === 0) {
          sendEvent({ status: "info", message: "Aucun produit à mettre à jour." });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        const BATCH_SIZE = 10;
        let globalCounter = 0;
        let totalUpdated = 0;
        let totalUnchanged = 0;
        let totalErrors = 0;

        for (let i = 0; i < products.length; i += BATCH_SIZE) {
          const batch = products.slice(i, i + BATCH_SIZE);
          const result = await updateBatch(batch, sendEvent, globalCounter);
          
          globalCounter = result.counter;
          totalUpdated += result.updated;
          totalUnchanged += result.unchanged;
          totalErrors += result.errors;

          if (i + BATCH_SIZE < products.length) {
            sendEvent({ status: "info", message: "Pause entre les lots..." });
            await new Promise(r => setTimeout(r, 5000));
          }
        }

        sendEvent({
          summary: { updated: totalUpdated, unchanged: totalUnchanged, errors: totalErrors, total: products.length }
        });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err: any) {
        console.error("[/api/update-prices] Fatal error:", err);
        sendEvent({ status: "fatal", message: err.message });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
