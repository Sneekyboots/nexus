import React from "react";
import "../styles/LandingPage.css";

interface LandingPageProps {
  onConnect: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onConnect }) => {
  return (
    <div className="landing-page">
      {/* Dotted background grid */}
      <div className="grid-background"></div>

      {/* Header */}
      <header className="landing-header">
        <div className="logo-section">
          <div className="logo-box">
            <span className="logo-text">NEXUS</span>
          </div>
          <span className="logo-label">Cross-Border Treasury</span>
        </div>
        <button className="connect-button" onClick={onConnect}>
          <span className="button-text">CONNECT WALLET</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="landing-main">
        {/* Annotation */}
        <div className="annotation">
          <div className="annotation-arrow"></div>
          <span className="annotation-text">New Protocol!</span>
        </div>

        {/* Hero Section */}
        <div className="hero-section">
          <div className="tagline-box">
            <span className="tagline-icon">🌍</span>
            <span className="tagline">Instant Multi-Currency Settlement</span>
          </div>

          <h1 className="hero-title">
            Borderless <span className="highlight">Treasury</span>
          </h1>

          <p className="hero-subtitle">
            Connect your wallet. Create bank subsidiaries. Settle across borders
            in minutes, not days.
          </p>

          {/* CTA Section */}
          <div className="cta-section">
            <button className="cta-button primary" onClick={onConnect}>
              ▶ Get Started
            </button>
            <button className="cta-button secondary">📖 Learn More</button>
          </div>
        </div>

        {/* Features Grid */}
        <section className="features-section">
          <h2 className="section-title">Why NEXUS?</h2>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3 className="feature-title">Instant Netting</h3>
              <p className="feature-desc">
                7-step algorithm settles multi-currency positions in minutes
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3 className="feature-title">Built-in Compliance</h3>
              <p className="feature-desc">
                6 mandatory gates: KYC, KYT, AML, Travel Rule, Daily Limits
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3 className="feature-title">Multi-Currency</h3>
              <p className="feature-desc">
                Support for USD, EUR, GBP, SGD, AED with real SIX rates
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">60% Cost Savings</h3>
              <p className="feature-desc">
                0.02% fees vs 0.05% traditional banking
              </p>
            </div>
          </div>
        </section>

        {/* Real-World Example */}
        <section className="example-section">
          <h2 className="section-title">See It In Action</h2>

          <div className="example-flow">
            <div className="flow-item">
              <div className="flow-number">1</div>
              <h3>AMINA Singapore</h3>
              <p className="flow-amount">+$2.5M SGD</p>
              <span className="flow-label surplus">SURPLUS</span>
            </div>

            <div className="flow-arrow">→</div>

            <div className="flow-item">
              <div className="flow-number">2</div>
              <h3>Run Netting</h3>
              <p className="flow-amount">7-Step Algorithm</p>
              <span className="flow-label processing">PROCESSING</span>
            </div>

            <div className="flow-arrow">→</div>

            <div className="flow-item">
              <div className="flow-number">3</div>
              <h3>AMINA Dubai</h3>
              <p className="flow-amount">-$1.2M AED</p>
              <span className="flow-label deficit">DEFICIT</span>
            </div>
          </div>

          <div className="result-box">
            <p className="result-text">
              Result: <strong>$2.06M settled in 5 minutes</strong> ✓ All 6
              compliance gates passed
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="stats-section">
          <div className="stat-card">
            <div className="stat-number">5</div>
            <div className="stat-label">Solana Programs</div>
            <div className="stat-sublabel">Live on Devnet</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">58</div>
            <div className="stat-label">Tests Passing</div>
            <div className="stat-sublabel">100% Coverage</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">6</div>
            <div className="stat-label">Compliance Gates</div>
            <div className="stat-sublabel">Production Ready</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">4</div>
            <div className="stat-label">Currencies</div>
            <div className="stat-sublabel">Multi-Currency Support</div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <p>
          Built for <strong>StableHacks 2026</strong> • Powered by{" "}
          <strong>AMINA Bank</strong>
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
