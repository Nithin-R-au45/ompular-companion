import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ompular — AI-Powered Matchmaking for Curious Minds" },
      {
        name: "description",
        content:
          "Chat with Claude Opus, GPT Pro or Gemini Pro and get matched with real people who share your curiosity. 3 free prompts a day, ₹9 per reveal.",
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
          <img src={ompularLogo.url} alt="Ompular Logo" className="hero-logo-img" />
        </div>

        <div className="hero-badge">✨ AI-Powered Matchmaking</div>

        <h1 className="hero-title">
          Find your
          <br />
          <span className="accent">Peers</span>
        </h1>
        <p className="hero-subtitle">
          Chat with Claude Opus, GPT Pro, or Gemini Pro — and we match you with real people who
          share your curiosity, passions, and perspective.
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
          3 free AI prompts per day &nbsp;·&nbsp; Reveal matches for just ₹9
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
              Use your 3 daily free prompts with Claude Opus, GPT Pro, or Gemini Pro. Ask anything —
              career, philosophy, hobbies, dreams.
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
              See a match you like? Pay just ₹9 to reveal their name and email, then connect
              directly. No subscriptions, pay only for who interests you.
            </p>
          </div>
        </div>
      </section>

      <section className="models-section">
        <h2 className="section-title">Powered by the Best AI Models</h2>
        <div className="models-grid">
          <div className="model-card">
            <div className="model-logo claude">✦</div>
            <h3>Claude Opus</h3>
            <p>Anthropic's most thoughtful model — deep, nuanced, reflective.</p>
          </div>
          <div className="model-card">
            <div className="model-logo gpt">⬡</div>
            <h3>GPT Pro</h3>
            <p>OpenAI's flagship — comprehensive, analytical, versatile.</p>
          </div>
          <div className="model-card">
            <div className="model-logo gemini">◈</div>
            <h3>Gemini Pro</h3>
            <p>Google's multimodal powerhouse — creative, wide-ranging, fast.</p>
          </div>
        </div>
        <p className="models-note">
          All 3 models share your daily limit of <strong>3 prompts total</strong> — choose wisely!
        </p>
      </section>

      <section className="pricing-section">
        <h2 className="section-title">Simple Pricing</h2>
        <div className="pricing-grid">
          <div className="pricing-card">
            <h3>Free</h3>
            <div className="price">₹0</div>
            <ul>
              <li>✓ 3 AI prompts per day</li>
              <li>✓ Choose any model</li>
              <li>✓ See your matches (blurred)</li>
              <li>✓ Compatibility % visible</li>
            </ul>
            <Link to="/register" className="btn-primary">
              Start Free
            </Link>
          </div>
          <div className="pricing-card featured">
            <div className="featured-badge">Per Reveal</div>
            <h3>Reveal a Match</h3>
            <div className="price">₹9</div>
            <ul>
              <li>✓ See their real name</li>
              <li>✓ Get their email</li>
              <li>✓ One-time per person</li>
              <li>✓ No subscription</li>
            </ul>
            <Link to="/register" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-logo">
          <img src={ompularLogo.url} alt="Ompular" className="footer-logo-img" />
          <span className="footer-brand">ompular</span>
        </div>
        <p>© 2026 Ompular. Built with ❤️ to connect curious minds.</p>
      </footer>
    </div>
  );
}
