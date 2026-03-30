import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testSerper() {
  const query = "steak haché";
  const url = "www.leclercdrive.fr/region-auvergne-rhone-alpes/grenoble/drive-echirolles---comboire.aspx";

  const q = `site:${url} "${query}"`;
  console.log("Testing Query:", q);

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q,
      gl: "fr",
      hl: "fr",
      num: 5,
    }),
  });

  const data = await response.json();
  console.log(JSON.stringify(data.organic || [], null, 2));
}

testSerper();
