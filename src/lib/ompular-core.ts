export type AiModel = "kimi-k3" | "qwen-38x" | "deepseek-v4-pro";

export const AI_MODELS: AiModel[] = ["kimi-k3", "qwen-38x", "deepseek-v4-pro"];

export const DAILY_PROMPT_LIMIT = 3;

export const MODEL_INFO: Record<
  AiModel,
  { label: string; color: string; icon: string; desc: string }
> = {
  "kimi-k3": {
    label: "google/gemini-3.1-pro-preview",
    color: "#f97316",
    icon: "✦",
    desc: "Deep reasoning via Lovable AI Gateway",
  },
  "qwen-38x": {
    label: "google/gemini-3.7-flash",
    color: "#22c55e",
    icon: "⬡",
    desc: "Fast answers via Lovable AI Gateway",
  },
  "deepseek-v4-pro": {
    label: "google/gemini-3.5-flash",
    color: "#3b82f6",
    icon: "◈",
    desc: "Balanced reasoning via Lovable AI Gateway",
  },
};

export interface TrioAnswer {
  model: AiModel;
  text: string;
  error?: string | undefined;
  ms: number;
}


export interface TrioResult {
  promptId: string;
  answers: TrioAnswer[];
}

const STOPWORDS = new Set([
  "the", "a", "an", "is", "in", "it", "to", "of", "and", "or",
  "i", "me", "my", "we", "do", "be", "on", "at", "so", "if",
  "what", "how", "why", "when", "who", "that", "this", "are",
  "was", "for", "with", "but", "not", "you", "have", "had",
]);

export function extractKeywords(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w))
    .slice(0, 10)
    .join(",");
}

export function jaccardSimilarity(a?: string | null, b?: string | null): number {
  if (!a || !b) return 0;
  const setA = new Set(a.split(",").map((k) => k.trim()).filter(Boolean));
  const setB = new Set(b.split(",").map((k) => k.trim()).filter(Boolean));
  const intersection = [...setA].filter((k) => setB.has(k)).length;
  const union = new Set([...setA, ...setB]).size;
  if (union === 0) return 0;
  return Math.round((intersection / union) * 100);
}

export interface MatchItem {
  userId: string;
  name: string;
  email: string;
  score: number;
  revealed: boolean;
}

export interface PromptsStatus {
  used: number;
  remaining: number;
  limit: number;
}
