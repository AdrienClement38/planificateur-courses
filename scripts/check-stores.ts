import { prisma } from "../lib/db";
async function main() {
  console.log("--- Unique Store IDs ---");
  const storeIds = await prisma.product.groupBy({
    by: ['store_id'],
    _count: {
        _all: true
    }
  });
  console.log(storeIds);
}
main().catch(console.error).finally(async () => {
    await prisma.$disconnect();
});
