export interface GeminiMessage {
  role: "user" | "model" | "function";
  parts: Array<{ text?: string; functionCall?: any; functionResponse?: any }>;
}

export async function generateWithGemini(
  prompt: string,
  apiKey: string,
  tools?: any[],
  responseSchema?: any
) {
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents: GeminiMessage[] = [
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ];

  const requestBody: any = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 16384,
      ...(responseSchema ? { responseMimeType: "application/json", responseSchema } : {}),
    },
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

  let retries = 0;
  const maxRetries = 10;
  
  while (retries < maxRetries) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 429) {
      const waitTime = Math.pow(2, retries) * 2000 + 1000;
      console.warn(`[Gemini] 429 hit, retrying in ${waitTime}ms... (Attempt ${retries + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, waitTime));
      retries++;
      continue;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  }
  throw new Error("Gemini API Error: Max retries exceeded (429)");
}

export async function chatWithGemini(
  messages: GeminiMessage[],
  apiKey: string,
  tools?: any[],
  responseSchema?: any
) {
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody: any = {
    contents: messages,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 16384,
      ...(responseSchema ? { responseMimeType: "application/json", responseSchema } : {}),
    },
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

  let retries = 0;
  const maxRetries = 10;
  
  while (retries < maxRetries) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 429) {
      const waitTime = Math.pow(2, retries) * 2000 + 1000;
      console.warn(`[Gemini] 429 hit, retrying in ${waitTime}ms... (Attempt ${retries + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, waitTime));
      retries++;
      continue;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }
  throw new Error("Gemini API Error: Max retries exceeded (429)");
}
