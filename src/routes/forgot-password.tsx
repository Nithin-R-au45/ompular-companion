import ompularLogo from "@/assets/ompular-mark.png";
import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { reportAuthEvent } from "@/lib/auth-log";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Your Password — Ompular" },
      {
        name: "description",
        content: "Forgot your Ompular password? Send yourself a secure reset link by email.",
      },
      { property: "og:title", content: "Reset Your Password — Ompular" },
      { property: "og:description", content: "Send yourself a secure Ompular password reset link." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw new Error(resetError.message);
      reportAuthEvent("password_reset_request", "success", { email });
      setSent(true);
    } catch (err) {
      reportAuthEvent("password_reset_request", "failure", { email, error: err });
      setError(err instanceof Error ? err.message : "Could not send the reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo-wrap">
            <img src={ompularLogo} alt="Ompular" className="auth-logo-img" />
            <span className="auth-logo-name">ompular</span>
          </Link>
          <h1>Forgot Password</h1>
          <p>We'll email you a link to set a new one</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        {sent ? (
          <div className="auth-info">
            <span>📬 Check {email} for your reset link.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="auth-switch">
          Remembered it? <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
