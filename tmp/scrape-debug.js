const puppeteer = require('puppeteer');

async function debug() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36");

    const STORE_URL = "https://fd11-courses.leclercdrive.fr/magasin-063801-063801-echirolles---comboire/Default.aspx";
    const SEARCH_URL = "https://fd11-courses.leclercdrive.fr/magasin-063801-063801/recherche-ajax.aspx?TexteRecherche=poulet";

    console.log("1. Visiting Store Home...");
    const homeRes = await page.goto(STORE_URL, { waitUntil: 'networkidle2' });
    console.log("Home Status:", homeRes.status());
    await new Promise(r => setTimeout(r, 5000));

    console.log("2. Performing AJAX Search...");
    const searchRes = await page.goto(SEARCH_URL, { waitUntil: 'networkidle2' });
    console.log("Search Status:", searchRes.status());
    console.log("Search Headers:", JSON.stringify(searchRes.headers(), null, 2));

    const body = await page.evaluate(() => document.body.innerText);
    console.log("Body Length:", body.length);
    console.log("Body Content (first 500):", body.substring(0, 500));

    if (body.length < 10) {
        console.log("Full HTML content (if empty body):", (await page.content()).substring(0, 1000));
    }

    await browser.close();
}

debug().catch(console.error);
