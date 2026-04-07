import { prisma } from "../lib/db";
async function main() {
  console.log("--- Searching for Huile ---");
  const products = await prisma.product.findMany({
    where: { 
      name: { contains: "Huile" }
    }
  });
  console.log(`Found ${products.length} products with 'Huile'`);
  products.forEach(p => console.log(`${p.name} (id:${p.id}): ${p.search_url}`));
}
main().catch(console.error).finally(async () => {
    await prisma.$disconnect();
});
