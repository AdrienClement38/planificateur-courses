import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// We use the absolute path from the environment to avoid relative resolution issues
const url = process.env.DATABASE_URL?.replace("file:", "") || "C:/Users/conta/.gemini/antigravity/scratch/planificateur-courses/dev.db";
const adapter = new PrismaBetterSqlite3({ url });

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
