import { prisma } from "./db";
import { decrypt } from "./crypto";

export interface GeminiMessage {
  role: "user" | "model" | "function";
  parts: Array<{ text?: string; functionCall?: any; functionResponse?: any }>;
}

const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro"
];

export async function hasAvailableGeminiKeys(): Promise<boolean> {
  const count = await prisma.geminiKey.count({ where: { isActive: true } });
  return count > 0 || !!process.env.GEMINI_API_KEY;
}

/**
 * Gets all active API keys, prioritizing DB keys over Env key.
 */
async function getAvailableKeys(): Promise<{ id: string | null; key: string }[]> {
  const dbKeys = await prisma.geminiKey.findMany({
    where: { isActive: true },
    orderBy: { lastUsedAt: "asc" } // Use the least recently used key first
  });

  const keys: { id: string | null; key: string }[] = dbKeys.map(k => {
    try {
      return { id: k.id, key: decrypt(k.key) };
    } catch (e) {
      console.error(`[Gemini] Failed to decrypt key ${k.id}:`, e);
      return null;
    }
  }).filter(Boolean) as { id: string | null; key: string }[];

  // Fallback to environment key if no DB keys
  if (keys.length === 0 && process.env.GEMINI_API_KEY) {
    keys.push({ id: null, key: process.env.GEMINI_API_KEY });
  }

  return keys;
}

async function callGeminiWithFallback(
  payload: any,
  onModelChange?: (model: string) => void
) {
  const keys = await getAvailableKeys();
  let lastError: any = null;

  if (keys.length === 0) {
    throw new Error("Aucune clé API Gemini n'est configurée ou active. Veuillez en ajouter une dans l'administration.");
  }

  for (const model of FALLBACK_MODELS) {
    if (onModelChange) onModelChange(model);

    // Try each key for the current model
    for (const keyObj of keys) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyObj.key}`;
      let retries = 0;
      const maxRetries = 1; // Fewer retries per key since we have multiple keys and we want to rotate fast

      while (retries <= maxRetries) {
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (response.status === 429 || response.status === 503) {
            let errorText = "";
            try { errorText = await response.text(); } catch (e) {}
            const isQuotaExhausted = errorText.toLowerCase().includes("quota");

            // Update key status in DB if it's a DB key
            if (keyObj.id) {
              await prisma.geminiKey.update({
                where: { id: keyObj.id },
                data: { 
                  lastStatus: response.status.toString(), 
                  lastUsedAt: new Date(),
                  isActive: isQuotaExhausted ? false : true // Disable key if daily quota exhausted
                }
              }).catch(() => { });
            }

            if (isQuotaExhausted) {
              console.warn(`[Gemini] Model ${model} Key ${keyObj.key.slice(0, 8)}... QUOTA EXHAUSTED. Switching key.`);
              lastError = new Error(`Quota épuisé pour cette clé (${response.status})`);
              break; // Stop retrying, switch to next key
            }

            if (retries < maxRetries) {
              const waitTime = Math.pow(2, retries) * 1000 + 500;
              console.warn(`[Gemini] Model ${model} with Key ${keyObj.key.slice(0, 8)}... - ${response.status} hit, retrying in ${waitTime}ms...`);
              await new Promise(r => setTimeout(r, waitTime));
              retries++;
              continue;
            } else {
              console.warn(`[Gemini] Model ${model} Key ${keyObj.key.slice(0, 8)}... MAX RETRIES REACHED. Switching key.`);
              lastError = new Error(`Max retries reached for 429/503 (${response.status})`);
              break; // Switch to next key
            }
          }

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`${response.status}: ${errorText}`);
          }

          const data = await response.json();

          // Successful call: update lastUsedAt
          if (keyObj.id) {
            await prisma.geminiKey.update({
              where: { id: keyObj.id },
              data: { lastStatus: "200", lastUsedAt: new Date() }
            }).catch(() => { });
          }

          return data;
        } catch (err: any) {
          lastError = err;
          console.error(`[Gemini] Error with Key ${keyObj.key.slice(0, 8)}... on Model ${model}:`, err.message);
          break; // Switch to next key immediately for non-rate-limit errors
        }
      }
    }
  }

  throw new Error(`Toutes les clés Gemini sont épuisées ou inactives. Veuillez ajouter de nouvelles clés dans l'administration. Dernière erreur: ${lastError?.message}`);
}

export async function generateWithGemini(
  prompt: string,
  tools?: any[],
  responseSchema?: any
) {
  const contents: GeminiMessage[] = [
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ];

  const safetySettings = [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
  ];

  const requestBody: any = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 16384,
      ...(responseSchema ? { responseMimeType: "application/json", responseSchema } : {}),
    },
    safetySettings,
  };

  if (tools) {
    requestBody.tools = [
      {
        function_declarations: tools.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: {
            type: "OBJECT",
            properties: Object.fromEntries(
              Object.entries(t.input_schema.properties).map(([k, v]: [string, any]) => [
                k,
                { ...v, type: v.type.toUpperCase() },
              ])
            ),
            required: t.input_schema.required,
          },
        })),
      },
    ];
  }

  return callGeminiWithFallback(requestBody);
}

export async function chatWithGemini(
  messages: GeminiMessage[],
  tools?: any[],
  responseSchema?: any
) {
  const safetySettings = [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
  ];

  const requestBody: any = {
    contents: messages,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 16384,
      ...(responseSchema ? { responseMimeType: "application/json", responseSchema } : {}),
    },
    safetySettings,
  };

  if (tools) {
    requestBody.tools = [
      {
        function_declarations: tools.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: {
            type: "OBJECT",
            properties: Object.fromEntries(
              Object.entries(t.input_schema.properties).map(([k, v]: [string, any]) => [
                k,
                { ...v, type: v.type.toUpperCase() },
              ])
            ),
            required: t.input_schema.required,
          },
        })),
      },
    ];
  }

  return callGeminiWithFallback(requestBody);
}
