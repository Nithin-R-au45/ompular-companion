import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getPromptsStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getPromptsStatusFor } = await import("./ompular.server");
    return getPromptsStatusFor(context.userId);
  });

export const listPrompts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listPromptsFor } = await import("./ompular.server");
    return listPromptsFor(context.userId);
  });

export const sendPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ promptText: z.string().min(1).max(2000) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { sendPromptFor } = await import("./ompular.server");
    return sendPromptFor(context.userId, data.promptText);
  });

export const chooseAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        promptId: z.string().uuid(),
        model: z.enum(["kimi-k3", "qwen-38x", "deepseek-v4-pro"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { chooseAnswerFor } = await import("./ompular.server");
    return chooseAnswerFor(context.userId, data.promptId, data.model);
  });


export const getMatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getMatchesFor } = await import("./ompular.server");
    return getMatchesFor(context.userId);
  });

export const revealMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ matchedUserId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { revealMatchFor } = await import("./ompular.server");
    return revealMatchFor(context.userId, data.matchedUserId);
  });

export const getPeerNames = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ peerIds: z.array(z.string().uuid()).max(50) }).parse(data))
  .handler(async ({ data, context }) => {
    const { getPeerNamesFor } = await import("./ompular.server");
    return getPeerNamesFor(context.userId, data.peerIds);
  });
