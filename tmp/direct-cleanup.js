const Database = require('better-sqlite3');
const path = require('path');

// Use absolute path
const dbPath = 'C:/Users/conta/.gemini/antigravity/scratch/planificateur-courses/dev.db';
const db = new Database(dbPath);

function decodeEntities(str) {
    if (!str) return str;
    return str.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'")
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>');
}

console.log("Starting Direct DB Cleanup (better-sqlite3)...");
const products = db.prepare('SELECT id, name, brand FROM Product').all();
console.log(`Checking ${products.length} products...`);

let updatedCount = 0;
const updateStmt = db.prepare('UPDATE Product SET name = ?, brand = ? WHERE id = ?');

db.transaction(() => {
    for (const p of products) {
        const decodedName = decodeEntities(p.name);
        const decodedBrand = decodeEntities(p.brand);
        
        if (decodedName !== p.name || decodedBrand !== p.brand) {
            updateStmt.run(decodedName, decodedBrand, p.id);
            updatedCount++;
        }
    }
})();

console.log(`Done! Updated ${updatedCount} products.`);
db.close();
