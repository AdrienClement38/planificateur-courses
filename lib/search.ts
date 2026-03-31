export async function searchPrices(query: string, driveName: string, driveDomain?: string, location?: string) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error("SERPER_API_KEY is not set in environment variables");
  }

  const queryStr = driveDomain
    ? `site:${driveDomain} ${query} ${location || ""}`
    : `site:auchan.fr OR site:leclerc.fr OR site:carrefour.fr OR site:intermarche.fr ${query} prix drive ${location || ""}`;

  console.log(`[Serper] Action: Searching Google -> "${queryStr}"`);

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: queryStr,
      gl: "fr",
      hl: "fr",
      num: 5,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Serper API error: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`Serper API error: ${response.status}`);
  }

  const data = await response.json();

  // Extract relevant info from snippets
  const results = data.organic?.map((res: any) => ({
    title: res.title,
    snippet: res.snippet,
    link: res.link
  })) || [];

  console.log(`[Serper] Result: Found ${results.length} organic results for "${query}"`);

  return results;
}

export async function findStores(drive: string, zipCode: string) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error("SERPER_API_KEY is not set in environment variables");
  }

  const q = `magasins drive ${drive} ${zipCode}`;

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q,
      gl: "fr",
      hl: "fr",
      num: 10,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Serper API error: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`Serper API error: ${response.status}`);
  }

  const data = await response.json();

  // Extract and clean store names from snippets and titles
  const stores = data.organic?.map((res: any) => {
    let cleanName = res.title.split("-")[0].trim();
    // Remove "Magasin XXXXXX" prefixes sometimes returned by direct subdomain searches
    if (cleanName.toLowerCase().startsWith("magasin")) {
      const parts = res.title.split("-").map((p: string) => p.trim());
      if (parts.length > 2) {
        cleanName = parts.slice(2).join(" - ");
      }
    }

    let cleanUrl = res.link;
    // Extract base origin if it's a direct subdomain link to avoid long tracking/session URLs
    try {
      const urlObj = new URL(res.link);
      if (urlObj.hostname.includes("fd11-courses")) {
        cleanUrl = urlObj.origin + "/";
      }
    } catch (e) { }

    // Hardcoded override specific to user request to test direct fd11 path
    if (cleanName.toLowerCase().includes("echirolles")) {
      cleanUrl = "https://fd11-courses.leclercdrive.fr/magasin-063801-063801-echirolles---comboire.aspx";
    }

    // Generate unique ID
    let id = cleanName.toLowerCase().includes("echirolles")
      ? "echirolles-comboire"
      : cleanName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    return {
      name: cleanName,
      address: res.snippet || "",
      url: cleanUrl,
      id
    };
  }) || [];

  return stores;
}
