import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { getMatches } from "@/lib/ompular.functions";

export const Route = createFileRoute("/dm/$userId")({
  head: () => ({
    meta: [
      { title: "Direct Message — Ompular" },
      { name: "description", content: "Chat privately with a match you revealed on Ompular." },
      { property: "og:title", content: "Direct Message — Ompular" },
      { property: "og:description", content: "Private messaging with your Ompular matches." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <DirectMessagePage />
    </RequireAuth>
  ),
});

interface Msg {
  id?: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
  pending?: boolean;
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(d: string) {
  const date = new Date(d);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function DirectMessagePage() {
  const { userId: peerId } = Route.useParams();
  const { user } = useAuth();
  const { clearSender, connected } = useNotifications();
  const navigate = useNavigate();
  const matchesFn = useServerFn(getMatches);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [peer, setPeer] = useState<{ name: string; email: string } | null>(null);
  const [error, setError] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    clearSender(peerId);
    matchesFn({})
      .then((list) => {
        const match = list.find((m) => m.userId === peerId && m.revealed);
        if (match) setPeer({ name: match.name, email: match.email });
        else setError("You can only DM people you have revealed.");
      })
      .catch(() => setError("Could not load match info."));
  }, [peerId, clearSender, matchesFn]);

  useEffect(() => {
    if (!user) return;
    let active = true;

    void supabase
      .from("messages")
      .select("id, sender_id, receiver_id, text, created_at")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${user.id})`,
      )
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!active) return;
        setMessages(
          (data ?? []).map((m) => ({
            id: m.id,
            senderId: m.sender_id,
            receiverId: m.receiver_id,
            text: m.text,
            createdAt: m.created_at,
          })),
        );
        setHistoryLoaded(true);
      });

    const channel = supabase
      .channel(`dm-${user.id}-${peerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${peerId}`,
        },
        (payload) => {
          const m = payload.new as {
            id: string;
            sender_id: string;
            receiver_id: string;
            text: string;
            created_at: string;
          };
          if (m.receiver_id !== user.id) return;
          setMessages((prev) => [
            ...prev,
            {
              id: m.id,
              senderId: m.sender_id,
              receiverId: m.receiver_id,
              text: m.text,
              createdAt: m.created_at,
            },
          ]);
          clearSender(peerId);
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [user, peerId, clearSender]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || !user) return;
    const optimistic: Msg = {
      senderId: user.id,
      receiverId: peerId,
      text,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    const { data, error: insertError } = await supabase
      .from("messages")
      .insert({ sender_id: user.id, receiver_id: peerId, text })
      .select("id, created_at")
      .single();

    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.pending && m.text === text);
      if (idx === -1) return prev;
      const next = [...prev];
      if (insertError || !data) {
        next.splice(idx, 1);
        return next;
      }
      next[idx] = { ...optimistic, pending: false, id: data.id, createdAt: data.created_at };
      return next;
    });
  }, [input, user, peerId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const grouped: { date: string; msgs: Msg[] }[] = [];
  messages.forEach((msg) => {
    const d = formatDate(msg.createdAt);
    const last = grouped[grouped.length - 1];
    if (!last || last.date !== d) grouped.push({ date: d, msgs: [msg] });
    else last.msgs.push(msg);
  });

  if (error) {
    return (
      <div className="dm-error-page">
        <div className="dm-error-box">
          <div className="dm-error-icon">🔒</div>
          <h3>Access Restricted</h3>
          <p>{error}</p>
          <Link to="/matches" className="btn-primary">
            Back to Matches
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dm-page">
      <div className="dm-header">
        <button className="dm-back" onClick={() => void navigate({ to: "/matches" })}>
          ← Back
        </button>
        <div className="dm-peer-info">
          <div className="dm-peer-avatar">{peer?.name?.[0]?.toUpperCase() ?? "?"}</div>
          <div>
            <div className="dm-peer-name">{peer?.name ?? "Loading..."}</div>
            <div className="dm-peer-status">
              <span className={`dm-status-dot ${connected ? "online" : "offline"}`} />
              {connected ? "Connected" : "Reconnecting..."}
            </div>
          </div>
        </div>
        <div className="dm-header-actions">
          {peer?.email && <span className="dm-peer-email">{peer.email}</span>}
        </div>
      </div>

      <div className="dm-messages">
        {!historyLoaded && (
          <div className="dm-empty">
            <div className="spinner" />
            <p>Loading messages...</p>
          </div>
        )}

        {historyLoaded && messages.length === 0 && (
          <div className="dm-empty">
            <div className="dm-empty-icon">💬</div>
            <h3>Start a conversation</h3>
            <p>Say hello to {peer?.name ?? "your match"}!</p>
          </div>
        )}

        {grouped.map((group) => (
          <div key={group.date}>
            <div className="dm-date-divider">
              <span>{group.date}</span>
            </div>
            {group.msgs.map((msg, i) => {
              const isMine = msg.senderId === user?.id;
              return (
                <div
                  key={msg.id ?? `p-${i}`}
                  className={`dm-message ${isMine ? "dm-mine" : "dm-theirs"}`}
                >
                  <div className={`dm-bubble ${msg.pending ? "dm-pending" : ""}`}>
                    {msg.text}
                    <span className="dm-time">
                      {formatTime(msg.createdAt)}
                      {isMine && <span className="dm-tick">{msg.pending ? "○" : "✓"}</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <div className="dm-input-area">
        <textarea
          className="dm-input"
          placeholder={`Message ${peer?.name ?? "..."}  (Enter to send)`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button className="dm-send-btn" onClick={() => void sendMessage()} disabled={!input.trim()}>
          ↑
        </button>
      </div>
    </div>
  );
}
