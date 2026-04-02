import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const meals = await prisma.favoriteMeal.findMany({
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(meals);
    } catch (error) {
        console.error("[api/favorites/meals] GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch favorite meals" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { breakfast, lunch, dinner, tags, breakfast_ingredients, lunch_ingredients, dinner_ingredients } = body;

        if (!lunch && !dinner && !breakfast) {
            return NextResponse.json({ error: "Meal must have at least one component" }, { status: 400 });
        }

        // Check if EXACT combination already exists (e.g. only lunch specified)
        const existing = await prisma.favoriteMeal.findFirst({
            where: {
                breakfast: breakfast || null,
                lunch: lunch || null,
                dinner: dinner || null,
            }
        });

        if (existing) {
            await prisma.favoriteMeal.delete({
                where: { id: existing.id }
            });
            return NextResponse.json({ message: "Retiré des favoris", removed: true });
        } else {
            const favorite = await prisma.favoriteMeal.create({
                data: {
                    breakfast: breakfast || null,
                    breakfast_ingredients: breakfast_ingredients ? (Array.isArray(breakfast_ingredients) ? breakfast_ingredients.join(", ") : breakfast_ingredients) : null,
                    lunch: lunch || null,
                    lunch_ingredients: lunch_ingredients ? (Array.isArray(lunch_ingredients) ? lunch_ingredients.join(", ") : lunch_ingredients) : null,
                    dinner: dinner || null,
                    dinner_ingredients: dinner_ingredients ? (Array.isArray(dinner_ingredients) ? dinner_ingredients.join(", ") : dinner_ingredients) : null,
                    tags: tags ? (Array.isArray(tags) ? tags.join(",") : tags) : null
                }
            });
            return NextResponse.json({ message: "Ajouté aux favoris", favorite });
        }
    } catch (error) {
        console.error("[api/favorites/meals] POST Error:", error);
        return NextResponse.json({ error: "Failed to toggle favorite meal" }, { status: 500 });
    }
}
