import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { io } from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';
import './Notifications.css';

// Axios Instance Configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('planora_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Inline SVG Icon Sets
const NotifIcons = {
  project_created: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z"/></svg>
  ),
  project_updated: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
  ),
  project_deleted: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
  ),
  task_created: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
  ),
  task_updated: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
  ),
  task_completed: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
  ),
  task_deleted: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
  ),
  member_added: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
  ),
  member_removed: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12H15"/></svg>
  ),
  comment_added: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
  )
};

const Notifications = () => {
  const { logout, user } = useAuth();
  const { notifications: globalNotifs = [], fetchData: syncGlobalContext } = useData();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [localNotifs, setLocalNotifs] = useState([]);
  const [localPage, setLocalPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);

  // Unread badge counts calculated locally for filters
  const unreadCount = useMemo(() => {
    return localNotifs.filter(n => !n.read).length;
  }, [localNotifs]);

  // Fetch paginated notifications from MERN server
  const fetchLocalNotifications = async (pageToLoad = 1, appendMode = false) => {
    if (pageToLoad === 1) {
      setLocalLoading(true);
    } else {
      setLoadMoreLoading(true);
    }

    try {
      const res = await api.get(`/notifications?page=${pageToLoad}&limit=20`);
      if (res.data && res.data.success) {
        const list = res.data.notifications;
        if (appendMode) {
          setLocalNotifs(prev => [...prev, ...list]);
        } else {
          setLocalNotifs(list);
        }
        setHasMore(res.data.page < res.data.pages);
        setLocalPage(res.data.page);
      }
    } catch (err) {
      toast.error('Failed to load notifications');
      console.error(err);
    } finally {
      setLocalLoading(false);
      setLoadMoreLoading(false);
    }
  };

  // Initial Fetch on Mount
  useEffect(() => {
    fetchLocalNotifications(1, false);
  }, []);

  // Connect and handle Socket.io room events in real-time
  useEffect(() => {
    const socket = io('http://localhost:5000', { withCredentials: true });

    // Join room of the logged-in user
    if (user && user._id) {
      socket.emit('join', user._id.toString());

      // Listen for room-based new notifications
      socket.on('newNotification', (newNotif) => {
        setLocalNotifs(prev => [newNotif, ...prev]);
        toast.success(`New activity: ${newNotif.title || 'Notification received'}`);
        syncGlobalContext(); // Decrement badges elsewhere
      });

      // Maintain legacy backup channel just in case
      socket.on(`new_notification_${user._id}`, (newNotif) => {
        setLocalNotifs(prev => {
          if (prev.some(x => x._id === newNotif._id)) return prev;
          return [newNotif, ...prev];
        });
        syncGlobalContext();
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [user, syncGlobalContext]);

  // Action: Mark single notification as read
  const handleMarkRead = async (notifId) => {
    try {
      const res = await api.put(`/notifications/${notifId}/read`);
      if (res.data && res.data.success) {
        setLocalNotifs(prev => 
          prev.map(n => n._id === notifId ? { ...n, read: true } : n)
        );
        syncGlobalContext();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Action: Mark ALL as read
  const handleMarkAllRead = async () => {
    try {
      const res = await api.put('/notifications/read-all');
      if (res.data && res.data.success) {
        setLocalNotifs(prev => prev.map(n => ({ ...n, read: true })));
        toast.success('All notifications marked as read');
        syncGlobalContext();
      }
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  // Action: Delete single notification
  const handleDeleteNotification = async (e, notifId) => {
    e.stopPropagation(); // Avoid triggering card click
    try {
      const res = await api.delete(`/notifications/${notifId}`);
      if (res.data && res.data.success) {
        setLocalNotifs(prev => prev.filter(n => n._id !== notifId));
        toast.success('Notification deleted');
        syncGlobalContext();
      }
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  // Action: Clear ALL notifications
  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications? This cannot be undone.')) return;
    try {
      const res = await api.delete('/notifications/clear-all');
      if (res.data && res.data.success) {
        setLocalNotifs([]);
        toast.success('All notifications cleared');
        syncGlobalContext();
      }
    } catch (err) {
      toast.error('Failed to clear notifications');
    }
  };

  // Action: Click single notification card
  const handleNotifClick = (notif) => {
    if (!notif.read) {
      handleMarkRead(notif._id);
    }
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  // ── FILTER TABS EVALUATIONS ──
  const filteredNotifs = useMemo(() => {
    return localNotifs.filter(n => {
      if (activeTab === 'All') return true;
      if (activeTab === 'Unread') return !n.read;
      if (activeTab === 'Projects') return n.type?.startsWith('project_');
      if (activeTab === 'Tasks') return n.type?.startsWith('task_');
      if (activeTab === 'Team') return n.type?.startsWith('member_');
      return true;
    });
  }, [localNotifs, activeTab]);

  // Relative timestamp formatter
  const formatTimestamp = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;

    // Yesterday Check
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Icon mapping resolver with fallback
  const getIcon = (type) => {
    return NotifIcons[type] || (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
    );
  };

  // Background colors resolved based on notification category
  const getIconStyle = (type) => {
    if (type?.startsWith('project_')) {
      if (type === 'project_deleted') return { background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' };
      return { background: 'rgba(0, 180, 166, 0.12)', color: '#00b4a6' };
    }
    if (type?.startsWith('task_')) {
      if (type === 'task_completed') return { background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' };
      if (type === 'task_deleted') return { background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' };
      return { background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' };
    }
    if (type?.startsWith('member_')) {
      if (type === 'member_removed') return { background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' };
      return { background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' };
    }
    if (type === 'comment_added') {
      return { background: 'rgba(0, 180, 166, 0.12)', color: '#00b4a6' };
    }
    return { background: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1' };
  };

  // Resolves empty state icons/details dynamically
  const getEmptyStateDetails = () => {
    if (activeTab === 'Unread') {
      return { icon: '✅', title: 'All caught up!', subtitle: 'No unread notifications' };
    }
    if (activeTab === 'Projects') {
      return { icon: '📁', title: 'No project activity yet', subtitle: 'Project creations and status updates appear here' };
    }
    if (activeTab === 'Tasks') {
      return { icon: '✓', title: 'No task activity yet', subtitle: 'Task creations, updates, and completions appear here' };
    }
    if (activeTab === 'Team') {
      return { icon: '👥', title: 'No team activity yet', subtitle: 'Member updates and org events appear here' };
    }
    return {
      icon: '🔔',
      title: "You're all caught up!",
      subtitle: "Notifications will appear here when there's activity in your workspace"
    };
  };

  // Global unread notifications badge for sidebar sync
  const globalUnreadCount = useMemo(() => {
    return globalNotifs.filter(n => !n.read).length;
  }, [globalNotifs]);

  return (
    <div className="notif-container">
      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">P</div>
            {sidebarOpen && <span className="logo-text">Planora</span>}
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
          <a href="#" className="nav-item" onClick={e => { e.preventDefault(); navigate('/team'); }}>
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
          <a href="#" className="nav-item active" onClick={e => e.preventDefault()}>
            <svg viewBox="0 0 24 24" fill="none"><path d="M18 8C18 6.41 17.37 4.88 16.24 3.76C15.12 2.63 13.59 2 12 2C10.41 2 8.88 2.63 7.76 3.76C6.63 4.88 6 6.41 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21C13.55 21.3 13.3 21.55 12.99 21.73C12.69 21.9 12.35 22 12 22C11.65 22 11.31 21.9 11.01 21.73C10.7 21.55 10.45 21.3 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {sidebarOpen && (
              <div className="sidebar-notif-label">
                <span>Notifications</span>
                {globalUnreadCount > 0 && <span className="sidebar-notif-badge">{globalUnreadCount}</span>}
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

      {/* ── Main Panel Area ── */}
      <div className="notif-main">
        {/* Header */}
        <header className="notif-header">
          <div className="notif-header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(o => !o)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            <div>
              <h2>Notifications</h2>
              <span className="team-header-sub">
                Track your team's progress and project health
              </span>
            </div>
          </div>
          <div className="notif-header-right">
            {localNotifs.length > 0 && (
              <>
                <button className="notif-action-btn" onClick={handleMarkAllRead} title="Mark all notifications read">
                  Mark All Read
                </button>
                <button className="notif-action-btn primary" onClick={handleClearAll} title="Clear all notifications">
                  Clear All
                </button>
              </>
            )}
            <div className="user-pill" onClick={logout} title="Logout">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin User')}&background=14b8a6&color=fff`}
                alt="avatar"
              />
            </div>
          </div>
        </header>

        {/* Content Layout */}
        <div className="notif-layout">
          {/* Left panel tabs filters */}
          <div className="notif-filters-sidebar">
            <button
              className={`notif-tab ${activeTab === 'All' ? 'active' : ''}`}
              onClick={() => setActiveTab('All')}
            >
              <span>All Activity</span>
            </button>
            <button
              className={`notif-tab ${activeTab === 'Unread' ? 'active' : ''}`}
              onClick={() => setActiveTab('Unread')}
            >
              <span>Unread</span>
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>
            <button
              className={`notif-tab ${activeTab === 'Projects' ? 'active' : ''}`}
              onClick={() => setActiveTab('Projects')}
            >
              <span>Projects</span>
            </button>
            <button
              className={`notif-tab ${activeTab === 'Tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('Tasks')}
            >
              <span>Tasks</span>
            </button>
            <button
              className={`notif-tab ${activeTab === 'Team' ? 'active' : ''}`}
              onClick={() => setActiveTab('Team')}
            >
              <span>Team</span>
            </button>
          </div>

          {/* Right panel Scrollable notifications list */}
          <div className="notif-list-wrapper">
            {localLoading ? (
              // 5 Placeholder Skeletons
              [1, 2, 3, 4, 5].map(i => (
                <div className="notif-skeleton-item" key={i}>
                  <div className="skel-circle skel-shimmer" />
                  <div className="skel-content">
                    <div className="skel-bar-title skel-shimmer" />
                    <div className="skel-bar-message skel-shimmer" />
                  </div>
                  <div className="skel-bar-time skel-shimmer" />
                </div>
              ))
            ) : filteredNotifs.length > 0 ? (
              <>
                {filteredNotifs.map(notif => (
                  <div
                    className={`notif-item ${notif.read ? '' : 'unread'}`}
                    key={notif._id}
                    onClick={() => handleNotifClick(notif)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Left Icon box */}
                    <div className="notif-icon-box" style={getIconStyle(notif.type)}>
                      {getIcon(notif.type)}
                    </div>

                    {/* Middle Details column */}
                    <div className="notif-content-area">
                      <h4 className="notif-title">{notif.title}</h4>
                      <p className="notif-message">{notif.message}</p>
                      {notif.actionUrl && (
                        <button
                          className="notif-action-link-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotifClick(notif);
                          }}
                        >
                          View details
                          <svg viewBox="0 0 24 24" fill="none" width="12" height="12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </button>
                      )}
                    </div>

                    {/* Right Meta Column */}
                    <div className="notif-meta-col">
                      <span className="notif-time">{formatTimestamp(notif.createdAt)}</span>
                      <div className="notif-right-actions">
                        {!notif.read && <span className="unread-glow-dot" />}
                        <button
                          className="notif-delete-btn"
                          onClick={(e) => handleDeleteNotification(e, notif._id)}
                          title="Delete notification"
                        >
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Paginated Load More Button */}
                {hasMore && (
                  <div className="load-more-container">
                    <button
                      className="load-more-btn"
                      onClick={() => fetchLocalNotifications(localPage + 1, true)}
                      disabled={loadMoreLoading}
                    >
                      {loadMoreLoading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              // Empty State matching tab type
              (() => {
                const empty = getEmptyStateDetails();
                return (
                  <div className="notif-empty-card">
                    <span className="notif-empty-icon">{empty.icon}</span>
                    <h3 className="notif-empty-title">{empty.title}</h3>
                    <p className="notif-empty-subtitle">{empty.subtitle}</p>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
