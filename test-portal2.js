import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function testFetchDrivesUrl() {
  const portalUrl = "https://www.leclercdrive.fr/region-auvergne-rhone-alpes/grenoble/drive-echirolles---comboire.aspx";
  console.log("Fetching portal URL:", portalUrl);

  try {
    const response = await fetch(portalUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "max-age=0",
        "Sec-Ch-Ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"122\"",
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": "\"Windows\"",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1"
      }
    });

    if (!response.ok) {
      console.error("HTTP error:", response.status);
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let trueUrl = null;
    $('.bouton-action').each((i, link) => {
      const dataUrl = $(link).attr('data-url');
      if (dataUrl && dataUrl.includes('fd')) {
        trueUrl = dataUrl;
      }
    });

    if (trueUrl) {
      console.log("SUCCESS! Found exact subdomain URL:", trueUrl);
    } else {
      console.log("Could not find data-url in HTML.");
    }

  } catch (error) {
    console.error("Error fetching URL:", error);
  }
}

testFetchDrivesUrl();
