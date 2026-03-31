import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = "C:/Users/conta/.gemini/antigravity/scratch/planificateur-courses/dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const stores = await prisma.product.findMany({ select: { store_id: true } });
  const uniqueStores = [...new Set(stores.map(s => s.store_id))];
  console.log("Unique Store IDs in DB:", uniqueStores);
}

main().catch(console.error).finally(() => prisma.$disconnect());
