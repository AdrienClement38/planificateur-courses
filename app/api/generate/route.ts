import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // Extend timeout for long AI generations

import Anthropic from "@anthropic-ai/sdk";
import { buildMealPlanPrompt } from "@/lib/prompt";
import { MealPlanSchema, PlannerFormSchema } from "@/lib/schemas";
import { searchPrices, resolveShoppingListPrices } from "@/lib/search";
import { DRIVES } from "@/lib/drives";
import { chatWithGemini, hasAvailableGeminiKeys } from "@/lib/gemini";
import { prisma } from "@/lib/db";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PlannerFormSchema.safeParse(body.formData);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const formData = parsed.data;
    const drive = DRIVES[formData.drive];

    // Fetch all user favorites (products and meals) to influence the AI
    const [favorites, favoriteMeals] = await Promise.all([
      prisma.product.findMany({ where: { is_favorite: true } }),
      prisma.favoriteMeal.findMany({ take: 10, orderBy: { createdAt: "desc" } })
    ]);

    const prompt = buildMealPlanPrompt({
      ...formData,
      zipCode: formData.zipCode || "",
    }, favorites, favoriteMeals);

    const tools: any[] = [
      {
        name: "search_prices",
        description: `Recherche les prix réels sur les sites de drive pour ${drive.name}.`,
        input_schema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Le nom simple du produit (ex: 'filet de poulet'). Ne pas inclure le nom du magasin ici.",
            },
          },
          required: ["query"],
        },
      },
    ];

    const canUseGemini = await hasAvailableGeminiKeys();

    if (canUseGemini) {
      console.log("[/api/generate] Using Gemini (DB Keys or Free Tier)");
      let geminiMessages: any[] = [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ];

      const mealProperties: any = {
        day: { type: "STRING" },
        tags: { type: "ARRAY", items: { type: "STRING" } }
      };
      
      const isLongPeriod = formData.period === "2 weeks" || formData.period === "3 weeks" || formData.period === "1 month";
      const maxIng = isLongPeriod ? 5 : 10;

      if (formData.mealType === "all") {
        mealProperties.breakfast = { type: "STRING" };
        mealProperties.breakfast_ingredients = { type: "ARRAY", items: { type: "STRING" }, maxItems: maxIng };
      }
      if (formData.mealType === "all" || formData.mealType === "lunch-dinner") {
        mealProperties.lunch = { type: "STRING" };
        mealProperties.lunch_ingredients = { type: "ARRAY", items: { type: "STRING" }, maxItems: maxIng };
      }
      mealProperties.dinner = { type: "STRING" };
      mealProperties.dinner_ingredients = { type: "ARRAY", items: { type: "STRING" }, maxItems: maxIng };

      const mealPlanResponseSchema = {
        type: "OBJECT",
        properties: {
          summary: { type: "STRING" },
          estimated_total: { type: "NUMBER" },
          meals: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: mealProperties,
              required: ["day", "tags"]
            }
          },
          shopping_list: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                category: { type: "STRING" },
                items: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      name: { type: "STRING" },
                      qty: { type: "STRING" },
                      unit_price: { type: "NUMBER" },
                      total_price: { type: "NUMBER" },
                      link: { type: "STRING" }
                    },
                    required: ["name", "qty", "unit_price", "total_price"]
                  }
                }
              },
              required: ["category", "items"]
            }
          },
          research_audit: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        },
        required: ["summary", "estimated_total", "meals", "shopping_list", "research_audit"]
      };

      let geminiResponse = await chatWithGemini(geminiMessages, tools);
      let toolCallsCount = 0;

      while (
        geminiResponse.candidates?.[0]?.content?.parts?.some((p: any) => p.functionCall) &&
        toolCallsCount < 15
      ) {
        toolCallsCount++;
        const assistantParts = geminiResponse.candidates[0].content.parts;
        geminiMessages.push({ role: "model", parts: assistantParts });

        const toolResultsParts = [];
        let executedToolsThisTurn = 0;
        for (const part of assistantParts) {
          if (part.functionCall) {
            const { name, args } = part.functionCall;

            executedToolsThisTurn++;
            if (executedToolsThisTurn > 10) {
              console.log(`[/api/generate] Gemini Tool Blocked (Limit Exceeded): ${name}(${JSON.stringify(args)})`);
              toolResultsParts.push({
                functionResponse: {
                  name,
                  response: { error: "Search limit exceeded. Please estimate the price for this item based on standard supermarkets." }
                }
              });
              continue;
            }

            console.log(`[/api/generate] Gemini Tool Use: ${name}(${JSON.stringify(args)})`);

            try {
              let domain = drive.home.replace("https://", "").replace("www.", "").split("/")[0];
              let location = formData.selectedStore || formData.zipCode || "";

              if (formData.selectedStoreUrl) {
                // Although the user selected a specific fd11 URL, we must search the root domain
                // because Google does not index the session-locked fd11 catalogs.
                domain = drive.home.replace("https://", "").replace("www.", "").split("/")[0];
              }

              const searchResults = await searchPrices((args as any).query, drive.name, domain, location);
              toolResultsParts.push({
                functionResponse: {
                  name,
                  response: { content: JSON.stringify(searchResults) },
                },
              });
            } catch (error) {
              console.error(`Gemini Tool error:`, error);
              toolResultsParts.push({
                functionResponse: {
                  name,
                  response: { error: "Failed to fetch search results" },
                },
              });
            }
          }
        }

        geminiMessages.push({ role: "function", parts: toolResultsParts });

        // Respect free-tier RPM limit (4s is safer for multiple tool calls)
        console.log("[/api/generate] GEMINI: Quota safety throttle (4s)...");
        await new Promise(r => setTimeout(r, 4000));

        geminiResponse = await chatWithGemini(geminiMessages, tools);
      }

      // --- CONTEXT DISTILLATION FOR FINAL GENERATION ---
      // Distill search results to save context window and avoid noise
      const distilledSearchResults: Record<string, any> = {};
      geminiMessages.forEach(msg => {
        if (msg.role === "function") {
          msg.parts.forEach((part: any) => {
            if (part.functionResponse) {
              try {
                distilledSearchResults[part.functionResponse.name] = JSON.parse(part.functionResponse.response.content);
              } catch (e) {}
            }
          });
        }
      });

      console.log(`[/api/generate] GEMINI: Distilling context for final JSON generation...`);
      const finalPrompt = `Voici les résultats des recherches de prix au drive :\n${JSON.stringify(distilledSearchResults)}\n\nMaintenant, génère le JSON final complet du planning sur ${formData.period} en respectant strictement le budget de ${formData.budget}€ et les favoris.`;
      
      // Request final response with a clean history and schema enforcement
      geminiResponse = await chatWithGemini([
        { role: "user", parts: [{ text: prompt }] },
        { role: "user", parts: [{ text: finalPrompt }] }
      ], undefined, mealPlanResponseSchema);

      const finalContent = geminiResponse.candidates?.[0]?.content?.parts
        .map((p: any) => p.text || "")
        .join("");

      return await processResponse(finalContent, "Gemini");
    }

    async function createMessageWithFallback(messages: any[], tools: any[]) {
      const models = [
        "claude-sonnet-4-20250514",
        "claude-3-5-sonnet-20241022",
        "claude-3-5-sonnet-20240620",
        "claude-3-7-sonnet-20250219",
        "claude-3-sonnet-20240229",
        "claude-3-haiku-20240307"
      ];
      let lastError;

      for (const model of models) {
        try {
          console.log(`[/api/generate] Attempting with model: ${model}`);
          const res = await anthropic.messages.create({
            model,
            max_tokens: 8192,
            tools,
            messages,
          });
          console.log(`[/api/generate] Success with model: ${model}`);
          return res;
        } catch (err: any) {
          lastError = err;
          const status = err.status || err.statusCode || err.error?.status;
          console.error(`[/api/generate] Model ${model} failed with status ${status}:`, err.message);

          if (status === 404 || status === 429 || status >= 500) {
            console.warn(`[/api/generate] Retrying with next model...`);
            continue;
          }
          throw err;
        }
      }
      throw lastError;
    }

    let anthropicMessages: any[] = [{ role: "user", content: prompt }];
    let response = await createMessageWithFallback(anthropicMessages, tools);

    let anthropicToolCallsCount = 0;
    while (response.stop_reason === "tool_use" && anthropicToolCallsCount < 10) {
      anthropicToolCallsCount++;

      const toolResultsArr = [];
      const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");

      for (const block of toolUseBlocks) {
        if (block.type === "tool_use") {
          const { query } = block.input as { query: string };
          console.log(`[/api/generate] Anthropic Tool Use: search_prices("${query}")`);

          try {
            const searchResults = await searchPrices(query, drive.name);
            toolResultsArr.push({
              type: "tool_result" as const,
              tool_use_id: block.id,
              content: JSON.stringify(searchResults),
            });
          } catch (error) {
            toolResultsArr.push({
              type: "tool_result" as const,
              tool_use_id: block.id,
              content: "Error: Failed to fetch search results.",
              is_error: true
            });
          }
        }
      }

      anthropicMessages.push({ role: "assistant", content: response.content });
      anthropicMessages.push({
        role: "user",
        content: toolResultsArr,
      });

      response = await createMessageWithFallback(anthropicMessages, tools);
    }

    let allText = "";
    for (const msg of anthropicMessages) {
      if (msg.role === "assistant") {
        if (typeof msg.content === "string") {
          allText += msg.content;
        } else if (Array.isArray(msg.content)) {
          allText += msg.content
            .filter((block: any) => block.type === "text")
            .map((block: any) => block.text)
            .join("");
        }
      }
    }

    const finalResponseText = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("");

    allText += finalResponseText;
    return await processResponse(allText, "Anthropic");

    async function processResponse(text: string, provider: string) {
      let jsonText = text.trim();
      const firstBrace = jsonText.indexOf("{");
      const lastBrace = jsonText.lastIndexOf("}");

      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
      }

      try {
        const planRaw = JSON.parse(jsonText);

        // Clean up hallucinations and broken links
        if (planRaw.shopping_list) {
          planRaw.shopping_list.forEach((category: any) => {
            if (category.items) {
              category.items.forEach((item: any) => {
                // If link is missing, "N/A", fake, or the dead national search link, use search fallback
                if (!item.link || item.link.toLowerCase().includes("n/a") || !item.link.startsWith("http") || item.link.includes("leclercdrive.fr/recherche")) {
                  let fallbackUrl = drive.buildSearchUrl(item.name);

                  // Dynamic Local URL Reconstruction based on user's pattern
                  if (formData.selectedStoreUrl && formData.selectedStoreUrl.includes("leclercdrive.fr")) {
                    const urlObj = new URL(formData.selectedStoreUrl);
                    // If we have an fd-courses or magasin URL, we can reconstruct the local search
                    if (urlObj.pathname.includes("magasin-")) {
                      const basePath = urlObj.pathname.replace(".aspx", "");
                      fallbackUrl = `${urlObj.origin}${basePath}/recherche.aspx?TexteRecherche=${encodeURIComponent(item.name)}`;
                    } else {
                      // If we only have the portal URL, drop them at the portal instead of the dead national search
                      fallbackUrl = formData.selectedStoreUrl;
                    }
                  }

                  item.link = fallbackUrl;
                }
              });
            }
          });
        }

        const planParsed = MealPlanSchema.safeParse(planRaw);
        if (!planParsed.success) {
          console.error(`[/api/generate] ${provider} Schema Validation Error:`, planParsed.error.flatten());
          return NextResponse.json({
            error: "AI response schema mismatch",
            details: planParsed.error.flatten(),
            json: planRaw
          }, { status: 500 });
        }

        // --- ZERO ESTIMATION RESOLUTION ---
        console.log(`[/api/generate] Starting post-generation resolution for ${planParsed.data.shopping_list.length} categories...`);
        const resolvedShoppingList = await resolveShoppingListPrices(planParsed.data.shopping_list, formData.drive);

        // Recalculate total with real prices
        let newTotal = 0;
        resolvedShoppingList.forEach((cat: any) => {
          cat.items?.forEach((item: any) => {
            newTotal += item.total_price || 0;
          });
        });

        const finalPlan = {
          ...planParsed.data,
          shopping_list: resolvedShoppingList,
          estimated_total: Math.round(newTotal * 100) / 100
        };

        // --- SAVE TO DATABASE ---
        try {
          const db = prisma as any;
          // Clear previous plan and save new one
          await db.savedMealPlan.deleteMany({});
          await db.savedMealPlan.create({
            data: {
              planData: JSON.stringify(finalPlan),
              formData: JSON.stringify(formData)
            }
          });
          console.log("[/api/generate] Meal plan saved to database.");
        } catch (dbError) {
          console.error("[/api/generate] Failed to save plan to DB:", dbError);
          // We don't fail the request if saving to DB fails, just log it.
        }

        return NextResponse.json({
          plan: finalPlan
        });
      } catch (parseError: any) {
        console.error(`[/api/generate] ${provider} JSON Parse Error:`, parseError.message);
        return NextResponse.json({
          error: "Failed to parse AI response as JSON",
          details: parseError.message,
          rawResponse: jsonText.substring(0, 1000)
        }, { status: 500 });
      }
    }
  } catch (error) {
    console.error("[/api/generate] Error detail:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
