import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AuthEventType =
  | "login"
  | "signup"
  | "password_reset_request"
  | "password_reset_update"
  | "logout";

export interface AuthEventInput {
  eventType: AuthEventType;
  outcome: "failure" | "success";
  email?: string | undefined;
  errorMessage?: string | undefined;
  errorCode?: string | undefined;
  path?: string | undefined;
  userAgent?: string | undefined;
}

const MAX = 500;
const trim = (v?: string) => (v ? v.slice(0, MAX) : null);

export async function recordAuthEvent(input: AuthEventInput) {
  // Also surface in the server log pipeline for fast incident triage.
  const line = `[auth:${input.outcome}] ${input.eventType} email=${input.email ?? "-"} code=${input.errorCode ?? "-"} msg=${input.errorMessage ?? "-"} path=${input.path ?? "-"}`;
  if (input.outcome === "failure") console.error(line);
  else console.log(line);

  const { error } = await supabaseAdmin.from("auth_event_logs").insert({
    event_type: input.eventType,
    outcome: input.outcome,
    email: trim(input.email),
    error_message: trim(input.errorMessage),
    error_code: trim(input.errorCode),
    path: trim(input.path),
    user_agent: trim(input.userAgent),
  });
  if (error) console.error(`[auth:log-write-failed] ${error.message}`);
  return { ok: !error };
}
