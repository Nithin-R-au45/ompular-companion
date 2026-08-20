import { logAuthEvent } from "./auth-log.functions";

type EventType =
  | "login"
  | "signup"
  | "password_reset_request"
  | "password_reset_update"
  | "logout";

/** Fire-and-forget auth telemetry. Never blocks or breaks the UI flow. */
export function reportAuthEvent(
  eventType: EventType,
  outcome: "failure" | "success",
  details: { email?: string; error?: unknown } = {},
) {
  try {
    const err = details.error;
    const errorMessage =
      err instanceof Error ? err.message : err ? String(err) : undefined;
    const errorCode =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: unknown }).code)
        : undefined;

    void logAuthEvent({
      data: {
        eventType,
        outcome,
        ...(details.email ? { email: details.email } : {}),
        ...(errorMessage ? { errorMessage } : {}),
        ...(errorCode ? { errorCode } : {}),
        ...(typeof window !== "undefined"
          ? { path: window.location.pathname, userAgent: navigator.userAgent }
          : {}),
      },
    }).catch(() => {});
  } catch {
    /* logging must never break auth */
  }
}
