import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { io } from 'socket.io-client';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';
import './Reports.css';

const REPORTS_COLORS = {
  blue: '#6366f1',
  teal: '#00b4a6',
  orange: '#f59e0b',
  green: '#10b981',
  red: '#ef4444',
  purple: '#8b5cf6',
  darkGray: '#475569'
};

const Reports = () => {
  const { logout, user } = useAuth();
  const {
    projects = [],
    tasks = [],
    teamMembers = [],
    notifications = [],
    loading,
    fetchData
  } = useData();

  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedRange, setSelectedRange] = useState('All Time');
  const [sortBy, setSortBy] = useState('deadline');
  const [sortOrder, setSortOrder] = useState('asc');

  // Handle Socket real-time updates for automatic report re-rendering
  useEffect(() => {
    const socket = io('http://localhost:5000', { withCredentials: true });

    // Listen to standard task and project update triggers to refresh reports
    const handleUpdate = () => {
      fetchData();
    };

    socket.on('task_created', handleUpdate);
    socket.on('task_updated', handleUpdate);
    socket.on('task_deleted', handleUpdate);
    socket.on('taskCreated', handleUpdate);
    socket.on('taskUpdated', handleUpdate);
    socket.on('taskDeleted', handleUpdate);
    socket.on('project_created', handleUpdate);
    socket.on('project_updated', handleUpdate);
    socket.on('project_deleted', handleUpdate);
    socket.on('projectCreated', handleUpdate);
    socket.on('projectUpdated', handleUpdate);
    socket.on('projectDeleted', handleUpdate);

    return () => {
      socket.disconnect();
    };
  }, [fetchData]);

  // Unread notifications count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Utility to convert IDs to standard string representation
  const toStr = (val) => {
    if (!val) return '';
    if (typeof val === 'object') return val._id?.toString() || val.toString();
    return val.toString();
  };

  // ── 1. DATE FILTERING UTILITY (Based on createdAt) ──
  const filterByDateRange = (item) => {
    if (selectedRange === 'All Time') return true;
    const createdDate = new Date(item.createdAt || item.updatedAt || Date.now());
    const now = new Date();
    
    // Reset to start/end of days to avoid precision boundary bugs
    const diffTime = now.getTime() - createdDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (selectedRange === 'Last 7 Days') {
      return diffDays <= 7;
    }
    if (selectedRange === 'Last 30 Days') {
      return diffDays <= 30;
    }
    if (selectedRange === 'This Month') {
      return (
        createdDate.getMonth() === now.getMonth() &&
        createdDate.getFullYear() === now.getFullYear()
      );
    }
    return true;
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(filterByDateRange);
  }, [projects, selectedRange]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(filterByDateRange);
  }, [tasks, selectedRange]);

  // ── 2. KPI METRICS CALCULATIONS ──

  // KPI 1: Total Projects Count
  const totalProjectsCount = filteredProjects.length;

  // KPI 2: Completed Tasks & Completion Rate (%)
  const completedTasks = useMemo(() => {
    return filteredTasks.filter(t => 
      t.status?.toLowerCase() === 'completed' || 
      t.status?.toLowerCase() === 'done'
    );
  }, [filteredTasks]);

  const taskCompletionRate = useMemo(() => {
    if (filteredTasks.length === 0) return 0;
    return Math.round((completedTasks.length / filteredTasks.length) * 100);
  }, [filteredTasks, completedTasks]);

  // KPI 3: Active Collaborators (from system)
  const activeCollaboratorsCount = teamMembers.length;

  // KPI 4: Overdue Items (Overdue Projects + Overdue Tasks)
  const totalOverdueItems = useMemo(() => {
    const now = new Date();
    
    const overdueProjects = filteredProjects.filter(p => {
      const deadline = p.deadline || p.dueDate;
      if (!deadline || p.status === 'Completed') return false;
      return new Date(deadline) < now;
    }).length;

    const overdueTasks = filteredTasks.filter(t => {
      if (!t.dueDate) return false;
      const isDone = t.status?.toLowerCase() === 'completed' || t.status?.toLowerCase() === 'done';
      if (isDone) return false;
      return new Date(t.dueDate) < now;
    }).length;

    return overdueProjects + overdueTasks;
  }, [filteredProjects, filteredTasks]);

  // KPI 5: Productivity Score Card (Enterprise Portfolio Feature)
  const productivityMetrics = useMemo(() => {
    // A. On-Time Delivery Rate
    const completedOnTime = completedTasks.filter(t => {
      if (!t.dueDate) return true; // Treat tasks without deadlines as on-time
      const completionDate = new Date(t.updatedAt || Date.now());
      const dueDate = new Date(t.dueDate);
      return completionDate <= dueDate;
    }).length;

    const onTimeRate = completedTasks.length > 0
      ? completedOnTime / completedTasks.length
      : 1.0;

    // B. Team Utilization Rate
    const utilizedMembersCount = teamMembers.filter(m => {
      return filteredTasks.some(t => {
        const assigneeId = toStr(t.assignedTo?._id || t.assignedTo || t.assignee?.id);
        const memberId = toStr(m._id || m.id);
        return assigneeId && memberId && assigneeId === memberId;
      });
    }).length;

    const teamUtilization = teamMembers.length > 0
      ? utilizedMembersCount / teamMembers.length
      : 0.0;

    // Productivity score (0 - 100)
    const score = Math.round(
      (taskCompletionRate * 0.4) +
      (onTimeRate * 100 * 0.4) +
      (teamUtilization * 100 * 0.2)
    );

    let status = 'Green';
    let statusClass = 'score-green';
    let label = 'Excellent';
    
    if (score < 50) {
      status = 'Red';
      statusClass = 'score-red';
      label = 'Needs Review';
    } else if (score < 80) {
      status = 'Yellow';
      statusClass = 'score-yellow';
      label = 'Stable';
    }

    return { score, label, statusClass };
  }, [completedTasks, teamMembers, filteredTasks, taskCompletionRate]);

  // ── 3. RECHARTS DATA PREPARATIONS ──

  // Donut Chart: Project Breakdown by Status
  const projectStatusData = useMemo(() => {
    const statuses = ['Planning', 'In Progress', 'Review', 'Completed'];
    return statuses.map(status => {
      const count = filteredProjects.filter(p => {
        // Handle variations in status strings
        const pStatus = p.status?.toLowerCase();
        if (status === 'In Progress' && (pStatus === 'in progress' || pStatus === 'in-progress')) return true;
        return p.status === status;
      }).length;
      return { name: status, value: count };
    });
  }, [filteredProjects]);

  const hasProjectStatusData = useMemo(() => {
    return projectStatusData.some(d => d.value > 0);
  }, [projectStatusData]);

  // Bar Chart: Task Priorities Distribution
  const taskPriorityData = useMemo(() => {
    const priorities = ['Low', 'Medium', 'High'];
    return priorities.map(priority => {
      const count = filteredTasks.filter(t => {
        const tPriority = t.priority?.toLowerCase();
        return tPriority === priority.toLowerCase();
      }).length;
      return { name: priority, count };
    });
  }, [filteredTasks]);

  const hasTaskPriorityData = useMemo(() => {
    return taskPriorityData.some(d => d.count > 0);
  }, [taskPriorityData]);

  // Line Chart: Task Completion Velocity (Time Series using updatedAt proxy)
  const taskCompletionVelocityData = useMemo(() => {
    const completed = completedTasks.filter(t => t.updatedAt || t.createdAt);
    
    // Group completed tasks by date
    const dateGroups = {};
    completed.forEach(task => {
      const dateStr = new Date(task.updatedAt || task.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      dateGroups[dateStr] = (dateGroups[dateStr] || 0) + 1;
    });

    // Map to array and sort chronologically (since keys are dates, we sort by timestamp)
    const sortedDates = Object.keys(dateGroups).sort((a, b) => new Date(a) - new Date(b));
    
    return sortedDates.map(date => ({
      date,
      Completed: dateGroups[date]
    }));
  }, [completedTasks]);

  const hasTaskVelocityData = useMemo(() => {
    return taskCompletionVelocityData.length > 0;
  }, [taskCompletionVelocityData]);

  // Horizontal Bar Chart: Team Workload (Assigned Tasks)
  const teamWorkloadData = useMemo(() => {
    return teamMembers.map(m => {
      const memberTasksCount = filteredTasks.filter(t => {
        // Strictly evaluate both id formats to ensure robust assignee matching
        const assigneeId = toStr(t.assignedTo?._id || t.assignedTo || t.assignee?.id);
        const memberId = toStr(m._id || m.id);
        return assigneeId && memberId && assigneeId === memberId;
      }).length;

      return {
        name: m.name.split(' ')[0], // First name for neat labels
        tasks: memberTasksCount
      };
    });
  }, [teamMembers, filteredTasks]);

  const hasTeamWorkloadData = useMemo(() => {
    return teamWorkloadData.some(d => d.tasks > 0);
  }, [teamWorkloadData]);

  // ── 4. PROJECT PROGRESS TABLE DETAILS & SORTING ──

  // Custom project calculation helper
  const projectsWithCalculations = useMemo(() => {
    return filteredProjects.map(proj => {
      // Find all tasks associated with this project
      const projTasks = tasks.filter(t => toStr(t.project || t.projectId) === toStr(proj.id));
      const total = projTasks.length;
      const completed = projTasks.filter(t => 
        t.status?.toLowerCase() === 'completed' || 
        t.status?.toLowerCase() === 'done'
      ).length;

      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        ...proj,
        totalTasks: total,
        completedTasks: completed,
        progress
      };
    });
  }, [filteredProjects, tasks]);

  // Execute sorting logic (soonest deadlines first by default)
  const sortedProjects = useMemo(() => {
    const list = [...projectsWithCalculations];
    
    list.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      // Handle custom properties
      if (sortBy === 'deadline') {
        const dateA = a.deadline || a.dueDate ? new Date(a.deadline || a.dueDate) : new Date(8640000000000000);
        const dateB = b.deadline || b.dueDate ? new Date(b.deadline || b.dueDate) : new Date(8640000000000000);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      if (sortBy === 'progress') {
        valA = a.progress;
        valB = b.progress;
      }
      if (sortBy === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      }
      if (sortBy === 'status') {
        valA = a.status.toLowerCase();
        valB = b.status.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [projectsWithCalculations, sortBy, sortOrder]);

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIndicator = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? ' ▲' : ' ▼';
  };

  // Actions
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="reports-container">
      {/* Print only header for PDF layout */}
      <div className="print-only-header">
        <h1>Planora Analytics Report</h1>
        <p>Generated on: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>

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
          <a href="#" className="nav-item active" onClick={e => e.preventDefault()}>
            <svg viewBox="0 0 24 24" fill="none"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {sidebarOpen && <span>Reports</span>}
          </a>
          <a href="#" className="nav-item" onClick={e => { e.preventDefault(); navigate('/notifications'); }}>
            <svg viewBox="0 0 24 24" fill="none"><path d="M18 8C18 6.41 17.37 4.88 16.24 3.76C15.12 2.63 13.59 2 12 2C10.41 2 8.88 2.63 7.76 3.76C6.63 4.88 6 6.41 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21C13.55 21.3 13.3 21.55 12.99 21.73C12.69 21.9 12.35 22 12 22C11.65 22 11.31 21.9 11.01 21.73C10.7 21.55 10.45 21.3 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {sidebarOpen && (
              <div className="sidebar-notif-label">
                <span>Notifications</span>
                {unreadCount > 0 && <span className="sidebar-notif-badge">{unreadCount}</span>}
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
      <div className="reports-main">
        {/* Header */}
        <header className="reports-header">
          <div className="reports-header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(o => !o)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            <div>
              <h2>Reports & Analytics</h2>
              <span className="reports-header-sub">
                Track your team's progress and project health
              </span>
            </div>
          </div>
          <div className="reports-header-right">
            <select
              className="date-filter-select"
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
            >
              <option value="All Time">All Time</option>
              <option value="This Month">This Month</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 7 Days">Last 7 Days</option>
            </select>
            <button className="export-pdf-btn" onClick={handlePrint} title="Save report as PDF">
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export PDF
            </button>
            <button className="icon-button" title="Notifications" onClick={() => navigate('/notifications')} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '50%', marginRight: '0.5rem', position: 'relative' }}>
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8C18 6.41 17.37 4.88 16.24 3.76C15.12 2.63 13.59 2 12 2C10.41 2 8.88 2.63 7.76 3.76C6.63 4.88 6 6.41 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"/><path d="M13.73 21C13.55 21.3 13.3 21.55 12.99 21.73C12.69 21.9 12.35 22 12 22C11.65 22 11.31 21.9 11.01 21.73C10.7 21.55 10.45 21.3 10.27 21"/></svg>
              {unreadCount > 0 && <span className="notification-badge" style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: 'bold', borderRadius: '50%', width: '15px', height: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>}
            </button>
            <div className="user-pill" onClick={logout} title="Logout">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin User')}&background=14b8a6&color=fff`}
                alt="avatar"
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="reports-content">
          {/* KPI Summary row */}
          <div className="kpi-cards-grid">
            <div className="kpi-card">
              <div className="kpi-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.12)', color: REPORTS_COLORS.blue }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div className="kpi-details">
                <span className="kpi-title">Total Projects</span>
                <span className="kpi-value">{totalProjectsCount}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper" style={{ background: 'rgba(0, 180, 166, 0.12)', color: REPORTS_COLORS.teal }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div className="kpi-details">
                <span className="kpi-title">Task Completion</span>
                <span className="kpi-value">{taskCompletionRate}%</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.12)', color: REPORTS_COLORS.purple }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21V19C17 17.93 16.58 16.92 15.83 16.17C15.08 15.42 14.06 15 13 15H5C3.93 15 2.92 15.42 2.17 16.17C1.42 16.92 1 17.93 1 19V21"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2c0-1.38-1.13-2.5-2.5-2.5h-1.5"/><circle cx="19" cy="3" r="3"/></svg>
              </div>
              <div className="kpi-details">
                <span className="kpi-title">Collaborators</span>
                <span className="kpi-value">{activeCollaboratorsCount}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.12)', color: REPORTS_COLORS.red }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <div className="kpi-details">
                <span className="kpi-title">Overdue Items</span>
                <span className="kpi-value" style={{ color: totalOverdueItems > 0 ? REPORTS_COLORS.red : '#fff' }}>{totalOverdueItems}</span>
              </div>
            </div>

            {/* Enterprise Productivity Score Card */}
            <div className="kpi-card productivity-card">
              <div className="productivity-score-ring">
                <div className="kpi-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.12)', color: REPORTS_COLORS.orange }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                </div>
              </div>
              <div className="kpi-details">
                <span className="kpi-title">
                  Productivity Score
                  <span className="info-icon" title="Calculated based on: Task Completion Rate (40%), On-Time Task Delivery (40%), and Team Resource Utilization (20%).">ⓘ</span>
                </span>
                <span className="kpi-value">{productivityMetrics.score}/100</span>
                <span className={`score-badge ${productivityMetrics.statusClass}`}>
                  {productivityMetrics.label}
                </span>
              </div>
            </div>
          </div>

          {/* 2x2 Charts Layout Grid */}
          <div className="charts-layout-grid">
            {/* Chart 1: Project Status Donut Chart */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-title">Project Distribution By Status</h3>
              </div>
              <div className="chart-container">
                {hasProjectStatusData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill={REPORTS_COLORS.blue} />
                        <Cell fill={REPORTS_COLORS.orange} />
                        <Cell fill={REPORTS_COLORS.purple} />
                        <Cell fill={REPORTS_COLORS.teal} />
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty-state">
                    <span className="chart-empty-icon">📁</span>
                    <span className="chart-empty-text">No projects yet</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Task Priorities Bar Chart */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-title">Task Distribution By Priority</h3>
              </div>
              <div className="chart-container">
                {hasTaskPriorityData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taskPriorityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }}
                      />
                      <Bar dataKey="count" fill={REPORTS_COLORS.teal} radius={[6, 6, 0, 0]}>
                        {taskPriorityData.map((entry, index) => {
                          const colors = [REPORTS_COLORS.blue, REPORTS_COLORS.orange, REPORTS_COLORS.red];
                          return <Cell key={`cell-${index}`} fill={colors[index]} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty-state">
                    <span className="chart-empty-icon">📋</span>
                    <span className="chart-empty-text">No team assignments yet</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chart 3: Task Completion Velocity Line Chart */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-title">Task Completion Velocity</h3>
              </div>
              <div className="chart-container">
                {hasTaskVelocityData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={taskCompletionVelocityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                      <XAxis dataKey="date" stroke="#64748b" />
                      <YAxis stroke="#64748b" allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Completed"
                        stroke={REPORTS_COLORS.teal}
                        strokeWidth={3}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty-state">
                    <span className="chart-empty-icon">📈</span>
                    <span className="chart-empty-text">No task history yet</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chart 4: Team Workload Horizontal Bar Chart */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-title">Team Task Workload</h3>
              </div>
              <div className="chart-container">
                {hasTeamWorkloadData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamWorkloadData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                      <XAxis type="number" stroke="#64748b" allowDecimals={false} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" width={75} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }}
                      />
                      <Bar dataKey="tasks" fill={REPORTS_COLORS.blue} radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty-state">
                    <span className="chart-empty-icon">👥</span>
                    <span className="chart-empty-text">No team assignments yet</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Project Progress table section */}
          <div className="project-table-card">
            <h3 className="project-table-title">Project Overview</h3>
            <div className="table-responsive-wrapper">
              {sortedProjects.length > 0 ? (
                <table className="project-data-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSortChange('name')}>
                        Project Name {getSortIndicator('name')}
                      </th>
                      <th onClick={() => handleSortChange('status')}>
                        Status {getSortIndicator('status')}
                      </th>
                      <th>Priority</th>
                      <th>Task Completion</th>
                      <th onClick={() => handleSortChange('progress')}>
                        Progress {getSortIndicator('progress')}
                      </th>
                      <th onClick={() => handleSortChange('deadline')}>
                        Deadline {getSortIndicator('deadline')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProjects.map(proj => {
                      const dl = proj.deadline || proj.dueDate;
                      const formattedDate = dl
                        ? new Date(dl).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : 'Not Set';
                      
                      const prioClass = `prio-badge prio-${proj.priority?.toLowerCase() || 'medium'}`;
                      
                      // Status dots
                      let dotColor = REPORTS_COLORS.blue;
                      if (proj.status === 'In Progress') dotColor = REPORTS_COLORS.orange;
                      if (proj.status === 'Review') dotColor = REPORTS_COLORS.purple;
                      if (proj.status === 'Completed') dotColor = REPORTS_COLORS.teal;

                      return (
                        <tr key={proj.id}>
                          <td style={{ fontWeight: '600', color: '#fff' }}>{proj.name}</td>
                          <td>
                            <span className="status-pill">
                              <span className="status-dot" style={{ backgroundColor: dotColor }} />
                              {proj.status}
                            </span>
                          </td>
                          <td>
                            <span className={prioClass}>
                              {proj.priority || 'Medium'}
                            </span>
                          </td>
                          <td>{proj.completedTasks} / {proj.totalTasks} tasks</td>
                          <td>
                            <div className="progress-bar-cell-wrapper">
                              <div className="progress-bg">
                                <div className="progress-fill" style={{ width: `${proj.progress}%` }} />
                              </div>
                              <span className="progress-text">{proj.progress}% completed</span>
                            </div>
                          </td>
                          <td>{formattedDate}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>📁</span>
                  <strong>Create projects to see data</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
