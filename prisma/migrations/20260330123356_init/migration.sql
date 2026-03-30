-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "drive" TEXT NOT NULL,
    "store_id" TEXT,
    "price_ttc" REAL NOT NULL,
    "unit" TEXT,
    "quantity" TEXT,
    "category" TEXT NOT NULL,
    "search_url" TEXT,
    "last_updated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'manual'
);

-- CreateIndex
CREATE INDEX "Product_name_drive_idx" ON "Product"("name", "drive");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_drive_store_id_key" ON "Product"("name", "drive", "store_id");
