import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import RequireAuth from "@/components/RequireAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { getMatches, revealMatch } from "@/lib/ompular.functions";

export const Route = createFileRoute("/matches")({
  head: () => ({
    meta: [
      { title: "Your Matches — Ompular" },
      {
        name: "description",
        content:
          "See the people who share your curiosity, discovered through your AI conversations.",
      },
      { property: "og:title", content: "Your Matches — Ompular" },
      { property: "og:description", content: "People who share your wavelength on Ompular." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <MatchesPage />
    </RequireAuth>
  ),
});

function getScoreColor(score: number) {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#3b82f6";
  return "#94a3b8";
}

function getScoreLabel(score: number) {
  if (score >= 70) return "High Compatibility";
  if (score >= 40) return "Good Compatibility";
  return "Partial Compatibility";
}

function MatchesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { unreadSenders, clearSender } = useNotifications();

  const matchesFn = useServerFn(getMatches);
  const revealFn = useServerFn(revealMatch);

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: () => matchesFn({}),
  });

  const [revealing, setRevealing] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleReveal = async (userId: string) => {
    setRevealing(userId);
    setError("");
    setSuccessMsg("");
    try {
      const res = await revealFn({ data: { matchedUserId: userId } });
      setSuccessMsg(res.message);
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reveal failed. Please try again.");
    } finally {
      setRevealing(null);
      setConfirmId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Finding your matches...</p>
      </div>
    );
  }

  return (
    <div className="matches-page">
      <div className="matches-header">
        <h1>
          Your <span className="accent">Matches</span>
        </h1>
        <p className="text-muted">
          People who share your curiosity, interests, and perspective — discovered through your AI
          conversations.
        </p>
      </div>

      {error && <div className="error-box">{error}</div>}
      {successMsg && <div className="success-box">{successMsg}</div>}

      {matches.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No matches yet</h3>
          <p>
            Send at least one AI prompt to let us understand your interests. The more you chat, the
            better your matches!
          </p>
          <Link to="/chat" className="btn-primary">
            Go to AI Chat →
          </Link>
        </div>
      )}

      {matches.length > 0 && (
        <>
          <div className="matches-stats">
            <span>{matches.length} people found</span>
            <span className="dot-sep">·</span>
            <span>{matches.filter((m) => m.revealed).length} revealed</span>
            <span className="dot-sep">·</span>
            <span>Reveals are free</span>
          </div>

          <div className="matches-grid">
            {matches.map((match) => (
              <div key={match.userId} className={`match-card ${match.revealed ? "revealed" : ""}`}>
                <div className="match-avatar">
                  {match.revealed ? match.name[0]?.toUpperCase() : "?"}
                </div>

                <div className="match-score-badge" style={{ background: getScoreColor(match.score) }}>
                  {match.score}% · {getScoreLabel(match.score)}
                </div>

                <div className="match-info">
                  {match.revealed ? (
                    <>
                      <h3 className="match-name accent">{match.name}</h3>
                      <p className="match-email">{match.email}</p>
                      <div className="match-revealed-badge">✓ Revealed</div>
                    </>
                  ) : (
                    <>
                      <h3 className="match-name blurred">████████</h3>
                      <p className="match-email blurred">████████@███.com</p>
                      <p className="match-hidden-note">
                        Reveal for free to see this person's name and email
                      </p>
                    </>
                  )}
                </div>

                <div className="compat-bar-label">
                  <span>Compatibility</span>
                  <span style={{ color: getScoreColor(match.score), fontWeight: 800 }}>
                    {match.score}%
                  </span>
                </div>
                <div className="score-bar-track">
                  <div
                    className="score-bar-fill"
                    style={{ width: `${match.score}%`, background: getScoreColor(match.score) }}
                  />
                </div>

                {!match.revealed &&
                  (confirmId === match.userId ? (
                    <div className="confirm-area">
                      <p>Reveal this match for free?</p>
                      <div className="confirm-buttons">
                        <button
                          className="btn-primary"
                          onClick={() => void handleReveal(match.userId)}
                          disabled={revealing === match.userId}
                        >
                          {revealing === match.userId ? "Revealing..." : "Yes, Reveal"}
                        </button>
                        <button className="btn-outline" onClick={() => setConfirmId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn-reveal" onClick={() => setConfirmId(match.userId)}>
                      🔓 Reveal for Free
                    </button>
                  ))}

                {match.revealed && (
                  <button
                    className="btn-chat"
                    onClick={() => {
                      clearSender(match.userId);
                      void navigate({ to: "/dm/$userId", params: { userId: match.userId } });
                    }}
                  >
                    💬 Send DM
                    {unreadSenders.has(match.userId) && <span className="btn-chat-unread">New!</span>}
                  </button>
                )}

                {!match.revealed && unreadSenders.has(match.userId) && (
                  <div className="match-msg-alert">
                    💬 This person has sent you a message — reveal to read!
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="matches-tip">
        <h3>💡 Get better matches</h3>
        <p>
          Use all 3 of your daily AI prompts to give us more data about your interests. The more
          specific your questions, the more accurate your matches.
        </p>
        <Link to="/chat" className="btn-outline">
          Use More Prompts →
        </Link>
      </div>
    </div>
  );
}
