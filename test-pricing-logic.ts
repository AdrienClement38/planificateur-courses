import { findProductPrice } from "./lib/pricing";

async function test() {
  const cases = [
    "filet de poulet",
    "steak hache",
    "tomate cerise bio",
    "pomme de terre",
    "yaourt skyr stracci",
    "pate brisee",
    "coca cola sans sucre"
  ];

  console.log("Testing Pricing Logic Matching...");
  
  for (const name of cases) {
    const result = await findProductPrice(name, "leclerc", "echirolles-comboire");
    if (result) {
      console.log(`✅ MATCH [${name}] -> [${result.matched_name}] (${result.price_ttc}€)`);
    } else {
      console.log(`❌ NO MATCH [${name}]`);
    }
  }
}

test().catch(console.error);
