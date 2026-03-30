const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config();

console.log("DEBUG DATABASE_URL:", process.env.DATABASE_URL);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const products = [
  // === VIANDES & POISSONS ===
  { name: "viande hachée 5% mg", brand: "Férial", quantity: "350g", category: "Viandes & Poissons", price_ttc: 5.71 },
  { name: "viande hachée 5% mg", brand: "Férial", quantity: "500g", category: "Viandes & Poissons", price_ttc: 8.09 },
  { name: "filet de poulet blanc", brand: "Le Gaulois", quantity: "720g", category: "Viandes & Poissons", price_ttc: 9.88 },
  { name: "poulet label rouge blanc", brand: null, quantity: "1.25kg", category: "Viandes & Poissons", price_ttc: 10.90 },
  { name: "filets de colin d'alaska meunière", brand: null, quantity: "200g", category: "Viandes & Poissons", price_ttc: 2.49 },
  { name: "filet limande meunière", brand: null, quantity: "200g", category: "Viandes & Poissons", price_ttc: 3.39 },
  { name: "steak haché façon bouchère 15%mg", brand: "Férial", quantity: "560g x4", category: "Viandes & Poissons", price_ttc: 9.99 },
  { name: "aiguillettes de poulet", brand: null, quantity: null, category: "Viandes & Poissons", price_ttc: 4.33 },
  { name: "filet poulet blanc", brand: null, quantity: "720g", category: "Viandes & Poissons", price_ttc: 8.01 },
  { name: "filet poulet jeune sans/atf", brand: null, quantity: "720g", category: "Viandes & Poissons", price_ttc: 8.64 },

  // === FRUITS & LÉGUMES ===
  { name: "tomates cerises bio", brand: "Bio Village", quantity: "250g", category: "Fruits & Légumes", price_ttc: 1.79 },
  { name: "pommes jaunes", brand: "Panier du Primeur", quantity: "x6", category: "Fruits & Légumes", price_ttc: 2.49 },
  { name: "blancs de poireaux filière", brand: "Panier du Primeur", quantity: "500g", category: "Fruits & Légumes", price_ttc: 2.39 },
  { name: "kiwi mûrs à point filière", brand: "Panier du Primeur", quantity: "x6", category: "Fruits & Légumes", price_ttc: 3.99 },
  { name: "chou rouge", brand: null, quantity: "1 pièce", category: "Fruits & Légumes", price_ttc: 1.49 },
  { name: "brocoli", brand: "Eco+", quantity: "400g", category: "Fruits & Légumes", price_ttc: 0.99 },
  { name: "concombre bio", brand: "Bio Village", quantity: "1 pièce", category: "Fruits & Légumes", price_ttc: 1.99 },
  { name: "pomme de terre vapeur filière", brand: "Panier du Primeur", quantity: "2kg", category: "Fruits & Légumes", price_ttc: 2.29 },
  { name: "kiwis bio", brand: "Bio Village", quantity: "x6", category: "Fruits & Légumes", price_ttc: 3.49 },
  { name: "carotte", brand: null, quantity: "1 pièce", category: "Fruits & Légumes", price_ttc: 0.20 },
  { name: "courgette", brand: null, quantity: "1 pièce", category: "Fruits & Légumes", price_ttc: 0.65 },
  { name: "poivron doux rouge", brand: null, quantity: "1 pièce", category: "Fruits & Légumes", price_ttc: 0.70 },
  { name: "banane", brand: null, quantity: "1 pièce", category: "Fruits & Légumes", price_ttc: 1.69 },
  { name: "poireau", brand: null, quantity: "1 pièce", category: "Fruits & Légumes", price_ttc: 1.14 },
  { name: "pomme de terre", brand: null, quantity: "2kg", category: "Fruits & Légumes", price_ttc: 1.79 },
  { name: "poivron bicolore", brand: "Eco+", quantity: "x2", category: "Fruits & Légumes", price_ttc: 0.99 },
  { name: "tomate cerise allongée bicolore", brand: null, quantity: null, category: "Fruits & Légumes", price_ttc: 1.69 },
  { name: "brocoli bio", brand: null, quantity: "sachet x5", category: "Fruits & Légumes", price_ttc: 2.49 },
  { name: "concombre", brand: null, quantity: "1 pièce", category: "Fruits & Légumes", price_ttc: 1.29 },

  // === PRODUITS LAITIERS & ŒUFS ===
  { name: "fromage blanc nature 0%mg", brand: "Délisse", quantity: "8x100g", category: "Laitier Œufs", price_ttc: 1.79 },
  { name: "dessert fruitier pomme", brand: "Douceur du Verger", quantity: "16x100g", category: "Laitier Œufs", price_ttc: 2.80 },
  { name: "compote pommes abricots", brand: "Charles & Alice", quantity: "4x100g", category: "Laitier Œufs", price_ttc: 1.45 },
  { name: "mozzarella boule", brand: "Casa Azzurra", quantity: "125g", category: "Laitier Œufs", price_ttc: 1.02 },
  { name: "fromage à tartiner nature léger", brand: "St Môret", quantity: "180g 9 portions", category: "Laitier Œufs", price_ttc: 2.48 },
  { name: "saint félicien", brand: "Dauphine", quantity: "180g", category: "Laitier Œufs", price_ttc: 2.65 },
  { name: "feta grecque AOP", brand: "Les Croisés", quantity: "150g", category: "Laitier Œufs", price_ttc: 1.84 },
  { name: "fromage fouetté ail fines herbes", brand: "Les Croisés", quantity: "150g", category: "Laitier Œufs", price_ttc: 1.74 },
  { name: "yaourt skyr stracciatella 2%mg", brand: "Yoplait", quantity: "4x120g", category: "Laitier Œufs", price_ttc: 3.11 },
  { name: "yaourt skyr framboise 0%", brand: "Siggis", quantity: "2x140g", category: "Laitier Œufs", price_ttc: 1.99 },
  { name: "yaourt skyr vanille 0%", brand: "Siggis", quantity: "2x140g", category: "Laitier Œufs", price_ttc: 1.99 },
  { name: "yaourt skyr citron", brand: "Siggis", quantity: "2x140g", category: "Laitier Œufs", price_ttc: 1.99 },
  { name: "yaourt skyr stracci", brand: "Siggis", quantity: "280g", category: "Laitier Œufs", price_ttc: 1.99 },
  { name: "compote pomme abricot", brand: null, quantity: "4x100g", category: "Laitier Œufs", price_ttc: 1.38 },
  { name: "œufs plein air", brand: null, quantity: "x12", category: "Laitier Œufs", price_ttc: 4.53 },
  { name: "dessert pomme", brand: null, quantity: "16x100g", category: "Laitier Œufs", price_ttc: 2.80 },
  { name: "fromage blanc nature", brand: null, quantity: "4x100g", category: "Laitier Œufs", price_ttc: 0.97 },
  { name: "épinards hachés crème", brand: null, quantity: "500g", category: "Surgelés", price_ttc: 2.32 },

  // === CHARCUTERIE & TRAITEUR ===
  { name: "saucisses de montbéliard IGP", brand: null, quantity: "250g", category: "Charcuterie", price_ttc: 3.18 },
  { name: "guacamole", brand: "Tables du Monde", quantity: "200g", category: "Charcuterie", price_ttc: 2.29 },
  { name: "pâte brisée bio", brand: "Bio Village", quantity: "230g", category: "Charcuterie", price_ttc: 1.99 },
  { name: "chorizo doux", brand: "Eco+", quantity: "250g", category: "Charcuterie", price_ttc: 1.66 },
  { name: "jambon supérieur sans nitrite", brand: "Tradilège", quantity: "140g x4", category: "Charcuterie", price_ttc: 1.84 },
  { name: "jambon supérieur", brand: "L'Atelier Charcuterie", quantity: "220g x4", category: "Charcuterie", price_ttc: 3.47 },
  { name: "jambon supérieur", brand: null, quantity: "2 tranches", category: "Charcuterie", price_ttc: 1.69 },
  { name: "jambon supérieur", brand: null, quantity: "4 tranches", category: "Charcuterie", price_ttc: 1.95 },
  { name: "jambon torchon", brand: null, quantity: null, category: "Charcuterie", price_ttc: 3.78 },
  { name: "galettes de sarrasin", brand: null, quantity: "230g", category: "Charcuterie", price_ttc: 1.79 },
  { name: "guacamole épicé", brand: null, quantity: "200g", category: "Charcuterie", price_ttc: 2.88 },

  // === ÉPICERIE SALÉE ===
  { name: "huile d'olive vierge extra bio", brand: "Bio Village", quantity: "75cl", category: "Épicerie Salée", price_ttc: 7.47 },
  { name: "soupe velouté légumes verts bio", brand: "Bio Village", quantity: "1L", category: "Épicerie Salée", price_ttc: 2.42 },
  { name: "riste d'aubergines provençale", brand: null, quantity: "650g", category: "Épicerie Salée", price_ttc: 3.99 },
  { name: "velouté de légumes bio", brand: "Bio Village", quantity: "1L", category: "Épicerie Salée", price_ttc: 2.95 },
  { name: "sauce burger", brand: "Amora", quantity: "188g", category: "Épicerie Salée", price_ttc: 1.74 },
  { name: "petits pois sans sel ajouté", brand: "Notre Jardin", quantity: "280g", category: "Épicerie Salée", price_ttc: 0.90 },
  { name: "thon entier nature MSC", brand: "Saupiquet", quantity: "140g", category: "Épicerie Salée", price_ttc: 2.51 },
  { name: "ratatouille provençale", brand: "Notre Jardin", quantity: "530g", category: "Épicerie Salée", price_ttc: 2.59 },
  { name: "soupe velouté moulin légumes verts bio", brand: "Liebig", quantity: "1L", category: "Épicerie Salée", price_ttc: 2.87 },
  { name: "thon entier nature", brand: null, quantity: "2x1/4", category: "Épicerie Salée", price_ttc: 3.75 },
  { name: "ratatouille provençale bocal", brand: null, quantity: "530g", category: "Épicerie Salée", price_ttc: 2.79 },
  { name: "petits pois étuvés", brand: null, quantity: null, category: "Épicerie Salée", price_ttc: 0.90 },

  // === ÉPICERIE SUCRÉE ===
  { name: "tablette chocolat noir 72%", brand: "Equador", quantity: "100g", category: "Épicerie Sucrée", price_ttc: 1.39 },
  { name: "pain de mie céréales graines", brand: "Epi d'Or", quantity: "580g", category: "Épicerie Sucrée", price_ttc: 2.54 },
  { name: "biscuits gerblé sans sucre", brand: "Gerblé", quantity: "132g", category: "Épicerie Sucrée", price_ttc: 1.94 },
  { name: "céréales bio croq soja provençal", brand: null, quantity: "200g", category: "Épicerie Sucrée", price_ttc: 2.17 },
  { name: "wraps blé complet", brand: null, quantity: "x6 370g", category: "Épicerie Sucrée", price_ttc: 2.29 },
  { name: "infusions détox bio", brand: null, quantity: "30g", category: "Épicerie Sucrée", price_ttc: 2.38 },
  { name: "brioche burger céréales", brand: "Fournée", quantity: "250g x4", category: "Épicerie Sucrée", price_ttc: 1.99 },
  { name: "gâche tranchée chocolat", brand: "Fournée", quantity: "500g", category: "Épicerie Sucrée", price_ttc: 2.84 },

  // === PAINS ===
  { name: "pain burger bio", brand: "La Boulangère", quantity: "200g", category: "Pains", price_ttc: 1.14 },

  // === FROMAGES ===
  { name: "tranche brebis", brand: null, quantity: "100g", category: "Fromages", price_ttc: 1.35 },

  // === HYGIÈNE & ENTRETIEN ===
  { name: "papier toilette ultra doux rose", brand: "Mimosa", quantity: "x12", category: "Hygiène", price_ttc: 2.85 },
  { name: "papier hygiénique rose", brand: null, quantity: "x12", category: "Hygiène", price_ttc: 2.88 },
  { name: "gel déboucheur syphon", brand: null, quantity: "1L", category: "Entretien", price_ttc: 1.34 },
  { name: "adoucissant bouquet floral", brand: "Rainett", quantity: "500ml", category: "Entretien", price_ttc: 1.71 },
  { name: "désodorisant petit coin", brand: "Febreze", quantity: "x1", category: "Entretien", price_ttc: 3.20 },
  { name: "adoucissant bouquet floral", brand: "Lenor", quantity: "55 doses", category: "Entretien", price_ttc: 4.53 },

  // === BOISSONS ===
  { name: "coca-cola sans sucre", brand: "Coca-Cola", quantity: "1.75L", category: "Boissons", price_ttc: 1.76 },
];

async function main() {
  console.log("Seeding database...");
  
  for (const product of products) {
    await prisma.product.upsert({
      where: {
        name_drive_store_id: {
          name: product.name,
          drive: "leclerc",
          store_id: "echirolles-comboire",
        }
      },
      update: {
        price_ttc: product.price_ttc,
        brand: product.brand,
        quantity: product.quantity,
        category: product.category,
        source: "invoice",
        last_updated: new Date(),
      },
      create: {
        name: product.name,
        brand: product.brand,
        drive: "leclerc",
        store_id: "echirolles-comboire",
        price_ttc: product.price_ttc,
        quantity: product.quantity,
        category: product.category,
        source: "invoice",
      },
    });
  }
  
  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
