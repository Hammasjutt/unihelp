import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

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
function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

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

  if (needsPasswordSetup) {
    return (
      <div className="landing-shell">
        <main className="landing-main">
          <section className="hero glass-card" style={{ gridTemplateColumns: '1fr', maxWidth: 480, margin: '80px auto' }}>
            <div className="glass-card auth-card">
              <p className="eyebrow">Almost there</p>
              <h1 style={{ fontSize: '1.6rem' }}>Set your password</h1>
              <form onSubmit={handleSetPassword} className="auth-form">
                <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
                <button type="submit">Set password &amp; continue</button>
              </form>
              {message ? <p className="message">{message}</p> : null}
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (authLoading) {
    return null;
  }

  if (!currentUser) {
    return (
      <div className="landing-shell">
        <header className="topbar">
          <a className="brand" href="#home" aria-label="UniHelp">
            <img src="/logo.png" alt="UniHelp" className="brand-logo-img" />
          </a>
          <nav className={`topnav ${isLandingNavOpen ? 'open' : ''}`}>
            <a href="#features" onClick={() => setIsLandingNavOpen(false)}>Features</a>
            <a href="#workflow" onClick={() => setIsLandingNavOpen(false)}>How it works</a>
            <a href="#faq" onClick={() => setIsLandingNavOpen(false)}>FAQ</a>
            <button type="button" className="ghost-btn small" onClick={() => openAuth('login')}>Sign in</button>
            <button type="button" className="primary-btn small" onClick={() => openAuth('register')}>Get started</button>
          </nav>
          <button className="landing-toggle" type="button" onClick={() => setIsLandingNavOpen((v) => !v)} aria-label="Toggle menu">
            <HamburgerIcon />
          </button>
        </header>

        <main className="landing-main">
          <section className="hero hero-solo glass-card">
            <motion.div className="hero-copy" initial="hidden" animate="visible" variants={fadeUp}>
              <p className="eyebrow">Campus services • complaint portal • student support</p>
              <h1>Modern complaint handling for universities that actually feels professional.</h1>
              <p>
                UniHelp gives students, staff, and administrators one clean place to report issues, route requests with AI, and follow progress without the chaos of spreadsheets and email threads.
              </p>
              <div className="hero-actions">
                <button type="button" className="primary-btn" onClick={() => openAuth('register')}>Get started free</button>
                <button type="button" className="ghost-btn" onClick={() => openAuth('login')}>Sign in</button>
                <a className="ghost-btn" href="#features">Explore features</a>
              </div>
              <div className="metric-row">
                <div><strong>24/7</strong><span>visibility</span></div>
                <div><strong>AI</strong><span>triage</span></div>
                <div><strong>Secure</strong><span>records</span></div>
              </div>
            </motion.div>
          </section>

          <motion.div
            className="capability-bar"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {capabilities.map((item) => (
              <motion.div key={item.label} className="capability-item" variants={fadeUp}>
                <item.icon />
                <span>{item.label}</span>
              </motion.div>
            ))}
          </motion.div>

          <div className="section-heading">
            <p className="eyebrow">Why UniHelp</p>
            <h2>Everything a campus support team needs, nothing it doesn't.</h2>
          </div>

          <motion.section
            id="features"
            className="feature-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {features.map((feature) => (
              <motion.article key={feature.title} className="glass-card info-card" variants={fadeUp}>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </motion.article>
            ))}
          </motion.section>

          <div className="section-heading">
            <p className="eyebrow">How it works</p>
            <h2>From report to resolution in three steps.</h2>
          </div>

          <motion.section
            id="workflow"
            className="workflow-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {workflowSteps.map((item) => (
              <motion.article key={item.step} className="glass-card workflow-card" variants={fadeUp}>
                <span className="step-badge">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </motion.article>
            ))}
          </motion.section>

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
                      <motion.div
                        className="faq-answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                      >
                        <p>{item.a}</p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </section>

          <motion.section
            className="cta-banner glass-card"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
          >
            <div>
              <p className="eyebrow">Ready when you are</p>
              <h2>Bring order to your campus complaint process today.</h2>
              <p>Create an account and see how quickly AI-assisted routing changes the way your team works.</p>
            </div>
            <div className="hero-actions">
              <button type="button" className="primary-btn" onClick={() => openAuth('register')}>Get started free</button>
            </div>
          </motion.section>
        </main>

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
              <button type="button" onClick={() => openAuth('login')}>Login</button>
              <button type="button" onClick={() => openAuth('register')}>Create account</button>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} UniHelp. Built for campus support teams.</span>
          </div>
        </footer>

        <AnimatePresence>
          {isAuthModalOpen ? (
            <motion.div
              className="auth-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsAuthModalOpen(false)}
            >
              <motion.div
                className="glass-card auth-card auth-modal"
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.97 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                onClick={(event) => event.stopPropagation()}
              >
                <button type="button" className="modal-close" onClick={() => setIsAuthModalOpen(false)} aria-label="Close">
                  ×
                </button>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <img src="/logo.png" alt="UniHelp" className="brand-logo-img" style={{ height: '42px', width: 'auto' }} />
                </div>
                <p className="eyebrow">{authView === 'login' ? 'Welcome back' : 'Register a new institution'}</p>
                <div className="toggle-row">
                  <button type="button" className={authView === 'login' ? 'toggle active' : 'toggle'} onClick={() => setAuthView('login')}>Login</button>
                  <button type="button" className={authView === 'register' ? 'toggle active' : 'toggle'} onClick={() => setAuthView('register')}>Register</button>
                </div>

                <form onSubmit={handleAuth} className="auth-form">
                  {authView === 'register' ? (
                    <>
                      <input placeholder="Full name" value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} required />
                      <input placeholder="Institution name" value={authForm.institutionName} onChange={(e) => setAuthForm({ ...authForm, institutionName: e.target.value })} required />
                    </>
                  ) : null}
                  <input type="email" placeholder="Email address" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required />
                  <input type="password" placeholder="Password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required minLength={6} />
                  {authView === 'register' ? (
                    <p className="hint-text">This creates a brand-new organization and makes you its admin. Already part of one? Ask your admin for an invite instead — there's no self-serve way to join an existing organization.</p>
                  ) : null}
                  <button type="submit">{authView === 'login' ? 'Sign in' : 'Create account'}</button>
                </form>

                {message ? <p className="message">{message}</p> : null}
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  if (needsStudentProfile) {
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
                <input placeholder="Full name" value={profileCompletionForm.name} onChange={(e) => setProfileCompletionForm({ ...profileCompletionForm, name: e.target.value })} required />
                <input placeholder="Roll number" value={profileCompletionForm.rollNumber} onChange={(e) => setProfileCompletionForm({ ...profileCompletionForm, rollNumber: e.target.value })} required />
                <select value={profileCompletionForm.academicDepartment} onChange={(e) => setProfileCompletionForm({ ...profileCompletionForm, academicDepartment: e.target.value })} required>
                  <option value="">Select department</option>
                  {academicDepartments.map((dept) => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
                <select value={profileCompletionForm.batch} onChange={(e) => setProfileCompletionForm({ ...profileCompletionForm, batch: e.target.value })} required>
                  <option value="">Select batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.name}>{batch.name}</option>
                  ))}
                </select>
                <button type="submit" disabled={isSavingProfile}>{isSavingProfile ? 'Saving...' : 'Continue'}</button>
              </form>
              {academicDepartments.length === 0 || batches.length === 0 ? (
                <p className="hint-text">
                  Your organization hasn't added department/batch options yet — ask your admin to add them in the Students panel.
                </p>
              ) : null}
              {message ? <p className="message">{message}</p> : null}
              <button className="ghost-btn small" type="button" onClick={handleLogout} style={{ marginTop: 12 }}>Logout</button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const navItems = NAV_BY_ROLE[currentUser.role] || NAV_BY_ROLE.student;
  const heroCopy = HERO_COPY[currentUser.role] || HERO_COPY.student;
  const realtimeLabel = !supabase ? 'Offline mode' : isRealtimeConnected ? 'Live' : 'Connecting';
  const realtimeClass = !supabase || !isRealtimeConnected ? 'topbar-pill offline' : 'topbar-pill';

  const renderActivePanel = () => {
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

    if (activePanel === 'complaints') {
      return (
        <div className="complaint-layout">
          <section className="glass-card form-card">
            <div className="list-head">
              <h3>{editingTicketId ? 'Edit complaint' : 'Create complaint'}</h3>
              {editingTicketId ? <button className="ghost-btn small" type="button" onClick={resetForm}>Cancel</button> : null}
            </div>
            <form onSubmit={handleSubmit} className="complaint-form">
              {!isStudent ? (
                <>
                  <input placeholder="Student name" value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} required />
                  <input placeholder="Student ID" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required />
                </>
              ) : null}

              {isAdmin ? (
                <input placeholder="Complaint title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              ) : null}

              <textarea placeholder="Describe the issue in detail" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={isAdmin ? 5 : 7} required />

              {isAdmin ? (
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="General">General</option>
                  <option value="Academic">Academic</option>
                  <option value="Facilities">Facilities</option>
                  <option value="IT Support">IT Support</option>
                  <option value="Finance">Finance</option>
                </select>
              ) : null}

              {!isStudent ? (
                <>
                  {editingTicketId ? (
                    <input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                  ) : (
                    <p className="hint-text">The department is assigned automatically by AI based on the description and attachment.</p>
                  )}
                  <select value={form.assignedStaffId} onChange={(e) => setForm({ ...form, assignedStaffId: e.target.value })}>
                    <option value="">Unassigned</option>
                    {staffMembers.map((member) => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="New">New</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Escalated">Escalated</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </>
              ) : !editingTicketId ? (
                <p className="hint-text">Our AI assistant reads your description (and attachment) and routes it to the right department automatically.</p>
              ) : null}

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
                {isSubmittingTicket ? 'Analyzing complaint...' : editingTicketId ? 'Save changes' : 'Send complaint'}
              </button>
            </form>
            {message ? <p className="message">{message}</p> : null}
          </section>

          <section className="glass-card list-card">
            <div className="list-head">
              <h3>{isStudent ? 'My requests' : isStaff ? 'My queue' : 'Queue'}</h3>
              <span className="pill">{tickets.length} items</span>
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
                        <button className="ghost-btn small" type="button" onClick={() => startEdit(ticket)}>Edit</button>
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
      );
    }

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
  };

  return (
    <div className="app-shell" data-role={currentUser.role}>
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className={`nav-backdrop ${isNavOpen ? 'open' : ''}`} onClick={() => setIsNavOpen(false)} />
      <div className="admin-shell">
        <aside className={`sidebar glass-card${isNavOpen ? ' open' : ''}`}>
          <div className="sidebar-brand">
            <a className="brand" href="#home" aria-label="UniHelp">
              <img src="/logo.png" alt="UniHelp" className="brand-logo-img" />
            </a>
            <h2>{ROLE_LABELS[currentUser.role] || 'My Portal'}</h2>
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

        <main className="admin-main">
          <header className="admin-topbar glass-card">
            <div className="topbar-heading">
              <button className="mobile-nav-toggle" type="button" onClick={() => setIsNavOpen(true)} aria-label="Open menu">
                <HamburgerIcon />
              </button>
              <div>
                <p className="eyebrow">{ROLE_LABELS[currentUser.role] || 'My Portal'} · {currentUser.organizationName || 'No organization'}</p>
                <h1>{getPanelTitle(activePanel, currentUser.role)}</h1>
              </div>
            </div>
            <div className={realtimeClass}>{realtimeLabel}</div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={activePanel}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {renderActivePanel()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;
