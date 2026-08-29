import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import RequireAuth from "@/components/RequireAuth";
import { chooseAnswer, getPromptsStatus, sendPrompt } from "@/lib/ompular.functions";
import { AI_MODELS, MODEL_INFO, type AiModel, type TrioAnswer } from "@/lib/ompular-core";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat — Ompular" },
      {
        name: "description",
        content:
          "Ask once, get answers from Kimi K3, Qwen 3.8x and DeepSeek v4 Pro at the same time — then pick the best.",
      },
      { property: "og:title", content: "Triple AI Chat — Ompular" },
      {
        property: "og:description",
        content: "Three pro models answer simultaneously. You pick the winner.",
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

interface TrioTurn {
  role: "trio";
  promptId: string;
  answers: TrioAnswer[];
  chosen?: AiModel;
}

type ChatEntry = { role: "user"; text: string } | TrioTurn;

function ChatPage() {
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const statusFn = useServerFn(getPromptsStatus);
  const sendFn = useServerFn(sendPrompt);
  const chooseFn = useServerFn(chooseAnswer);
  const status = useQuery({ queryKey: ["prompts-status"], queryFn: () => statusFn({}) });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, loading]);

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
    setEntries((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await sendFn({ data: { promptText: text } });
      setEntries((prev) => [
        ...prev,
        { role: "trio", promptId: res.promptId, answers: res.answers },
      ]);
      await queryClient.invalidateQueries({ queryKey: ["prompts-status"] });
      await queryClient.invalidateQueries({ queryKey: ["prompts"] });
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setEntries((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const pick = async (promptId: string, model: AiModel) => {
    setEntries((prev) =>
      prev.map((e) => (e.role === "trio" && e.promptId === promptId ? { ...e, chosen: model } : e)),
    );
    try {
      await chooseFn({ data: { promptId, model } });
      await queryClient.invalidateQueries({ queryKey: ["prompts"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your pick.");
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
        <h2>The Trio</h2>
        <p className="sidebar-note">All 3 pro models answer every prompt at once</p>
        <div className="model-list">
          {AI_MODELS.map((m) => (
            <div key={m} className="model-option active" style={{ borderColor: MODEL_INFO[m].color }}>
              <span className="model-icon" style={{ color: MODEL_INFO[m].color }}>
                {MODEL_INFO[m].icon}
              </span>
              <div>
                <div className="model-name">{MODEL_INFO[m].label}</div>
                <div className="model-desc">{MODEL_INFO[m].desc}</div>
              </div>
            </div>
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
          <p className="counter-note">One run of all 3 models = 1 prompt</p>
        </div>

        <div className="match-tip">
          <span>💡</span>
          <p>Pick the best answer — the super selector learns what you like.</p>
        </div>
      </aside>

      <div className="chat-main">
        <div className="chat-mobile-bar">
          <div className="chat-mobile-models">
            {AI_MODELS.map((m) => (
              <div
                key={m}
                className="chat-mobile-model-btn active"
                style={{ borderColor: MODEL_INFO[m].color, color: MODEL_INFO[m].color }}
              >
                <span>{MODEL_INFO[m].icon}</span>
                <span className="chat-mobile-model-label">{MODEL_INFO[m].label}</span>
              </div>
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
          <div className="chat-model-badge" style={{ borderColor: "var(--accent, #3b82f6)" }}>
            <span>⚡</span> Super Selector
          </div>
          <span className="chat-model-desc">3 pro models answer simultaneously — you pick the best</span>
        </div>

        <div className="chat-messages">
          {entries.length === 0 && (
            <div className="chat-welcome">
              <div className="welcome-icon">⚡</div>
              <h3>Ask once, get three expert answers</h3>
              <p>
                Kimi K3, Qwen 3.8x and DeepSeek v4 Pro all respond at the same time. Compare them
                side by side and crown the winner.
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

          {entries.map((entry, i) =>
            entry.role === "user" ? (
              <div key={i} className="message user">
                <div className="message-bubble">{entry.text}</div>
              </div>
            ) : (
              <div key={i} className="trio-grid">
                {entry.answers.map((a) => {
                  const info = MODEL_INFO[a.model];
                  const isChosen = entry.chosen === a.model;
                  const dimmed = entry.chosen && !isChosen;
                  return (
                    <div
                      key={a.model}
                      className={`trio-card ${isChosen ? "trio-card-winner" : ""} ${dimmed ? "trio-card-dim" : ""}`}
                      style={isChosen ? { borderColor: info.color } : {}}
                    >
                      <div className="trio-card-head" style={{ color: info.color }}>
                        <span>
                          {info.icon} {info.label}
                        </span>
                        <span className="trio-ms">{(a.ms / 1000).toFixed(1)}s</span>
                      </div>
                      <div className="trio-card-body">
                        {a.error ? <span className="trio-err">{a.error}</span> : a.text}
                      </div>
                      {!entry.chosen && !a.error && (
                        <button
                          className="trio-pick"
                          style={{ borderColor: info.color, color: info.color }}
                          onClick={() => void pick(entry.promptId, a.model)}
                        >
                          Pick this answer
                        </button>
                      )}
                      {isChosen && <div className="trio-winner-tag">★ Your pick</div>}
                    </div>
                  );
                })}
              </div>
            ),
          )}

          {loading && (
            <div className="trio-grid">
              {AI_MODELS.map((m) => (
                <div key={m} className="trio-card">
                  <div className="trio-card-head" style={{ color: MODEL_INFO[m].color }}>
                    <span>
                      {MODEL_INFO[m].icon} {MODEL_INFO[m].label}
                    </span>
                  </div>
                  <div className="message-bubble typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              ))}
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
                ? "Ask all three models anything... (Enter to send)"
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
