import type { DriveConfig, DriveKey } from "@/types";

/**
 * Repairs Leclerc URLs to use the functional Store Subdomain instead of regional SEO ones.
 * Primary target is the Echirolles store if the URL looks broken.
 */
export function repairLeclercUrl(url: string, storeId?: string): string {
  if (!url || !url.includes("leclercdrive.fr")) return url;

  // Already in functional format
  if (url.includes("fd11-courses.leclercdrive.fr")) return url;

  // Specific repair for Echirolles regional SEO URL
  if (url.includes("echirolles---comboire")) {
    const queryMatch = url.match(/TexteRecherche=([^&]*)/);
    const query = queryMatch ? queryMatch[1] : null;
    const base = "https://fd11-courses.leclercdrive.fr/magasin-063801-063801-echirolles---comboire";
    return query ? `${base}/recherche.aspx?TexteRecherche=${query}` : base;
  }

  // If we have an ID but it's using the regional SEO pattern (or just the wrong subdomain)
  if (url.includes("www.leclercdrive.fr/region-") || url.includes("www.leclercdrive.fr/")) {
    const queryMatch = url.match(/TexteRecherche=([^&]*)/);
    const query = queryMatch ? queryMatch[1] : null;

    // Use the provided storeId or fallback to the Echirolles one
    let finalId = storeId || "063801-063801-echirolles---comboire";
    
    // Help users who only have the slug in their DB/session
    if (finalId.includes("echirolles---comboire") || finalId === "echirolles-comboire") {
      finalId = "063801-063801-echirolles---comboire";
    }

    const cleanId = finalId.replace(/^magasin-/, "");
    const base = `https://fd11-courses.leclercdrive.fr/magasin-${cleanId}`;
    return query ? `${base}/recherche.aspx?TexteRecherche=${query}` : base;
  }

  return url;
}

export const DRIVES: Record<DriveKey, DriveConfig> = {
  leclerc: {
    key: "leclerc",
    name: "E.Leclerc Drive",
    label: "Leclerc",
    home: "https://www.leclercdrive.fr",
    color: "#003189",
    buildSearchUrl: (q: string, baseUrl?: string, storeId?: string) => {
      // First, repair the base URL if it's potentially broken
      const repairedBase = repairLeclercUrl(baseUrl || "", storeId);
      
      const cleanBase = repairedBase.split('?')[0].replace(".aspx", "").replace(/\/$/, "");
      
      if (cleanBase.includes("leclercdrive.fr")) {
        return `${cleanBase}/recherche.aspx?TexteRecherche=${encodeURIComponent(q)}`;
      }
      
      // Fallback to the known functional Echirolles store
      return `https://fd11-courses.leclercdrive.fr/magasin-063801-063801-echirolles---comboire/recherche.aspx?TexteRecherche=${encodeURIComponent(q)}`;
    },
  },
  carrefour: {
    key: "carrefour",
    name: "Carrefour Drive",
    label: "Carrefour",
    home: "https://www.carrefour.fr/drive",
    color: "#004A9F",
    buildSearchUrl: (q: string) =>
      `https://www.carrefour.fr/s?q=${encodeURIComponent(q)}`,
  },
  intermarche: {
    key: "intermarche",
    name: "Intermarché Drive",
    label: "Intermarché",
    home: "https://drive.intermarche.com",
    color: "#E30613",
    buildSearchUrl: (q: string) =>
      `https://drive.intermarche.com/recherche?query=${encodeURIComponent(q)}`,
  },
  auchan: {
    key: "auchan",
    name: "Auchan Drive",
    label: "Auchan",
    home: "https://www.auchan.fr/drive",
    color: "#E8002D",
    buildSearchUrl: (q: string) =>
      `https://www.auchan.fr/recherche?text=${encodeURIComponent(q)}`,
  },
  cora: {
    key: "cora",
    name: "Cora Drive",
    label: "Cora",
    home: "https://www.cora.fr/drive",
    color: "#009B3A",
    buildSearchUrl: (q: string) =>
      `https://www.cora.fr/recherche?q=${encodeURIComponent(q)}`,
  },
  monoprix: {
    key: "monoprix",
    name: "Monoprix",
    label: "Monoprix",
    home: "https://www.monoprix.fr",
    color: "#1A1A1A",
    buildSearchUrl: (q: string) =>
      `https://www.monoprix.fr/recherche?q=${encodeURIComponent(q)}`,
  },
};

export const DRIVE_LIST = Object.values(DRIVES);
