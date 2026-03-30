import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "C:/Users/conta/.gemini/antigravity/scratch/planificateur-courses/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Testing Prisma 7 connection...");
  try {
    const products = await prisma.product.findMany();
    console.log("Success! Found products:", products.length);
  } catch (err) {
    console.error("Failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
