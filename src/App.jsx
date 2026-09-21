import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import LandingPage from './components/LandingPage';
import DashboardShell from './components/DashboardShell';
import DashboardPanels from './components/DashboardPanels';
import { PasswordSetupScreen, StudentProfileSetupScreen } from './components/AuthScreens';

// ============================================================
// COMPONENT FILE GUIDE
// Landing page + login modal:  components/LandingPage.jsx
// Password/profile setup:       components/AuthScreens.jsx
// Dashboard layout/navigation:  components/DashboardShell.jsx
// All dashboard panels:         components/DashboardPanels.jsx
// App state/API handlers:       this file (App.jsx)
// Search "COMPONENT:" in any file to jump to a UI section.
// ============================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const emptyForm = {
  studentName: '',
  studentId: '',
  title: '',
  description: '',
  category: 'General',
  department: 'Student Services',
  assignedStaffId: '',
  status: 'New'
};

const features = [
  { title: 'Fast intake', text: 'Students can report issues in minutes with clear forms and file uploads.' },
  { title: 'AI-powered routing', text: 'Every complaint is read by an AI assistant that picks the right department automatically.' },
  { title: 'Role-based access', text: 'Admins see the full queue, staff see their assignments, students see their own requests.' }
];

const workflowSteps = [
  { step: '1', title: 'Submit', text: 'A concern is filed with details, category, and supporting evidence.' },
  { step: '2', title: 'Route', text: 'AI reads the report and assigns the right department in seconds.' },
  { step: '3', title: 'Resolve', text: 'Progress updates keep students informed until the issue is closed.' }
];

const faqs = [
  {
    q: 'How does the AI routing work?',
    a: 'When a complaint is submitted, our AI assistant reads the description and any attached evidence, then automatically assigns it to the right department and priority level — no manual triage needed.'
  },
  {
    q: 'What is different between student, staff, and admin accounts?',
    a: 'Students get a simplified portal to submit and track their own requests. Staff see a working queue of complaints assigned to them. Admins get full visibility across departments, staff, and every complaint in the system.'
  },
  {
    q: 'Can I attach evidence to a complaint?',
    a: 'Evidence attachment (photo & document uploads) is currently under development and coming soon! For now, you can include all relevant details directly in the complaint description.'
  },
  {
    q: 'Do I need to pick a department myself?',
    a: 'No. Just describe the issue — the AI assistant figures out which department it belongs to and sets the priority automatically.'
  },
  {
    q: 'How do I join my organization?',
    a: 'Your admin sends you an invite by email — that’s the only way to join an existing organization, whether you’re a student or staff. If your institution isn’t on UniHelp yet, register with its name to create it and become its admin.'
  }
];

const NavIcon = {
  grid: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    </svg>
  ),
  building: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21V6.5A1.5 1.5 0 0 1 5.5 5h5A1.5 1.5 0 0 1 12 6.5V21" />
      <path d="M12 10.5h5.5A1.5 1.5 0 0 1 19 12v9" />
      <path d="M2.5 21h19" />
      <path d="M7 8.5h1M7 12h1M7 15.5h1" />
    </svg>
  ),
  users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8.2" r="3.2" />
      <path d="M2.8 20c0-3.5 2.8-5.8 6.2-5.8s6.2 2.3 6.2 5.8" />
      <circle cx="17.2" cy="8.4" r="2.5" />
      <path d="M15.6 14.4c2.8.4 4.7 2.5 4.7 5.6" />
    </svg>
  ),
  ticket: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5a1.8 1.8 0 0 1 1.8-1.8h14.4A1.8 1.8 0 0 1 21 9.5v1.3a1.7 1.7 0 0 0 0 3.4v1.3a1.8 1.8 0 0 1-1.8 1.8H4.8A1.8 1.8 0 0 1 3 15.5v-1.3a1.7 1.7 0 0 0 0-3.4z" />
      <path d="M9.5 8v9" strokeDasharray="2.4 2.4" />
    </svg>
  ),
  user: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M4.6 20c0-4 3.3-6.8 7.4-6.8s7.4 2.8 7.4 6.8" />
    </svg>
  ),
  sparkle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
    </svg>
  ),
  shield: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v5.5c0 4.6-3 8.2-7 9.5-4-1.3-7-4.9-7-9.5V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  sync: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 11a8 8 0 0 0-14.9-3.6M4 13a8 8 0 0 0 14.9 3.6" />
      <path d="M4.5 4.5v4h4M19.5 19.5v-4h-4" />
    </svg>
  ),
  idCard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="12" r="2" />
      <path d="M14 10h5M14 14h3" />
    </svg>
  )
};

const capabilities = [
  { icon: NavIcon.sparkle, label: 'AI-powered routing' },
  { icon: NavIcon.grid, label: 'Role-based dashboards' },
  { icon: NavIcon.sync, label: 'Real-time updates' },
  { icon: NavIcon.shield, label: 'Evidence uploads (Coming Soon)' }
];
const NAV_BY_ROLE = {
  admin: [
    { id: 'overview', label: 'Overview', icon: NavIcon.grid },
    { id: 'departments', label: 'Departments', icon: NavIcon.building },
    { id: 'staff', label: 'Staff', icon: NavIcon.users },
    { id: 'students', label: 'Students', icon: NavIcon.idCard },
    { id: 'complaints', label: 'Complaints', icon: NavIcon.ticket },
    { id: 'profile', label: 'Profile', icon: NavIcon.user }
  ],
  staff: [
    { id: 'overview', label: 'Overview', icon: NavIcon.grid },
    { id: 'complaints', label: 'My queue', icon: NavIcon.ticket },
    { id: 'profile', label: 'Profile', icon: NavIcon.user }
  ],
  student: [
    { id: 'complaints', label: 'My requests', icon: NavIcon.ticket },
    { id: 'profile', label: 'Profile', icon: NavIcon.user }
  ]
};

const ROLE_LABELS = { admin: 'Admin Hub', staff: 'Staff Console', student: 'My Portal' };

const HERO_COPY = {
  admin: {
    heading: 'Keep campus issues moving with one calm command center.',
    body: 'Review incoming reports, assign teams, and monitor departments from a single polished dashboard.',
    cta: 'Open complaints'
  },
  staff: {
    heading: 'Here is what needs your attention today.',
    body: 'Stay on top of the requests assigned to you and keep students in the loop as you work them.',
    cta: 'Open my queue'
  },
  student: {
    heading: 'Track every request you have filed, in one place.',
    body: 'See status updates the moment staff pick up your complaint.',
    cta: 'View my requests'
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

function getPanelTitle(panel, role) {
  if (panel === 'overview') return 'Operations overview';
  if (panel === 'departments') return 'Departments';
  if (panel === 'staff') return 'Staff roster';
  if (panel === 'students') return 'Students';
  if (panel === 'complaints') {
    if (role === 'student') return 'My requests';
    if (role === 'staff') return 'My queue';
    return 'Complaint queue';
  }
  if (panel === 'profile') return 'Profile settings';
  return '';
}

// ============================================================
// COMPONENT: App Controller
// Owns authentication, shared state, API calls, and routing.
// UI markup lives in the component files listed above.
// ============================================================
function App() {
  const [tickets, setTickets] = useState([]);
  const [authView, setAuthView] = useState('login');
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', institutionName: '' });
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [editingTicketId, setEditingTicketId] = useState(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [activePanel, setActivePanel] = useState('overview');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [staffMembers, setStaffMembers] = useState([]);
  const [departmentCards, setDepartmentCards] = useState([]);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    role: 'staff',
    department: '',
    roll_number: '',
    academic_department: '',
    batch: '',
    temporary_password: 'TempPass123!'
  });
  const [departmentForm, setDepartmentForm] = useState({ name: '', head: '', status: 'Active' });
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);
  const [academicDepartments, setAcademicDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentDeptFilter, setStudentDeptFilter] = useState('');
  const [academicDeptForm, setAcademicDeptForm] = useState({ name: '' });
  const [editingAcademicDeptId, setEditingAcademicDeptId] = useState(null);
  const [batchForm, setBatchForm] = useState({ name: '' });
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [profileCompletionForm, setProfileCompletionForm] = useState({ name: '', rollNumber: '', academicDepartment: '', batch: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [isLandingNavOpen, setIsLandingNavOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // LOGIC: Load the signed-in user's profile.
  const hydrateUser = async (authUser) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, organization:organizations(name)')
      .eq('id', authUser.id)
      .single();
    if (error || !profile) {
      setCurrentUser(null);
      return;
    }
    setCurrentUser({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      department: profile.department,
      rollNumber: profile.roll_number,
      academicDepartment: profile.academic_department,
      batch: profile.batch,
      organizationId: profile.organization_id,
      organizationName: profile.organization?.name,
      createdAt: profile.created_at
    });
  };

  // LOGIC: Load tickets, staff, departments, batches, and students.
  const loadDashboardData = async () => {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();

    const loadTicketsFromApi = async () => {
      if (!session) return { data: [], error: 'No active session found.' };
      try {
        const response = await fetch(`${API_URL}/tickets`, { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (response.ok) return { data: await response.json(), error: null };
        const err = await response.json().catch(() => ({}));
        return { data: [], error: err.detail || `Tickets API returned ${response.status}` };
      } catch {
        return { data: [], error: 'Tickets API is not reachable. Start the backend on port 8001.' };
      }
    };

    const loadTicketsFromSupabase = async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, assigned:profiles!assigned_staff_id(id,name)')
        .order('created_at', { ascending: false });
      return { data: data || [], error: error?.message || null };
    };

    const [ticketsRes, staffRes, deptRes, academicDeptRes, batchRes, studentsRes] = await Promise.all([
      loadTicketsFromApi(),
      supabase.from('profiles').select('*').in('role', ['staff', 'admin']).order('name'),
      supabase.from('departments').select('*').order('name'),
      supabase.from('academic_departments').select('*').order('name'),
      supabase.from('batches').select('*').order('name'),
      supabase.from('profiles').select('*').eq('role', 'student').order('name')
    ]);

    let resolvedTicketsRes = ticketsRes;
    if (ticketsRes.error || (ticketsRes.data || []).length === 0) {
      const fallbackTicketsRes = await loadTicketsFromSupabase();
      if (!fallbackTicketsRes.error && fallbackTicketsRes.data.length > 0) {
        resolvedTicketsRes = fallbackTicketsRes;
      } else if (ticketsRes.error && !fallbackTicketsRes.error) {
        resolvedTicketsRes = fallbackTicketsRes;
      }
    }

    if (!resolvedTicketsRes.error) {
      setTickets(resolvedTicketsRes.data || []);
    } else {
      setMessage(`Could not load complaints: ${resolvedTicketsRes.error}`);
    }
    if (!staffRes.error) setStaffMembers(staffRes.data || []);
    if (!deptRes.error) setDepartmentCards(deptRes.data || []);
    if (!academicDeptRes.error) setAcademicDepartments(academicDeptRes.data || []);
    if (!batchRes.error) setBatches(batchRes.data || []);
    if (!studentsRes.error) setStudents(studentsRes.data || []);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && /type=invite|type=recovery/.test(window.location.hash)) {
      setNeedsPasswordSetup(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsAuthModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAuthModalOpen]);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    let active = true;

    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await hydrateUser(session.user);
      if (active) setAuthLoading(false);
    };
    bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await hydrateUser(session.user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    const interval = window.setInterval(loadDashboardData, 10000);
    return () => window.clearInterval(interval);
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    const nav = NAV_BY_ROLE[currentUser.role] || NAV_BY_ROLE.student;
    setActivePanel(nav[0].id);
  }, [currentUser?.id]);

  useEffect(() => {
    if (!supabase || !currentUser?.organizationId) return;
    const orgFilter = `organization_id=eq.${currentUser.organizationId}`;
    const channel = supabase
      .channel('unihelp-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: orgFilter }, () => {
        loadDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: orgFilter }, () => {
        loadDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departments', filter: orgFilter }, () => {
        loadDashboardData();
      })
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.organizationId]);

  const isAdmin = currentUser?.role === 'admin';
  const isStaff = currentUser?.role === 'staff';
  const isStudent = !isAdmin && !isStaff;
  const needsStudentProfile = false;

  useEffect(() => {
    if (needsStudentProfile) {
      setProfileCompletionForm((prev) => ({ ...prev, name: prev.name || currentUser.name || '' }));
    }
  }, [needsStudentProfile, currentUser?.id]);

  const stats = useMemo(() => ({
    total: tickets.length,
    highPriority: tickets.filter((ticket) => ticket.priority === 'High').length,
    assigned: tickets.filter((ticket) => ticket.status === 'Assigned' || ticket.status === 'In Progress').length
  }), [tickets]);

  const recentTickets = useMemo(() => tickets.slice(0, 5), [tickets]);

  // LOGIC: Login and institution registration.
  const handleAuth = async (event) => {
    event.preventDefault();
    if (!supabase) {
      setMessage('Supabase is not configured for this app.');
      return;
    }

    if (authView === 'register') {
      const { data, error } = await supabase.auth.signUp({
        email: authForm.email,
        password: authForm.password,
        options: { data: { name: authForm.name, institution_name: authForm.institutionName } }
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setAuthForm({ name: '', email: '', password: '', institutionName: '' });
      if (data.session) {
        setMessage(`Welcome ${authForm.name}! Your account is ready.`);
      } else {
        setMessage('Check your email to confirm your account before signing in.');
        setAuthView('login');
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: authForm.email,
      password: authForm.password
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage('Signed in.');
  };

  // LOGIC: Password setup for invited/recovery users.
  const handleSetPassword = async (event) => {
    event.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage(error.message);
      return;
    }
    setNeedsPasswordSetup(false);
    setNewPassword('');
    window.history.replaceState(null, '', window.location.pathname);
    setMessage('Password set. Welcome!');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsNavOpen(false);
    setMessage('You are signed out.');
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingTicketId(null);
    setFile(null);
  };

  // LOGIC: Create or update a complaint.
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (editingTicketId) {
      const { data: updatedTicket, error } = await supabase
        .from('tickets')
        .update({
          title: form.title,
          description: form.description,
          category: form.category,
          department: form.department,
          status: form.status,
          assigned_staff_id: form.assignedStaffId || null
        })
        .eq('id', editingTicketId)
        .select('*, assigned:profiles!assigned_staff_id(id,name)')
        .single();

      if (error) {
        setMessage(error.message);
        return;
      }
      setTickets((prev) => prev.map((ticket) => (ticket.id === updatedTicket.id ? updatedTicket : ticket)));
      setMessage('Complaint updated successfully.');
      setActivePanel('complaints');
      resetForm();
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setMessage('Your session expired. Please sign in again.');
      return;
    }

    const formData = new FormData();
    formData.append('studentName', form.studentName || currentUser?.name || '');
    formData.append('studentId', form.studentId || currentUser?.id || '');
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('category', form.category);
    if (file) formData.append('file', file);

    setIsSubmittingTicket(true);
    setMessage('Analyzing your complaint and routing it to the right department...');
    try {
      const response = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setMessage(err.detail || 'Could not submit complaint.');
        return;
      }
      const newTicket = await response.json();
      setTickets((prev) => [newTicket, ...prev]);
      setActivePanel('complaints');
      setMessage(`Ticket submitted and routed to ${newTicket.department}.`);
      resetForm();
    } catch {
      setMessage('Could not submit complaint because the Tickets API is not reachable. Start the backend on port 8001.');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const deleteTicket = async (ticketId) => {
    const { error } = await supabase.from('tickets').delete().eq('id', ticketId);
    if (error) {
      setMessage(error.message);
      return;
    }
    setTickets((prev) => prev.filter((ticket) => ticket.id !== ticketId));
    setMessage('Complaint removed.');
  };

  const resetStaffForm = () => {
    setStaffForm({
      name: '',
      email: '',
      role: 'staff',
      department: '',
      roll_number: '',
      academic_department: '',
      batch: '',
      temporary_password: 'TempPass123!'
    });
  };

  const resetDepartmentForm = () => {
    setDepartmentForm({ name: '', head: '', status: 'Active' });
    setEditingDepartmentId(null);
  };

  // LOGIC: Create staff, student, or admin accounts.
  const handleStaffSubmit = async (event) => {
    event.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setMessage('Your session expired. Please sign in again.');
      return;
    }

    setMessage(`Creating ${staffForm.role} account...`);
    try {
      const response = await fetch(`${API_URL}/admin/staff-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(staffForm)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setMessage(err.detail || 'Could not create account.');
        return;
      }
      const account = await response.json();
      resetStaffForm();
      await loadDashboardData();
      setMessage(`Account created for ${account.email}. Temporary password: ${account.temporaryPassword}`);
    } catch {
      setMessage('Could not create account because the backend API is not reachable. Start the backend on port 8001.');
    }
  };

  const removeAccount = async (account) => {
    if (!window.confirm(`Remove ${account.name || account.email}? This will delete their login account.`)) return;
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}/admin/accounts/${account.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      setMessage(err.detail || 'Could not remove account.');
      return;
    }
    const removed = await response.json();
    await loadDashboardData();
    setMessage(`${removed.email} removed.`);
  };

  // LOGIC: Create or update service departments.
  const handleDepartmentSubmit = async (event) => {
    event.preventDefault();
    if (editingDepartmentId) {
      const { error } = await supabase
        .from('departments')
        .update({ name: departmentForm.name, head: departmentForm.head, status: departmentForm.status })
        .eq('id', editingDepartmentId);
      if (error) {
        setMessage(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('departments').insert({
        organization_id: currentUser.organizationId,
        name: departmentForm.name,
        head: departmentForm.head,
        status: departmentForm.status
      });
      if (error) {
        setMessage(error.message);
        return;
      }
    }
    await loadDashboardData();
    resetDepartmentForm();
    setMessage(editingDepartmentId ? 'Department updated.' : 'Department added.');
  };

  const deleteDepartment = async (departmentId) => {
    const { error } = await supabase.from('departments').delete().eq('id', departmentId);
    if (error) {
      setMessage(error.message);
      return;
    }
    await loadDashboardData();
    setMessage('Department removed.');
  };

  const resetAcademicDeptForm = () => {
    setAcademicDeptForm({ name: '' });
    setEditingAcademicDeptId(null);
  };

  // LOGIC: Create or update academic departments.
  const handleAcademicDeptSubmit = async (event) => {
    event.preventDefault();
    const { error } = editingAcademicDeptId
      ? await supabase.from('academic_departments').update({ name: academicDeptForm.name }).eq('id', editingAcademicDeptId)
      : await supabase.from('academic_departments').insert({ organization_id: currentUser.organizationId, name: academicDeptForm.name });
    if (error) {
      setMessage(error.message);
      return;
    }
    await loadDashboardData();
    resetAcademicDeptForm();
    setMessage(editingAcademicDeptId ? 'Academic department updated.' : 'Academic department added.');
  };

  const deleteAcademicDept = async (id) => {
    const { error } = await supabase.from('academic_departments').delete().eq('id', id);
    if (error) {
      setMessage(error.message);
      return;
    }
    await loadDashboardData();
    setMessage('Academic department removed.');
  };

  const resetBatchForm = () => {
    setBatchForm({ name: '' });
    setEditingBatchId(null);
  };

  // LOGIC: Create or update student batches.
  const handleBatchSubmit = async (event) => {
    event.preventDefault();
    const { error } = editingBatchId
      ? await supabase.from('batches').update({ name: batchForm.name }).eq('id', editingBatchId)
      : await supabase.from('batches').insert({ organization_id: currentUser.organizationId, name: batchForm.name });
    if (error) {
      setMessage(error.message);
      return;
    }
    await loadDashboardData();
    resetBatchForm();
    setMessage(editingBatchId ? 'Batch updated.' : 'Batch added.');
  };

  const deleteBatch = async (id) => {
    const { error } = await supabase.from('batches').delete().eq('id', id);
    if (error) {
      setMessage(error.message);
      return;
    }
    await loadDashboardData();
    setMessage('Batch removed.');
  };

  // LOGIC: Save a student's first-time profile details.
  const handleProfileCompletionSubmit = async (event) => {
    event.preventDefault();
    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileCompletionForm.name,
          roll_number: profileCompletionForm.rollNumber,
          academic_department: profileCompletionForm.academicDepartment,
          batch: profileCompletionForm.batch
        })
        .eq('id', currentUser.id);
      if (error) {
        setMessage(error.message);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await hydrateUser(session.user);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const startEdit = (ticket) => {
    setEditingTicketId(ticket.id);
    setActivePanel('complaints');
    setForm({
      studentName: ticket.student_name || '',
      studentId: ticket.student_id || '',
      title: ticket.title || '',
      description: ticket.description || '',
      category: ticket.category || 'General',
      department: ticket.department || 'Student Services',
      assignedStaffId: ticket.assigned_staff_id || '',
      status: ticket.status || 'New'
    });
  };

  const goToPanel = (panelId) => {
    setActivePanel(panelId);
    setIsNavOpen(false);
  };

  const openAuth = (view) => {
    setAuthView(view);
    setMessage('');
    setIsAuthModalOpen(true);
    setIsLandingNavOpen(false);
  };

  // VIEW ROUTE: Password setup screen.
  if (needsPasswordSetup) {
    return (
      <PasswordSetupScreen
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        handleSetPassword={handleSetPassword}
        message={message}
      />
    );
  }

  if (authLoading) {
    return null;
  }

  // VIEW ROUTE: Public landing page and authentication modal.
  if (!currentUser) {
    return (
      <LandingPage
        isLandingNavOpen={isLandingNavOpen}
        setIsLandingNavOpen={setIsLandingNavOpen}
        openAuth={openAuth}
        openFaqIndex={openFaqIndex}
        setOpenFaqIndex={setOpenFaqIndex}
        features={features}
        workflowSteps={workflowSteps}
        faqs={faqs}
        capabilities={capabilities}
        fadeUp={fadeUp}
        staggerContainer={staggerContainer}
        isAuthModalOpen={isAuthModalOpen}
        setIsAuthModalOpen={setIsAuthModalOpen}
        authView={authView}
        setAuthView={setAuthView}
        authForm={authForm}
        setAuthForm={setAuthForm}
        handleAuth={handleAuth}
        message={message}
      />
    );
  }

  // VIEW ROUTE: Student profile completion screen.
  if (needsStudentProfile) {
    return (
      <StudentProfileSetupScreen
        profileCompletionForm={profileCompletionForm}
        setProfileCompletionForm={setProfileCompletionForm}
        academicDepartments={academicDepartments}
        batches={batches}
        isSavingProfile={isSavingProfile}
        handleProfileCompletionSubmit={handleProfileCompletionSubmit}
        handleLogout={handleLogout}
        message={message}
      />
    );
  }

  const navItems = NAV_BY_ROLE[currentUser.role] || NAV_BY_ROLE.student;
  const heroCopy = HERO_COPY[currentUser.role] || HERO_COPY.student;
  const realtimeLabel = !supabase ? 'Offline mode' : isRealtimeConnected ? 'Live' : 'Connecting';
  const realtimeClass = !supabase || !isRealtimeConnected ? 'topbar-pill offline' : 'topbar-pill';

  // COMPONENT DATA: Props used by DashboardPanels.jsx
  const panelContext = {
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
    startEdit,
    deleteTicket,
    currentUser
  };

  // VIEW ROUTE: Signed-in dashboard.
  return (
    <DashboardShell
      currentUser={currentUser}
      portalLabel={ROLE_LABELS[currentUser.role] || 'My Portal'}
      navItems={navItems}
      activePanel={activePanel}
      isNavOpen={isNavOpen}
      setIsNavOpen={setIsNavOpen}
      goToPanel={goToPanel}
      handleLogout={handleLogout}
      panelTitle={getPanelTitle(activePanel, currentUser.role)}
      realtimeClass={realtimeClass}
      realtimeLabel={realtimeLabel}
    >
      <DashboardPanels panelContext={panelContext} />
    </DashboardShell>
  );
}

export default App;
