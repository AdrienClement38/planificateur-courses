import { prisma } from "../lib/db";
async function main() {
  console.log("--- Searching for Moutarde ---");
  const products = await prisma.product.findMany({
    where: { 
      name: { contains: "Moutarde" }
    }
  });
  products.forEach(p => console.log(`${p.name} (id:${p.id}): ${p.search_url}`));
}
main().catch(console.error).finally(async () => {
    await prisma.$disconnect();
});
