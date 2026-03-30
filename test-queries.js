import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testSerper() {
  const query = "steak haché";
  const domain = "fd11-courses.leclercdrive.fr";
  const location = "E.Leclerc DRIVE Echirolles";

  const q = `site:${domain} "${query}" ${location}`;
  console.log("Testing Query 1:", q);

  let response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q, gl: "fr", hl: "fr", num: 5 }),
  });
  console.log("Result 1:", (await response.json()).organic?.length || 0, "results");

  const q2 = `site:${domain} "${query}" Echirolles`;
  console.log("Testing Query 2:", q2);

  response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: q2, gl: "fr", hl: "fr", num: 5 }),
  });
  console.log("Result 2:", (await response.json()).organic?.length || 0, "results");

  const q3 = `site:leclercdrive.fr "${query}" Echirolles`;
  console.log("Testing Query 3 (Root Domain):", q3);

  response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: q3, gl: "fr", hl: "fr", num: 5 }),
  });
  console.log("Result 3:", (await response.json()).organic?.length || 0, "results");
}

testSerper();
