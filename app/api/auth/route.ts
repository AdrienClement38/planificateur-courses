import { NextRequest, NextResponse } from "next/server";
import { createAuthToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import path from "path";

// Extract real file path from Prisma URL or fallback
const dbUrl = process.env.DATABASE_URL || "file:C:/Users/conta/.gemini/antigravity/scratch/planificateur-courses/dev.db";
const dbPath = dbUrl.replace("file:", "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Identifiants requis" }, { status: 400 });
    }

    const db = new Database(dbPath);
    const user = db.prepare('SELECT * FROM "User" WHERE email = ?').get(email) as any;

    if (!user) {
      return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
    }

    const isMatch = bcrypt.compareSync(password, user.password);

    if (isMatch) {
      const token = await createAuthToken();

      const response = NextResponse.json({ success: true });
      response.cookies.set({
        name: "drive-planner-auth",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return response;
    }

    return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
