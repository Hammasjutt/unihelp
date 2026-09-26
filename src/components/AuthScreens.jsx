// ============================================================
// COMPONENT: Password Setup Screen
// Change the invited/recovery user's password form here.
// ============================================================
export function PasswordSetupScreen({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  handleSetPassword,
  isSubmitting,
  message
}) {
  return (
    <div className="landing-shell">
      <main className="landing-main">
        <section className="hero glass-card" style={{ gridTemplateColumns: '1fr', maxWidth: 480, margin: '80px auto' }}>
          <div className="glass-card auth-card">
            <p className="eyebrow">Almost there</p>
            <h1 style={{ fontSize: '1.6rem' }}>Set your password</h1>
            <form onSubmit={handleSetPassword} className="auth-form">
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                minLength={6}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={6}
              />
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating password...' : 'Set password & continue'}
              </button>
            </form>
            {message ? <p className="message">{message}</p> : null}
          </div>
        </section>
      </main>
    </div>
  );
}

// ============================================================
// COMPONENT: Student Profile Setup Screen
// Change the student's first-time profile completion form here.
// ============================================================
export function StudentProfileSetupScreen({
  profileCompletionForm,
  setProfileCompletionForm,
  academicDepartments,
  batches,
  isSavingProfile,
  handleProfileCompletionSubmit,
  handleLogout,
  message
}) {
  return (
    <div className="landing-shell">
      <main className="landing-main">
        <section className="hero glass-card" style={{ gridTemplateColumns: '1fr', maxWidth: 480, margin: '80px auto' }}>
          <div className="glass-card auth-card">
            <p className="eyebrow">Almost there</p>
            <h1 style={{ fontSize: '1.6rem' }}>Complete your profile</h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.92rem', marginTop: '-8px' }}>
              Just a few details so staff know who you are and where you're from.
            </p>
            <form onSubmit={handleProfileCompletionSubmit} className="auth-form">
              <input
                placeholder="Full name"
                value={profileCompletionForm.name}
                onChange={(event) => setProfileCompletionForm({ ...profileCompletionForm, name: event.target.value })}
                required
              />
              <input
                placeholder="Roll number"
                value={profileCompletionForm.rollNumber}
                onChange={(event) => setProfileCompletionForm({ ...profileCompletionForm, rollNumber: event.target.value })}
                required
              />
              <select
                value={profileCompletionForm.academicDepartment}
                onChange={(event) => setProfileCompletionForm({ ...profileCompletionForm, academicDepartment: event.target.value })}
                required
              >
                <option value="">Select department</option>
                {academicDepartments.map((department) => (
                  <option key={department.id} value={department.name}>{department.name}</option>
                ))}
              </select>
              <select
                value={profileCompletionForm.batch}
                onChange={(event) => setProfileCompletionForm({ ...profileCompletionForm, batch: event.target.value })}
                required
              >
                <option value="">Select batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.name}>{batch.name}</option>
                ))}
              </select>
              <button type="submit" disabled={isSavingProfile}>
                {isSavingProfile ? 'Saving...' : 'Continue'}
              </button>
            </form>
            {academicDepartments.length === 0 || batches.length === 0 ? (
              <p className="hint-text">
                Your organization hasn't added department/batch options yet — ask your admin to add them in the Students panel.
              </p>
            ) : null}
            {message ? <p className="message">{message}</p> : null}
            <button className="ghost-btn small" type="button" onClick={handleLogout} style={{ marginTop: 12 }}>
              Logout
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
