import fetch from 'node-fetch';

async function testUrl() {
  const urlWithoutId = "https://fd11-courses.leclercdrive.fr/magasin-echirolles---comboire.aspx";
  try {
    const res = await fetch(urlWithoutId, { method: 'HEAD' });
    console.log("Status for URL without ID:", res.status, res.url);
  } catch(e) {
    console.error("Error:", e);
  }
}
testUrl();
