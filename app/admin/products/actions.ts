"use server"

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifyAuth as verifyJwtAuth } from "@/lib/auth";

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("drive-planner-auth")?.value;
  if (!token) throw new Error("Unauthorized");
  await verifyJwtAuth(token);
}

export async function banProduct(id: number) {
  try {
    await verifyAuth();
    await prisma.product.update({ 
      where: { id: Number(id) },
      data: { is_banned: true }
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: any) {
    console.error("banProduct Error:", error);
    return { error: error.message || String(error) };
  }
}

export async function restoreProduct(id: number) {
  try {
    await verifyAuth();
    await prisma.product.update({ 
      where: { id: Number(id) },
      data: { is_banned: false }
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: any) {
    console.error("restoreProduct Error:", error);
    return { error: error.message || String(error) };
  }
}

export async function permanentlyDeleteProduct(id: number) {
  try {
    await verifyAuth();
    await prisma.product.delete({ where: { id: Number(id) } });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: any) {
    console.error("permanentlyDeleteProduct Error:", error);
    return { error: error.message || String(error) };
  }
}

export async function updateProduct(id: number, data: any) {
  try {
    await verifyAuth();
    await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name: data.name,
        brand: data.brand || null,
        quantity: data.quantity || null,
        category: data.category,
        price_ttc: parseFloat(data.price_ttc),
      }
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: any) {
    console.error("updateProduct Error:", error);
    return { error: error.message || String(error) };
  }
}

export async function createProduct(data: any) {
  try {
    await verifyAuth();
    await prisma.product.create({
      data: {
        name: data.name,
        brand: data.brand || null,
        quantity: data.quantity || null,
        category: data.category,
        price_ttc: parseFloat(data.price_ttc),
        drive: "MANUAL",
        store_id: "MANUAL_" + Date.now(),
        search_url: "",
        source: "MANUAL"
      }
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: any) {
    console.error("createProduct Error:", error);
    return { error: error.message || String(error) };
  }
}

export async function toggleFavorite(id: number, currentStatus: boolean) {
  try {
    await verifyAuth();
    await prisma.product.update({
      where: { id: Number(id) },
      data: { is_favorite: !currentStatus }
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: any) {
    console.error("toggleFavorite Error:", error);
    return { error: error.message || String(error) };
  }
}

