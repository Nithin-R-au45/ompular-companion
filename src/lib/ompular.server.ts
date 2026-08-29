import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  AI_MODELS,
  DAILY_PROMPT_LIMIT,
  REVEAL_PRICE,
  extractKeywords,
  jaccardSimilarity,
  type AiModel,
  type MatchItem,
  type PromptsStatus,
  type TrioAnswer,
  type TrioResult,
} from "./ompular-core";
import { askModel } from "./ompular-ai.server";


function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getPromptsStatusFor(userId: string): Promise<PromptsStatus> {
  const { count, error } = await supabaseAdmin
    .from("prompts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfToday());
  if (error) throw new Error(error.message);
  const used = count ?? 0;
  return { used, remaining: Math.max(0, DAILY_PROMPT_LIMIT - used), limit: DAILY_PROMPT_LIMIT };
}

export async function listPromptsFor(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("prompts")
    .select("id, model, prompt_text, response_text, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({
    id: p.id,
    model: p.model,
    promptText: p.prompt_text,
    responseText: p.response_text,
    createdAt: p.created_at,
  }));
}

export async function sendPromptFor(
  userId: string,
  model: AiModel,
  promptText: string,
): Promise<{ responseText: string }> {
  if (!AI_MODELS.includes(model)) {
    throw new Error("Invalid model. Choose: claude-opus, gpt-pro, gemini-pro");
  }
  const status = await getPromptsStatusFor(userId);
  if (status.remaining <= 0) {
    throw new Error("You have used all 3 free prompts for today. Come back tomorrow!");
  }

  const responseText = AI_SIMULATORS[model](promptText);
  const keywords = extractKeywords(promptText);

  const { error } = await supabaseAdmin.from("prompts").insert({
    user_id: userId,
    model,
    prompt_text: promptText,
    response_text: responseText,
    keywords,
  });
  if (error) throw new Error(error.message);

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("interests")
    .eq("id", userId)
    .maybeSingle();

  const merged = Array.from(
    new Set(
      `${profile?.interests ?? ""},${keywords}`
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    ),
  ).join(",");

  await supabaseAdmin.from("profiles").update({ interests: merged }).eq("id", userId);

  return { responseText };
}

export async function getMatchesFor(userId: string): Promise<MatchItem[]> {
  const { data: me } = await supabaseAdmin
    .from("profiles")
    .select("interests")
    .eq("id", userId)
    .maybeSingle();
  if (!me) return [];

  const { data: others, error } = await supabaseAdmin
    .from("profiles")
    .select("id, name, email, interests")
    .neq("id", userId);
  if (error) throw new Error(error.message);

  const { data: existing } = await supabaseAdmin
    .from("matches")
    .select("matched_id, revealed")
    .eq("seeker_id", userId);

  const revealedIds = new Set(
    (existing ?? []).filter((m) => m.revealed).map((m) => m.matched_id),
  );

  return (others ?? [])
    .map((u) => {
      const revealed = revealedIds.has(u.id);
      return {
        userId: u.id,
        name: revealed ? u.name : "???",
        email: revealed ? u.email : "",
        score: jaccardSimilarity(me.interests, u.interests),
        revealed,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export async function revealMatchFor(userId: string, matchedUserId: string) {
  if (userId === matchedUserId) throw new Error("You cannot reveal yourself.");

  const { data: existingPayment } = await supabaseAdmin
    .from("payments")
    .select("id")
    .eq("user_id", userId)
    .eq("matched_user_id", matchedUserId)
    .maybeSingle();

  if (existingPayment) {
    return { alreadyRevealed: true, success: false, message: "Already revealed this person." };
  }

  const { error: payError } = await supabaseAdmin.from("payments").insert({
    user_id: userId,
    matched_user_id: matchedUserId,
    amount: REVEAL_PRICE,
  });
  if (payError) throw new Error(payError.message);

  const [{ data: seeker }, { data: matched }] = await Promise.all([
    supabaseAdmin.from("profiles").select("interests").eq("id", userId).maybeSingle(),
    supabaseAdmin.from("profiles").select("interests").eq("id", matchedUserId).maybeSingle(),
  ]);
  const score = jaccardSimilarity(seeker?.interests, matched?.interests);

  const { data: existingMatch } = await supabaseAdmin
    .from("matches")
    .select("id")
    .eq("seeker_id", userId)
    .eq("matched_id", matchedUserId)
    .maybeSingle();

  if (existingMatch) {
    await supabaseAdmin.from("matches").update({ revealed: true, score }).eq("id", existingMatch.id);
  } else {
    await supabaseAdmin
      .from("matches")
      .insert({ seeker_id: userId, matched_id: matchedUserId, score, revealed: true });
  }

  return {
    success: true,
    alreadyRevealed: false,
    amount: REVEAL_PRICE,
    message: "Payment successful! Person revealed.",
  };
}

export async function getPeerNamesFor(userId: string, peerIds: string[]) {
  if (peerIds.length === 0) return {} as Record<string, string>;
  const { data: revealed } = await supabaseAdmin
    .from("payments")
    .select("matched_user_id")
    .eq("user_id", userId)
    .in("matched_user_id", peerIds);
  const allowed = new Set((revealed ?? []).map((r) => r.matched_user_id));

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, name")
    .in("id", peerIds);

  const out: Record<string, string> = {};
  for (const p of profiles ?? []) {
    out[p.id] = allowed.has(p.id) ? p.name : "Someone";
  }
  return out;
}
