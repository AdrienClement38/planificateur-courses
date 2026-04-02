import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const favorites = await prisma.product.findMany({
            where: { is_favorite: true },
            orderBy: { last_updated: "desc" }
        });
        return NextResponse.json(favorites);
    } catch (error) {
        console.error("[api/favorites/products] GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch favorite products" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, drive, store_id, is_favorite } = body;

        if (!name || !drive) {
            return NextResponse.json({ error: "Missing name or drive" }, { status: 400 });
        }

        // Update the FAVORITE status for all instances of this product across the store
        // (or just the specific one if store_id provided)
        const product = await prisma.product.updateMany({
            where: {
                name,
                drive,
                ...(store_id ? { store_id } : {})
            },
            data: { is_favorite: !!is_favorite }
        });

        return NextResponse.json({
            success: true,
            count: product.count,
            is_favorite: !!is_favorite
        });
    } catch (error) {
        console.error("[api/favorites/products] POST Error:", error);
        return NextResponse.json({ error: "Failed to toggle favorite product" }, { status: 500 });
    }
}
