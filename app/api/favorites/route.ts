import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Routes for persistent favorite stores

export async function GET() {
    try {
        const favorites = await prisma.favoriteStore.findMany({
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(favorites);
    } catch (error) {
        console.error("[api/favorites] GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, address, url, drive, storeId } = body;

        if (!url || !name || !drive) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if it already exists
        const existing = await prisma.favoriteStore.findUnique({
            where: { url }
        });

        if (existing) {
            // Remove it (toggle off)
            await prisma.favoriteStore.delete({
                where: { url }
            });
            return NextResponse.json({ message: "Removed from favorites", removed: true });
        } else {
            // Add it (toggle on)
            const favorite = await prisma.favoriteStore.create({
                data: { name, address, url, drive, storeId }
            });
            return NextResponse.json({ message: "Added to favorites", favorite });
        }
    } catch (error) {
        console.error("[api/favorites] POST Error:", error);
        return NextResponse.json({ error: "Failed to toggle favorite" }, { status: 500 });
    }
}
