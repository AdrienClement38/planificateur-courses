import fetch from 'node-fetch';

async function testFetchDrivesUrl() {
  const portalUrl = "https://www.leclercdrive.fr/region-auvergne-rhone-alpes/grenoble/drive-echirolles---comboire.aspx";

  try {
    const response = await fetch(portalUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      }
    });

    const html = await response.text();
    
    // Look for the specific data-url of the button
    const match = html.match(/data-url=\"(https:\/\/fd[0-9]+-courses\.leclercdrive\.fr\/magasin-[^\"]+)\"/);
    if (match && match[1]) {
      console.log("Found EXACT URL:", match[1]);
    } else {
      console.log("No exact match found. Searching for any fd url again...");
      const match2 = html.match(/https:\/\/fd[0-9]+-courses\.leclercdrive\.fr\/magasin-[^\"]+/g);
      console.log("All fd urls:", match2);
    }

  } catch (error) {
    console.error("Error fetching URL:", error);
  }
}

testFetchDrivesUrl();
