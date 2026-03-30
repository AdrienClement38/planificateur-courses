import { NextRequest, NextResponse } from "next/server";
import { findStores } from "@/lib/search";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const drive = searchParams.get("drive");
  const zipCode = searchParams.get("zipCode");

  if (!drive || !zipCode) {
    return NextResponse.json({ error: "Missing drive or zipCode" }, { status: 400 });
  }

  try {
    console.log(`[/api/stores] Searching for ${drive} in ${zipCode}...`);
    const stores = await findStores(drive, zipCode);
    return NextResponse.json({ stores });
  } catch (error) {
    console.error("[/api/stores] Error:", error);
    return NextResponse.json({ error: "Failed to fetch stores" }, { status: 500 });
  }
}
