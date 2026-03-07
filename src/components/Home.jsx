import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import { getProjects, createProject, createTask, getTeamMembers } from '../services/api';

const DEFAULT_PROJECTS = [
  { id: 1, name: 'Website Redesign',       progress: 75, status: 'In Progress', team: 5,  deadline: '2026-02-15', priority: 'high',   tasks: 24, completedTasks: 18, description: 'Complete redesign of company website with modern UI/UX' },
  { id: 2, name: 'Mobile App Development', progress: 45, status: 'In Progress', team: 8,  deadline: '2026-03-20', priority: 'high',   tasks: 32, completedTasks: 14, description: 'Native mobile app for iOS and Android platforms' },
  { id: 3, name: 'Marketing Campaign',     progress: 90, status: 'Review',      team: 3,  deadline: '2026-02-10', priority: 'medium', tasks: 15, completedTasks: 13, description: 'Q1 marketing campaign for new product launch' },
  { id: 4, name: 'Database Migration',     progress: 30, status: 'Planning',    team: 4,  deadline: '2026-04-01', priority: 'low',    tasks: 20, completedTasks: 6,  description: 'Migrate legacy database to cloud infrastructure' },
  { id: 5, name: 'Security Audit',         progress: 60, status: 'In Progress', team: 2,  deadline: '2026-02-25', priority: 'high',   tasks: 12, completedTasks: 7,  description: 'Comprehensive security audit and vulnerability assessment' },
];

const DEFAULT_TEAM = [
  { id: 1, name: 'Sarah Chen',  role: 'Lead Designer',   avatar: 'SC', status: 'online',  color: '#6366f1' },
  { id: 2, name: 'Mike Ross',   role: 'Backend Dev',     avatar: 'MR', status: 'online',  color: '#10b981' },
  { id: 3, name: 'Emily Davis', role: 'Project Manager', avatar: 'ED', status: 'away',    color: '#f59e0b' },
  { id: 4, name: 'John Smith',  role: 'Frontend Dev',    avatar: 'JS', status: 'offline', color: '#ec4899' },
];

const Home = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [toast, setToast]               = useState({ show: false, message: '', type: '' });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);

const [projects, setProjects] = useState([]);
const [teamMembers, setTeamMembers] = useState([]);
const [tasks, setTasks] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const [projRes, teamRes] = await Promise.all([
        getProjects(),
        getTeamMembers(),
      ]);
      if (projRes.success) setProjects(projRes.projects);
      if (teamRes.success) setTeamMembers(teamRes.members.map(m => ({
        id: m._id,
        name: m.user?.name || 'Unknown',
        role: m.role,
        avatar: m.user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) || '??',
        status: m.availability === 'Available' ? 'online' : m.availability === 'Busy' ? 'away' : 'offline',
        color: '#6366f1',
      })));
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New task assigned',    message: 'You have been assigned to "API Integration"', time: '10 min ago', read: false, type: 'task' },
    { id: 2, title: 'Deadline approaching', message: 'Marketing Campaign due in 2 days',             time: '1 hr ago',   read: false, type: 'warning' },
    { id: 3, title: 'Comment received',     message: 'Mike commented on your task',                  time: '3 hrs ago',  read: true,  type: 'comment' },
  ]);

  // New Project mini-form
  const [newProject, setNewProject] = useState({ name: '', priority: 'medium', deadline: '' });
  const [newProjectErr, setNewProjectErr] = useState({});

  // New Task mini-form
  const [newTask, setNewTask] = useState({ title: '', projectId: '', assigneeId: '', dueDate: '' });
  const [newTaskErr, setNewTaskErr] = useState({});

  // Invite mini-form
  const [inviteForm, setInviteForm] = useState({ name: '', email: '' });
  const [inviteErr, setInviteErr]   = useState({});

  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // ── Derived stats (live from localStorage) ─────────────────────
  const totalProjects  = projects.length;
  const activeTasks    = projects.reduce((s, p) => s + (p.tasks - p.completedTasks), 0);
  const totalMembers   = teamMembers.length;
  const avgProgress    = projects.length
    ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)
    : 0;

  const quickStats = [
    { label: 'Total Projects', value: totalProjects.toString(),  icon: '📊', color: '#6366f1' },
    { label: 'Active Tasks',   value: activeTasks.toString(),    icon: '✓',  color: '#10b981' },
    { label: 'Team Members',   value: totalMembers.toString(),   icon: '👥', color: '#f59e0b' },
    { label: 'Avg Progress',   value: `${avgProgress}%`,         icon: '🎯', color: '#ec4899' },
  ];

 const recentProjects = [...projects].slice(0, 3);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Quick Create Project ───────────────────────────────────────
  const handleQuickCreateProject = async () => {
  const errors = {};
  if (!newProject.name.trim()) errors.name = 'Name is required';
  if (!newProject.deadline) errors.deadline = 'Deadline is required';
  if (Object.keys(errors).length) { setNewProjectErr(errors); return; }

  try {
    const result = await createProject({
      name: newProject.name.trim(),
      priority: newProject.priority,
      dueDate: newProject.deadline,
      status: 'Planning',
    });
    if (result.success) {
      setProjects(prev => [result.project, ...prev]);
      setNewProject({ name: '', priority: 'medium', deadline: '' });
      setNewProjectErr({});
      setShowAddProjectModal(false);
      showToast(`Project "${result.project.name}" created! 🎉`);
    }
  } catch (err) {
    showToast('Failed to create project', 'error');
  }
};

  // ── Quick Create Task ──────────────────────────────────────────
const handleQuickCreateTask = async () => {
  const errors = {};
  if (!newTask.title.trim()) errors.title = 'Title is required';
  if (!newTask.projectId) errors.projectId = 'Select a project';
  if (!newTask.dueDate) errors.dueDate = 'Due date is required';
  if (Object.keys(errors).length) { setNewTaskErr(errors); return; }

  try {
    const result = await createTask({
      title: newTask.title.trim(),
      project: newTask.projectId,
      assignedTo: newTask.assigneeId || undefined,
      dueDate: newTask.dueDate,
      priority: 'medium',
    });
    if (result.success) {
      setNewTask({ title: '', projectId: '', assigneeId: '', dueDate: '' });
      setNewTaskErr({});
      setShowAddTaskModal(false);
      showToast(`Task "${result.task.title}" added! ✅`);
    }
  } catch (err) {
    showToast('Failed to create task', 'error');
  }
};

  // ── Quick Invite ───────────────────────────────────────────────
  const handleQuickInvite = () => {
    const errors = {};
    if (!inviteForm.name.trim()) errors.name = 'Name is required';
    if (!inviteForm.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email)) errors.email = 'Invalid email';
    if (Object.keys(errors).length) { setInviteErr(errors); return; }

    const existing = JSON.parse(localStorage.getItem('planora_invites') || '[]');
    const invite = {
      id: Date.now(), name: inviteForm.name.trim(),
      email: inviteForm.email.trim().toLowerCase(),
      role: 'Frontend Dev', avatar: inviteForm.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2),
      color: '#14b8a6', status: 'pending', sentAt: new Date().toLocaleString(),
    };
    localStorage.setItem('planora_invites', JSON.stringify([...existing, invite]));
    setNotifications(prev => [{
      id: Date.now(), title: 'Invite Sent',
      message: `Invitation sent to ${invite.name}`,
      time: 'Just now', read: false, type: 'task',
    }, ...prev]);
    setInviteForm({ name: '', email: '' });
    setInviteErr({});
    setShowInviteModal(false);
    showToast(`Invite sent to ${invite.name}! 📧`);
  };

  const markAllRead = () => setNotifications(n => n.map(x => ({ ...x, read: true })));

  const getStatusClass = (status) =>
    'status-' + (status || '').toLowerCase().replace(/\s+/g, '-');

  const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

  return (
    <div className="home-container">

      {/* Toast */}
      {toast.show && (
        <div className={`home-toast home-toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            {/* FIXED: was TF, now P */}
            <div className="logo-icon">P</div>
            {sidebarOpen && <span className="logo-text">Planora</span>}
          </div>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item active" onClick={e => { e.preventDefault(); navigate('/home'); }}>
            <svg viewBox="0 0 24 24" fill="none"><path d="M3 9L12 2L21 9V20C21 20.53 20.79 21.04 20.41 21.41C20.04 21.79 19.53 22 19 22H5C4.47 22 3.96 21.79 3.59 21.41C3.21 21.04 3 20.53 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {sidebarOpen && <span>Home</span>}
          </a>
          <a href="#" className="nav-item" onClick={e => { e.preventDefault(); navigate('/dashboard'); }}>
            <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {sidebarOpen && <span>Dashboard</span>}
          </a>
          <a href="#" className="nav-item" onClick={e => { e.preventDefault(); navigate('/projects'); }}>
            <svg viewBox="0 0 24 24" fill="none"><path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12V19C21 19.53 20.79 20.04 20.41 20.41C20.04 20.79 19.53 21 19 21H5C4.47 21 3.96 20.79 3.59 20.41C3.21 20.04 3 19.53 3 19V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {sidebarOpen && <span>Projects</span>}
          </a>
          <a href="#" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none"><path d="M17 21V19C17 17.93 16.58 16.92 15.83 16.17C15.08 15.42 14.06 15 13 15H5C3.93 15 2.92 15.42 2.17 16.17C1.42 16.92 1 17.93 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg>
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

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="main-content">

        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(o => !o)}>
              <svg viewBox="0 0 24 24" fill="none"><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            <h2>Welcome Back!</h2>
          </div>
          <div className="header-right">
            <button className="icon-button" title="Notifications">
              <svg viewBox="0 0 24 24" fill="none"><path d="M18 8C18 6.41 17.37 4.88 16.24 3.76C15.12 2.63 13.59 2 12 2C10.41 2 8.88 2.63 7.76 3.76C6.63 4.88 6 6.41 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2"/><path d="M13.73 21C13.55 21.3 13.3 21.55 12.99 21.73C12.69 21.9 12.35 22 12 22C11.65 22 11.31 21.9 11.01 21.73C10.7 21.55 10.45 21.3 10.27 21" stroke="currentColor" strokeWidth="2"/></svg>
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
            <div className="user-menu">
              <div className="user-avatar">
                <img src="https://ui-avatars.com/api/?name=Admin+User&background=14b8a6&color=fff" alt="User"/>
              </div>
              <div className="user-info">
                <span className="user-name">{JSON.parse(localStorage.getItem('planora_user'))?.name || 'User'}</span>
                <span className="user-role">{JSON.parse(localStorage.getItem('planora_user'))?.role || 'Member'}</span>
              </div>
              <button className="dropdown-button" onClick={onLogout} title="Logout">
                <svg viewBox="0 0 24 24" fill="none"><path d="M9 21H5C4.47 21 3.96 20.79 3.59 20.41C3.21 20.04 3 19.53 3 19V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H9" stroke="currentColor" strokeWidth="2"/><path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2"/><path d="M21 12H9" stroke="currentColor" strokeWidth="2"/></svg>
              </button>
            </div>
          </div>
        </header>

        {/* Home Content */}
        <div className="home-content">

          {/* Welcome Banner */}
          <div className="welcome-banner">
            <div className="banner-content">
              <div className="banner-eyebrow">👋 Hello, Admin</div>
              <h1>Welcome to Planora</h1>
              <p>You have <strong>{activeTasks} active tasks</strong> across <strong>{totalProjects} projects</strong>. Here's your overview for today.</p>
              <div className="banner-actions">
                <button className="btn-primary" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                  <svg viewBox="0 0 24 24" fill="none"><path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button className="btn-secondary-home" onClick={() => navigate('/projects')}>
                  View Projects
                </button>
              </div>
            </div>
            <div className="banner-illustration">
              <div className="floating-card card-1">
                <div className="mini-stat-label">Projects</div>
                <div className="mini-stat-value">{totalProjects}</div>
                <div className="mini-bar"><div className="mini-bar-fill" style={{ width: `${avgProgress}%` }}></div></div>
              </div>
              <div className="floating-card card-2">
                <div className="mini-stat-label">Team</div>
                <div className="mini-stat-value">{totalMembers}</div>
                <div className="mini-avatars">
                  {teamMembers.slice(0,3).map(m => (
                    <div key={m.id} className="mini-avatar" style={{ background: m.color }}>{m.avatar}</div>
                  ))}
                </div>
              </div>
              <div className="floating-card card-3">
                <div className="mini-stat-label">Progress</div>
                <div className="mini-stat-value">{avgProgress}%</div>
                <div className="mini-progress-ring">
                  <svg viewBox="0 0 40 40" width="40" height="40">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4"/>
                    <circle cx="20" cy="20" r="16" fill="none" stroke="#14b8a6" strokeWidth="4"
                      strokeDasharray={`${avgProgress * 1.005} 100.5`}
                      strokeLinecap="round" transform="rotate(-90 20 20)"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            {quickStats.map((stat, i) => (
              <div key={i} className="stat-card" onClick={() => navigate('/dashboard')}>
                <div className="stat-icon" style={{ backgroundColor: `${stat.color}18`, color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
                <div className="stat-arrow">→</div>
              </div>
            ))}
          </div>

          {/* Recent Projects — LIVE */}
          <div className="recent-projects-preview">
            <div className="section-header">
              <h2>Recent Projects</h2>
              <button className="btn-link" onClick={() => navigate('/projects')}>View All →</button>
            </div>
            {recentProjects.length === 0 ? (
              <div className="empty-home-state">
                <div className="empty-home-icon">📂</div>
                <p>No projects yet. Create your first one!</p>
                <button className="btn-primary" onClick={() => setShowAddProjectModal(true)}>Create Project</button>
              </div>
            ) : (
              <div className="projects-grid">
                {recentProjects.map(project => (
                  <div key={project.id} className="project-card" onClick={() => navigate('/projects')}>
                    <div className="project-card-top">
                      <h3>{project.name}</h3>
                      <div className={`priority-dot`} style={{ background: priorityColor[project.priority] || '#6b7280' }} title={project.priority}></div>
                    </div>
                    <span className={`status-badge ${getStatusClass(project.status)}`}>{project.status}</span>
                    {project.description && <p className="project-desc">{project.description}</p>}
                    <div className="project-meta-row">
                      <span>👥 {project.team} members</span>
                      <span>✓ {project.completedTasks}/{project.tasks} tasks</span>
                    </div>
                    <div className="project-progress">
                      <div className="progress-info">
                        <span>Progress</span>
                        <span className="progress-pct">{project.progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${project.progress}%`,
                            background: project.progress >= 75 ? 'linear-gradient(90deg,#10b981,#059669)' :
                                        project.progress >= 50 ? 'linear-gradient(90deg,#f59e0b,#d97706)' :
                                        'linear-gradient(90deg,#6366f1,#4f46e5)'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions — ALL WIRED UP */}
          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              <button className="action-card" onClick={() => setShowAddProjectModal(true)}>
                <div className="action-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>📝</div>
                <div className="action-text">
                  <h3>Create Project</h3>
                  <p>Start a new project</p>
                </div>
                <div className="action-arrow">→</div>
              </button>
              <button className="action-card" onClick={() => setShowAddTaskModal(true)}>
                <div className="action-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' }}>✅</div>
                <div className="action-text">
                  <h3>Add Task</h3>
                  <p>Create a new task</p>
                </div>
                <div className="action-arrow">→</div>
              </button>
              <button className="action-card" onClick={() => setShowInviteModal(true)}>
                <div className="action-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#fcd34d' }}>👥</div>
                <div className="action-text">
                  <h3>Invite Team</h3>
                  <p>Add team members</p>
                </div>
                <div className="action-arrow">→</div>
              </button>
              <button className="action-card" onClick={() => navigate('/dashboard')}>
                <div className="action-icon" style={{ background: 'rgba(236,72,153,0.15)', color: '#f9a8d4' }}>📊</div>
                <div className="action-text">
                  <h3>View Reports</h3>
                  <p>Check analytics</p>
                </div>
                <div className="action-arrow">→</div>
              </button>
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="recent-notifications">
            <div className="section-header">
              <h2>Recent Notifications</h2>
              {unreadCount > 0 && (
                <button className="btn-link" onClick={markAllRead}>Mark all read</button>
              )}
            </div>
            <div className="notif-list">
              {notifications.slice(0, 4).map(n => (
                <div key={n.id} className={`notif-item ${n.read ? 'read' : ''}`}>
                  <div className={`notif-dot ${n.type}`}></div>
                  <div className="notif-body">
                    <strong>{n.title}</strong>
                    <span>{n.message}</span>
                  </div>
                  <span className="notif-time">{n.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>{/* /home-content */}
      </div>{/* /main-content */}

      {/* ═══════════════ ADD PROJECT MODAL ═══════════════ */}
      {showAddProjectModal && (
        <div className="home-modal-overlay" onClick={() => setShowAddProjectModal(false)}>
          <div className="home-modal" onClick={e => e.stopPropagation()}>
            <div className="home-modal-header">
              <h3>Create New Project</h3>
              <button className="home-modal-close" onClick={() => setShowAddProjectModal(false)}>✕</button>
            </div>
            <div className="home-modal-body">
              <div className="hform-group">
                <label>Project Name *</label>
                <input
                  type="text" placeholder="e.g. Mobile App Redesign"
                  value={newProject.name} autoFocus
                  onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                  className={newProjectErr.name ? 'error' : ''}
                />
                {newProjectErr.name && <span className="herror">{newProjectErr.name}</span>}
              </div>
              <div className="hform-row">
                <div className="hform-group">
                  <label>Priority</label>
                  <select value={newProject.priority} onChange={e => setNewProject({ ...newProject, priority: e.target.value })}>
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
                <div className="hform-group">
                  <label>Deadline *</label>
                  <input
                    type="date" value={newProject.deadline}
                    onChange={e => setNewProject({ ...newProject, deadline: e.target.value })}
                    className={newProjectErr.deadline ? 'error' : ''}
                  />
                  {newProjectErr.deadline && <span className="herror">{newProjectErr.deadline}</span>}
                </div>
              </div>
            </div>
            <div className="home-modal-footer">
              <button className="hbtn-secondary" onClick={() => setShowAddProjectModal(false)}>Cancel</button>
              <button className="hbtn-primary" onClick={handleQuickCreateProject}>Create Project</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ ADD TASK MODAL ═══════════════ */}
      {showAddTaskModal && (
        <div className="home-modal-overlay" onClick={() => setShowAddTaskModal(false)}>
          <div className="home-modal" onClick={e => e.stopPropagation()}>
            <div className="home-modal-header">
              <h3>Add New Task</h3>
              <button className="home-modal-close" onClick={() => setShowAddTaskModal(false)}>✕</button>
            </div>
            <div className="home-modal-body">
              <div className="hform-group">
                <label>Task Title *</label>
                <input
                  type="text" placeholder="e.g. Design login screen" autoFocus
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  className={newTaskErr.title ? 'error' : ''}
                />
                {newTaskErr.title && <span className="herror">{newTaskErr.title}</span>}
              </div>
              <div className="hform-group">
                <label>Project *</label>
                <select
                  value={newTask.projectId}
                  onChange={e => setNewTask({ ...newTask, projectId: e.target.value })}
                  className={newTaskErr.projectId ? 'error' : ''}
                >
                  <option value="">— Select project —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {newTaskErr.projectId && <span className="herror">{newTaskErr.projectId}</span>}
              </div>
              <div className="hform-row">
                <div className="hform-group">
                  <label>Assign To</label>
                  <select value={newTask.assigneeId} onChange={e => setNewTask({ ...newTask, assigneeId: e.target.value })}>
                    <option value="">Unassigned</option>
                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name} · {m.role}</option>)}
                  </select>
                </div>
                <div className="hform-group">
                  <label>Due Date *</label>
                  <input
                    type="date" value={newTask.dueDate}
                    onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className={newTaskErr.dueDate ? 'error' : ''}
                  />
                  {newTaskErr.dueDate && <span className="herror">{newTaskErr.dueDate}</span>}
                </div>
              </div>
            </div>
            <div className="home-modal-footer">
              <button className="hbtn-secondary" onClick={() => setShowAddTaskModal(false)}>Cancel</button>
              <button className="hbtn-primary" onClick={handleQuickCreateTask}>Add Task</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ INVITE MODAL ═══════════════ */}
      {showInviteModal && (
        <div className="home-modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="home-modal" onClick={e => e.stopPropagation()}>
            <div className="home-modal-header">
              <h3>Invite Team Member</h3>
              <button className="home-modal-close" onClick={() => setShowInviteModal(false)}>✕</button>
            </div>
            <div className="home-modal-body">
              <div className="hform-group">
                <label>Full Name *</label>
                <input
                  type="text" placeholder="e.g. Alex Johnson" autoFocus
                  value={inviteForm.name}
                  onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className={inviteErr.name ? 'error' : ''}
                />
                {inviteErr.name && <span className="herror">{inviteErr.name}</span>}
              </div>
              <div className="hform-group">
                <label>Email Address *</label>
                <input
                  type="email" placeholder="e.g. alex@company.com"
                  value={inviteForm.email}
                  onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className={inviteErr.email ? 'error' : ''}
                />
                {inviteErr.email && <span className="herror">{inviteErr.email}</span>}
              </div>
            </div>
            <div className="home-modal-footer">
              <button className="hbtn-secondary" onClick={() => setShowInviteModal(false)}>Cancel</button>
              <button className="hbtn-primary" onClick={handleQuickInvite}>Send Invite</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;