import fetch from 'node-fetch';

async function testHead() {
  // test if the search URL works with the single ID format found by the regex
  const url = "https://fd11-courses.leclercdrive.fr/magasin-063801-Echirolles---Comboire/recherche.aspx?TexteRecherche=steak";
  console.log("Testing:", url);
  try {
    const response = await fetch(url, { method: "HEAD" });
    console.log("Status:", response.status, response.url);
  } catch (e) {
    console.error(e);
  }
}

testHead();
