import type { DriveConfig, DriveKey } from "@/types";

export const DRIVES: Record<DriveKey, DriveConfig> = {
  leclerc: {
    key: "leclerc",
    name: "E.Leclerc Drive",
    label: "Leclerc",
    home: "https://www.leclercdrive.fr",
    color: "#003189",
    buildSearchUrl: (q) =>
      `https://www.leclercdrive.fr/recherche/?q=${encodeURIComponent(q)}`,
  },
  carrefour: {
    key: "carrefour",
    name: "Carrefour Drive",
    label: "Carrefour",
    home: "https://www.carrefour.fr/drive",
    color: "#004A9F",
    buildSearchUrl: (q) =>
      `https://www.carrefour.fr/s?q=${encodeURIComponent(q)}`,
  },
  intermarche: {
    key: "intermarche",
    name: "Intermarché Drive",
    label: "Intermarché",
    home: "https://drive.intermarche.com",
    color: "#E30613",
    buildSearchUrl: (q) =>
      `https://drive.intermarche.com/recherche?query=${encodeURIComponent(q)}`,
  },
  auchan: {
    key: "auchan",
    name: "Auchan Drive",
    label: "Auchan",
    home: "https://www.auchan.fr/drive",
    color: "#E8002D",
    buildSearchUrl: (q) =>
      `https://www.auchan.fr/recherche?text=${encodeURIComponent(q)}`,
  },
  cora: {
    key: "cora",
    name: "Cora Drive",
    label: "Cora",
    home: "https://www.cora.fr/drive",
    color: "#009B3A",
    buildSearchUrl: (q) =>
      `https://www.cora.fr/recherche?q=${encodeURIComponent(q)}`,
  },
  monoprix: {
    key: "monoprix",
    name: "Monoprix",
    label: "Monoprix",
    home: "https://www.monoprix.fr",
    color: "#1A1A1A",
    buildSearchUrl: (q) =>
      `https://www.monoprix.fr/recherche?q=${encodeURIComponent(q)}`,
  },
};

export const DRIVE_LIST = Object.values(DRIVES);
