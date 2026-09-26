import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// ============================================================
// COMPONENT: Animated Dashboard Counter
// ============================================================
function CountUp({ value }) {
  const numericValue = Number(value) || 0;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const duration = 650;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(numericValue * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [numericValue]);

  return display;
}

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

// ============================================================
// COMPONENT: Dashboard Panel Router
// This file contains Overview, Departments, Staff, Students,
// Complaints, and Profile panels. Search "COMPONENT:" to jump.
// ============================================================
export default function DashboardPanels({ panelContext }) {
  const {
    activePanel,
    isStudent,
    isAdmin,
    isStaff,
    heroCopy,
    goToPanel,
    stats,
    recentTickets,
    departmentForm,
    setDepartmentForm,
    editingDepartmentId,
    setEditingDepartmentId,
    handleDepartmentSubmit,
    departmentCards,
    setActivePanel,
    deleteDepartment,
    staffForm,
    setStaffForm,
    handleStaffSubmit,
    academicDepartments,
    batches,
    staffMembers,
    removeAccount,
    studentDeptFilter,
    setStudentDeptFilter,
    students,
    academicDeptForm,
    setAcademicDeptForm,
    editingAcademicDeptId,
    setEditingAcademicDeptId,
    handleAcademicDeptSubmit,
    resetAcademicDeptForm,
    deleteAcademicDept,
    batchForm,
    setBatchForm,
    editingBatchId,
    setEditingBatchId,
    handleBatchSubmit,
    resetBatchForm,
    deleteBatch,
    editingTicketId,
    resetForm,
    handleSubmit,
    form,
    setForm,
    isSubmittingTicket,
    message,
    tickets,
    deletedTickets = [],
    startEdit,
    deleteTicket,
    restoreTicket,
    permanentDeleteTicket,
    currentUser
  } = panelContext;

    // COMPONENT: Overview Panel
    // Change dashboard summary cards and recent complaints here.
    if (activePanel === 'overview' && !isStudent) {
      return (
        <div className="panel-grid">
          <section className="glass-card hero-panel">
            <p className="eyebrow">Welcome back</p>
            <h2>{heroCopy.heading}</h2>
            <p>{heroCopy.body}</p>
            <div className="hero-actions">
              <button className="primary-btn" type="button" onClick={() => goToPanel('complaints')}>{heroCopy.cta}</button>
            </div>
          </section>

          <section className="glass-card stats-panel">
            <div className="stats-grid">
              <div><strong><CountUp value={stats.total} /></strong><span>Total tickets</span></div>
              <div><strong><CountUp value={stats.highPriority} /></strong><span>High priority</span></div>
              <div><strong><CountUp value={stats.assigned} /></strong><span>Assigned</span></div>
            </div>
          </section>

          <section className="glass-card recent-panel">
            <div className="list-head">
              <h3>Recent complaints</h3>
              <span className="pill">Live</span>
            </div>
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="recent-item">
                <div>
                  <strong>{ticket.title}</strong>
                  <p>{ticket.department}</p>
                </div>
                <span className={`pill ${ticket.status.toLowerCase().replace(/\s+/g, '-')}`}>{ticket.status}</span>
              </div>
            ))}
          </section>
        </div>
      );
    }

    // COMPONENT: Departments Panel
    // Change department forms and department cards here.
    if (activePanel === 'departments' && isAdmin) {
      return (
        <section className="glass-card panel-card">
          <div className="list-head">
            <h3>Department coverage</h3>
            <span className="pill">Managed by admin</span>
          </div>
          <form onSubmit={handleDepartmentSubmit} className="complaint-form">
            <input placeholder="Department name" value={departmentForm.name} onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })} required />
            <input placeholder="Department head" value={departmentForm.head} onChange={(e) => setDepartmentForm({ ...departmentForm, head: e.target.value })} />
            <select value={departmentForm.status} onChange={(e) => setDepartmentForm({ ...departmentForm, status: e.target.value })}>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
            </select>
            <button type="submit">{editingDepartmentId ? 'Save department' : 'Add department'}</button>
          </form>
          <div className="department-grid">
            {departmentCards.map((dept) => (
              <div key={dept.id} className={`dept-card ${dept.tone || 'blue'}`}>
                <div className="list-head">
                  <h4>{dept.name}</h4>
                  <span className="pill">{dept.status || 'Active'}</span>
                </div>
                <p>Head: {dept.head || 'Pending'}</p>
                <div className="action-row">
                  <button className="ghost-btn small" type="button" onClick={() => { setEditingDepartmentId(dept.id); setDepartmentForm({ name: dept.name, head: dept.head || '', status: dept.status || 'Active' }); setActivePanel('departments'); }}>Edit</button>
                  <button className="ghost-btn small danger" type="button" onClick={() => deleteDepartment(dept.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    // COMPONENT: Staff Panel
    // Change staff/student invite form and staff list here.
    if (activePanel === 'staff' && isAdmin) {
      return (
        <section className="glass-card panel-card">
          <div className="list-head">
            <h3>Staff roster</h3>
            <span className="pill">Managed by admin</span>
          </div>
          <form onSubmit={handleStaffSubmit} className="complaint-form">
            <input placeholder="Full name" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} required />
            <input type="email" placeholder="Email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} required />
            <input
              type="text"
              placeholder="Temporary password"
              value={staffForm.temporary_password}
              onChange={(e) => setStaffForm({ ...staffForm, temporary_password: e.target.value })}
              required
              minLength={6}
            />
            <select
              value={staffForm.role}
              onChange={(e) => setStaffForm({
                ...staffForm,
                role: e.target.value,
                department: e.target.value === 'staff' ? staffForm.department : '',
                roll_number: e.target.value === 'student' ? staffForm.roll_number : '',
                academic_department: e.target.value === 'student' ? staffForm.academic_department : '',
                batch: e.target.value === 'student' ? staffForm.batch : ''
              })}
            >
              <option value="student">Student</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            {staffForm.role === 'staff' ? (
              <select value={staffForm.department} onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })} required>
                <option value="">Select department</option>
                {departmentCards.map((dept) => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            ) : null}
            {staffForm.role === 'student' ? (
              <>
                <input
                  placeholder="Roll number"
                  value={staffForm.roll_number}
                  onChange={(e) => setStaffForm({ ...staffForm, roll_number: e.target.value })}
                  required
                />
                <select
                  value={staffForm.academic_department}
                  onChange={(e) => setStaffForm({ ...staffForm, academic_department: e.target.value })}
                  required
                >
                  <option value="">Select student department</option>
                  {academicDepartments.map((dept) => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
                <select
                  value={staffForm.batch}
                  onChange={(e) => setStaffForm({ ...staffForm, batch: e.target.value })}
                  required
                >
                  <option value="">Select batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.name}>{batch.name}</option>
                  ))}
                </select>
              </>
            ) : null}
            {staffForm.role === 'staff' ? (
              <p className="hint-text">Staff only ever see and handle complaints filed under this department.</p>
            ) : null}
            {staffForm.role === 'student' ? (
              <p className="hint-text">Students receive a ready profile and can sign in with only email and password.</p>
            ) : null}
            <button type="submit">Send invite</button>
          </form>
          <div className="staff-list">
            {staffMembers.map((member) => (
              <div key={member.id} className="staff-item">
                <div>
                  <strong>{member.name}</strong>
                  <p>{member.role} • {member.department || 'No department'}</p>
                </div>
                <div className="action-row">
                  <span className="pill">{member.email}</span>
                  {member.role !== 'admin' ? (
                    <button className="ghost-btn small danger" type="button" onClick={() => removeAccount(member)}>Remove</button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    // COMPONENT: Students Panel
    // Change academic departments, batches, and student list here.
    if (activePanel === 'students' && isAdmin) {
      const filteredStudents = studentDeptFilter
        ? students.filter((student) => student.academic_department === studentDeptFilter)
        : students;
      return (
        <div className="panel-grid">
          <section className="glass-card panel-card">
            <div className="list-head">
              <h3>Academic departments</h3>
              <span className="pill">Managed by admin</span>
            </div>
            <form onSubmit={handleAcademicDeptSubmit} className="complaint-form">
              <input placeholder="e.g. Computer Science" value={academicDeptForm.name} onChange={(e) => setAcademicDeptForm({ name: e.target.value })} required />
              <button type="submit">{editingAcademicDeptId ? 'Save department' : 'Add department'}</button>
              {editingAcademicDeptId ? <button type="button" className="ghost-btn small" onClick={resetAcademicDeptForm}>Cancel</button> : null}
            </form>
            <div className="staff-list">
              {academicDepartments.map((dept) => (
                <div key={dept.id} className="staff-item">
                  <strong>{dept.name}</strong>
                  <div className="action-row">
                    <button className="ghost-btn small" type="button" onClick={() => { setEditingAcademicDeptId(dept.id); setAcademicDeptForm({ name: dept.name }); }}>Edit</button>
                    <button className="ghost-btn small danger" type="button" onClick={() => deleteAcademicDept(dept.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card panel-card">
            <div className="list-head">
              <h3>Batches</h3>
              <span className="pill">Managed by admin</span>
            </div>
            <form onSubmit={handleBatchSubmit} className="complaint-form">
              <input placeholder="e.g. 2024" value={batchForm.name} onChange={(e) => setBatchForm({ name: e.target.value })} required />
              <button type="submit">{editingBatchId ? 'Save batch' : 'Add batch'}</button>
              {editingBatchId ? <button type="button" className="ghost-btn small" onClick={resetBatchForm}>Cancel</button> : null}
            </form>
            <div className="staff-list">
              {batches.map((batch) => (
                <div key={batch.id} className="staff-item">
                  <strong>{batch.name}</strong>
                  <div className="action-row">
                    <button className="ghost-btn small" type="button" onClick={() => { setEditingBatchId(batch.id); setBatchForm({ name: batch.name }); }}>Edit</button>
                    <button className="ghost-btn small danger" type="button" onClick={() => deleteBatch(batch.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card panel-card" style={{ gridColumn: '1 / -1' }}>
            <div className="list-head">
              <h3>Students</h3>
              <select value={studentDeptFilter} onChange={(e) => setStudentDeptFilter(e.target.value)} style={{ width: 'auto' }}>
                <option value="">All departments</option>
                {academicDepartments.map((dept) => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
            {filteredStudents.length === 0 ? (
              <p className="empty-state">No students yet.</p>
            ) : (
              <div className="staff-list">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="staff-item">
                    <div>
                      <strong>{student.name}</strong>
                      <p>{student.roll_number || 'No roll number'} • {student.academic_department || 'No department'} • {student.batch || 'No batch'}</p>
                    </div>
                    <div className="action-row">
                      <span className="pill">{student.email}</span>
                      <button className="ghost-btn small danger" type="button" onClick={() => removeAccount(student)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      );
    }

    // COMPONENT: Complaints Panel
    // Change complaint form, queue, ticket cards, and ticket actions here.
    if (activePanel === 'complaints') {
      return (
        <div className="complaints-view">
          <div className="complaint-layout">
            {isStudent ? (
              <section className="glass-card form-card">
                <div className="list-head">
                  <h3>Create complaint</h3>
                </div>
                <form onSubmit={handleSubmit} className="complaint-form">
                  <textarea
                    placeholder="Describe the issue in detail"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={7}
                    required
                  />
                  <p className="hint-text">
                    Our AI assistant reads your description (and attachment) and routes it to the right department automatically.
                  </p>
                  <div className="upload-box upload-box-disabled" title="File evidence attachment feature is coming soon">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        📎 Upload evidence
                      </span>
                      <span className="pill-coming-soon">Coming Soon</span>
                    </div>
                    <p className="hint-text" style={{ margin: '2px 0 0', fontSize: '0.78rem', opacity: 0.8 }}>File attachments will be available in the upcoming update.</p>
                  </div>
                  <button type="submit" disabled={isSubmittingTicket}>
                    {isSubmittingTicket ? 'Analyzing complaint...' : 'Send complaint'}
                  </button>
                </form>
                {message ? <p className="message">{message}</p> : null}
              </section>
            ) : (
              <section className="glass-card form-card">
                {editingTicketId ? (
                  <>
                    <div className="list-head">
                      <h3>Assign & update status</h3>
                      <button className="ghost-btn small" type="button" onClick={resetForm}>Cancel</button>
                    </div>

                    <div className="ticket-preview-card">
                      <div className="ticket-preview-top">
                        <h4>{form.title || 'Complaint'}</h4>
                        <span className={`pill ${(form.status || 'new').toLowerCase().replace(/\s+/g, '-')}`}>{form.status || 'New'}</span>
                      </div>
                      <p className="ticket-preview-desc">{form.description}</p>
                      <div className="meta-row" style={{ marginTop: '4px' }}>
                        {form.studentName ? <span>Student: {form.studentName}</span> : null}
                        {form.studentId ? <span>ID: {form.studentId}</span> : null}
                        {form.department ? <span>Dept: {form.department}</span> : null}
                        {form.category ? <span>{form.category}</span> : null}
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="complaint-form">
                      <div>
                        <label className="field-label">Assign to staff</label>
                        <select value={form.assignedStaffId} onChange={(e) => setForm({ ...form, assignedStaffId: e.target.value })}>
                          <option value="">Unassigned</option>
                          {staffMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name} {member.department ? `(${member.department})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="field-label">Complaint status</label>
                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                          <option value="New">New</option>
                          <option value="Assigned">Assigned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Escalated">Escalated</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </div>

                      <button type="submit" disabled={isSubmittingTicket}>
                        Save changes
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <div className="list-head">
                      <h3>Complaint actions</h3>
                    </div>
                    <div className="empty-selection-box">
                      <p className="empty-title">No complaint selected</p>
                      <p className="empty-desc">
                        Click <strong>"Assign / Status"</strong> on any complaint in the queue to assign staff or update its status.
                      </p>
                      <p className="empty-note">
                        Complaint contents (title, description, and student info) cannot be modified.
                      </p>
                    </div>
                  </>
                )}
                {message ? <p className="message">{message}</p> : null}
              </section>
            )}

            <section className="glass-card list-card">
              <div className="list-head">
                <h3>{isStudent ? 'My requests' : isStaff ? 'My queue' : 'Queue'}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="pill">{tickets.length} items</span>
                  {isAdmin && deletedTickets.length > 0 ? (
                    <a
                      href="#deleted-complaints"
                      className="pill danger"
                      style={{ textDecoration: 'none', cursor: 'pointer' }}
                    >
                      {deletedTickets.length} in trash ↓
                    </a>
                  ) : null}
                </div>
              </div>
              {tickets.length === 0 ? (
                <p className="empty-state">No complaints yet. Your first report will appear here.</p>
              ) : (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                  {tickets.map((ticket) => (
                    <motion.article key={ticket.id} className="ticket-item" variants={fadeUp} whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
                      <div className="ticket-top">
                        <h4>{ticket.title}</h4>
                        <span className={`pill ${ticket.status.toLowerCase().replace(/\s+/g, '-')}`}>{ticket.status}</span>
                      </div>
                      <p>{ticket.description}</p>
                      <div className="meta-row">
                        <span>{ticket.student_name}</span>
                        <span>{ticket.department}</span>
                        <span>{ticket.assigned?.name || 'No staff'}</span>
                        <span>{ticket.priority || 'Medium'}</span>
                      </div>
                      {!isStudent ? (
                        <div className="action-row">
                          <button
                            className="ghost-btn small"
                            type="button"
                            onClick={() => startEdit(ticket)}
                          >
                            {editingTicketId === ticket.id ? 'Selected' : 'Assign / Status'}
                          </button>
                          {isAdmin ? (
                            <button className="ghost-btn small danger" type="button" onClick={() => deleteTicket(ticket.id)}>Delete</button>
                          ) : null}
                        </div>
                      ) : null}
                    </motion.article>
                  ))}
                </motion.div>
              )}
            </section>
          </div>

          {isAdmin ? (
            <section id="deleted-complaints" className="glass-card deleted-section">
              <div className="list-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0 }}>Deleted complaints</h3>
                  <span className="pill danger" style={{ fontSize: '0.74rem' }}>Trash</span>
                </div>
                <span className="pill">{deletedTickets.length} items</span>
              </div>

              {deletedTickets.length === 0 ? (
                <p className="empty-state" style={{ padding: '24px 12px' }}>
                  No deleted complaints. When you delete a complaint from the queue, it will move here.
                </p>
              ) : (
                <div className="deleted-tickets-list">
                  {deletedTickets.map((ticket) => (
                    <article key={ticket.id} className="ticket-item deleted-ticket-item">
                      <div className="ticket-top">
                        <h4 style={{ textDecoration: 'line-through', opacity: 0.85 }}>{ticket.title}</h4>
                        <span className="pill deleted">Deleted</span>
                      </div>
                      <p style={{ opacity: 0.85 }}>{ticket.description}</p>
                      <div className="meta-row">
                        <span>Student: {ticket.student_name}</span>
                        <span>Dept: {ticket.department}</span>
                        <span>{ticket.assigned?.name || 'No staff'}</span>
                        <span>{ticket.priority || 'Medium'}</span>
                      </div>
                      <div className="action-row">
                        <button
                          className="ghost-btn small"
                          type="button"
                          onClick={() => restoreTicket(ticket.id)}
                        >
                          Restore
                        </button>
                        <button
                          className="ghost-btn small danger"
                          type="button"
                          onClick={() => permanentDeleteTicket(ticket.id)}
                        >
                          Delete permanently
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </div>
      );
    }

    // COMPONENT: Deleted Complaints Panel
    // Dedicated panel for deleted complaints archive.
    if (activePanel === 'deleted-complaints' && isAdmin) {
      return (
        <section className="glass-card panel-card deleted-section">
          <div className="list-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ margin: 0 }}>Deleted complaints</h3>
              <span className="pill danger" style={{ fontSize: '0.74rem' }}>Trash</span>
            </div>
            <span className="pill">{deletedTickets.length} items</span>
          </div>

          {deletedTickets.length === 0 ? (
            <p className="empty-state" style={{ padding: '36px 12px' }}>
              No deleted complaints found. When complaints are deleted from the queue, they will appear here.
            </p>
          ) : (
            <div className="deleted-tickets-list">
              {deletedTickets.map((ticket) => (
                <article key={ticket.id} className="ticket-item deleted-ticket-item">
                  <div className="ticket-top">
                    <h4 style={{ textDecoration: 'line-through', opacity: 0.85 }}>{ticket.title}</h4>
                    <span className="pill deleted">Deleted</span>
                  </div>
                  <p style={{ opacity: 0.85 }}>{ticket.description}</p>
                  <div className="meta-row">
                    <span>Student: {ticket.student_name}</span>
                    <span>Dept: {ticket.department}</span>
                    <span>{ticket.assigned?.name || 'No staff'}</span>
                    <span>{ticket.priority || 'Medium'}</span>
                  </div>
                  <div className="action-row">
                    <button
                      className="ghost-btn small"
                      type="button"
                      onClick={() => restoreTicket(ticket.id)}
                    >
                      Restore
                    </button>
                    <button
                      className="ghost-btn small danger"
                      type="button"
                      onClick={() => permanentDeleteTicket(ticket.id)}
                    >
                      Delete permanently
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      );
    }

    // COMPONENT: Profile Panel
    // Change the user profile summary here.
    if (activePanel === 'profile') {
      return (
        <section className="glass-card panel-card profile-card">
          <div className="profile-header">
            <div>
              <p className="eyebrow">Profile</p>
              <h3>{currentUser.name}</h3>
              <p>{currentUser.email}</p>
            </div>
            <span className="role-badge">{currentUser.role}</span>
          </div>
          <div className="profile-details">
            <div>
              <strong>Department</strong>
              <p>{currentUser.department || 'Not set'}</p>
            </div>
            <div>
              <strong>Organization</strong>
              <p>{currentUser.organizationName || '—'}</p>
            </div>
            <div>
              <strong>Member since</strong>
              <p>{currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : '—'}</p>
            </div>
          </div>
        </section>
      );
    }

    return null;
}
