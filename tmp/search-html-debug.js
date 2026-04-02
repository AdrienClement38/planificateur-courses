const puppeteer = require('puppeteer');

async function debugSearchPage() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36");

    const STORE_NAME = "echirolles---comboire";
    const QUERY = "poulet";
    const SEARCH_PAGE_URL = `https://fd11-courses.leclercdrive.fr/magasin-063801-063801-${STORE_NAME}/recherche.aspx?TexteRecherche=${QUERY}`;

    console.log(`Visiting: ${SEARCH_PAGE_URL}`);
    
    try {
        const response = await page.goto(SEARCH_PAGE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        console.log("Status:", response.status());
        
        await new Promise(r => setTimeout(r, 5000)); // Wait for dynamic content
        
        const html = await page.content();
        console.log("HTML Length:", html.length);
        
        // Print snippet of potential price location
        const foundPrice = html.includes("€") || html.includes(",00") || html.includes(",99");
        console.log("Contains price symbols:", foundPrice);
        
        // Find product list selectors (common ones for Leclerc)
        console.log("Checking for product containers...");
        const containers = await page.evaluate(() => {
            const results = [];
            if (document.querySelector('.divProduit')) results.push('.divProduit');
            if (document.querySelector('.product-container')) results.push('.product-container');
            if (document.querySelector('article')) results.push('article');
            return results;
        });
        console.log("Found containers:", containers);

        // Save a snippet to check for DataDome
        if (html.includes("DataDome") || html.includes("captcha")) {
            console.log("DETECTED: DataDome or Captcha present in HTML.");
        }

    } catch (e) {
        console.error("Error:", e.message);
    }

    await browser.close();
}

debugSearchPage().catch(console.error);
