import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as cheerio from "cheerio";

const ECHIROLLES_BASE_URL = "https://fd11-courses.leclercdrive.fr/magasin-063801-063801-Echirolles---Comboire";

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          // ignore if stream closed
        }
      };

      try {
        const products = await prisma.product.findMany({
          orderBy: { last_updated: 'asc' }
        });
        
        let updated = 0;
        let unchanged = 0;
        let errors = 0;

        for (const product of products) {
          if (req.signal.aborted) {
            break;
          }

          try {
            const searchUrl = `${ECHIROLLES_BASE_URL}/recherche.aspx?TexteRecherche=${encodeURIComponent(product.name)}`;
            const response = await fetch(searchUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
              }
            });

            if (!response.ok) {
              sendEvent({ product: product.name, status: "error", reason: `http_${response.status}` });
              errors++;
              continue;
            }

            const html = await response.text();
            const $ = cheerio.load(html);

            const firstProduct = $(".divWCRS310_Produit").first();
            if (!firstProduct.length) {
              sendEvent({ product: product.name, status: "error", reason: "not_found" });
              errors++;
              continue;
            }

            const priceInt = firstProduct.find(".spanWCRS310_PrixUnite").text().trim();
            const priceDec = firstProduct.find(".spanWCRS310_PrixDixieme").text().trim();
            
            if (!priceInt) {
              sendEvent({ product: product.name, status: "error", reason: "no_price" });
              errors++;
              continue;
            }

            const newPrice = parseFloat(`${priceInt}.${priceDec}`);

            if (newPrice !== product.price_ttc) {
              await prisma.product.update({
                where: { id: product.id },
                data: {
                  price_ttc: newPrice,
                  last_updated: new Date(),
                  source: "scrape"
                }
              });
              sendEvent({ product: product.name, old_price: product.price_ttc, new_price: newPrice, status: "updated" });
              updated++;
            } else {
               // Even if price is unchanged, update last_updated
              await prisma.product.update({
                where: { id: product.id },
                data: {
                  last_updated: new Date()
                }
              });
              sendEvent({ product: product.name, old_price: product.price_ttc, new_price: newPrice, status: "unchanged" });
              unchanged++;
            }
          } catch (err: any) {
             sendEvent({ product: product.name, status: "error", reason: err.message });
             errors++;
          }

          // Throttle: 1 second per product
          await new Promise(r => setTimeout(r, 1000));
        }

        if (!req.signal.aborted) {
          sendEvent({ summary: { updated, unchanged, errors, total: products.length } });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }

      } catch (err: any) {
        if (!req.signal.aborted) {
          sendEvent({ error: err.message });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
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
