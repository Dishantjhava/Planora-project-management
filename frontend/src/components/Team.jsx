import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Team.css';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { removeTeamMember } from '../services/api.js';
import { SkeletonDashboard } from './Skeleton';
import LogoIcon from './icons/LogoIcon';
import LogoText from './icons/LogoText';

const AVATAR_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ec4899',
  '#8b5cf6', '#14b8a6', '#ef4444', '#0891b2'
];

const ROLES = [
  'Admin', 'Project Manager', 'Developer', 'Designer', 'QA'
];

const Team = () => {
  const { logout, user } = useAuth();
  const { teamMembers, setTeamMembers, pendingInvites, setPendingInvites, tasks, projects = [], loading, notifications = [] } = useData();
  const navigate = useNavigate();
  const unreadCount = notifications.filter(n => !n.read).length;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast]             = useState({ show: false, message: '', type: '' });

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter]   = useState('All');

  // Profile modal states
  const [selectedMember, setSelectedMember] = useState(null);
  const [editRole, setEditRole]             = useState('');
  const [activeMenuId, setActiveMenuId]     = useState(null);

  // Close action menus on click outside
  React.useEffect(() => {
    const handleGlobalClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Form states
  const [inviteForm, setInviteForm]   = useState({ name: '', email: '', role: 'Developer' });
  const [inviteErrors, setInviteErrors] = useState({});

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const toStr = (val) => {
    if (!val) return '';
    if (typeof val === 'object') return val._id?.toString() || val.toString();
    return val.toString();
  };

  const getInitials = (name) =>
    name.trim().split(' ').slice(0, 2).map(w => w[0].toUpperCase()).join('');

  // ── Invite Validation & Submission ──────────────────────────────
  const validateInvite = () => {
    const errors = {};
    if (!inviteForm.name.trim())  errors.name  = 'Name is required';
    if (!inviteForm.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email))
      errors.email = 'Enter a valid email';
    else if (teamMembers.some(m => m.email?.toLowerCase() === inviteForm.email.toLowerCase()) ||
             pendingInvites.some(i => i.email?.toLowerCase() === inviteForm.email.toLowerCase()))
      errors.email = 'This email has already been added';
    setInviteErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendInvite = (e) => {
    e.preventDefault();
    if (!validateInvite()) return;
    
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const invite = {
      id: Date.now(),
      name: inviteForm.name.trim(),
      email: inviteForm.email.trim().toLowerCase(),
      role: inviteForm.role,
      avatar: getInitials(inviteForm.name),
      color,
      status: 'pending',
      sentAt: new Date().toLocaleDateString()
    };
    
    setPendingInvites(prev => [...prev, invite]);
    showToast(`Member ${invite.name} added! 🎉`);
    setInviteForm({ name: '', email: '', role: 'Developer' });
    setInviteErrors({});
  };

  const handleAcceptInvite = (invite) => {
    setTeamMembers(prev => [...prev, { ...invite, status: 'offline' }]);
    setPendingInvites(prev => prev.filter(i => i.id !== invite.id));
    showToast(`${invite.name}'s membership activated! 🎉`);
  };

  const handleRevokeInvite = (inviteId) => {
    setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
    showToast('Pending member removed.', 'error');
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;
    try {
      await removeTeamMember(memberId);
      setTeamMembers(prev => prev.filter(m => m.id !== memberId));
      showToast('Team member removed.', 'error');
    } catch (err) {
      // Fallback local cleanup if API has issues
      setTeamMembers(prev => prev.filter(m => m.id !== memberId));
      showToast('Removed member locally.', 'error');
    }
  };

  const handleSaveRole = () => {
    if (!selectedMember) return;
    setTeamMembers(prev => prev.map(m => m.id === selectedMember.id ? { ...m, role: editRole } : m));
    showToast(`${selectedMember.name}'s role updated to ${editRole}! ✏️`);
    setSelectedMember(null);
  };

  const filteredTeamMembers = useMemo(() => {
    return teamMembers.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (member.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'All' || member.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [teamMembers, searchQuery, roleFilter]);

  // ── Stats ────────────────────────────────────────────────────────
  const onlineCount = teamMembers.filter(m => m.status === 'online').length;
  const awayCount   = teamMembers.filter(m => m.status === 'away').length;

  return (
    <div className="team-container">
      {/* Toast */}
      {toast.show && (
        <div className={`team-toast team-toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <LogoIcon />
            </div>
            {sidebarOpen && <LogoText className="logo-text" />}
          </div>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item" onClick={e => { e.preventDefault(); navigate('/home'); }}>
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
          <a href="#" className="nav-item active" onClick={e => e.preventDefault()}>
            <svg viewBox="0 0 24 24" fill="none"><path d="M17 21V19C17 17.93 16.58 16.92 15.83 16.17C15.08 15.42 14.06 15 13 15H5C3.93 15 2.92 15.42 2.17 16.17C1.42 16.92 1 17.93 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg>
            {sidebarOpen && <span>Team</span>}
          </a>
          <a href="#" className="nav-item" onClick={e => { e.preventDefault(); navigate('/calendar'); }}>
            <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {sidebarOpen && <span>Calendar</span>}
          </a>
          <a href="#" className="nav-item" onClick={e => { e.preventDefault(); navigate('/reports'); }}>
            <svg viewBox="0 0 24 24" fill="none"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {sidebarOpen && <span>Reports</span>}
          </a>
          <a href="#" className="nav-item" onClick={e => { e.preventDefault(); navigate('/notifications'); }}>
            <svg viewBox="0 0 24 24" fill="none"><path d="M18 8C18 6.41 17.37 4.88 16.24 3.76C15.12 2.63 13.59 2 12 2C10.41 2 8.88 2.63 7.76 3.76C6.63 4.88 6 6.41 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21C13.55 21.3 13.3 21.55 12.99 21.73C12.69 21.9 12.35 22 12 22C11.65 22 11.31 21.9 11.01 21.73C10.7 21.55 10.45 21.3 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {sidebarOpen && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>Notifications</span>
                {unreadCount > 0 && <span className="sidebar-notif-badge" style={{ background: '#00b4a6', color: '#0f172a', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>{unreadCount}</span>}
              </div>
            )}
          </a>
        </nav>
        <div className="sidebar-footer">
          <a href="#" className="nav-item" onClick={e => { e.preventDefault(); navigate('/settings'); }}>
            <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><path d="M19.4 15A7.5 7.5 0 1 1 12 7.5" stroke="currentColor" strokeWidth="2"/></svg>
            {sidebarOpen && <span>Settings</span>}
          </a>
        </div>
      </aside>

      {/* ── Main Panel ── */}
      <div className="team-main">
        {/* Header */}
        <header className="team-header">
          <div className="team-header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(o => !o)}>
              <svg viewBox="0 0 24 24" fill="none"><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            <div>
              <h2>Team Management</h2>
              <span className="team-header-sub">{teamMembers.length} active members · {pendingInvites.length} pending approval</span>
            </div>
          </div>
          <div className="team-header-right">
            <button className="icon-button" title="Notifications" onClick={() => navigate('/notifications')} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '50%', marginRight: '0.5rem', position: 'relative' }}>
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8C18 6.41 17.37 4.88 16.24 3.76C15.12 2.63 13.59 2 12 2C10.41 2 8.88 2.63 7.76 3.76C6.63 4.88 6 6.41 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"/><path d="M13.73 21C13.55 21.3 13.3 21.55 12.99 21.73C12.69 21.9 12.35 22 12 22C11.65 22 11.31 21.9 11.01 21.73C10.7 21.55 10.45 21.3 10.27 21"/></svg>
              {unreadCount > 0 && <span className="notification-badge" style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: 'bold', borderRadius: '50%', width: '15px', height: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>}
            </button>
            <div className="user-pill" onClick={logout} title="Logout">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=14b8a6&color=fff`} alt="User"/>
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M9 21H5C4.47 21 3.96 20.79 3.59 20.41C3.21 20.04 3 19.53 3 19V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H9" stroke="currentColor" strokeWidth="2"/><path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2"/><path d="M21 12H9" stroke="currentColor" strokeWidth="2"/></svg>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="team-content">
          {loading ? (
            <SkeletonDashboard />
          ) : (
            <div className="team-layout">
              {/* Left Column: Active Members and Stats */}
              <div className="team-layout-left">
                {/* Stats Grid */}
                <div className="team-stats-grid">
                  <div className="team-stat-card border-indigo">
                    <div className="stat-num color-indigo">{teamMembers.length}</div>
                    <div className="stat-label">Active Members</div>
                  </div>
                  <div className="team-stat-card border-teal">
                    <div className="stat-num color-teal">{onlineCount}</div>
                    <div className="stat-label">Online Now</div>
                  </div>
                  <div className="team-stat-card border-gold">
                    <div className="stat-num color-gold">{awayCount}</div>
                    <div className="stat-label">Away / Busy</div>
                  </div>
                  <div className="team-stat-card border-pink">
                    <div className="stat-num color-pink">{pendingInvites.length}</div>
                    <div className="stat-label">Pending Approvals</div>
                  </div>
                </div>

                {/* Active Members Grid */}
                <div className="active-members-section">
                  <div className="active-members-header-bar">
                    <h3>Active Team Members</h3>
                    <div className="team-filter-bar">
                      <div className="search-wrapper">
                        <span className="search-icon">🔍</span>
                        <input 
                          type="text" 
                          placeholder="Search by name or email..." 
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <select 
                        value={roleFilter} 
                        onChange={e => setRoleFilter(e.target.value)}
                        className="role-filter-select"
                      >
                        <option value="All">All Roles</option>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>

                  {filteredTeamMembers.length === 0 ? (
                    <div className="empty-search-results">
                      <span className="search-empty-icon">🔍</span>
                      <h4>No members found</h4>
                      <p>Try modifying your search query or role filter</p>
                    </div>
                  ) : (
                    <div className="members-grid">
                      {filteredTeamMembers.map(member => {
                        const activeAssignedTasks = tasks.filter(
                          t => toStr(t.assigneeId || t.assignedTo) === toStr(member.id) && t.status !== 'done'
                        );
                        return (
                          <div 
                            key={member.id} 
                            className="member-card clickable" 
                            onClick={() => { setSelectedMember(member); setEditRole(member.role); }}
                          >
                            {/* Actions dropdown menu */}
                            <div className="card-actions-menu" onClick={(e) => e.stopPropagation()}>
                              <button 
                                className="menu-dot-btn" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setActiveMenuId(activeMenuId === member.id ? null : member.id); 
                                }}
                                title="Member Actions"
                              >
                                •••
                              </button>
                              {activeMenuId === member.id && (
                                <div className="menu-dropdown">
                                  <button 
                                    className="dropdown-item" 
                                    onClick={() => { 
                                      setSelectedMember(member); 
                                      setEditRole(member.role); 
                                      setActiveMenuId(null); 
                                    }}
                                  >
                                    👤 View Profile
                                  </button>
                                  {user?.email !== member.email && (
                                    <button 
                                      className="dropdown-item delete" 
                                      onClick={() => { 
                                        handleRemoveMember(member.id); 
                                        setActiveMenuId(null); 
                                      }}
                                    >
                                      🗑️ Remove
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="member-card-header">
                              <div className="member-avatar-large" style={{ backgroundColor: member.color || '#6366f1' }}>
                                {member.avatar || getInitials(member.name)}
                                <span className={`status-indicator ${member.status}`}></span>
                              </div>
                              <div className="member-card-title">
                                <h4>{member.name}</h4>
                                <span className="member-role-badge">{member.role}</span>
                              </div>
                            </div>
                            <div className="member-card-body">
                              <p className="member-email-text">✉️ {member.email || 'No email shared'}</p>
                              {activeAssignedTasks.length === 0 ? (
                                <div className="member-task-stat empty">
                                  <span className="task-icon">📋</span>
                                  <span className="task-lbl">No tasks assigned yet</span>
                                </div>
                              ) : (
                                <div className="member-task-stat">
                                  <span className="task-count">{activeAssignedTasks.length}</span>
                                  <span className="task-lbl">active tasks assigned</span>
                                </div>
                              )}
                            </div>
                            <div className="member-card-footer">
                              <span className={`status-pill ${member.status}`}>
                                {member.status === 'online' ? '🟢 Online' : member.status === 'away' ? '🟡 Away' : '⚫ Offline'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Members Section */}
              <div className="team-layout-right">
                {/* Add Member Form */}
                <div className="invite-box-card">
                  <h3>Add New Member</h3>
                  <p className="subtitle">Add a member directly to your workspace team list</p>
                  <form onSubmit={handleSendInvite} className="invite-form">
                    <div className="tform-group">
                      <label>Full Name *</label>
                      <input type="text" placeholder="e.g. Alex Johnson"
                        value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})}
                        className={inviteErrors.name ? 'error' : ''}/>
                      {inviteErrors.name && <span className="terror">{inviteErrors.name}</span>}
                    </div>
                    <div className="tform-group">
                      <label>Email Address *</label>
                      <input type="email" placeholder="e.g. alex@company.com"
                        value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                        className={inviteErrors.email ? 'error' : ''}/>
                      {inviteErrors.email && <span className="terror">{inviteErrors.email}</span>}
                    </div>
                    <div className="tform-group">
                      <label>Role</label>
                      <select value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})}>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="tbtn-primary">Add Member</button>
                  </form>
                </div>

                {/* Pending Members List */}
                <div className="pending-invites-card">
                  <h3>Pending Approvals ({pendingInvites.length})</h3>
                  {pendingInvites.length === 0 ? (
                    <div className="empty-pending">
                      <span className="icon">👤</span>
                      <p>No pending approvals</p>
                    </div>
                  ) : (
                    <div className="pending-list">
                      {pendingInvites.map(invite => (
                        <div key={invite.id} className="pending-item">
                          <div className="pending-left">
                            <div className="pending-avatar" style={{ backgroundColor: invite.color }}>
                              {invite.avatar}
                            </div>
                            <div className="pending-info">
                              <h5>{invite.name}</h5>
                              <span className="email">{invite.email}</span>
                              <span className="role">{invite.role} · added {invite.sentAt}</span>
                            </div>
                          </div>
                          <div className="pending-actions">
                            <button className="accept-btn" onClick={() => handleAcceptInvite(invite)} title="Accept">✓</button>
                            <button className="revoke-btn" onClick={() => handleRevokeInvite(invite.id)} title="Revoke">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MEMBER PROFILE MODAL ── */}
      {selectedMember && (() => {
        const memberTasks = tasks.filter(t => toStr(t.assigneeId || t.assignedTo) === toStr(selectedMember.id));
        const activeTasks = memberTasks.filter(t => t.status !== 'done');
        const completedTasks = memberTasks.filter(t => t.status === 'done');
        const completionRate = memberTasks.length 
          ? Math.round((completedTasks.length / memberTasks.length) * 100) 
          : 0;

        const involvedProjectIds = [...new Set(memberTasks.map(t => toStr(t.projectId || t.project)))];
        const involvedProjects = projects.filter(p => involvedProjectIds.includes(toStr(p._id || p.id)));

        return (
          <div className="profile-modal-overlay" onClick={() => setSelectedMember(null)}>
            <div className="profile-modal-card" onClick={e => e.stopPropagation()}>
              <button className="profile-modal-close" onClick={() => setSelectedMember(null)}>✕</button>
              
              <div className="profile-modal-header">
                <div className="profile-avatar-giant" style={{ backgroundColor: selectedMember.color || '#6366f1' }}>
                  {selectedMember.avatar || getInitials(selectedMember.name)}
                  <span className={`status-indicator ${selectedMember.status}`}></span>
                </div>
                <div className="profile-header-info">
                  <h2>{selectedMember.name}</h2>
                  <p className="profile-email">✉️ {selectedMember.email || 'No email shared'}</p>
                  <div className="profile-badges">
                    <span className={`status-pill ${selectedMember.status}`}>
                      {selectedMember.status === 'online' ? '🟢 Online' : selectedMember.status === 'away' ? '🟡 Away' : '⚫ Offline'}
                    </span>
                    <span className="member-role-badge">{selectedMember.role}</span>
                  </div>
                </div>
              </div>

              <div className="profile-modal-body">
                {/* Role Editor Section */}
                <div className="profile-section border-teal">
                  <h4>✏️ Update Workspace Role</h4>
                  <div className="profile-role-editor">
                    <select 
                      value={editRole} 
                      onChange={e => setEditRole(e.target.value)}
                      className="profile-role-select"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button className="profile-save-btn" onClick={handleSaveRole}>Save Changes</button>
                  </div>
                </div>

                {/* Stats Summary */}
                <div className="profile-stats-row">
                  <div className="profile-stat-box">
                    <span className="num color-indigo">{memberTasks.length}</span>
                    <span className="lbl">Total Tasks</span>
                  </div>
                  <div className="profile-stat-box">
                    <span className="num color-teal">{activeTasks.length}</span>
                    <span className="lbl">Active Tasks</span>
                  </div>
                  <div className="profile-stat-box">
                    <span className="num color-gold">{completionRate}%</span>
                    <span className="lbl">Completion Rate</span>
                  </div>
                </div>

                {/* Involved Projects Section */}
                <div className="profile-section">
                  <h4>💼 Involved Projects</h4>
                  {involvedProjects.length === 0 ? (
                    <p className="profile-empty-text">No active project involvements found.</p>
                  ) : (
                    <div className="profile-projects-list">
                      {involvedProjects.map(proj => (
                        <div key={proj.id || proj._id} className="profile-project-badge">
                          <span className="dot"></span>
                          <span className="name">{proj.name}</span>
                          <span className="priority-badge" style={{
                            fontSize: '0.68rem',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px',
                            background: proj.priority === 'high' ? 'rgba(239,68,68,0.15)' : proj.priority === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                            color: proj.priority === 'high' ? '#fca5a5' : proj.priority === 'medium' ? '#fde047' : '#a7f3d0',
                            marginLeft: '0.5rem',
                            textTransform: 'uppercase',
                            fontWeight: 'bold'
                          }}>{proj.priority}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assigned Tasks Table */}
                <div className="profile-section">
                  <h4>📋 Assigned Tasks</h4>
                  {memberTasks.length === 0 ? (
                    <p className="profile-empty-text">No tasks assigned to this team member.</p>
                  ) : (
                    <div className="profile-tasks-container">
                      <table className="profile-tasks-table">
                        <thead>
                          <tr>
                            <th>Task Title</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Due Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {memberTasks.map(t => (
                            <tr key={t.id || t._id}>
                              <td className="task-title-cell">{t.title}</td>
                              <td>
                                <span className={`task-prio-pill ${t.priority}`}>
                                  {t.priority}
                                </span>
                              </td>
                              <td>
                                <span className={`task-status-pill ${t.status}`}>
                                  {t.status === 'done' ? 'Done' : t.status === 'review' ? 'Review' : t.status === 'in-progress' ? 'In Progress' : 'To Do'}
                                </span>
                              </td>
                              <td className="task-date-cell">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No date'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Team;
