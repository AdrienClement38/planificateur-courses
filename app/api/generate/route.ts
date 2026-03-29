import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildMealPlanPrompt } from "@/lib/prompt";
import { MealPlanSchema, PlannerFormSchema } from "@/lib/schemas";

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
    const prompt = buildMealPlanPrompt(formData);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = message.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("");

    // Strip potential markdown code fences
    const jsonText = rawText.replace(/```json\n?|\n?```/g, "").trim();

    let planRaw: unknown;
    try {
      planRaw = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response as JSON" },
        { status: 500 }
      );
    }

    const planParsed = MealPlanSchema.safeParse(planRaw);
    if (!planParsed.success) {
      return NextResponse.json(
        { error: "AI response schema mismatch", details: planParsed.error.flatten() },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan: planParsed.data });
  } catch (error) {
    console.error("[/api/generate] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
