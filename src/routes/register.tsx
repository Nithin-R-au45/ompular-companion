import ompularLogo from "@/assets/ompular-mark.png";
import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { reportAuthEvent } from "@/lib/auth-log";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Your Account — Ompular" },
      {
        name: "description",
        content: "Join Ompular free and get 3 AI prompts every day to find people like you.",
      },
      { property: "og:title", content: "Create Your Account — Ompular" },
      {
        property: "og:description",
        content: "Sign up free and start your AI-powered matchmaking journey.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register, resendVerification } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", age: "", bio: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { needsVerification } = await register(
        form.name,
        form.email,
        form.password,
        Number(form.age) || 0,
        form.bio,
      );
      reportAuthEvent("signup", "success", { email: form.email });
      if (needsVerification) {
        setRegistered(true);
      } else {
        void navigate({ to: "/dashboard" });
      }
    } catch (err) {
      reportAuthEvent("signup", "failure", { email: form.email, error: err });
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendState("sending");
    try {
      await resendVerification(form.email);
      setResendState("sent");
    } catch {
      setResendState("idle");
      setError("Couldn't resend the email right now — try again in a minute.");
    }
  };

  if (registered) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <Link to="/" className="auth-logo-wrap">
              <img src={ompularLogo} alt="Ompular" className="auth-logo-img" />
              <span className="auth-logo-name">ompular</span>
            </Link>
            <h1>Verify Your Email ✉️</h1>
            <p>
              We sent a verification link to <strong>{form.email}</strong>. Click it to activate
              your account, then sign in.
            </p>
          </div>

          {error && <div className="error-box">{error}</div>}

          <button
            className="btn-primary btn-full"
            onClick={handleResend}
            disabled={resendState !== "idle"}
          >
            {resendState === "sending"
              ? "Sending..."
              : resendState === "sent"
                ? "✓ Email resent — check your inbox"
                : "Resend verification email"}
          </button>

          <p className="auth-switch">
            Verified already? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo-wrap">
            <img src={ompularLogo} alt="Ompular" className="auth-logo-img" />
            <span className="auth-logo-name">ompular</span>
          </Link>
          <h1>Create Account</h1>
          <p>Join to start your AI-powered matchmaking journey</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Your name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Age (optional)</label>
              <input
                type="number"
                name="age"
                placeholder="25"
                value={form.age}
                onChange={handleChange}
                min="13"
                max="100"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Short Bio (optional)</label>
            <textarea
              name="bio"
              placeholder="Tell us a bit about yourself..."
              value={form.bio}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

        <div className="auth-info">
          <span>🎁 3 free AI prompts every day after signing up</span>
        </div>
      </div>
    </div>
  );
}
