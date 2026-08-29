import type { AiModel } from "./ompular-core";

// Public-facing brand labels are mapped to the models available on the gateway.
const BACKING_MODEL: Record<AiModel, string> = {
  "kimi-k3": "google/gemini-3.1-pro-preview",
  "qwen-38x": "google/gemini-3.7-flash",
  "deepseek-v4-pro": "google/gemini-3.5-flash",
  "openai-gpt": "openai/gpt-5.4-mini",
};

const SYSTEM_PROMPT =
  "You are a helpful, warm assistant inside Ompular, an app that connects people through their curiosity. Answer clearly and concisely (under 250 words) with concrete, useful substance.";

export async function askModel(
  model: AiModel,
  promptText: string,
): Promise<{ text: string; error?: string }> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { text: "", error: "AI is not configured." };

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: BACKING_MODEL[model],
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: promptText },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) return { text: "", error: "Rate limited — try again in a moment." };
    if (res.status === 402) return { text: "", error: "AI credits exhausted for this workspace." };
    return { text: "", error: `AI error ${res.status}: ${body.slice(0, 180)}` };
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = json.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) return { text: "", error: "No answer returned." };
  return { text };
}
