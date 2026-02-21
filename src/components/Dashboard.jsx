import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const AVATAR_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ec4899',
  '#8b5cf6', '#14b8a6', '#ef4444', '#0891b2'
];

const ROLES = [
  'Frontend Dev', 'Backend Dev', 'Full Stack Dev',
  'UI/UX Designer', 'Lead Designer', 'Project Manager',
  'QA Engineer', 'DevOps Engineer', 'Data Analyst', 'Product Owner'
];

const TASK_CATEGORIES = [
  'Design', 'Development', 'Testing', 'Research',
  'Documentation', 'Review', 'Deployment', 'Planning'
];

const Dashboard = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProject, setShowAddProject] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // ── Invite Feature State ──────────────────────────────────────────
  const [showInviteModal, setShowInviteModal]   = useState(false);
  const [showTeamModal, setShowTeamModal]        = useState(false);
  const [inviteForm, setInviteForm]              = useState({ name: '', email: '', role: 'Frontend Dev' });
  const [inviteErrors, setInviteErrors]          = useState({});
  const [inviteStep, setInviteStep]              = useState(1);
  const [pendingInvites, setPendingInvites]      = useState(() => {
    const saved = localStorage.getItem('planora_invites');
    return saved ? JSON.parse(saved) : [];
  });

  // ── Add Task State ────────────────────────────────────────────────
  const [showAddTask, setShowAddTask]       = useState(false);
  const [taskForm, setTaskForm]             = useState({
    title: '', description: '', projectId: '', assigneeId: '',
    priority: 'medium', dueDate: '', category: 'Development', status: 'todo'
  });
  const [taskFormErrors, setTaskFormErrors] = useState({});
  const [tasks, setTasks]                   = useState(() => {
    const saved = localStorage.getItem('planora_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [teamMembers, setTeamMembers] = useState(() => {
    const saved = localStorage.getItem('planora_team');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Sarah Chen',  role: 'Lead Designer',   avatar: 'SC', status: 'online',  color: '#6366f1' },
      { id: 2, name: 'Mike Ross',   role: 'Backend Dev',     avatar: 'MR', status: 'online',  color: '#10b981' },
      { id: 3, name: 'Emily Davis', role: 'Project Manager', avatar: 'ED', status: 'away',    color: '#f59e0b' },
      { id: 4, name: 'John Smith',  role: 'Frontend Dev',    avatar: 'JS', status: 'offline', color: '#ec4899' },
    ];
  });

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('planora_projects');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Website Redesign',      progress: 75, status: 'In Progress', team: 5, deadline: '2026-02-15', priority: 'high',   tasks: 24, completedTasks: 18, description: 'Complete redesign of company website with modern UI/UX' },
      { id: 2, name: 'Mobile App Development',progress: 45, status: 'In Progress', team: 8, deadline: '2026-03-20', priority: 'high',   tasks: 32, completedTasks: 14, description: 'Native mobile app for iOS and Android platforms' },
      { id: 3, name: 'Marketing Campaign',    progress: 90, status: 'Review',      team: 3, deadline: '2026-02-10', priority: 'medium', tasks: 15, completedTasks: 13, description: 'Q1 marketing campaign for new product launch' },
      { id: 4, name: 'Database Migration',    progress: 30, status: 'Planning',    team: 4, deadline: '2026-04-01', priority: 'low',    tasks: 20, completedTasks: 6,  description: 'Migrate legacy database to cloud infrastructure' },
      { id: 5, name: 'Security Audit',        progress: 60, status: 'In Progress', team: 2, deadline: '2026-02-25', priority: 'high',   tasks: 12, completedTasks: 7,  description: 'Comprehensive security audit and vulnerability assessment' },
    ];
  });

  const [projectForm, setProjectForm] = useState({
    name: '', description: '', deadline: '', priority: 'medium',
    team: '', status: 'planning', tasks: '', completedTasks: 0
  });
  const [formErrors, setFormErrors] = useState({});

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New task assigned',   message: 'You have been assigned to "API Integration"', time: '10 min ago', read: false, type: 'task' },
    { id: 2, title: 'Deadline approaching',message: 'Marketing Campaign due in 2 days',            time: '1 hour ago', read: false, type: 'warning' },
    { id: 3, title: 'Comment received',    message: 'Mike commented on your task',                 time: '3 hours ago',read: true,  type: 'comment' },
  ]);

  const navigate = useNavigate();

  // ── Persist data ──────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('planora_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('planora_team',     JSON.stringify(teamMembers)); }, [teamMembers]);
  useEffect(() => { localStorage.setItem('planora_invites',  JSON.stringify(pendingInvites)); }, [pendingInvites]);
  useEffect(() => { localStorage.setItem('planora_tasks',    JSON.stringify(tasks)); }, [tasks]);

  // ── Keyboard shortcuts ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); document.querySelector('.search-bar input')?.focus(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); handleAddProject(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 't') { e.preventDefault(); openAddTaskModal(); }
      if (e.key === 'Escape') {
        setShowAddProject(false); setSelectedProject(null);
        setShowInviteModal(false); setShowTeamModal(false);
        setShowAddTask(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const getInitials = (name) =>
    name.trim().split(' ').slice(0, 2).map(w => w[0].toUpperCase()).join('');

  // ── Task logic ────────────────────────────────────────────────────
  const openAddTaskModal = (preselectedProjectId = '') => {
    setTaskForm({
      title: '', description: '',
      projectId: preselectedProjectId || (projects[0]?.id?.toString() || ''),
      assigneeId: '', priority: 'medium',
      dueDate: '', category: 'Development', status: 'todo'
    });
    setTaskFormErrors({});
    setShowAddTask(true);
  };

  const validateTaskForm = () => {
    const errors = {};
    if (!taskForm.title.trim())   errors.title     = 'Task title is required';
    if (!taskForm.projectId)      errors.projectId = 'Please select a project';
    if (!taskForm.dueDate)        errors.dueDate   = 'Due date is required';
    setTaskFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveTask = () => {
    if (!validateTaskForm()) return;

    const assignee = teamMembers.find(m => m.id === parseInt(taskForm.assigneeId));
    const project  = projects.find(p => p.id === parseInt(taskForm.projectId));

    const newTask = {
      id:          Date.now(),
      title:       taskForm.title.trim(),
      description: taskForm.description.trim(),
      projectId:   parseInt(taskForm.projectId),
      projectName: project?.name || '',
      assigneeId:  assignee ? parseInt(taskForm.assigneeId) : null,
      assignee:    assignee || null,
      priority:    taskForm.priority,
      dueDate:     taskForm.dueDate,
      category:    taskForm.category,
      status:      taskForm.status,
      createdAt:   new Date().toISOString(),
    };

    setTasks(prev => [newTask, ...prev]);

    // bump the project's task count
    setProjects(prev => prev.map(p =>
      p.id === parseInt(taskForm.projectId)
        ? { ...p, tasks: p.tasks + 1 }
        : p
    ));

    // add a notification
    setNotifications(prev => [{
      id:      Date.now(),
      title:   'New task created',
      message: `"${newTask.title}" added to ${project?.name}${assignee ? ` · Assigned to ${assignee.name}` : ''}`,
      time:    'Just now',
      read:    false,
      type:    'task',
    }, ...prev]);

    showToast(`Task "${newTask.title}" created successfully! ✅`);
    setShowAddTask(false);
  };

  // ── Invite logic ──────────────────────────────────────────────────
  const validateInvite = () => {
    const errors = {};
    if (!inviteForm.name.trim())  errors.name  = 'Name is required';
    if (!inviteForm.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email))
      errors.email = 'Enter a valid email address';
    else if (teamMembers.some(m => m.email === inviteForm.email.toLowerCase()) ||
             pendingInvites.some(i => i.email === inviteForm.email.toLowerCase()))
      errors.email = 'This email has already been invited';
    setInviteErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendInvite = () => {
    if (!validateInvite()) return;
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const invite = {
      id:      Date.now(),
      name:    inviteForm.name.trim(),
      email:   inviteForm.email.trim().toLowerCase(),
      role:    inviteForm.role,
      avatar:  getInitials(inviteForm.name),
      color,
      status:  'pending',
      sentAt:  new Date().toLocaleString(),
    };
    setPendingInvites(prev => [...prev, invite]);
    setNotifications(prev => [{
      id:      Date.now(),
      title:   'Invite Sent',
      message: `Invitation sent to ${invite.name} (${invite.email})`,
      time:    'Just now',
      read:    false,
      type:    'task',
    }, ...prev]);
    setInviteStep(2);
  };

  const handleAcceptInvite = (invite) => {
    const newMember = {
      id:     invite.id,
      name:   invite.name,
      email:  invite.email,
      role:   invite.role,
      avatar: invite.avatar,
      color:  invite.color,
      status: 'online',
    };
    setTeamMembers(prev => [...prev, newMember]);
    setPendingInvites(prev => prev.filter(i => i.id !== invite.id));
    showToast(`${invite.name} has joined the team! 🎉`);
  };

  const handleRevokeInvite = (inviteId) => {
    setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
    showToast('Invitation revoked', 'error');
  };

  const handleRemoveMember = (memberId) => {
    if (window.confirm('Remove this team member?')) {
      setTeamMembers(prev => prev.filter(m => m.id !== memberId));
      showToast('Team member removed', 'error');
    }
  };

  const openInviteModal = () => {
    setInviteForm({ name: '', email: '', role: 'Frontend Dev' });
    setInviteErrors({});
    setInviteStep(1);
    setShowInviteModal(true);
  };

  // ── Project logic ─────────────────────────────────────────────────
  const validateForm = () => {
    const errors = {};
    if (!projectForm.name.trim())              errors.name     = 'Project name is required';
    if (!projectForm.deadline)                 errors.deadline = 'Deadline is required';
    if (!projectForm.team || projectForm.team < 1) errors.team = 'Team size must be at least 1';
    if (!projectForm.tasks || projectForm.tasks < 1) errors.tasks = 'Tasks must be at least 1';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setProjectForm({ name: '', description: '', deadline: '', priority: 'medium', team: '', status: 'planning', tasks: '', completedTasks: 0 });
    setFormErrors({});
    setShowAddProject(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name, description: project.description, deadline: project.deadline,
      priority: project.priority, team: project.team.toString(),
      status: project.status.toLowerCase().replace(' ', '-'),
      tasks: project.tasks.toString(), completedTasks: project.completedTasks
    });
    setFormErrors({});
    setSelectedProject(null);
    setShowAddProject(true);
  };

  const handleSaveProject = () => {
    if (!validateForm()) return;
    const progress = Math.round((projectForm.completedTasks / projectForm.tasks) * 100);
    const statusLabel = projectForm.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    if (editingProject) {
      setProjects(projects.map(p => p.id === editingProject.id
        ? { ...p, name: projectForm.name, description: projectForm.description, deadline: projectForm.deadline,
            priority: projectForm.priority, team: parseInt(projectForm.team), status: statusLabel,
            tasks: parseInt(projectForm.tasks), completedTasks: projectForm.completedTasks, progress }
        : p));
      showToast('Project updated successfully!');
    } else {
      setProjects([...projects, {
        id: Date.now(), name: projectForm.name, description: projectForm.description,
        deadline: projectForm.deadline, priority: projectForm.priority, team: parseInt(projectForm.team),
        status: statusLabel, tasks: parseInt(projectForm.tasks),
        completedTasks: projectForm.completedTasks, progress
      }]);
      showToast('Project created successfully!');
    }
    setShowAddProject(false);
  };

  const handleDeleteProject = (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter(p => p.id !== projectId));
      setSelectedProject(null);
      showToast('Project deleted', 'error');
    }
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read');
  };

  const handleExportCSV = () => {
    const headers = ['ID','Name','Status','Priority','Progress','Team','Tasks','Completed','Deadline'];
    const rows    = projects.map(p => [p.id, p.name, p.status, p.priority, `${p.progress}%`, p.team, p.tasks, p.completedTasks, p.deadline]);
    const csv     = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `planora-projects-${new Date().toISOString().split('T')[0]}.csv`
    });
    a.click();
    showToast('Projects exported successfully!');
  };

  // ── Derived data ──────────────────────────────────────────────────
  const stats = [
    { label: 'Total Projects', value: projects.length.toString(),                              icon: '📊', color: '#6366f1', trend: '+12%', trendUp: true  },
    { label: 'Active Tasks',   value: projects.reduce((s, p) => s + (p.tasks - p.completedTasks), 0).toString(), icon: '✓', color: '#10b981', trend: '+8%', trendUp: true  },
    { label: 'Team Members',   value: teamMembers.length.toString(),                           icon: '👥', color: '#f59e0b', trend: '+5%', trendUp: true  },
    { label: 'Avg Progress',   value: projects.length ? `${Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)}%` : '0%', icon: '🎯', color: '#ec4899', trend: '+3%', trendUp: true },
  ];

  const recentActivity = [
    { user: 'Sarah Chen',  action: 'completed task',   item: 'UI Design Review',    time: '5 min ago',   avatar: 'SC', color: '#6366f1' },
    { user: 'Mike Ross',   action: 'added comment on', item: 'Backend API',          time: '23 min ago',  avatar: 'MR', color: '#10b981' },
    { user: 'Emily Davis', action: 'created new',      item: 'Sprint Planning',      time: '1 hour ago',  avatar: 'ED', color: '#f59e0b' },
    { user: 'John Smith',  action: 'updated status of',item: 'Mobile App',           time: '2 hours ago', avatar: 'JS', color: '#ec4899' },
    { user: 'Anna Lee',    action: 'uploaded files to', item: 'Database Migration',  time: '3 hours ago', avatar: 'AL', color: '#8b5cf6' },
  ];

  const upcomingDeadlines = projects
    .filter(p => new Date(p.deadline) > new Date())
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3)
    .map(p => ({
      project: p.name,
      days: Math.ceil((new Date(p.deadline) - new Date()) / 86400000),
      priority: p.priority,
    }));

  const filteredProjects = projects
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (activeTab === 'all' || p.status.toLowerCase().replace(' ', '-') === activeTab))
    .sort((a, b) => {
      if (sortBy === 'name')     return a.name.localeCompare(b.name);
      if (sortBy === 'deadline') return new Date(a.deadline) - new Date(b.deadline);
      if (sortBy === 'progress') return b.progress - a.progress;
      return 0;
    });

  const totalTasks     = projects.reduce((s, p) => s + p.tasks, 0);
  const completedTasks = projects.reduce((s, p) => s + p.completedTasks, 0);
  const overallProgress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // helper: days until due
  const getDaysUntil = (dateStr) => {
    const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
    if (diff < 0)  return { label: 'Overdue', cls: 'overdue' };
    if (diff === 0) return { label: 'Due today', cls: 'today' };
    if (diff === 1) return { label: 'Tomorrow', cls: 'soon' };
    return { label: `${diff}d left`, cls: diff <= 3 ? 'soon' : 'ok' };
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="dashboard-container">

      {/* Toast */}
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">P</div>
            {sidebarOpen && <span className="logo-text">Planora</span>}
          </div>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item" onClick={() => navigate('/home')}>
            <svg viewBox="0 0 24 24" fill="none"><path d="M3 9L12 2L21 9V20C21 20.53 20.79 21.04 20.41 21.41C20.04 21.79 19.53 22 19 22H5C4.47 22 3.96 21.79 3.59 21.41C3.21 21.04 3 20.53 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {sidebarOpen && <span>Home</span>}
          </a>
          <a href="#" className="nav-item active">
            <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {sidebarOpen && <span>Dashboard</span>}
          </a>
          <a href="#" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none"><path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12V19C21 19.53 20.79 20.04 20.41 20.41C20.04 20.79 19.53 21 19 21H5C4.47 21 3.96 20.79 3.59 20.41C3.21 20.04 3 19.53 3 19V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {sidebarOpen && <span>Projects</span>}
          </a>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); setShowTeamModal(true); }}>
            <svg viewBox="0 0 24 24" fill="none"><path d="M17 21V19C17 17.93 16.58 16.92 15.83 16.17C15.08 15.42 14.06 15 13 15H5C3.93 15 2.92 15.42 2.17 16.17C1.42 16.92 1 17.93 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 21V19C23 18.04 22.67 17.14 22.09 16.43" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 3.13C16.9 3.36 17.68 3.89 18.24 4.62C18.8 5.36 19.1 6.26 19.1 7.19C19.1 8.12 18.8 9.02 18.24 9.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {sidebarOpen && <span>Team</span>}
          </a>
          <a href="#" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {sidebarOpen && <span>Calendar</span>}
          </a>
        </nav>
        <div className="sidebar-footer">
          <a href="#" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><path d="M19.4 15A7.5 7.5 0 1 1 12 7.5" stroke="currentColor" strokeWidth="2"/></svg>
            {sidebarOpen && <span>Settings</span>}
          </a>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <svg viewBox="0 0 24 24" fill="none"><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            <h2>Dashboard</h2>
          </div>
          <div className="header-right">
            {/* Search */}
            <div className="search-bar">
              <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2"/></svg>
              <input type="text" placeholder="Search projects… (Ctrl+K)" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
              {searchQuery && <button className="clear-search" onClick={() => setSearchQuery('')}>✕</button>}
            </div>

            {/* ── ADD TASK BUTTON ── */}
            <button className="add-task-btn" onClick={() => openAddTaskModal()} title="Add Task (Ctrl+T)">
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12V19C21 19.53 20.79 20.04 20.41 20.41C20.04 20.79 19.53 21 19 21H5C4.47 21 3.96 20.79 3.59 20.41C3.21 20.04 3 19.53 3 19V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Add Task</span>
              {tasks.length > 0 && <span className="task-count-badge">{tasks.length}</span>}
            </button>

            {/* Invite Button */}
            <button className="invite-btn" onClick={openInviteModal} title="Invite Team Member">
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M16 11C18.21 11 20 9.21 20 7C20 4.79 18.21 3 16 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18 22C18 20.44 17.29 19.04 16.18 18.09C15.07 17.14 13.59 16.57 12 16.57" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 11C11.21 11 13 9.21 13 7C13 4.79 11.21 3 9 3C6.79 3 5 4.79 5 7C5 9.21 6.79 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 22V21C1 18.24 3.24 16 6 16H12C14.76 16 17 18.24 17 21V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="17" y1="11" x2="23" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              {sidebarOpen !== false && <span>Invite</span>}
              {pendingInvites.length > 0 && <span className="invite-badge">{pendingInvites.length}</span>}
            </button>

            {/* Notifications */}
            <div className="notification-wrapper">
              <button className="icon-button" onClick={() => setShowNotifications(!showNotifications)}>
                <svg viewBox="0 0 24 24" fill="none"><path d="M18 8C18 6.41 17.37 4.88 16.24 3.76C15.12 2.63 13.59 2 12 2C10.41 2 8.88 2.63 7.76 3.76C6.63 4.88 6 6.41 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2"/><path d="M13.73 21C13.55 21.3 13.3 21.55 12.99 21.73C12.69 21.9 12.35 22 12 22C11.65 22 11.31 21.9 11.01 21.73C10.7 21.55 10.45 21.3 10.27 21" stroke="currentColor" strokeWidth="2"/></svg>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="notification-badge">{notifications.filter(n => !n.read).length}</span>
                )}
              </button>
              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h3>Notifications</h3>
                    <button onClick={() => setShowNotifications(false)}>✕</button>
                  </div>
                  <div className="notifications-list">
                    {notifications.map(n => (
                      <div key={n.id} className={`notification-item ${n.read ? 'read' : ''}`}>
                        <div className={`notification-icon ${n.type}`}>
                          {n.type === 'task' && '📋'}{n.type === 'warning' && '⚠️'}{n.type === 'comment' && '💬'}
                        </div>
                        <div className="notification-content">
                          <h4>{n.title}</h4><p>{n.message}</p>
                          <span className="notification-time">{n.time}</span>
                        </div>
                        {!n.read && <div className="unread-dot"></div>}
                      </div>
                    ))}
                  </div>
                  <div className="notifications-footer">
                    <button onClick={markAllAsRead}>Mark all as read</button>
                  </div>
                </div>
              )}
            </div>

            {/* User */}
            <div className="user-menu">
              <div className="user-avatar">
                <img src="https://ui-avatars.com/api/?name=Admin+User&background=14b8a6&color=fff" alt="User"/>
              </div>
              <div className="user-info">
                <span className="user-name">Admin User</span>
                <span className="user-role">Project Manager</span>
              </div>
              <button className="dropdown-button" onClick={onLogout} title="Logout">
                <svg viewBox="0 0 24 24" fill="none"><path d="M9 21H5C4.47 21 3.96 20.79 3.59 20.41C3.21 20.04 3 19.53 3 19V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H9" stroke="currentColor" strokeWidth="2"/><path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2"/><path d="M21 12H9" stroke="currentColor" strokeWidth="2"/></svg>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {/* Stats */}
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <div key={i} className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>{stat.icon}</div>
                <div className="stat-content">
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-value">{stat.value}</div>
                  <div className={`stat-trend ${stat.trendUp ? 'up' : 'down'}`}>{stat.trendUp ? '↑' : '↓'} {stat.trend} from last month</div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="dashboard-grid">
            {/* Projects */}
            <div className="projects-section">
              <div className="card">
                <div className="card-header">
                  <h3>Projects ({filteredProjects.length})</h3>
                  <div className="header-actions">
                    <button className="btn-icon" onClick={handleExportCSV} title="Export CSV">
                      <svg viewBox="0 0 24 24" fill="none"><path d="M21 15V19C21 19.53 20.79 20.04 20.41 20.41C20.04 20.79 19.53 21 19 21H5C4.47 21 3.96 20.79 3.59 20.41C3.21 20.04 3 19.53 3 19V15" stroke="currentColor" strokeWidth="2"/><path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2"/><path d="M12 15V3" stroke="currentColor" strokeWidth="2"/></svg>
                    </button>
                    <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                      <option value="name">Sort by Name</option>
                      <option value="deadline">Sort by Deadline</option>
                      <option value="progress">Sort by Progress</option>
                    </select>
                    {/* Add Task button inside projects card */}
                    <button className="btn-task-small" onClick={() => openAddTaskModal()}>
                      <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2"/></svg>
                      Add Task
                    </button>
                    <button className="btn-primary-small" onClick={handleAddProject}>
                      <svg viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2"/></svg>
                      New Project
                    </button>
                  </div>
                </div>
                <div className="filter-tabs">
                  {[['all','All'], ['in-progress','In Progress'], ['review','Review'], ['planning','Planning']].map(([key, label]) => (
                    <button key={key} className={`tab ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
                      {label} <span className="tab-count">{key === 'all' ? projects.length : projects.filter(p => p.status.toLowerCase().replace(' ','-') === key).length}</span>
                    </button>
                  ))}
                </div>
                <div className="projects-list">
                  {filteredProjects.length > 0 ? filteredProjects.map(project => (
                    <div key={project.id} className="project-item" onClick={() => setSelectedProject(project)}>
                      <div className="project-header">
                        <div className="project-title">
                          <h4>{project.name}</h4>
                          <span className={`priority-badge priority-${project.priority}`}>
                            {project.priority === 'high' && '🔴'}{project.priority === 'medium' && '🟡'}{project.priority === 'low' && '🟢'}
                            {project.priority.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={`status-badge status-${project.status.toLowerCase().replace(' ','-')}`}>{project.status}</span>
                          {/* Quick Add Task per project */}
                          <button
                            className="btn-task-inline"
                            title="Add task to this project"
                            onClick={(e) => { e.stopPropagation(); openAddTaskModal(project.id.toString()); }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2"/></svg>
                            Task
                          </button>
                        </div>
                      </div>
                      <div className="project-meta">
                        <span className="project-team">
                          <svg viewBox="0 0 24 24" fill="none"><path d="M17 21V19C17 17.93 16.58 16.92 15.83 16.17C15.08 15.42 14.06 15 13 15H5C3.93 15 2.92 15.42 2.17 16.17C1.42 16.92 1 17.93 1 19V21" stroke="currentColor" strokeWidth="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg>
                          {project.team} members
                        </span>
                        <span className="project-tasks">
                          <svg viewBox="0 0 24 24" fill="none"><path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2"/></svg>
                          {project.completedTasks}/{project.tasks} tasks
                        </span>
                        <span className="project-deadline">
                          <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2"/></svg>
                          {new Date(project.deadline).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="progress-section">
                        <div className="progress-header">
                          <span className="progress-label">Progress</span>
                          <span className="progress-percentage">{project.progress}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${project.progress}%`, backgroundColor: project.progress >= 75 ? '#10b981' : project.progress >= 50 ? '#f59e0b' : '#6366f1' }}></div>
                        </div>
                      </div>

                      {/* Tasks for this project */}
                      {tasks.filter(t => t.projectId === project.id).length > 0 && (
                        <div className="project-tasks-preview">
                          <div className="tasks-preview-header">
                            <span>Tasks ({tasks.filter(t => t.projectId === project.id).length})</span>
                          </div>
                          <div className="tasks-preview-list">
                            {tasks.filter(t => t.projectId === project.id).slice(0, 3).map(task => {
                              const due = getDaysUntil(task.dueDate);
                              const assignee = task.assignee;
                              return (
                                <div key={task.id} className="task-preview-item">
                                  <div className={`task-status-dot task-status-${task.status}`}></div>
                                  <span className="task-preview-title">{task.title}</span>
                                  <div className="task-preview-meta">
                                    {assignee && (
                                      <div className="task-assignee-mini" style={{ backgroundColor: assignee.color }} title={assignee.name}>
                                        {assignee.avatar}
                                      </div>
                                    )}
                                    <span className={`task-due-mini due-${due.cls}`}>{due.label}</span>
                                    <span className={`task-priority-mini priority-${task.priority}`}>
                                      {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                            {tasks.filter(t => t.projectId === project.id).length > 3 && (
                              <div className="tasks-preview-more">
                                +{tasks.filter(t => t.projectId === project.id).length - 3} more tasks
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="empty-state">
                      <div className="empty-icon">🔍</div>
                      <h3>No projects found</h3>
                      <p>Try adjusting your search or filters</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="dashboard-sidebar">
              {/* Overall Progress */}
              <div className="card progress-overview-card">
                <div className="card-header"><h3>Overall Progress</h3></div>
                <div className="circular-progress">
                  <svg viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10"/>
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#14b8a6" strokeWidth="10"
                      strokeDasharray={`${overallProgress * 3.39} 339`} strokeLinecap="round"
                      transform="rotate(-90 60 60)" style={{ transition: 'stroke-dasharray 1s ease' }}/>
                  </svg>
                  <div className="progress-text">
                    <div className="progress-percentage">{overallProgress}%</div>
                    <div className="progress-subtitle">Complete</div>
                  </div>
                </div>
                <div className="progress-stats">
                  <div className="progress-stat"><span className="stat-label">Total Tasks</span><span className="stat-number">{totalTasks}</span></div>
                  <div className="progress-stat"><span className="stat-label">Completed</span><span className="stat-number">{completedTasks}</span></div>
                  <div className="progress-stat"><span className="stat-label">Remaining</span><span className="stat-number">{totalTasks - completedTasks}</span></div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card activity-card">
                <div className="card-header"><h3>Recent Activity</h3></div>
                <div className="activity-list">
                  {recentActivity.map((a, i) => (
                    <div key={i} className="activity-item">
                      <div className="activity-avatar" style={{ backgroundColor: a.color }}>{a.avatar}</div>
                      <div className="activity-content">
                        <p><strong>{a.user}</strong> {a.action} <span className="highlight">{a.item}</span></p>
                        <span className="activity-time">{a.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Members */}
              <div className="card team-card">
                <div className="card-header">
                  <h3>Team Members <span className="team-count-badge">{teamMembers.length}</span></h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-link" onClick={() => setShowTeamModal(true)}>View All</button>
                    <button className="btn-invite-small" onClick={openInviteModal} title="Invite Member">+ Invite</button>
                  </div>
                </div>
                <div className="team-list">
                  {teamMembers.slice(0, 4).map((member, i) => (
                    <div key={i} className="team-member">
                      <div className="member-avatar" style={{ backgroundColor: member.color }}>
                        {member.avatar}
                        <span className={`status-indicator ${member.status}`}></span>
                      </div>
                      <div className="member-info">
                        <div className="member-name">{member.name}</div>
                        <div className="member-role">{member.role}</div>
                      </div>
                      <div className={`member-status ${member.status}`}>
                        {member.status === 'online' && '🟢'}{member.status === 'away' && '🟡'}{member.status === 'offline' && '⚫'}
                      </div>
                    </div>
                  ))}
                  {teamMembers.length > 4 && (
                    <button className="show-more-btn" onClick={() => setShowTeamModal(true)}>
                      +{teamMembers.length - 4} more members
                    </button>
                  )}
                  {pendingInvites.length > 0 && (
                    <div className="pending-preview">
                      <span className="pending-label">⏳ {pendingInvites.length} pending invite{pendingInvites.length > 1 ? 's' : ''}</span>
                      <button className="btn-link" onClick={() => setShowTeamModal(true)}>Manage</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Deadlines */}
              <div className="card deadlines-card">
                <div className="card-header"><h3>Upcoming Deadlines</h3></div>
                <div className="deadlines-list">
                  {upcomingDeadlines.length > 0 ? upcomingDeadlines.map((item, i) => (
                    <div key={i} className="deadline-item">
                      <div className={`deadline-indicator priority-${item.priority}`}></div>
                      <div className="deadline-info">
                        <div className="deadline-project">{item.project}</div>
                        <div className="deadline-days">{item.days === 1 ? 'Tomorrow' : `${item.days} days left`}</div>
                      </div>
                      <div className={`deadline-priority priority-${item.priority}`}>
                        {item.priority === 'high' && '🔴'}{item.priority === 'medium' && '🟡'}
                      </div>
                    </div>
                  )) : <p className="no-deadlines">No upcoming deadlines</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ADD TASK MODAL
      ═══════════════════════════════════════════════════════════ */}
      {showAddTask && (
        <div className="modal-overlay" onClick={() => setShowAddTask(false)}>
          <div className="modal task-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Add New Task</h2>
                <p className="modal-subtitle">Assign a task to a project and team member</p>
              </div>
              <button className="modal-close" onClick={() => setShowAddTask(false)}>✕</button>
            </div>

            <div className="modal-body">

              {/* Task Title */}
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Design login screen mockups"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  className={taskFormErrors.title ? 'error' : ''}
                  autoFocus
                />
                {taskFormErrors.title && <span className="error-text">{taskFormErrors.title}</span>}
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Describe what needs to be done…"
                  rows="3"
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                />
              </div>

              {/* Project + Category row */}
              <div className="form-row">
                <div className="form-group">
                  <label>Project *</label>
                  <select
                    value={taskForm.projectId}
                    onChange={e => setTaskForm({ ...taskForm, projectId: e.target.value })}
                    className={taskFormErrors.projectId ? 'error' : ''}
                  >
                    <option value="">— Select project —</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {taskFormErrors.projectId && <span className="error-text">{taskFormErrors.projectId}</span>}
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={taskForm.category} onChange={e => setTaskForm({ ...taskForm, category: e.target.value })}>
                    {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Assignee */}
              <div className="form-group">
                <label>Assign To</label>
                <div className="assignee-selector">
                  <div
                    className={`assignee-option ${taskForm.assigneeId === '' ? 'selected' : ''}`}
                    onClick={() => setTaskForm({ ...taskForm, assigneeId: '' })}
                    title="Unassigned"
                  >
                    <div className="assignee-avatar unassigned">?</div>
                    <span>Unassigned</span>
                  </div>
                  {teamMembers.map(m => (
                    <div
                      key={m.id}
                      className={`assignee-option ${taskForm.assigneeId === m.id.toString() ? 'selected' : ''}`}
                      onClick={() => setTaskForm({ ...taskForm, assigneeId: m.id.toString() })}
                      title={`${m.name} · ${m.role}`}
                    >
                      <div className="assignee-avatar" style={{ backgroundColor: m.color }}>
                        {m.avatar}
                        <span className={`status-indicator ${m.status}`}></span>
                      </div>
                      <span>{m.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority + Status row */}
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <div className="priority-selector">
                    {[['high','🔴 High'], ['medium','🟡 Medium'], ['low','🟢 Low']].map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        className={`priority-option priority-opt-${val} ${taskForm.priority === val ? 'selected' : ''}`}
                        onClick={() => setTaskForm({ ...taskForm, priority: val })}
                      >{label}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div className="form-group">
                <label>Due Date *</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className={taskFormErrors.dueDate ? 'error' : ''}
                />
                {taskFormErrors.dueDate && <span className="error-text">{taskFormErrors.dueDate}</span>}
              </div>

              {/* Live Preview */}
              {taskForm.title && (
                <div className="task-preview-card">
                  <div className="task-preview-label">Preview</div>
                  <div className="task-preview-inner">
                    <div className="task-preview-row">
                      <div className={`task-status-dot task-status-${taskForm.status}`}></div>
                      <span className="task-preview-name">{taskForm.title}</span>
                      <span className={`priority-badge priority-${taskForm.priority}`}>
                        {taskForm.priority === 'high' ? '🔴' : taskForm.priority === 'medium' ? '🟡' : '🟢'} {taskForm.priority}
                      </span>
                    </div>
                    <div className="task-preview-details">
                      {taskForm.projectId && (
                        <span className="task-preview-chip">
                          📁 {projects.find(p => p.id.toString() === taskForm.projectId)?.name}
                        </span>
                      )}
                      {taskForm.assigneeId && (
                        <span className="task-preview-chip">
                          👤 {teamMembers.find(m => m.id.toString() === taskForm.assigneeId)?.name}
                        </span>
                      )}
                      {taskForm.dueDate && (
                        <span className={`task-preview-chip due-chip-${getDaysUntil(taskForm.dueDate).cls}`}>
                          📅 {getDaysUntil(taskForm.dueDate).label}
                        </span>
                      )}
                      <span className="task-preview-chip">🏷 {taskForm.category}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddTask(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveTask}>
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16" style={{ marginRight: '0.4rem' }}>
                  <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12V19C21 19.53 20.79 20.04 20.41 20.41C20.04 20.79 19.53 21 19 21H5C4.47 21 3.96 20.79 3.59 20.41C3.21 20.04 3 19.53 3 19V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          INVITE TEAM MEMBER MODAL
      ═══════════════════════════════════════════════════════════ */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal invite-modal" onClick={e => e.stopPropagation()}>
            {inviteStep === 1 ? (
              <>
                <div className="modal-header">
                  <div>
                    <h2>Invite Team Member</h2>
                    <p className="modal-subtitle">Send an invitation to join Planora</p>
                  </div>
                  <button className="modal-close" onClick={() => setShowInviteModal(false)}>✕</button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input type="text" placeholder="e.g. Alex Johnson" value={inviteForm.name}
                      onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
                      className={inviteErrors.name ? 'error' : ''} autoFocus/>
                    {inviteErrors.name && <span className="error-text">{inviteErrors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input type="email" placeholder="e.g. alex@company.com" value={inviteForm.email}
                      onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                      className={inviteErrors.email ? 'error' : ''}/>
                    {inviteErrors.email && <span className="error-text">{inviteErrors.email}</span>}
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select value={inviteForm.role} onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="invite-preview">
                    <div className="invite-preview-avatar" style={{ backgroundColor: AVATAR_COLORS[2] }}>
                      {inviteForm.name ? getInitials(inviteForm.name) : '?'}
                    </div>
                    <div className="invite-preview-info">
                      <div className="invite-preview-name">{inviteForm.name || 'Preview Name'}</div>
                      <div className="invite-preview-email">{inviteForm.email || 'preview@email.com'}</div>
                      <div className="invite-preview-role">{inviteForm.role}</div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setShowInviteModal(false)}>Cancel</button>
                  <button className="btn-primary" onClick={handleSendInvite}>
                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" style={{ marginRight: '0.4rem' }}>
                      <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Send Invite
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-header" style={{ borderBottom: 'none' }}>
                  <button className="modal-close" onClick={() => setShowInviteModal(false)}>✕</button>
                </div>
                <div className="invite-success">
                  <div className="success-icon-circle">✓</div>
                  <h2>Invite Sent!</h2>
                  <p>An invitation has been sent to</p>
                  <strong className="invite-email-highlight">{inviteForm.email}</strong>
                  <p className="success-note">They will appear in your team once they accept the invite.</p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button className="btn-secondary" onClick={() => { setInviteStep(1); setInviteForm({ name: '', email: '', role: 'Frontend Dev' }); }}>
                      Invite Another
                    </button>
                    <button className="btn-primary" onClick={() => setShowInviteModal(false)}>Done</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TEAM MANAGEMENT MODAL
      ═══════════════════════════════════════════════════════════ */}
      {showTeamModal && (
        <div className="modal-overlay" onClick={() => setShowTeamModal(false)}>
          <div className="modal modal-large team-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Team Management</h2>
                <p className="modal-subtitle">{teamMembers.length} members · {pendingInvites.length} pending</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button className="btn-primary-small" onClick={() => { setShowTeamModal(false); openInviteModal(); }}>
                  <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2"/></svg>
                  Invite
                </button>
                <button className="modal-close" onClick={() => setShowTeamModal(false)}>✕</button>
              </div>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <div className="team-section">
                <div className="team-section-header">
                  <h4>Active Members</h4>
                  <span className="team-section-count">{teamMembers.length}</span>
                </div>
                <div className="team-members-full">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="team-member-row">
                      <div className="member-avatar large" style={{ backgroundColor: member.color }}>
                        {member.avatar}
                        <span className={`status-indicator ${member.status}`}></span>
                      </div>
                      <div className="member-info-full">
                        <div className="member-name">{member.name}</div>
                        <div className="member-role">{member.role}</div>
                        {member.email && <div className="member-email">{member.email}</div>}
                      </div>
                      <div className="member-actions">
                        <span className={`status-pill ${member.status}`}>
                          {member.status === 'online' ? '🟢 Online' : member.status === 'away' ? '🟡 Away' : '⚫ Offline'}
                        </span>
                        {member.id > 4 && (
                          <button className="btn-remove" onClick={() => handleRemoveMember(member.id)} title="Remove member">
                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 6L18.11 19.11C18.05 19.61 17.83 20.07 17.48 20.42C17.13 20.77 16.67 20.97 16.19 21H7.81C7.33 20.97 6.87 20.77 6.52 20.42C6.17 20.07 5.95 19.61 5.89 19.11L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 6V4C9 3.73 9.11 3.48 9.29 3.29C9.48 3.11 9.73 3 10 3H14C14.27 3 14.52 3.11 14.71 3.29C14.89 3.48 15 3.73 15 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {pendingInvites.length > 0 && (
                <div className="team-section">
                  <div className="team-section-header">
                    <h4>Pending Invites</h4>
                    <span className="team-section-count pending">{pendingInvites.length}</span>
                  </div>
                  <div className="team-members-full">
                    {pendingInvites.map(invite => (
                      <div key={invite.id} className="team-member-row pending-row">
                        <div className="member-avatar large" style={{ backgroundColor: invite.color, opacity: 0.7 }}>
                          {invite.avatar}
                        </div>
                        <div className="member-info-full">
                          <div className="member-name">{invite.name}</div>
                          <div className="member-role">{invite.role}</div>
                          <div className="member-email">{invite.email}</div>
                          <div className="invite-sent-time">Invited: {invite.sentAt}</div>
                        </div>
                        <div className="member-actions">
                          <span className="status-pill pending-pill">⏳ Pending</span>
                          <button className="btn-accept" onClick={() => handleAcceptInvite(invite)}>✓ Accept</button>
                          <button className="btn-remove" onClick={() => handleRevokeInvite(invite.id)}>
                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ADD / EDIT PROJECT MODAL
      ═══════════════════════════════════════════════════════════ */}
      {showAddProject && (
        <div className="modal-overlay" onClick={() => setShowAddProject(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProject ? 'Edit Project' : 'Create New Project'}</h2>
              <button className="modal-close" onClick={() => setShowAddProject(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Project Name *</label>
                <input type="text" placeholder="Enter project name" value={projectForm.name}
                  onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
                  className={formErrors.name ? 'error' : ''} autoFocus/>
                {formErrors.name && <span className="error-text">{formErrors.name}</span>}
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Enter project description" rows="3" value={projectForm.description}
                  onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}></textarea>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Deadline *</label>
                  <input type="date" value={projectForm.deadline}
                    onChange={e => setProjectForm({ ...projectForm, deadline: e.target.value })}
                    className={formErrors.deadline ? 'error' : ''}/>
                  {formErrors.deadline && <span className="error-text">{formErrors.deadline}</span>}
                </div>
                <div className="form-group">
                  <label>Priority *</label>
                  <select value={projectForm.priority} onChange={e => setProjectForm({ ...projectForm, priority: e.target.value })}>
                    <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Team Size *</label>
                  <input type="number" placeholder="Number of members" min="1" value={projectForm.team}
                    onChange={e => setProjectForm({ ...projectForm, team: e.target.value })}
                    className={formErrors.team ? 'error' : ''}/>
                  {formErrors.team && <span className="error-text">{formErrors.team}</span>}
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={projectForm.status} onChange={e => setProjectForm({ ...projectForm, status: e.target.value })}>
                    <option value="planning">Planning</option><option value="in-progress">In Progress</option><option value="review">Review</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Total Tasks *</label>
                  <input type="number" placeholder="Number of tasks" min="1" value={projectForm.tasks}
                    onChange={e => setProjectForm({ ...projectForm, tasks: e.target.value })}
                    className={formErrors.tasks ? 'error' : ''}/>
                  {formErrors.tasks && <span className="error-text">{formErrors.tasks}</span>}
                </div>
                <div className="form-group">
                  <label>Completed Tasks</label>
                  <input type="number" placeholder="Completed tasks" min="0" max={projectForm.tasks || 0}
                    value={projectForm.completedTasks}
                    onChange={e => setProjectForm({ ...projectForm, completedTasks: parseInt(e.target.value) || 0 })}/>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddProject(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveProject}>{editingProject ? 'Update Project' : 'Create Project'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          PROJECT DETAILS MODAL
      ═══════════════════════════════════════════════════════════ */}
      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedProject.name}</h2>
                <p className="modal-subtitle">{selectedProject.description}</p>
              </div>
              <button className="modal-close" onClick={() => setSelectedProject(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="project-details-grid">
                <div className="detail-card">
                  <div className="detail-label">Status</div>
                  <span className={`status-badge status-${selectedProject.status.toLowerCase().replace(' ','-')}`}>{selectedProject.status}</span>
                </div>
                <div className="detail-card">
                  <div className="detail-label">Priority</div>
                  <span className={`priority-badge priority-${selectedProject.priority}`}>
                    {selectedProject.priority === 'high' && '🔴'}{selectedProject.priority === 'medium' && '🟡'}{selectedProject.priority === 'low' && '🟢'}
                    {selectedProject.priority.toUpperCase()}
                  </span>
                </div>
                <div className="detail-card">
                  <div className="detail-label">Team Size</div>
                  <div className="detail-value">{selectedProject.team} members</div>
                </div>
                <div className="detail-card">
                  <div className="detail-label">Deadline</div>
                  <div className="detail-value">{new Date(selectedProject.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                </div>
              </div>
              <div className="detail-progress-section">
                <div className="detail-label">Progress</div>
                <div className="detail-progress-bar">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${selectedProject.progress}%`, backgroundColor: selectedProject.progress >= 75 ? '#10b981' : selectedProject.progress >= 50 ? '#f59e0b' : '#6366f1' }}></div>
                  </div>
                  <span className="progress-percentage">{selectedProject.progress}%</span>
                </div>
                <div className="tasks-summary">{selectedProject.completedTasks} of {selectedProject.tasks} tasks completed</div>
              </div>

              {/* Tasks in this project */}
              {tasks.filter(t => t.projectId === selectedProject.id).length > 0 && (
                <div className="detail-tasks-section">
                  <div className="detail-label" style={{ marginBottom: '0.75rem' }}>
                    Tasks ({tasks.filter(t => t.projectId === selectedProject.id).length})
                  </div>
                  <div className="detail-tasks-list">
                    {tasks.filter(t => t.projectId === selectedProject.id).map(task => {
                      const due = getDaysUntil(task.dueDate);
                      return (
                        <div key={task.id} className="detail-task-item">
                          <div className={`task-status-dot task-status-${task.status}`}></div>
                          <div className="detail-task-info">
                            <span className="detail-task-title">{task.title}</span>
                            {task.category && <span className="detail-task-category">{task.category}</span>}
                          </div>
                          <div className="detail-task-meta">
                            {task.assignee && (
                              <div className="task-assignee-mini" style={{ backgroundColor: task.assignee.color }} title={task.assignee.name}>
                                {task.assignee.avatar}
                              </div>
                            )}
                            <span className={`task-due-mini due-${due.cls}`}>{due.label}</span>
                            <span className={`priority-badge priority-${task.priority}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-danger" onClick={() => handleDeleteProject(selectedProject.id)}>Delete</button>
              <button className="btn-task-small" onClick={() => { setSelectedProject(null); openAddTaskModal(selectedProject.id.toString()); }}>
                + Add Task
              </button>
              <div style={{ flex: 1 }}></div>
              <button className="btn-secondary" onClick={() => setSelectedProject(null)}>Close</button>
              <button className="btn-primary" onClick={() => handleEditProject(selectedProject)}>Edit Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;