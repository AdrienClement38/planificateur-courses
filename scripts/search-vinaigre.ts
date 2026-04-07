import { prisma } from "../lib/db";
async function main() {
  console.log("--- Searching for Vinaigre ---");
  const products = await prisma.product.findMany({
    where: { 
      name: { contains: "Vinaigre" }
    }
  });
  products.forEach(p => console.log(`${p.name} (id:${p.id}): ${p.search_url}`));
}
main().catch(console.error).finally(async () => {
    await prisma.$disconnect();
});
