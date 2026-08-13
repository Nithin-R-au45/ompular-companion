import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import RequireAuth from "@/components/RequireAuth";
import { getPromptsStatus, sendPrompt } from "@/lib/ompular.functions";
import { AI_MODELS, MODEL_INFO, type AiModel } from "@/lib/ompular-core";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat — Ompular" },
      {
        name: "description",
        content: "Chat with Claude Opus, GPT Pro or Gemini Pro. 3 free prompts every day.",
      },
      { property: "og:title", content: "AI Chat — Ompular" },
      {
        property: "og:description",
        content: "Use your daily prompts to talk to AI and find your matches.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ChatPage />
    </RequireAuth>
  ),
});

interface ChatMessage {
  role: "user" | "ai";
  text: string;
  model?: AiModel;
}

function ChatPage() {
  const [model, setModel] = useState<AiModel>("claude-opus");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const statusFn = useServerFn(getPromptsStatus);
  const sendFn = useServerFn(sendPrompt);
  const status = useQuery({ queryKey: ["prompts-status"], queryFn: () => statusFn({}) });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const remaining = status.data?.remaining ?? 0;
  const used = status.data?.used ?? 0;
  const canSend = remaining > 0 && !loading;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (remaining <= 0) {
      setError("No prompts remaining today. Come back tomorrow!");
      return;
    }
    setError("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await sendFn({ data: { model, promptText: text } });
      setMessages((prev) => [...prev, { role: "ai", text: res.responseText, model }]);
      await queryClient.invalidateQueries({ queryKey: ["prompts-status"] });
      await queryClient.invalidateQueries({ queryKey: ["prompts"] });
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <div className="chat-page">
      <aside className="chat-sidebar">
        <h2>Choose Model</h2>
        <p className="sidebar-note">All 3 models share your daily limit</p>
        <div className="model-list">
          {AI_MODELS.map((m) => (
            <button
              key={m}
              className={`model-option ${model === m ? "active" : ""}`}
              onClick={() => setModel(m)}
              style={model === m ? { borderColor: MODEL_INFO[m].color } : {}}
            >
              <span className="model-icon" style={{ color: MODEL_INFO[m].color }}>
                {MODEL_INFO[m].icon}
              </span>
              <div>
                <div className="model-name">{MODEL_INFO[m].label}</div>
                <div className="model-desc">{MODEL_INFO[m].desc}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="prompt-counter">
          <div className="counter-label">Daily Prompts</div>
          <div className="counter-dots">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`dot ${i < used ? "dot-used" : "dot-free"}`} />
            ))}
          </div>
          <div className="counter-text">
            <span className="accent">{remaining}</span> / {status.data?.limit ?? 3} remaining
          </div>
          <p className="counter-note">Resets at midnight</p>
        </div>

        <div className="match-tip">
          <span>💡</span>
          <p>Each prompt you send helps us find better matches for you.</p>
        </div>
      </aside>

      <div className="chat-main">
        <div className="chat-mobile-bar">
          <div className="chat-mobile-models">
            {AI_MODELS.map((m) => (
              <button
                key={m}
                className={`chat-mobile-model-btn ${model === m ? "active" : ""}`}
                onClick={() => setModel(m)}
                style={
                  model === m ? { borderColor: MODEL_INFO[m].color, color: MODEL_INFO[m].color } : {}
                }
              >
                <span>{MODEL_INFO[m].icon}</span>
                <span className="chat-mobile-model-label">{MODEL_INFO[m].label}</span>
              </button>
            ))}
          </div>
          <div className="chat-mobile-counter">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`dot ${i < used ? "dot-used" : "dot-free"}`} />
            ))}
            <span className="chat-mobile-remaining">{remaining}/3</span>
          </div>
        </div>

        <div className="chat-topbar">
          <div className="chat-model-badge" style={{ borderColor: MODEL_INFO[model].color }}>
            <span style={{ color: MODEL_INFO[model].color }}>{MODEL_INFO[model].icon}</span>
            {MODEL_INFO[model].label}
          </div>
          <span className="chat-model-desc">{MODEL_INFO[model].desc}</span>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-welcome">
              <div className="welcome-icon" style={{ color: MODEL_INFO[model].color }}>
                {MODEL_INFO[model].icon}
              </div>
              <h3>Start a conversation with {MODEL_INFO[model].label}</h3>
              <p>
                Ask about anything — your passions, career questions, life advice, or what you're
                curious about. Your chats help find people like you.
              </p>
              <div className="starter-chips">
                {[
                  "What should I build as a side project?",
                  "Recommend books on philosophy",
                  "How do I find my passion in life?",
                  "Best ways to learn a new skill",
                ].map((s) => (
                  <button key={s} className="starter-chip" onClick={() => setInput(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              {msg.role === "ai" && msg.model && (
                <div className="message-model-tag" style={{ color: MODEL_INFO[msg.model].color }}>
                  {MODEL_INFO[msg.model].icon} {MODEL_INFO[msg.model].label}
                </div>
              )}
              <div className="message-bubble">{msg.text}</div>
            </div>
          ))}

          {loading && (
            <div className="message ai">
              <div className="message-model-tag" style={{ color: MODEL_INFO[model].color }}>
                {MODEL_INFO[model].icon} {MODEL_INFO[model].label}
              </div>
              <div className="message-bubble typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && <div className="chat-error">{error}</div>}

        <div className="chat-input-area">
          <textarea
            className="chat-input"
            placeholder={
              canSend
                ? `Ask ${MODEL_INFO[model].label} anything... (Enter to send)`
                : "No prompts remaining today"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!canSend}
            rows={2}
          />
          <button className="btn-send" onClick={() => void send()} disabled={!canSend || !input.trim()}>
            {loading ? "..." : "↑"}
          </button>
        </div>
      </div>
    </div>
  );
}
