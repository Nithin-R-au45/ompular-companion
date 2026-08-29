import ompularLogo from "@/assets/ompular-mark.png";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ompular — AI-Powered Matchmaking for Curious Minds" },
      {
        name: "description",
        content:
          "Chat with Kimi K3, Qwen 3.8x and DeepSeek v4 Pro at once and get matched with real people who share your curiosity. 3 free prompts a day, free match reveals — no pricing, ever.",
      },
      { property: "og:title", content: "Ompular — AI-Powered Matchmaking" },
      {
        property: "og:description",
        content:
          "Talk to AI, find your peers. Ompular matches you with people who share your interests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="landing">
      <section className="hero-section">
        <div className="hero-logo-wrap">
          <img src={ompularLogo} alt="Ompular Logo" className="hero-logo-img" />
        </div>

        <div className="hero-badge">✨ AI-Powered Matchmaking</div>

        <h1 className="hero-title">
          Find your
          <br />
          <span className="accent">Peers</span>
        </h1>
        <p className="hero-subtitle">
          Chat with google/gemini-3.1-pro-preview, google/gemini-3.7-flash and google/gemini-3.5-flash at once
          — and we match you with real people who share your curiosity, passions, and perspective.
        </p>
        <div className="hero-cta">
          <Link to="/register" className="btn-primary">
            Start for Free
          </Link>
          <Link to="/login" className="btn-outline">
            Sign In
          </Link>
        </div>
        <p className="hero-note">
          3 free AI prompts per day &nbsp;·&nbsp; Reveal matches free &nbsp;·&nbsp; No payments, ever
        </p>
      </section>

      <section className="how-section">
        <h2 className="section-title">How Ompular Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">01</div>
            <div className="step-icon">💬</div>
            <h3>Chat with AI</h3>
            <p>
              Use your 3 daily free prompts across google/gemini-3.1-pro-preview, google/gemini-3.7-flash and
              google/gemini-3.5-flash. Ask anything — career, philosophy, hobbies, dreams.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">02</div>
            <div className="step-icon">🔍</div>
            <h3>We Find Your Matches</h3>
            <p>
              Our algorithm analyses your AI conversations and matches you with people who asked
              similar things — same curiosity, same wavelength.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">03</div>
            <div className="step-icon">🔓</div>
            <h3>Reveal &amp; Connect</h3>
            <p>
              See a match you like? Reveal their name and email for free, then connect
              directly. No subscriptions, no payments — everything is free.
            </p>
          </div>
        </div>
      </section>

      <section className="models-section">
        <h2 className="section-title">Powered by the Best AI Models</h2>
        <div className="models-grid">
          <div className="model-card">
            <div className="model-logo kimi">✦</div>
            <h3>google/gemini-3.1-pro-preview</h3>
            <p>Deep, nuanced reasoning for the questions that need real thought.</p>
          </div>
          <div className="model-card">
            <div className="model-logo qwen">⬡</div>
            <h3>google/gemini-3.7-flash</h3>
            <p>Fast, versatile and analytical — great for everyday asks.</p>
          </div>
          <div className="model-card">
            <div className="model-logo deepseek">◈</div>
            <h3>google/gemini-3.5-flash</h3>
            <p>Creative, wide-ranging and quick — a sharp second opinion.</p>
          </div>
        </div>
        <p className="models-note">
          All 3 answer at once and share your daily limit of <strong>3 prompts total</strong> — the
          super selector helps you pick the best.
        </p>
      </section>

      <section className="pricing-section">
        <h2 className="section-title">100% Free</h2>
        <div className="pricing-grid">
          <div className="pricing-card featured">
            <div className="featured-badge">No Pricing</div>
            <h3>Everything Included</h3>
            <div className="price">₹0</div>
            <ul>
              <li>✓ 3 AI prompts per day</li>
              <li>✓ All 3 models answer at once</li>
              <li>✓ See your matches with compatibility %</li>
              <li>✓ Reveal names &amp; emails free</li>
              <li>✓ Unlimited DMs</li>
            </ul>
            <Link to="/register" className="btn-primary">
              Start Free
            </Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-logo">
          <img src={ompularLogo} alt="Ompular" className="footer-logo-img" />
          <span className="footer-brand">ompular</span>
        </div>
        <p>© 2026 Ompular. Built with ❤️ to connect curious minds.</p>
      </footer>
    </div>
  );
}
