import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import "dotenv/config";

// Prisma 7 Setup with absolute path
const url = "C:/Users/conta/.gemini/antigravity/scratch/planificateur-courses/dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@driveplanner.local"; 
  const password = process.env.SITE_PASSWORD || "planificateur123!"; 
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword },
    create: {
      email,
      password: hashedPassword,
      role: "admin"
    }
  });

  console.log(`✅ Admin user created or updated! Email: ${email}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
