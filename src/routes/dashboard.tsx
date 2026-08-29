import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { getMatches, getPromptsStatus, listPrompts } from "@/lib/ompular.functions";
import { MODEL_INFO, type AiModel } from "@/lib/ompular-core";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Ompular" },
      {
        name: "description",
        content: "Track your daily AI prompts, matches and reveals on Ompular.",
      },
      { property: "og:title", content: "Dashboard — Ompular" },
      { property: "og:description", content: "Your Ompular matchmaking dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  ),
});

function DashboardPage() {
  const { user } = useAuth();
  const statusFn = useServerFn(getPromptsStatus);
  const promptsFn = useServerFn(listPrompts);
  const matchesFn = useServerFn(getMatches);

  const status = useQuery({ queryKey: ["prompts-status"], queryFn: () => statusFn({}) });
  const prompts = useQuery({ queryKey: ["prompts"], queryFn: () => promptsFn({}) });
  const matches = useQuery({ queryKey: ["matches"], queryFn: () => matchesFn({}) });

  const loading = status.isLoading || prompts.isLoading || matches.isLoading;
  const recent = (prompts.data ?? []).slice(0, 3);
  const matchCount = matches.data?.length ?? 0;

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>
            Welcome back, <span className="accent">{user?.name}</span> 👋
          </h1>
          <p className="text-muted">Here's what's happening on your Ompular journey</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-body">
            <div className="stat-value accent">{status.data?.remaining ?? 0}</div>
            <div className="stat-label">Prompts remaining today</div>
            <div className="stat-sub">
              {status.data?.used ?? 0} / {status.data?.limit ?? 3} used
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔍</div>
          <div className="stat-body">
            <div className="stat-value accent">{matchCount}</div>
            <div className="stat-label">People like you</div>
            <div className="stat-sub">Based on your AI chats</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💡</div>
          <div className="stat-body">
            <div className="stat-value accent">₹9</div>
            <div className="stat-label">To reveal a match</div>
            <div className="stat-sub">One-time per person</div>
          </div>
        </div>
      </div>

      <div className="prompt-bar-card">
        <div className="prompt-bar-header">
          <span>Daily AI Prompts</span>
          <span className="badge">{status.data?.remaining ?? 0} left</span>
        </div>
        <div className="prompt-bar-track">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`prompt-dot ${i < (status.data?.used ?? 0) ? "used" : "free"}`}
            />
          ))}
        </div>
        <p className="prompt-bar-note">
          Prompts reset at midnight. Each prompt helps find better matches.
        </p>
        {(status.data?.remaining ?? 0) > 0 ? (
          <Link to="/chat" className="btn-primary">
            Use a Prompt →
          </Link>
        ) : (
          <button className="btn-primary" disabled>
            No prompts left today
          </button>
        )}
      </div>

      <div className="quick-actions">
        <Link to="/chat" className="action-card">
          <div className="action-icon">🤖</div>
          <div>
            <h3>AI Chat</h3>
            <p>Talk to Kimi K3, Qwen and DeepSeek at once</p>
          </div>
          <span className="action-arrow">→</span>
        </Link>
        <Link to="/matches" className="action-card">
          <div className="action-icon">❤️</div>
          <div>
            <h3>See Matches</h3>
            <p>{matchCount} people found so far</p>
          </div>
          <span className="action-arrow">→</span>
        </Link>
      </div>

      {recent.length > 0 && (
        <div className="recent-section">
          <h2>Recent Conversations</h2>
          <div className="recent-list">
            {recent.map((p) => (
              <div key={p.id} className="recent-card">
                <div
                  className="recent-model"
                  style={{ color: MODEL_INFO[p.model as AiModel]?.color }}
                >
                  {MODEL_INFO[p.model as AiModel]?.label ?? p.model}
                </div>
                <p className="recent-prompt">"{p.promptText}"</p>
                <p className="recent-response">{p.responseText?.slice(0, 120)}...</p>
                <span className="recent-time">
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recent.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🚀</div>
          <h3>No prompts yet</h3>
          <p>Start a conversation with an AI model to find your matches.</p>
          <Link to="/chat" className="btn-primary">
            Try your first prompt
          </Link>
        </div>
      )}
    </div>
  );
}
