import { AnimatePresence, motion } from 'framer-motion';

// ============================================================
// COMPONENT: Dashboard Mobile Menu Icon
// ============================================================
function DashboardMenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

// ============================================================
// COMPONENT: Dashboard Sidebar
// Change dashboard navigation, branding, and logout UI here.
// ============================================================
function DashboardSidebar({
  currentUser,
  portalLabel,
  navItems,
  activePanel,
  isNavOpen,
  goToPanel,
  handleLogout
}) {
  return (
    <aside className={`sidebar glass-card${isNavOpen ? ' open' : ''}`}>
      <div className="sidebar-brand">
        <a className="brand" href="#home" aria-label="UniHelp">
          <img src="/logo.png" alt="UniHelp" className="brand-logo-img" />
        </a>
        <h2>{portalLabel}</h2>
        <p className="org-name">{currentUser.organizationName || 'No organization'}</p>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button key={item.id} className={activePanel === item.id ? 'sidebar-link active' : 'sidebar-link'} type="button" onClick={() => goToPanel(item.id)}>
            {activePanel === item.id ? (
              <motion.span className="nav-pill" layoutId="navPill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
            ) : null}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <item.icon />
              {item.label}
            </span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <p>{currentUser.name}</p>
        <span className="role-badge">{currentUser.role}</span>
        <button className="ghost-btn small" type="button" onClick={handleLogout}>Logout</button>
      </div>
    </aside>
  );
}

// ============================================================
// COMPONENT: Dashboard Top Bar
// Change panel title and realtime status UI here.
// ============================================================
function DashboardTopBar({
  currentUser,
  portalLabel,
  panelTitle,
  realtimeClass,
  realtimeLabel,
  openMobileNav
}) {
  return (
    <header className="admin-topbar glass-card">
      <div className="topbar-heading">
        <button className="mobile-nav-toggle" type="button" onClick={openMobileNav} aria-label="Open menu">
          <DashboardMenuIcon />
        </button>
        <div>
          <p className="eyebrow">{portalLabel} · {currentUser.organizationName || 'No organization'}</p>
          <h1>{panelTitle}</h1>
        </div>
      </div>
      <div className={realtimeClass}>{realtimeLabel}</div>
    </header>
  );
}

// ============================================================
// COMPONENT: Dashboard Shell
// This combines the sidebar, top bar, and active panel content.
// ============================================================
export default function DashboardShell({
  currentUser,
  portalLabel,
  navItems,
  activePanel,
  isNavOpen,
  setIsNavOpen,
  goToPanel,
  handleLogout,
  panelTitle,
  realtimeClass,
  realtimeLabel,
  children
}) {
  return (
    <div className="app-shell" data-role={currentUser.role}>
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className={`nav-backdrop ${isNavOpen ? 'open' : ''}`} onClick={() => setIsNavOpen(false)} />
      <div className="admin-shell">
        <DashboardSidebar
          currentUser={currentUser}
          portalLabel={portalLabel}
          navItems={navItems}
          activePanel={activePanel}
          isNavOpen={isNavOpen}
          goToPanel={goToPanel}
          handleLogout={handleLogout}
        />

        <main className="admin-main">
          <DashboardTopBar
            currentUser={currentUser}
            portalLabel={portalLabel}
            panelTitle={panelTitle}
            realtimeClass={realtimeClass}
            realtimeLabel={realtimeLabel}
            openMobileNav={() => setIsNavOpen(true)}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={activePanel}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
