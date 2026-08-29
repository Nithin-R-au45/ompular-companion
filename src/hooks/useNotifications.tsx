import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getPeerNames } from "@/lib/ompular.functions";

export interface ToastInfo {
  kind: "dm" | "ai";
  title: string;
  preview: string;
  senderId?: string | undefined;
  link?: string | undefined;
}

interface NotifyInput {
  kind: "dm" | "ai";
  title: string;
  preview: string;
  senderId?: string | undefined;
  link?: string | undefined;
  system?: boolean;
}

interface NotificationsValue {
  unreadSenders: Set<string>;
  unreadCount: number;
  toast: ToastInfo | null;
  dismissToast: () => void;
  clearSender: (senderId: string) => void;
  connected: boolean;
  permission: NotificationPermission | "unsupported";
  requestPermission: () => Promise<void>;
  notify: (input: NotifyInput) => void;
}

const NotificationsContext = createContext<NotificationsValue | undefined>(undefined);

function systemNotify(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, { body, icon: "/favicon.png", badge: "/favicon.png" });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* ignore */
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unreadSenders, setUnreadSenders] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const [connected, setConnected] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const askedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPermission("Notification" in window ? Notification.permission : "unsupported");
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "default" || askedRef.current) {
      setPermission(Notification.permission);
      return;
    }
    askedRef.current = true;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch {
      /* ignore */
    }
  }, []);

  const notify = useCallback((input: NotifyInput) => {
    setToast({
      kind: input.kind,
      title: input.title,
      preview: input.preview,
      senderId: input.senderId,
      link: input.link,
    });
    if (input.system !== false && (typeof document === "undefined" || document.hidden || input.kind === "dm")) {
      systemNotify(input.title, input.preview);
    }
  }, []);

  const clearSender = useCallback(
    (senderId: string) => {
      setUnreadSenders((prev) => {
        if (!prev.has(senderId)) return prev;
        const next = new Set(prev);
        next.delete(senderId);
        return next;
      });
      if (user) {
        void supabase
          .from("messages")
          .update({ read: true })
          .eq("sender_id", senderId)
          .eq("receiver_id", user.id)
          .eq("read", false);
      }
    },
    [user],
  );

  useEffect(() => {
    if (!user) {
      setUnreadSenders(new Set());
      setConnected(false);
      return;
    }

    let active = true;

    void supabase
      .from("messages")
      .select("sender_id")
      .eq("receiver_id", user.id)
      .eq("read", false)
      .then(({ data }) => {
        if (!active || !data) return;
        setUnreadSenders(new Set(data.map((m) => m.sender_id)));
      });

    const channel = supabase
      .channel(`dm-inbox-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const msg = payload.new as { sender_id: string; text: string };
          setUnreadSenders((prev) => new Set(prev).add(msg.sender_id));
          const show = (name: string) =>
            notify({
              kind: "dm",
              title: `💬 ${name}`,
              preview: msg.text.slice(0, 80),
              senderId: msg.sender_id,
              link: `/dm/${msg.sender_id}`,
            });
          void getPeerNames({ data: { peerIds: [msg.sender_id] } })
            .then((names) => show(names[msg.sender_id] ?? "Someone"))
            .catch(() => show("Someone"));
        },
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [user, notify]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <NotificationsContext.Provider
      value={{
        unreadSenders,
        unreadCount: unreadSenders.size,
        toast,
        dismissToast: () => setToast(null),
        clearSender,
        connected,
        permission,
        requestPermission,
        notify,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

const fallbackNotifications: NotificationsValue = {
  unreadSenders: new Set<string>(),
  unreadCount: 0,
  toast: null,
  dismissToast: () => {},
  clearSender: () => {},
  connected: false,
  permission: "default",
  requestPermission: async () => {},
  notify: () => {},
};

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  // During HMR/module duplication the provider context can be momentarily
  // missing; fall back to inert defaults instead of crashing the whole app.
  return ctx ?? fallbackNotifications;
}
