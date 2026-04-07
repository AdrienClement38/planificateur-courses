import { prisma } from "../lib/db";
async function main() {
  console.log("--- Dumping Leclerc URLs ---");
  const products = await prisma.product.findMany({
    where: { drive: "leclerc" },
    select: { name: true, search_url: true },
    take: 20
  });
  products.forEach(p => console.log(`${p.name}: ${p.search_url}`));
}
main().catch(console.error).finally(async () => {
    await prisma.$disconnect();
});
