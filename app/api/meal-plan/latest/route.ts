import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const latestPlan = await prisma.savedMealPlan.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!latestPlan) {
      return NextResponse.json({ plan: null, formData: null });
    }

    return NextResponse.json({
      plan: JSON.parse(latestPlan.planData),
      formData: JSON.parse(latestPlan.formData),
    });
  } catch (error) {
    console.error("[/api/meal-plan/latest] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.savedMealPlan.deleteMany({});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/meal-plan/latest] DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
