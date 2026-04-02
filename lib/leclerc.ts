import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import path from "path";

// Initialization - Safe to call multiple times or once at top level
try {
  puppeteer.use(StealthPlugin());
} catch (e) {
  console.warn("[/lib/leclerc] StealthPlugin initialization error:", e);
}

const STORE_BASE_URL = "https://fd11-courses.leclercdrive.fr/magasin-063801-063801-echirolles---comboire";
const AJAX_BASE_URL = "https://fd11-courses.leclercdrive.fr/magasin-063801-063801";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0"
];

const randomDelay = (min: number, max: number) => new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min) + min)));

/**
 * Simulates human-like mouse movements
 */
async function simulateHumanMovement(page: any) {
  try {
    const { width, height } = { width: 1280, height: 800 };
    const numPoints = Math.floor(Math.random() * 3) + 2; // 2 to 5 points
    for (let i = 0; i < numPoints; i++) {
        const targetX = Math.floor(Math.random() * width);
        const targetY = Math.floor(Math.random() * height);
        await page.mouse.move(targetX, targetY, {
            steps: Math.floor(Math.random() * 15) + 5 // Slower/faster movements
        });
        await randomDelay(100, 400);
    }
  } catch (e) {}
}

/**
 * Simulates human-like scrolling
 */
async function simulateHumanScroll(page: any) {
    try {
        const scrollAmount = Math.floor(Math.random() * 300) + 100;
        await page.evaluate((amount: number) => {
            window.scrollBy(0, amount);
        }, scrollAmount);
        await randomDelay(500, 1000);
        await page.evaluate((amount: number) => {
            window.scrollBy(0, -Math.floor(amount / 2));
        }, scrollAmount);
    } catch (e) {}
}

/**
 * Tries to extract weight/volume from a string (e.g., "250g", "1L", "2x100g")
 */
function extractQuantityInfo(str: string): { value: number; unit: string } | null {
    if (!str) return null;
    const match = str.toLowerCase().replace(/\s/g, "").match(/(\d+x)?(\d+)(g|kg|l|cl|ml|tr|tranches)/);
    if (match) {
        let value = parseFloat(match[2]);
        if (match[1]) {
            const multiplier = parseInt(match[1].replace("x", ""));
            value *= multiplier;
        }
        return { value, unit: match[3] };
    }
    return null;
}


export const SCRAPE_BLOCKED = "SCRAPE_BLOCKED";

export interface LeclercProduct {
  name: string;
  price: number;
  url: string;
  image?: string;
  brand?: string;
  is_blocked?: boolean;
}


/**
 * Common browser setup with stealth
 */
async function setupBrowser() {
  const isHeadless = process.env.SCRAPER_HEADLESS !== "false";
  const sessionPath = path.join(process.cwd(), ".leclerc_session");
  
  const browser = await (puppeteer as any).launch({
    headless: isHeadless,
    userDataDir: sessionPath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--exclude-switches", "enable-automation",
      "--disable-infobars",
      "--window-size=1280,1024"
    ],
    ignoreDefaultArgs: ["--enable-automation"],
    defaultViewport: null // Allows real window resizing if headful
  });
  return browser;
}






/**
 * Basic HTML Decode
 */
function decodeHtmlEntities(str: string): string {
    if (!str) return str;
    return str.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)))
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'")
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>');
}

/**
 * Searches for a single product on Leclerc Drive using the AJAX endpoint.
 */
export async function scrapeLeclercProduct(query: string, quantity?: string): Promise<LeclercProduct | null> {
  const results = await scrapeLeclercBatch([{ name: query, quantity }]);
  return results[query] || null;
}

/**
 * Searches for multiple products in a single session.
 * Takes objects with name and quantity for smart matching.
 */
export async function scrapeLeclercBatch(products: { name: string; quantity?: string }[]): Promise<Record<string, LeclercProduct>> {
  const results: Record<string, LeclercProduct> = {};
  if (products.length === 0) return results;

  console.log(`[/lib/leclerc] Starting batch scrape for ${products.length} items...`);

  let browser = await setupBrowser();

  try {
    let page = await browser.newPage();

    await page.setUserAgent(USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]);


    // Handshake
    console.log(`[/lib/leclerc] Batch handshake (Initializing session)...`);
    await page.goto(`${STORE_BASE_URL}/Default.aspx`, { waitUntil: "networkidle2", timeout: 45000 });
    await randomDelay(3000, 6000);




    for (let i = 0; i < products.length; i++) {
        const productObj = products[i];
        const query = productObj.name;
        const targetQty = extractQuantityInfo(productObj.quantity || "");
        
        // Hard reset browser every 10 items to prevent DataDome fatigue
        if (i > 0 && i % 10 === 0) {
            console.log(`[/lib/leclerc] Cyclic reset (item ${i})...`);
            await browser.close();
            browser = await setupBrowser();
            page = await browser.newPage();
            await page.setUserAgent(USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]);
            await page.goto(`${STORE_BASE_URL}/Default.aspx`, { waitUntil: "networkidle2", timeout: 45000 });
            await randomDelay(3000, 6000);
        }

        try {
            console.log(`[/lib/leclerc] [${i+1}/${products.length}] Scraping: "${query}" (${productObj.quantity || 'N/A'})`);
            const decodedQuery = decodeHtmlEntities(query);
            const htmlUrl = `${STORE_BASE_URL}/recherche.aspx?TexteRecherche=${encodeURIComponent(decodedQuery)}`;
            const ajaxUrl = `${AJAX_BASE_URL}/recherche-ajax.aspx?TexteRecherche=${encodeURIComponent(decodedQuery)}`;
            
            // SECURITY CHECK: If blocked, abort early
            let content = await page.content();
            if (content.includes("Accès temporairement restreint")) {
                console.error("[/lib/leclerc] HARD BLOCK DETECTED. Aborting batch.");
                results[query] = { name: query, price: 0, url: htmlUrl, is_blocked: true };
                break;
            }

            // CAPTCHA CHECK: Wait for manual solve if headful
            if (content.includes("s'adresse bien à vous") || content.includes("Faites glisser vers la droite")) {
                console.warn("[/lib/leclerc] ⚠️ CAPTCHA DETECTED! Please solve it manually in the Chrome window.");
                try {
                    await page.waitForFunction(
                        () => !document.body.innerText.includes("Faites glisser vers la droite") && !document.body.innerText.includes("s'adresse bien à vous"),
                        { timeout: 120000 }
                    );
                    console.log("[/lib/leclerc] ✅ Captcha resolved. Continuing...");
                    await randomDelay(2000, 4000);
                } catch (e) {
                    console.error("[/lib/leclerc] Captcha solve timeout. Skipping item.");
                    continue;
                }
            }

            // Human behaviors
            await simulateHumanMovement(page);
            await simulateHumanScroll(page);

            // 1. Visit HTML page first (sets headers and cookies naturally)
            const responseHtml = await page.goto(htmlUrl, { waitUntil: "networkidle2", timeout: 30000 });
            if (responseHtml?.status() === 403 || (await page.content()).includes("Accès temporairement restreint")) {
                results[query] = { name: query, price: 0, url: htmlUrl, is_blocked: true };
                continue;
            }
            await randomDelay(1000, 3000);

            // 2. Try AJAX now with Referer headers
            await page.setExtraHTTPHeaders({ "Referer": htmlUrl });
            const responseAjax = await page.goto(ajaxUrl, { waitUntil: "networkidle2", timeout: 15000 });
            
            let data: any = null;
            if (responseAjax?.status() === 200) {
                const jsonText = await page.evaluate(() => document.body.innerText);
                try { 
                    const parsed = JSON.parse(jsonText);
                    const elements = parsed?.lstProduits?.lstElements || [];
                    let bestMatch = elements[0]?.objElement;

                    if (targetQty && elements.length > 1) {
                        for (const el of elements) {
                            const candidate = el.objElement;
                            const fullLabel = (candidate.sLibelleLigne1 + " " + (candidate.sLibellePrimes || "")).toLowerCase();
                            const candQty = extractQuantityInfo(fullLabel);
                            if (candQty && candQty.unit === targetQty.unit && candQty.value === targetQty.value) {
                                bestMatch = candidate;
                                break;
                            }
                        }
                    }
                    data = bestMatch; 
                } catch (e) {}
            }

            if (data) {
                results[query] = {
                    name: decodeHtmlEntities(data.sLibelleLigne1),
                    price: data.nrPVUnitaireTTC,
                    url: htmlUrl,
                    brand: decodeHtmlEntities(data.sLibelleLigne2),
                };
            } else {
                // HTML Fallback
                const scraped = await page.evaluate(() => {
                    const firstPrice = document.querySelector(".prix, .price, [class*='prix']");
                    const firstName = document.querySelector(".libelle, .title, [class*='libelle']");
                    if (firstPrice) {
                        const priceText = firstPrice.textContent?.replace(/[^\d.,]/g, "").replace(",", ".");
                        return { 
                            name: firstName?.textContent?.trim() || "",
                            price: priceText ? parseFloat(priceText) : 0
                        };
                    }
                    return null;
                });

                if (scraped && scraped.price > 0) {
                    results[query] = { name: scraped.name || query, price: scraped.price, url: htmlUrl };
                } else if (responseAjax?.status() === 403) {
                    results[query] = { name: query, price: 0, url: htmlUrl, is_blocked: true };
                }
            }
        } catch (e) {
            console.warn(`[/lib/leclerc] Failed to scrape "${query}":`, e);
            await randomDelay(3000, 6000);
        }


        // Expanded Jitter Delay: between 2s and 5s
        const nextDelay = Math.random() * (5000 - 2000) + 2000;
        await randomDelay(nextDelay, nextDelay + 1000);
    }



  } finally {
    await browser.close();
  }

  return results;
}
