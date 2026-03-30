import fetch from 'node-fetch';

async function testFetchMultiple() {
  const url = "https://www.leclercdrive.fr/region-auvergne-rhone-alpes/lyon/drive-lyon---9eme-arrondissement.aspx";
  console.log("Fetching:", url);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      }
    });
    const html = await res.text();
    const match = html.match(/(https:\/\/fd[0-9]+-[^\"]+)/g);
    if (match) {
      console.log("  -> All fd matches:", match);
    } else {
      console.log("  -> No match at all. First 1000 chars:");
      console.log(html.substring(0,1000));
    }
  } catch(e) {
    console.log("  -> Error fetching");
  }
}
testFetchMultiple();
