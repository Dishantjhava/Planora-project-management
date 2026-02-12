import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProject, setShowAddProject] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const navigate = useNavigate();

  const projects = [
    { id: 1, name: 'Website Redesign', progress: 75, status: 'In Progress', team: 5, deadline: '2026-02-15', priority: 'high', tasks: 24, completedTasks: 18, description: 'Complete redesign of company website with modern UI/UX' },
    { id: 2, name: 'Mobile App Development', progress: 45, status: 'In Progress', team: 8, deadline: '2026-03-20', priority: 'high', tasks: 32, completedTasks: 14, description: 'Native mobile app for iOS and Android platforms' },
    { id: 3, name: 'Marketing Campaign', progress: 90, status: 'Review', team: 3, deadline: '2026-02-10', priority: 'medium', tasks: 15, completedTasks: 13, description: 'Q1 marketing campaign for new product launch' },
    { id: 4, name: 'Database Migration', progress: 30, status: 'Planning', team: 4, deadline: '2026-04-01', priority: 'low', tasks: 20, completedTasks: 6, description: 'Migrate legacy database to cloud infrastructure' },
    { id: 5, name: 'Security Audit', progress: 60, status: 'In Progress', team: 2, deadline: '2026-02-25', priority: 'high', tasks: 12, completedTasks: 7, description: 'Comprehensive security audit and vulnerability assessment' },
  ];

  const stats = [
    { label: 'Total Projects', value: '24', icon: '📊', color: '#6366f1', trend: '+12%', trendUp: true },
    { label: 'Active Tasks', value: '156', icon: '✓', color: '#10b981', trend: '+8%', trendUp: true },
    { label: 'Team Members', value: '32', icon: '👥', color: '#f59e0b', trend: '+5%', trendUp: true },
    { label: 'Completed', value: '89%', icon: '🎯', color: '#ec4899', trend: '-2%', trendUp: false },
  ];

  const recentActivity = [
    { user: 'Sarah Chen', action: 'completed task', item: 'UI Design Review', time: '5 min ago', avatar: 'SC', color: '#6366f1' },
    { user: 'Mike Ross', action: 'added comment on', item: 'Backend API', time: '23 min ago', avatar: 'MR', color: '#10b981' },
    { user: 'Emily Davis', action: 'created new', item: 'Sprint Planning', time: '1 hour ago', avatar: 'ED', color: '#f59e0b' },
    { user: 'John Smith', action: 'updated status of', item: 'Mobile App', time: '2 hours ago', avatar: 'JS', color: '#ec4899' },
    { user: 'Anna Lee', action: 'uploaded files to', item: 'Database Migration', time: '3 hours ago', avatar: 'AL', color: '#8b5cf6' },
  ];

  const notifications = [
    { id: 1, title: 'New task assigned', message: 'You have been assigned to "API Integration"', time: '10 min ago', read: false, type: 'task' },
    { id: 2, title: 'Deadline approaching', message: 'Marketing Campaign due in 2 days', time: '1 hour ago', read: false, type: 'warning' },
    { id: 3, title: 'Comment received', message: 'Mike commented on your task', time: '3 hours ago', read: true, type: 'comment' },
  ];

  const teamMembers = [
    { name: 'Sarah Chen', role: 'Lead Designer', avatar: 'SC', status: 'online', color: '#6366f1' },
    { name: 'Mike Ross', role: 'Backend Dev', avatar: 'MR', status: 'online', color: '#10b981' },
    { name: 'Emily Davis', role: 'Project Manager', avatar: 'ED', status: 'away', color: '#f59e0b' },
    { name: 'John Smith', role: 'Frontend Dev', avatar: 'JS', status: 'offline', color: '#ec4899' },
  ];

  const upcomingDeadlines = [
    { project: 'Marketing Campaign', days: 2, priority: 'high' },
    { project: 'Website Redesign', days: 5, priority: 'high' },
    { project: 'Security Audit', days: 14, priority: 'medium' },
  ];

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || project.status.toLowerCase().replace(' ', '-') === activeTab;
    return matchesSearch && matchesTab;
  });

  // Calculate stats
  const totalTasks = projects.reduce((sum, p) => sum + p.tasks, 0);
  const completedTasks = projects.reduce((sum, p) => sum + p.completedTasks, 0);
  const overallProgress = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">TF</div>
            {sidebarOpen && <span className="logo-text">Planora</span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          <a href="#" className="nav-item" onClick={() => navigate('/home')}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {sidebarOpen && <span>Home</span>}
          </a>
          <a href="#" className="nav-item active">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {sidebarOpen && <span>Dashboard</span>}
          </a>
          <a href="#" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {sidebarOpen && <span>Projects</span>}
          </a>
          <a href="#" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {sidebarOpen && <span>Team</span>}
          </a>
          <a href="#" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {sidebarOpen && <span>Calendar</span>}
          </a>
        </nav>

        <div className="sidebar-footer">
          <a href="#" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M19.4 15A7.5 7.5 0 1 1 12 7.5" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {sidebarOpen && <span>Settings</span>}
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <h2>Dashboard</h2>
          </div>

          <div className="header-right">
            {/* Search Bar */}
            <div className="search-bar">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search projects..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Notifications */}
            <div className="notification-wrapper">
              <button className="icon-button" onClick={() => setShowNotifications(!showNotifications)}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span className="notification-badge">{notifications.filter(n => !n.read).length}</span>
              </button>

              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h3>Notifications</h3>
                    <button onClick={() => setShowNotifications(false)}>✕</button>
                  </div>
                  <div className="notifications-list">
                    {notifications.map(notif => (
                      <div key={notif.id} className={`notification-item ${notif.read ? 'read' : ''}`}>
                        <div className={`notification-icon ${notif.type}`}>
                          {notif.type === 'task' && '📋'}
                          {notif.type === 'warning' && '⚠️'}
                          {notif.type === 'comment' && '💬'}
                        </div>
                        <div className="notification-content">
                          <h4>{notif.title}</h4>
                          <p>{notif.message}</p>
                          <span className="notification-time">{notif.time}</span>
                        </div>
                        {!notif.read && <div className="unread-dot"></div>}
                      </div>
                    ))}
                  </div>
                  <div className="notifications-footer">
                    <button>Mark all as read</button>
                  </div>
                </div>
              )}
            </div>

            <div className="user-menu">
              <div className="user-avatar">
                <img src="https://ui-avatars.com/api/?name=Admin+User&background=14b8a6&color=fff" alt="User" />
              </div>
              <div className="user-info">
                <span className="user-name">Admin User</span>
                <span className="user-role">Project Manager</span>
              </div>
              <button className="dropdown-button" onClick={onLogout} title="Logout">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2"/>
                  <path d="M21 12H9" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {/* Stats Cards */}
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="stat-content">
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-value">{stat.value}</div>
                  <div className={`stat-trend ${stat.trendUp ? 'up' : 'down'}`}>
                    {stat.trendUp ? '↑' : '↓'} {stat.trend} from last month
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="dashboard-grid">
            {/* Projects Section */}
            <div className="dashboard-section projects-section">
              <div className="card">
                <div className="card-header">
                  <h3>Projects</h3>
                  <button className="btn-primary-small" onClick={() => setShowAddProject(true)}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2"/>
                      <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    New Project
                  </button>
                </div>

                {/* Filter Tabs */}
                <div className="filter-tabs">
                  <button 
                    className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                  >
                    All <span className="tab-count">{projects.length}</span>
                  </button>
                  <button 
                    className={`tab ${activeTab === 'in-progress' ? 'active' : ''}`}
                    onClick={() => setActiveTab('in-progress')}
                  >
                    In Progress <span className="tab-count">{projects.filter(p => p.status === 'In Progress').length}</span>
                  </button>
                  <button 
                    className={`tab ${activeTab === 'review' ? 'active' : ''}`}
                    onClick={() => setActiveTab('review')}
                  >
                    Review <span className="tab-count">{projects.filter(p => p.status === 'Review').length}</span>
                  </button>
                  <button 
                    className={`tab ${activeTab === 'planning' ? 'active' : ''}`}
                    onClick={() => setActiveTab('planning')}
                  >
                    Planning <span className="tab-count">{projects.filter(p => p.status === 'Planning').length}</span>
                  </button>
                </div>

                <div className="projects-list">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                      <div 
                        key={project.id} 
                        className="project-item"
                        onClick={() => setSelectedProject(project)}
                      >
                        <div className="project-header">
                          <div className="project-title">
                            <h4>{project.name}</h4>
                            <span className={`priority-badge priority-${project.priority}`}>
                              {project.priority === 'high' && '🔴'}
                              {project.priority === 'medium' && '🟡'}
                              {project.priority === 'low' && '🟢'}
                              {project.priority.toUpperCase()}
                            </span>
                          </div>
                          <span className={`status-badge status-${project.status.toLowerCase().replace(' ', '-')}`}>
                            {project.status}
                          </span>
                        </div>

                        <div className="project-meta">
                          <span className="project-team">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2"/>
                              <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            {project.team} members
                          </span>
                          <span className="project-tasks">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            {project.completedTasks}/{project.tasks} tasks
                          </span>
                          <span className="project-deadline">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            {new Date(project.deadline).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="progress-section">
                          <div className="progress-header">
                            <span className="progress-label">Progress</span>
                            <span className="progress-percentage">{project.progress}%</span>
                          </div>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ 
                                width: `${project.progress}%`,
                                backgroundColor: project.progress >= 75 ? '#10b981' : project.progress >= 50 ? '#f59e0b' : '#6366f1'
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
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
                <div className="card-header">
                  <h3>Overall Progress</h3>
                </div>
                <div className="circular-progress">
                  <svg viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10"/>
                    <circle 
                      cx="60" 
                      cy="60" 
                      r="54" 
                      fill="none" 
                      stroke="#14b8a6" 
                      strokeWidth="10"
                      strokeDasharray={`${overallProgress * 3.39} 339`}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                      style={{ transition: 'stroke-dasharray 1s ease' }}
                    />
                  </svg>
                  <div className="progress-text">
                    <div className="progress-percentage">{overallProgress}%</div>
                    <div className="progress-subtitle">Complete</div>
                  </div>
                </div>
                <div className="progress-stats">
                  <div className="progress-stat">
                    <span className="stat-label">Total Tasks</span>
                    <span className="stat-number">{totalTasks}</span>
                  </div>
                  <div className="progress-stat">
                    <span className="stat-label">Completed</span>
                    <span className="stat-number">{completedTasks}</span>
                  </div>
                  <div className="progress-stat">
                    <span className="stat-label">In Progress</span>
                    <span className="stat-number">{totalTasks - completedTasks}</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card activity-card">
                <div className="card-header">
                  <h3>Recent Activity</h3>
                </div>
                <div className="activity-list">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-avatar" style={{ backgroundColor: activity.color }}>
                        {activity.avatar}
                      </div>
                      <div className="activity-content">
                        <p>
                          <strong>{activity.user}</strong> {activity.action} <span className="highlight">{activity.item}</span>
                        </p>
                        <span className="activity-time">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Members */}
              <div className="card team-card">
                <div className="card-header">
                  <h3>Team Members</h3>
                  <button className="btn-link">View All</button>
                </div>
                <div className="team-list">
                  {teamMembers.map((member, index) => (
                    <div key={index} className="team-member">
                      <div className="member-avatar" style={{ backgroundColor: member.color }}>
                        {member.avatar}
                        <span className={`status-indicator ${member.status}`}></span>
                      </div>
                      <div className="member-info">
                        <div className="member-name">{member.name}</div>
                        <div className="member-role">{member.role}</div>
                      </div>
                      <div className={`member-status ${member.status}`}>
                        {member.status === 'online' && '🟢'}
                        {member.status === 'away' && '🟡'}
                        {member.status === 'offline' && '⚫'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Deadlines */}
              <div className="card deadlines-card">
                <div className="card-header">
                  <h3>Upcoming Deadlines</h3>
                </div>
                <div className="deadlines-list">
                  {upcomingDeadlines.map((item, index) => (
                    <div key={index} className="deadline-item">
                      <div className={`deadline-indicator priority-${item.priority}`}></div>
                      <div className="deadline-info">
                        <div className="deadline-project">{item.project}</div>
                        <div className="deadline-days">
                          {item.days === 1 ? 'Tomorrow' : `${item.days} days left`}
                        </div>
                      </div>
                      <div className={`deadline-priority priority-${item.priority}`}>
                        {item.priority === 'high' && '🔴'}
                        {item.priority === 'medium' && '🟡'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="modal-overlay" onClick={() => setShowAddProject(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button className="modal-close" onClick={() => setShowAddProject(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Project Name *</label>
                <input type="text" placeholder="Enter project name" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Enter project description" rows="3"></textarea>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Deadline *</label>
                  <input type="date" />
                </div>
                <div className="form-group">
                  <label>Priority *</label>
                  <select>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Team Size</label>
                  <input type="number" placeholder="Number of members" min="1" />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select>
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddProject(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => setShowAddProject(false)}>Create Project</button>
            </div>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
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
                  <span className={`status-badge status-${selectedProject.status.toLowerCase().replace(' ', '-')}`}>
                    {selectedProject.status}
                  </span>
                </div>
                <div className="detail-card">
                  <div className="detail-label">Priority</div>
                  <span className={`priority-badge priority-${selectedProject.priority}`}>
                    {selectedProject.priority === 'high' && '🔴'}
                    {selectedProject.priority === 'medium' && '🟡'}
                    {selectedProject.priority === 'low' && '🟢'}
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
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${selectedProject.progress}%`,
                        backgroundColor: selectedProject.progress >= 75 ? '#10b981' : selectedProject.progress >= 50 ? '#f59e0b' : '#6366f1'
                      }}
                    ></div>
                  </div>
                  <span className="progress-percentage">{selectedProject.progress}%</span>
                </div>
                <div className="tasks-summary">
                  {selectedProject.completedTasks} of {selectedProject.tasks} tasks completed
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedProject(null)}>Close</button>
              <button className="btn-primary">Edit Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;