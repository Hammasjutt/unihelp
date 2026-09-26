import { AnimatePresence, motion } from 'framer-motion';

// ============================================================
// COMPONENT: Landing Page Mobile Menu Icon
// ============================================================
function LandingMenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

// ============================================================
// COMPONENT: Authentication Modal
// Change login/register fields and modal text here.
// ============================================================
function AuthModal({
  isOpen,
  closeModal,
  authView,
  setAuthView,
  authForm,
  setAuthForm,
  handleAuth,
  recoveryEmail,
  setRecoveryEmail,
  handleForgotPassword,
  isAuthSubmitting,
  recoveryCooldown,
  message,
  clearAuthMessage
}) {
  const isRecoveryView = authView === 'forgot' || authView === 'recovery-sent';
  const switchView = (view) => {
    setAuthView(view);
    clearAuthMessage();
    if (view === 'forgot' && !recoveryEmail) setRecoveryEmail(authForm.email);
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="auth-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeModal}
        >
          <motion.div
            className="glass-card auth-card auth-modal"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="modal-close" onClick={closeModal} aria-label="Close">
              ×
            </button>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <img src="/logo.png" alt="UniHelp" className="brand-logo-img" style={{ height: '42px', width: 'auto' }} />
            </div>
            <p className="eyebrow">
              {authView === 'login' && 'Welcome back'}
              {authView === 'register' && 'Register a new institution'}
              {authView === 'forgot' && 'Password recovery'}
              {authView === 'recovery-sent' && 'Email sent'}
            </p>
            {!isRecoveryView ? (
              <div className="toggle-row">
                <button type="button" className={authView === 'login' ? 'toggle active' : 'toggle'} onClick={() => switchView('login')}>Login</button>
                <button type="button" className={authView === 'register' ? 'toggle active' : 'toggle'} onClick={() => switchView('register')}>Register</button>
              </div>
            ) : null}

            {authView === 'forgot' ? (
              <form onSubmit={handleForgotPassword} className="auth-form">
                <h2 className="auth-title">Forgot your password?</h2>
                <p className="hint-text">Enter the email used for your admin, staff, or student account. We will send you a secure password-reset link.</p>
                <input
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  value={recoveryEmail}
                  onChange={(event) => setRecoveryEmail(event.target.value)}
                  required
                  autoFocus
                />
                <button type="submit" disabled={isAuthSubmitting || recoveryCooldown > 0}>
                  {isAuthSubmitting
                    ? 'Sending link...'
                    : recoveryCooldown > 0
                      ? `Try again in ${recoveryCooldown}s`
                      : 'Send reset link'}
                </button>
                <button type="button" className="auth-text-button" onClick={() => switchView('login')}>Back to sign in</button>
              </form>
            ) : null}

            {authView === 'recovery-sent' ? (
              <div className="auth-form recovery-confirmation" role="status">
                <div className="recovery-email-icon" aria-hidden="true">✓</div>
                <h2 className="auth-title">Check your email</h2>
                <p className="hint-text">We sent a password-reset link to <strong>{recoveryEmail}</strong>.</p>
                <p className="hint-text">Open the email and click <strong>Reset password</strong> to choose your new password. You can close this window afterward.</p>
                <p className="hint-text">If it is not visible, check your spam folder before requesting another email.</p>
                <button type="button" onClick={handleForgotPassword} disabled={isAuthSubmitting || recoveryCooldown > 0}>
                  {isAuthSubmitting
                    ? 'Sending again...'
                    : recoveryCooldown > 0
                      ? `Resend in ${recoveryCooldown}s`
                      : 'Resend reset link'}
                </button>
                <div className="auth-secondary-actions">
                  <button type="button" className="auth-text-button" onClick={() => switchView('forgot')}>Change email</button>
                  <button type="button" className="auth-text-button" onClick={() => switchView('login')}>Back to sign in</button>
                </div>
              </div>
            ) : null}

            {!isRecoveryView ? <form onSubmit={handleAuth} className="auth-form">
              {authView === 'register' ? (
                <>
                  <input placeholder="Full name" value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} required />
                  <input placeholder="Institution name" value={authForm.institutionName} onChange={(event) => setAuthForm({ ...authForm, institutionName: event.target.value })} required />
                </>
              ) : null}
              <input type="email" placeholder="Email address" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} required />
              <input type="password" placeholder="Password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} required minLength={6} />
              {authView === 'login' ? (
                <button type="button" className="auth-text-button forgot-password-link" onClick={() => switchView('forgot')}>Forgot password?</button>
              ) : null}
              {authView === 'register' ? (
                <p className="hint-text">
                  This creates a brand-new organization and makes you its admin. Already part of one? Ask your admin for an invite instead — there's no self-serve way to join an existing organization.
                </p>
              ) : null}
              <button type="submit">{authView === 'login' ? 'Sign in' : 'Create account'}</button>
            </form> : null}

            {message ? <p className="message">{message}</p> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// ============================================================
// COMPONENT: Public Landing Page
// Change navbar, hero, features, workflow, FAQ, CTA, or footer here.
// ============================================================
export default function LandingPage({
  isLandingNavOpen,
  setIsLandingNavOpen,
  openAuth,
  openFaqIndex,
  setOpenFaqIndex,
  features,
  workflowSteps,
  faqs,
  capabilities,
  fadeUp,
  staggerContainer,
  isAuthModalOpen,
  setIsAuthModalOpen,
  authView,
  setAuthView,
  authForm,
  setAuthForm,
  handleAuth,
  recoveryEmail,
  setRecoveryEmail,
  handleForgotPassword,
  isAuthSubmitting,
  recoveryCooldown,
  message,
  clearAuthMessage
}) {
  return (
    <div className="landing-shell landing-page">
      {/* COMPONENT SECTION: Landing Navbar */}
      <header className="topbar">
        <a className="brand" href="#home" aria-label="UniHelp">
          <img src="/logo.png" alt="UniHelp" className="brand-logo-img" />
        </a>
        <nav className={`topnav ${isLandingNavOpen ? 'open' : ''}`}>
          <a href="#features" onClick={() => setIsLandingNavOpen(false)}>Features</a>
          <a href="#workflow" onClick={() => setIsLandingNavOpen(false)}>How it works</a>
          <a href="#faq" onClick={() => setIsLandingNavOpen(false)}>FAQ</a>
          <button type="button" className="landing-nav-sign-in-btn" onClick={() => openAuth('login')}>Sign in</button>
          <button type="button" className="landing-nav-get-started-btn" onClick={() => openAuth('register')}>Get started</button>
        </nav>
        <button className="landing-toggle" type="button" onClick={() => setIsLandingNavOpen((value) => !value)} aria-label="Toggle menu">
          <LandingMenuIcon />
        </button>
      </header>

      <main className="landing-main">
        {/* COMPONENT SECTION: Landing Hero */}
        <section className="hero hero-solo glass-card">
          <motion.div className="hero-copy" initial="hidden" animate="visible" variants={fadeUp}>
            <p className="eyebrow">Campus services • complaint portal • student support</p>
            <h1>
              <span>Modern complaint handling</span>
              <span>for universities that</span>
              <span className="landing-title-gradient">actually feels professional.</span>
            </h1>
            <p>
              UniHelp gives students, staff, and administrators one clean place to report issues, route requests with AI, and follow progress without the chaos of spreadsheets and email threads.
            </p>
            <div className="hero-actions">
              <button type="button" className="landing-hero-get-started-btn" onClick={() => openAuth('register')}>Get started free</button>
              <button type="button" className="landing-hero-sign-in-btn" onClick={() => openAuth('login')}>Sign in</button>
              <a className="landing-hero-explore-link" href="#features">Explore features</a>
            </div>
            <div className="metric-row">
              <div><strong>24/7</strong><span>visibility</span></div>
              <div><strong>AI</strong><span>triage</span></div>
              <div><strong>Secure</strong><span>records</span></div>
            </div>
          </motion.div>
        </section>

        {/* COMPONENT SECTION: Capability Bar */}
        <motion.div className="capability-bar" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
          {capabilities.map((item) => (
            <motion.div key={item.label} className="capability-item" variants={fadeUp}>
              <item.icon />
              <span>{item.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* COMPONENT SECTION: Features */}
        <div className="section-heading">
          <p className="eyebrow">Why UniHelp</p>
          <h2>Everything a campus support team needs, nothing it doesn't.</h2>
        </div>
        <motion.section id="features" className="feature-grid" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
          {features.map((feature) => (
            <motion.article key={feature.title} className="glass-card info-card" variants={fadeUp}>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </motion.article>
          ))}
        </motion.section>

        {/* COMPONENT SECTION: Workflow */}
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2>From report to resolution in three steps.</h2>
        </div>
        <motion.section id="workflow" className="workflow-grid" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
          {workflowSteps.map((item) => (
            <motion.article key={item.step} className="glass-card workflow-card" variants={fadeUp}>
              <span className="step-badge">{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </motion.article>
          ))}
        </motion.section>

        {/* COMPONENT SECTION: FAQ */}
        <div className="section-heading">
          <p className="eyebrow">Questions</p>
          <h2>Frequently asked questions</h2>
          <p>Everything you need to know before you get started.</p>
        </div>
        <section id="faq" className="faq-list">
          {faqs.map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div key={item.q} className={`faq-item glass-card ${isOpen ? 'open' : ''}`}>
                <button type="button" className="faq-question" onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}>
                  <span>{item.q}</span>
                  <span className="faq-icon">{isOpen ? '−' : '+'}</span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div className="faq-answer" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
                      <p>{item.a}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </section>

        {/* COMPONENT SECTION: Call To Action */}
        <motion.section className="cta-banner glass-card" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }}>
          <div>
            <p className="eyebrow">Ready when you are</p>
            <h2>Bring order to your campus complaint process today.</h2>
            <p>Create an account and see how quickly AI-assisted routing changes the way your team works.</p>
          </div>
          <div className="hero-actions">
            <button type="button" className="landing-cta-get-started-btn" onClick={() => openAuth('register')}>Get started free</button>
          </div>
        </motion.section>
      </main>

      {/* COMPONENT SECTION: Landing Footer */}
      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <a className="brand" href="#home" aria-label="UniHelp">
              <img src="/logo.png" alt="UniHelp" className="brand-logo-img" />
            </a>
            <p>A calmer way for students, staff, and administrators to report, route, and resolve campus issues.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#workflow">How it works</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="footer-col">
            <h4>Get started</h4>
            <button type="button" className="landing-footer-login-btn" onClick={() => openAuth('login')}>Login</button>
            <button type="button" className="landing-footer-create-account-btn" onClick={() => openAuth('register')}>Create account</button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} UniHelp. Built for campus support teams.</span>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        closeModal={() => setIsAuthModalOpen(false)}
        authView={authView}
        setAuthView={setAuthView}
        authForm={authForm}
        setAuthForm={setAuthForm}
        handleAuth={handleAuth}
        recoveryEmail={recoveryEmail}
        setRecoveryEmail={setRecoveryEmail}
        handleForgotPassword={handleForgotPassword}
        isAuthSubmitting={isAuthSubmitting}
        recoveryCooldown={recoveryCooldown}
        message={message}
        clearAuthMessage={clearAuthMessage}
      />
    </div>
  );
}
