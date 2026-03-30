import * as cheerio from 'cheerio';

async function testFetchDrivesUrl() {
  const portalUrl = "https://www.leclercdrive.fr/region-auvergne-rhone-alpes/grenoble/drive-echirolles---comboire.aspx";
  console.log("Fetching portal URL:", portalUrl);

  try {
    const response = await fetch(portalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.error("HTTP error:", response.status);
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Look for the "Commencer mes courses" link or similar redirects
    // Commonly in hrefs of primary buttons on these portal pages
    let trueUrl = null;
    $('a').each((i, link) => {
      const href = $(link).attr('href');
      if (href && href.includes('fd11-courses.leclercdrive.fr')) {
        trueUrl = href;
      }
    });

    if (trueUrl) {
      console.log("Found true subdomain URL:", trueUrl);
    } else {
      console.log("Could not find direct link in HTML. Analyzing meta tags or scripts...");
      // Add logic to check meta tags, window.location redirects in scripts etc.
    }

  } catch (error) {
    console.error("Error fetching URL:", error);
  }
}

testFetchDrivesUrl();
