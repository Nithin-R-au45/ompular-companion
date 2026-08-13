import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getPeerNames } from "@/lib/ompular.functions";

interface ToastInfo {
  senderId: string;
  senderName: string;
  preview: string;
}

interface NotificationsValue {
  unreadSenders: Set<string>;
  unreadCount: number;
  toast: ToastInfo | null;
  dismissToast: () => void;
  clearSender: (senderId: string) => void;
  connected: boolean;
}

const NotificationsContext = createContext<NotificationsValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unreadSenders, setUnreadSenders] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const [connected, setConnected] = useState(false);

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
          void getPeerNames({ data: { peerIds: [msg.sender_id] } })
            .then((names) => {
              setToast({
                senderId: msg.sender_id,
                senderName: names[msg.sender_id] ?? "Someone",
                preview: msg.text.slice(0, 60),
              });
            })
            .catch(() => {
              setToast({
                senderId: msg.sender_id,
                senderName: "Someone",
                preview: msg.text.slice(0, 60),
              });
            });
        },
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [user]);

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
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
