export type AiModel = "claude-opus" | "gpt-pro" | "gemini-pro";

export const AI_MODELS: AiModel[] = ["claude-opus", "gpt-pro", "gemini-pro"];

export const DAILY_PROMPT_LIMIT = 3;
export const REVEAL_PRICE = 9;

export const MODEL_INFO: Record<
  AiModel,
  { label: string; color: string; icon: string; desc: string }
> = {
  "claude-opus": {
    label: "Claude Opus",
    color: "#f97316",
    icon: "✦",
    desc: "Thoughtful & nuanced",
  },
  "gpt-pro": {
    label: "GPT Pro",
    color: "#22c55e",
    icon: "⬡",
    desc: "Analytical & comprehensive",
  },
  "gemini-pro": {
    label: "Gemini Pro",
    color: "#3b82f6",
    icon: "◈",
    desc: "Creative & wide-ranging",
  },
};

export const AI_SIMULATORS: Record<AiModel, (text: string) => string> = {
  "claude-opus": (text) =>
    `[Claude Opus] Thoughtful response to: "${text.slice(0, 60)}..." — I find this topic deeply meaningful. Let's explore it together.`,
  "gpt-pro": (text) =>
    `[GPT Pro] Smart analysis of: "${text.slice(0, 60)}..." — Here's a comprehensive breakdown with multiple perspectives.`,
  "gemini-pro": (text) =>
    `[Gemini Pro] Creative take on: "${text.slice(0, 60)}..." — This reminds me of interconnected ideas across science and art.`,
};

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
