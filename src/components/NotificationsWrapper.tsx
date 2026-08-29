import type { ReactNode } from "react";
import { NotificationsProvider } from "@/hooks/useNotifications";

/**
 * Dedicated root-level wrapper that guarantees every consumer of
 * useNotifications() sits below a NotificationsProvider — including during
 * hot reload, when module identities can briefly be swapped out. Keeping the
 * provider behind this single wrapper means the root layout never has to
 * know about provider wiring, and useNotifications falls back to inert
 * defaults if the context is ever momentarily unavailable.
 */
export function NotificationsWrapper({ children }: { children: ReactNode }) {
  return <NotificationsProvider>{children}</NotificationsProvider>;
}
