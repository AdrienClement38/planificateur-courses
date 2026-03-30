import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testSerper() {
  const q3 = `site:leclercdrive.fr Echirolles steak haché`;
  console.log("Testing Query 3:", q3);

  let response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: q3, gl: "fr", hl: "fr", num: 5 }),
  });
  
  const data = await response.json();
  console.log("Result 3:", data.organic?.length || 0, "results");
  if (data.organic) console.log(data.organic.map(o => o.link));

  const q4 = `prix drive leclerc echirolles steak haché`;
  console.log("\nTesting Query 4:", q4);
  
  response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: q4, gl: "fr", hl: "fr", num: 5 }),
  });
  
  const data2 = await response.json();
  console.log("Result 4:", data2.organic?.length || 0, "results");
  if (data2.organic) console.log(data2.organic.map(o => o.link));
}

testSerper();
