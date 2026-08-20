import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  eventType: z.enum([
    "login",
    "signup",
    "password_reset_request",
    "password_reset_update",
    "logout",
  ]),
  outcome: z.enum(["failure", "success"]).default("failure"),
  email: z.string().max(320).optional(),
  errorMessage: z.string().max(500).optional(),
  errorCode: z.string().max(120).optional(),
  path: z.string().max(300).optional(),
  userAgent: z.string().max(400).optional(),
});

// Intentionally unauthenticated: these events happen before a session exists.
export const logAuthEvent = createServerFn({ method: "POST" })
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data }) => {
    const { recordAuthEvent } = await import("./auth-log.server");
    return recordAuthEvent(data);
  });
