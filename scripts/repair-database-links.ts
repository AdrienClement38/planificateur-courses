import { prisma } from "../lib/db";
import { repairLeclercUrl } from "../lib/drives";

async function main() {
  console.log("--- Leclerc URL Repair Script ---");
  
  const products = await prisma.product.findMany({
    where: {
      drive: "leclerc",
    },
  });

  console.log(`Analyzing ${products.length} Leclerc products...`);

  let updatedCount = 0;
  for (const product of products) {
    if (!product.search_url) continue;

    // Use the repair logic we just implemented
    const repaired = repairLeclercUrl(product.search_url, product.store_id || undefined);
    
    if (repaired !== product.search_url) {
      await prisma.product.update({
        where: { id: product.id },
        data: { search_url: repaired },
      });
      updatedCount++;
      if (updatedCount % 10 === 0) {
        console.log(`Progress: ${updatedCount} items repaired...`);
      }
    }
  }

  console.log(`\n✅ Done! ${updatedCount} records were updated with functional URLs.`);
}

main()
  .catch((e) => {
    console.error("Fatal error during repair:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
