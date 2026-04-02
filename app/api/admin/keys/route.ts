import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/crypto";

export async function GET() {
    try {
        const keys = await prisma.geminiKey.findMany({
            orderBy: { createdAt: "desc" },
        });

        // Obscure the keys for safety
        const safeKeys = keys.map(k => ({
            ...k,
            key: "********" + k.key.slice(-4)
        }));

        return NextResponse.json(safeKeys);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { name, key } = await req.json();
        if (!name || !key) {
            return NextResponse.json({ error: "Name and Key are required" }, { status: 400 });
        }

        const encryptedKey = encrypt(key);

        const newKey = await prisma.geminiKey.create({
            data: {
                name,
                key: encryptedKey,
                isActive: true,
            }
        });

        return NextResponse.json({ success: true, id: newKey.id });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await prisma.geminiKey.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
