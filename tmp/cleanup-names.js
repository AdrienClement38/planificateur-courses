const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function decodeEntities(str) {
    if (!str) return str;
    return str.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'")
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>');
}

async function main() {
    console.log("Starting DB Cleanup (HTML Entities)...");
    const products = await prisma.product.findMany();
    console.log(`Checking ${products.length} products...`);
    
    let updatedCount = 0;
    for (const p of products) {
        const decodedName = decodeEntities(p.name);
        const decodedBrand = decodeEntities(p.brand);
        
        if (decodedName !== p.name || decodedBrand !== p.brand) {
            await prisma.product.update({
                where: { id: p.id },
                data: {
                    name: decodedName,
                    brand: decodedBrand
                }
            });
            updatedCount++;
        }
    }
    
    console.log(`Done! Updated ${updatedCount} products.`);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(() => {
    prisma.$disconnect();
});
