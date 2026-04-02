import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

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
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",

  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0"
];

const randomDelay = (min: number, max: number) => new Promise(r => setTimeout(r, Math.random() * (max - min) + min));


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
  
  const browser = await (puppeteer as any).launch({
    headless: isHeadless,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1280,1024"
    ],
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
export async function scrapeLeclercProduct(query: string): Promise<LeclercProduct | null> {
  const results = await scrapeLeclercBatch([query]);
  return results[query] || null;
}

/**
 * Searches for multiple products in a single session (with resets if needed).
 */
export async function scrapeLeclercBatch(queries: string[]): Promise<Record<string, LeclercProduct>> {
  const results: Record<string, LeclercProduct> = {};
  if (queries.length === 0) return results;

  console.log(`[/lib/leclerc] Starting batch scrape for ${queries.length} items...`);

  let browser = await setupBrowser();

  try {
    let page = await browser.newPage();

    await page.setUserAgent(USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]);


    // Handshake
    console.log(`[/lib/leclerc] Batch handshake (Initializing session)...`);
    await page.goto(`${STORE_BASE_URL}/Default.aspx`, { waitUntil: "networkidle2", timeout: 45000 });
    await randomDelay(3000, 6000);




    for (let i = 0; i < queries.length; i++) {
        const query = queries[i];
        
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
            console.log(`[/lib/leclerc] [${i+1}/${queries.length}] Scraping: "${query}"`);
            const decodedQuery = decodeHtmlEntities(query);
            const ajaxUrl = `${AJAX_BASE_URL}/recherche-ajax.aspx?TexteRecherche=${encodeURIComponent(decodedQuery)}`;
            const htmlUrl = `${STORE_BASE_URL}/recherche.aspx?TexteRecherche=${encodeURIComponent(decodedQuery)}`;
            
            // 1. Try AJAX first (Clean JSON)
            const response = await page.goto(ajaxUrl, { waitUntil: "networkidle2", timeout: 20000 });
            
            let data: any = null;
            if (response?.status() === 200) {
                const jsonText = await page.evaluate(() => document.body.innerText);
                try { data = JSON.parse(jsonText); } catch (e) { }
            }

            // 2. If AJAX fails/blocked, try the HTML Page
            if (!data || response?.status() === 403) {
                console.warn(`[/lib/leclerc] JSON blocked or empty for "${query}". Using HTML Fallback (recherche.aspx)...`);
                await page.goto(htmlUrl, { waitUntil: "networkidle2", timeout: 30000 });
                
                // Try to extract from HTML if possible
                const scraped = await page.evaluate(() => {
                    // This is a naive selector, would need adjustment based on real HTML
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
                    results[query] = {
                        name: scraped.name || query,
                        price: scraped.price,
                        url: htmlUrl
                    };
                    continue;
                }
            }

            // 3. Process AJAX result if we got it
            const firstElement = data?.lstProduits?.lstElements?.[0]?.objElement;
            if (firstElement) {
                results[query] = {
                    name: decodeHtmlEntities(firstElement.sLibelleLigne1),
                    price: firstElement.nrPVUnitaireTTC,
                    url: htmlUrl,
                    brand: decodeHtmlEntities(firstElement.sLibelleLigne2),
                };
            } else if (response?.status() === 403) {
                 results[query] = { name: query, price: 0, url: htmlUrl, is_blocked: true };
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
