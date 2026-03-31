import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import puppeteer from "puppeteer";

const STORE_BASE_URL = "https://fd11-courses.leclercdrive.fr/magasin-063801-063801-echirolles---comboire";
const AJAX_BASE_URL = "https://fd11-courses.leclercdrive.fr/magasin-063801-063801";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
];

async function updateBatch(batchProducts: any[], sendEvent: any, startCounter: number) {
  let [updated, unchanged, errors] = [0, 0, 0];
  let localCounter = startCounter;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled", "--window-size=1920,1080"]
  });

  try {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });
    await page.setUserAgent(USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]);

    console.log(`[/api/update-prices] [Batch] Initializing session...`);
    await page.goto(`${STORE_BASE_URL}/Default.aspx`, { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise(r => setTimeout(r, 4000));

    for (const product of batchProducts) {
      localCounter++;
      try {
        console.log(`[/api/update-prices] [${localCounter}] Updating: ${product.name}`);
        const ajaxUrl = `${AJAX_BASE_URL}/recherche-ajax.aspx?TexteRecherche=${encodeURIComponent(product.name)}`;

        await page.goto(ajaxUrl, { waitUntil: "networkidle2", timeout: 30000 });
        const jsonText = await page.evaluate(() => document.body.innerText);

        let data: any;
        try {
          data = JSON.parse(jsonText);
        } catch (e) {
          const isBlocked = jsonText.includes("cmsg") || jsonText.includes("DataDome") || jsonText.includes("JS challenge");
          console.warn(`[/api/update-prices] Blocked or Parse Error for ${product.name}. Blocked: ${isBlocked}`);
          sendEvent({ product: product.name, status: "error", reason: isBlocked ? "bot_blocked" : "parsing_error", search_url: ajaxUrl });
          errors++;
          if (isBlocked) break; // Stop batch if blocked
          continue;
        }

        const firstElement = data.lstProduits?.lstElements?.[0]?.objElement;
        if (!firstElement) {
          sendEvent({ product: product.name, status: "error", reason: "not_found", search_url: ajaxUrl });
          errors++;
          continue;
        }

        const newPrice = firstElement.nrPVUnitaireTTC;
        if (newPrice !== product.price_ttc) {
          await prisma.product.update({ where: { id: product.id }, data: { price_ttc: newPrice, last_updated: new Date(), source: "ajax_json" } });
          sendEvent({ product: product.name, old_price: product.price_ttc, new_price: newPrice, status: "updated" });
          updated++;
        } else {
          await prisma.product.update({ where: { id: product.id }, data: { last_updated: new Date(), source: "ajax_json" } });
          sendEvent({ product: product.name, old_price: product.price_ttc, new_price: newPrice, status: "unchanged" });
          unchanged++;
        }
      } catch (err: any) {
        sendEvent({ product: product.name, status: "error", reason: err.message });
        errors++;
      }
      await new Promise(r => setTimeout(r, 3000 + Math.random() * 3000));
    }
  } finally {
    await browser.close();
  }

  return { updated, unchanged, errors, counter: localCounter };
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch (e) { }
      };

      try {
        const products = await prisma.product.findMany({
          orderBy: { last_updated: 'asc' }
        });

        let [totalUpdated, totalUnchanged, totalErrors] = [0, 0, 0];
        let globalCounter = 0;

        // Split into small batches of 10 to reset browser session
        const batchSize = 10;
        for (let i = 0; i < products.length; i += batchSize) {
          if (req.signal.aborted) break;

          const batch = products.slice(i, i + batchSize);
          console.log(`[/api/update-prices] Launching batch ${Math.floor(i / batchSize) + 1}...`);

          const result = await updateBatch(batch, sendEvent, globalCounter);
          totalUpdated += result.updated;
          totalUnchanged += result.unchanged;
          totalErrors += result.errors;
          globalCounter = result.counter;

          if (!req.signal.aborted && i + batchSize < products.length) {
            console.log("[/api/update-prices] Cool down between batches (10s)...");
            await new Promise(r => setTimeout(r, 10000));
          }
        }

        if (!req.signal.aborted) {
          sendEvent({ summary: { updated: totalUpdated, unchanged: totalUnchanged, errors: totalErrors, total: products.length } });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      } catch (err: any) {
        if (!req.signal.aborted) {
          sendEvent({ error: `Erreur fatale : ${err.message}` });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      }
    }
  });

  return new NextResponse(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
  });
}
