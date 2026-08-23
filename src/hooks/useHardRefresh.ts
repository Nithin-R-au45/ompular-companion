import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Clears cached app data (react-query cache, browser Cache Storage,
 * service workers, sessionStorage) then reloads with a cache-busting URL.
 * The Supabase auth session in localStorage is intentionally preserved.
 */
export function useHardRefresh() {
  const queryClient = useQueryClient();
  const [clearing, setClearing] = useState(false);

  const hardRefresh = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      queryClient.clear();

      try {
        sessionStorage.clear();
      } catch {
        /* ignore */
      }

      if (typeof caches !== "undefined") {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }

      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch {
      /* ignore and reload anyway */
    }

    const url = new URL(window.location.href);
    url.searchParams.set("_r", Date.now().toString());
    window.location.replace(url.toString());
  };

  return { hardRefresh, clearing };
}
