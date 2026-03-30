import fetch from 'node-fetch';

async function testFetchDrivesUrl() {
  const portalUrl = "https://www.leclercdrive.fr/region-auvergne-rhone-alpes/grenoble/drive-echirolles---comboire.aspx";

  try {
    const response = await fetch(portalUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      }
    });

    const html = await response.text();
    
    // Simple regex to find any URL containing "fd" and "magasin-"
    const match = html.match(/https:\/\/fd[0-9]+-courses\.leclercdrive\.fr\/magasin-[^\"]+/);
    if (match) {
      console.log("Found URL via regex:", match[0]);
    } else {
      console.log("No regex match found. Dumping first 1000 chars of HTML:");
      console.log(html.substring(0, 1000));
    }

  } catch (error) {
    console.error("Error fetching URL:", error);
  }
}

testFetchDrivesUrl();
