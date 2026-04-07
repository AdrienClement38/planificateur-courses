import { NextRequest } from "next/server";
import { findProductPrice } from "@/lib/pricing";

export const runtime = "nodejs"; // Prisma requires nodejs runtime

export async function POST(req: NextRequest) {
  try {
    const { items, drive, storeId } = await req.json();

    if (!items || !Array.isArray(items)) {
      return new Response(JSON.stringify({ error: "Missing items array" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Function to send data in SSE format
        const send = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        // Process items with a concurrency limit of 5
        const concurrencyLimit = 5;
        const remainingItems = [...items];
        
        const processNext = async (): Promise<void> => {
          if (remainingItems.length === 0) return;
          
          const item = remainingItems.shift()!;
          try {
            const result = await findProductPrice(item, drive, storeId);
            
            if (result) {
              send({
                item,
                price: result.price_ttc,
                source: result.source,
                matched: result.matched_name,
                link: result.search_url
              });
            } else {
              send({
                item,
                price: null,
                source: "not_found"
              });
            }
          } catch (err) {
            console.error(`Error pricing item "${item}":`, err);
            send({
              item,
              price: null,
              source: "error"
            });
          }
          
          return processNext();
        };

        // Launch initial "workers" up to concurrency limit
        const workers = Array.from({ length: Math.min(items.length, concurrencyLimit) }).map(() => processNext());
        
        await Promise.all(workers);
        
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("[/api/price] Global Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
