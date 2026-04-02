const Database = require('better-sqlite3');
const db = new Database('C:/Users/conta/.gemini/antigravity/scratch/planificateur-courses/dev.db');

function migrate() {
    const columns = [
        'breakfast_ingredients',
        'lunch_ingredients',
        'dinner_ingredients'
    ];

    for (const col of columns) {
        try {
            db.prepare(`ALTER TABLE FavoriteMeal ADD COLUMN ${col} TEXT;`).run();
            console.log(`Added column ${col} to FavoriteMeal`);
        } catch (e) {
            console.log(`Column ${col} already exists or error: ${e.message}`);
        }
    }

    try {
        db.prepare(`
            CREATE TABLE IF NOT EXISTS SavedMealPlan (
                id TEXT PRIMARY KEY,
                planData TEXT,
                formData TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `).run();
        console.log('Created SavedMealPlan table');
    } catch (e) {
        console.log(`Error creating SavedMealPlan: ${e.message}`);
    }
}

migrate();
db.close();
