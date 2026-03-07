import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Projects.css';
import { getProjects, createProject, updateProject, deleteProject, createTask, deleteTask, updateTask, getTeamMembers, getTasks } from '../services/api.js';

const TASK_CATEGORIES = ['Design','Development','Testing','Research','Documentation','Review','Deployment','Planning'];

const Projects = ({ onLogout }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast]             = useState({ show: false, message: '', type: '' });

  // ── Data ──────────────────────────────────────────────────────────
  const [projects, setProjects]       = useState([]);
  const [tasks, setTasks]             = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, teamRes, taskRes] = await Promise.all([
          getProjects(),
          getTeamMembers(),
          getTasks(),
        ]);

        let members = [];
        if (teamRes.success) {
          members = teamRes.members.map(m => ({
            id: m._id?.toString(),
            name: m.user?.name || 'Unknown',
            role: m.role,
            avatar: m.user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) || '??',
            color: '#6366f1',
          }));
          setTeamMembers(members);
        }

        if (projRes.success) {
          setProjects(projRes.projects.map(p => ({
            ...p,
            id: p._id?.toString(),
            team: p.members?.length || 0,
            tasks: 0,
            completedTasks: 0,
            progress: 0,
          })));
        }

        if (taskRes.success) {
          setTasks(taskRes.tasks.map(t => {
            // normalize projectId to plain string always
            const pid = typeof t.project === 'object'
              ? (t.project?._id?.toString() || t.project?.toString())
              : t.project?.toString();

            // normalize assignee
            const assigneeId = typeof t.assignedTo === 'object'
              ? t.assignedTo?._id?.toString()
              : t.assignedTo?.toString();

            const assignee = members.find(m => m.id === assigneeId) || null;

            return {
              ...t,
              id: t._id?.toString(),
              projectId: pid,
              assignee,
            };
          }));
        }
      } catch (err) {
        console.error('Failed to fetch:', err);
      }
    };
    fetchData();
  }, []);

  // ── UI state ──────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]         = useState('');
  const [activeFilter, setActiveFilter]       = useState('all');
  const [sortBy, setSortBy]                   = useState('name');
  const [viewMode, setViewMode]               = useState('grid');
  const [selectedProject, setSelectedProject] = useState(null);

  // ── Modals ────────────────────────────────────────────────────────
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject]     = useState(null);
  const [showTaskModal, setShowTaskModal]       = useState(false);

  // ── Forms ─────────────────────────────────────────────────────────
  const emptyProjectForm = { name:'', description:'', deadline:'', priority:'medium', team:'', status:'planning', tasks:'', completedTasks:0 };
  const [projectForm, setProjectForm]     = useState(emptyProjectForm);
  const [projectErrors, setProjectErrors] = useState({});

  const emptyTaskForm = { title:'', description:'', projectId:'', assigneeId:'', priority:'medium', dueDate:'', category:'Development', status:'todo' };
  const [taskForm, setTaskForm]   = useState(emptyTaskForm);
  const [taskErrors, setTaskErrors] = useState({});

  const showToast = (msg, type = 'success') => {
    setToast({ show:true, message:msg, type });
    setTimeout(() => setToast({ show:false, message:'', type:'' }), 3000);
  };

  // ── KEY FIX: normalize any ID to plain string ─────────────────────
  const toStr = (val) => {
    if (!val) return '';
    if (typeof val === 'object') return val._id?.toString() || val.toString();
    return val.toString();
  };

  // ── Get tasks for a project (robust ID comparison) ─────────────────
  const projectTasks = (projectId) => {
    const pid = toStr(projectId);
    return tasks.filter(t => toStr(t.projectId) === pid);
  };

  // ── Project CRUD ──────────────────────────────────────────────────
  const openAddProject = () => {
    setEditingProject(null);
    setProjectForm(emptyProjectForm);
    setProjectErrors({});
    setShowProjectModal(true);
  };

  const openEditProject = (p, e) => {
    e?.stopPropagation();
    setEditingProject(p);
    setProjectForm({
      name: p.name, description: p.description || '',
      deadline: p.deadline || p.dueDate || '',
      priority: p.priority, team: p.team.toString(),
      status: p.status.toLowerCase().replace(/\s+/g,'-'),
      tasks: p.tasks.toString(), completedTasks: p.completedTasks,
    });
    setProjectErrors({});
    setSelectedProject(null);
    setShowProjectModal(true);
  };

  const validateProject = () => {
    const e = {};
    if (!projectForm.name.trim()) e.name = 'Name is required';
    if (!projectForm.deadline)    e.deadline = 'Deadline is required';
    if (!projectForm.team || projectForm.team < 1) e.team = 'Team size ≥ 1';
    if (!projectForm.tasks || projectForm.tasks < 1) e.tasks = 'Tasks must be ≥ 1';
    setProjectErrors(e);
    return !Object.keys(e).length;
  };

  const handleSaveProject = async () => {
    if (!validateProject()) return;
    const statusLbl = projectForm.status.split('-').map(w => w[0].toUpperCase()+w.slice(1)).join(' ');
    try {
      if (editingProject) {
        const result = await updateProject(editingProject._id || editingProject.id, {
          name: projectForm.name, description: projectForm.description,
          dueDate: projectForm.deadline, priority: projectForm.priority, status: statusLbl,
        });
        if (result.success) {
          setProjects(ps => ps.map(p => p.id === editingProject.id
            ? { ...p, ...result.project, id: result.project._id?.toString() } : p));
          showToast('Project updated! ✏️');
        }
      } else {
        const result = await createProject({
          name: projectForm.name, description: projectForm.description,
          dueDate: projectForm.deadline, priority: projectForm.priority, status: statusLbl,
        });
        if (result.success) {
          setProjects(ps => [{
            ...result.project,
            id: result.project._id?.toString(),
            team: 0, tasks: 0, completedTasks: 0, progress: 0
          }, ...ps]);
          showToast('Project created! 🎉');
        }
      }
      setShowProjectModal(false);
    } catch (err) {
      showToast('Failed to save project', 'error');
    }
  };

  const handleDeleteProject = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Delete this project?')) return;
    try {
      await deleteProject(id);
      setProjects(ps => ps.filter(p => p.id !== toStr(id)));
      setTasks(ts => ts.filter(t => toStr(t.projectId) !== toStr(id)));
      setSelectedProject(null);
      showToast('Project deleted.', 'error');
    } catch (err) {
      showToast('Failed to delete project', 'error');
    }
  };

  // ── Task CRUD ─────────────────────────────────────────────────────
  const openAddTask = (projectId = '', e) => {
    e?.stopPropagation();
    setTaskForm({ ...emptyTaskForm, projectId: projectId || (projects[0]?.id || '') });
    setTaskErrors({});
    setShowTaskModal(true);
  };

  const validateTask = () => {
    const e = {};
    if (!taskForm.title.trim()) e.title = 'Title is required';
    if (!taskForm.projectId)    e.projectId = 'Select a project';
    if (!taskForm.dueDate)      e.dueDate = 'Due date is required';
    setTaskErrors(e);
    return !Object.keys(e).length;
  };

  const handleSaveTask = async () => {
    if (!validateTask()) return;
    try {
      const result = await createTask({
        title:       taskForm.title.trim(),
        description: taskForm.description.trim(),
        project:     taskForm.projectId,
        assignedTo:  taskForm.assigneeId || undefined,
        priority:    taskForm.priority,
        dueDate:     taskForm.dueDate,
        status:      taskForm.status,
        category:    taskForm.category,
      });

      if (result.success) {
        const rawTask = result.task;

        // normalize projectId to string
        const pid = typeof rawTask.project === 'object'
          ? rawTask.project?._id?.toString()
          : rawTask.project?.toString();

        // resolve assignee from teamMembers
        const assigneeId = typeof rawTask.assignedTo === 'object'
          ? rawTask.assignedTo?._id?.toString()
          : rawTask.assignedTo?.toString();
        const assignee = teamMembers.find(m => m.id === assigneeId)
          || teamMembers.find(m => m.id === taskForm.assigneeId)
          || null;

        const newTask = {
          ...rawTask,
          id:        rawTask._id?.toString(),
          projectId: pid,
          assignee,
        };

        setTasks(ts => [newTask, ...ts]);
        setShowTaskModal(false);
        showToast(`Task "${rawTask.title}" created! ✅`);
      } else {
        showToast(result.message || 'Failed to create task', 'error');
      }
    } catch (err) {
      showToast('Server error creating task', 'error');
    }
  };

  const handleDeleteTask = async (taskId, e) => {
    e?.stopPropagation();
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      setTasks(ts => ts.filter(t => toStr(t.id) !== toStr(taskId)));
      showToast('Task deleted.', 'error');
    } catch (err) {
      showToast('Failed to delete task', 'error');
    }
  };

  // ── Toggle task status through cycle ─────────────────────────────
  const toggleTaskStatus = async (taskId, e) => {
    e?.stopPropagation();
    const task = tasks.find(t => toStr(t.id) === toStr(taskId));
    if (!task) return;
    const cycle = { todo:'in-progress', 'in-progress':'review', review:'done', done:'todo' };
    const newStatus = cycle[task.status] || 'todo';
    try {
      await updateTask(toStr(task.id), { status: newStatus });
      setTasks(ts => ts.map(t => toStr(t.id) === toStr(taskId) ? { ...t, status: newStatus } : t));
    } catch (err) {
      showToast('Failed to update task status', 'error');
    }
  };

  // ── CSV Export ────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['ID','Name','Status','Priority','Progress','Team','Tasks','Completed','Deadline'];
    const rows = projects.map(p => [p.id,p.name,p.status,p.priority,`${p.progress}%`,p.team,p.tasks,p.completedTasks,p.deadline]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})),
      download:`planora-projects-${new Date().toISOString().split('T')[0]}.csv`,
    });
    a.click(); showToast('Exported! 📥');
  };

  // ── Derived ───────────────────────────────────────────────────────
  const filtered = projects
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFilter = activeFilter === 'all' || p.status.toLowerCase().replace(/\s+/g,'-') === activeFilter;
      return matchSearch && matchFilter;
    })
    .sort((a,b) => {
      if (sortBy === 'name')     return a.name.localeCompare(b.name);
      if (sortBy === 'deadline') return new Date(a.deadline||a.dueDate) - new Date(b.deadline||b.dueDate);
      if (sortBy === 'progress') return b.progress - a.progress;
      if (sortBy === 'priority') { const r={high:0,medium:1,low:2}; return (r[a.priority]||3)-(r[b.priority]||3); }
      return 0;
    });

  const filters = [
    { key:'all',         label:'All',        count:projects.length },
    { key:'in-progress', label:'In Progress', count:projects.filter(p=>p.status.toLowerCase().replace(/\s+/g,'-')==='in-progress').length },
    { key:'review',      label:'Review',      count:projects.filter(p=>p.status.toLowerCase()==='review').length },
    { key:'planning',    label:'Planning',    count:projects.filter(p=>p.status.toLowerCase()==='planning').length },
    { key:'completed',   label:'Completed',   count:projects.filter(p=>p.status.toLowerCase()==='completed').length },
  ];

  const getDaysUntil = (dateStr) => {
    if (!dateStr) return { label:'No date', cls:'ok' };
    const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
    if (diff < 0)   return { label:'Overdue',  cls:'overdue' };
    if (diff === 0) return { label:'Today',    cls:'today' };
    if (diff === 1) return { label:'Tomorrow', cls:'soon' };
    return { label:`${diff}d left`, cls:diff<=3?'soon':'ok' };
  };

  const statusColor   = { 'In Progress':'#6366f1','Review':'#f59e0b','Planning':'#8b5cf6','Completed':'#10b981' };
  const priorityColor = { high:'#ef4444', medium:'#f59e0b', low:'#10b981' };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="projects-container">

      {toast.show && (
        <div className={`proj-toast proj-toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">P</div>
            {sidebarOpen && <span className="logo-text">Planora</span>}
          </div>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item" onClick={e=>{e.preventDefault();navigate('/home')}}>
            <svg viewBox="0 0 24 24" fill="none"><path d="M3 9L12 2L21 9V20C21 20.53 20.79 21.04 20.41 21.41C20.04 21.79 19.53 22 19 22H5C4.47 22 3.96 21.79 3.59 21.41C3.21 21.04 3 20.53 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {sidebarOpen && <span>Home</span>}
          </a>
          <a href="#" className="nav-item" onClick={e=>{e.preventDefault();navigate('/dashboard')}}>
            <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {sidebarOpen && <span>Dashboard</span>}
          </a>
          <a href="#" className="nav-item active">
            <svg viewBox="0 0 24 24" fill="none"><path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12V19C21 19.53 20.79 20.04 20.41 20.41C20.04 20.79 19.53 21 19 21H5C4.47 21 3.96 20.79 3.59 20.41C3.21 20.04 3 19.53 3 19V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {sidebarOpen && <span>Projects</span>}
          </a>
          <a href="#" className="nav-item" onClick={e=>{e.preventDefault();navigate('/team')}}>
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

      {/* Main */}
      <div className="proj-main">

        {/* Header */}
        <header className="proj-header">
          <div className="proj-header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(o=>!o)}>
              <svg viewBox="0 0 24 24" fill="none"><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            <div>
              <h2>Projects</h2>
              <span className="proj-header-sub">{projects.length} total · {filtered.length} shown</span>
            </div>
          </div>
          <div className="proj-header-right">
            <div className="proj-search">
              <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2"/></svg>
              <input type="text" placeholder="Search projects…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
              {searchQuery && <button className="clear-search" onClick={() => setSearchQuery('')}>✕</button>}
            </div>
            <button className="proj-btn-task" onClick={() => openAddTask()}>
              <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              Add Task
            </button>
            <button className="proj-btn-primary" onClick={openAddProject}>
              <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              New Project
            </button>
            <div className="user-pill" onClick={onLogout} title="Logout">
              <img src="https://ui-avatars.com/api/?name=Admin+User&background=14b8a6&color=fff" alt="User"/>
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M9 21H5C4.47 21 3.96 20.79 3.59 20.41C3.21 20.04 3 19.53 3 19V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H9" stroke="currentColor" strokeWidth="2"/><path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2"/><path d="M21 12H9" stroke="currentColor" strokeWidth="2"/></svg>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="proj-content">

          {/* Toolbar */}
          <div className="proj-toolbar">
            <div className="proj-filters">
              {filters.map(f => (
                <button key={f.key} className={`proj-filter-tab ${activeFilter===f.key?'active':''}`} onClick={() => setActiveFilter(f.key)}>
                  {f.label}<span className="proj-filter-count">{f.count}</span>
                </button>
              ))}
            </div>
            <div className="proj-toolbar-right">
              <select className="proj-sort" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="name">Name</option>
                <option value="deadline">Deadline</option>
                <option value="progress">Progress</option>
                <option value="priority">Priority</option>
              </select>
              <div className="view-toggle">
                <button className={`view-btn ${viewMode==='grid'?'active':''}`} onClick={() => setViewMode('grid')}>
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
                <button className={`view-btn ${viewMode==='list'?'active':''}`} onClick={() => setViewMode('list')}>
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>
              <button className="proj-export-btn" onClick={exportCSV}>
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M21 15V19C21 19.53 20.79 20.04 20.41 20.41C20.04 20.79 19.53 21 19 21H5C4.47 21 3.96 20.79 3.59 20.41C3.21 20.04 3 19.53 3 19V15" stroke="currentColor" strokeWidth="2"/><path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2"/><path d="M12 15V3" stroke="currentColor" strokeWidth="2"/></svg>
                Export
              </button>
            </div>
          </div>

          {/* Projects Grid / List */}
          {filtered.length === 0 ? (
            <div className="proj-empty">
              <div className="proj-empty-icon">🔍</div>
              <h3>No projects found</h3>
              <p>Try a different search or filter, or create a new project.</p>
              <button className="proj-btn-primary" onClick={openAddProject}>+ New Project</button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'proj-grid' : 'proj-list'}>
              {filtered.map(project => {
                const due    = getDaysUntil(project.deadline || project.dueDate);
                const pTasks = projectTasks(project.id);
                return (
                  <div key={project.id} className={`proj-card ${viewMode==='list'?'list-card':''}`} onClick={() => setSelectedProject(project)}>
                    <div className="proj-card-accent" style={{ background: statusColor[project.status] || '#6366f1' }}></div>
                    <div className="proj-card-body">
                      <div className="proj-card-header">
                        <div className="proj-card-title-row">
                          <h3>{project.name}</h3>
                          <div className="proj-card-actions" onClick={e => e.stopPropagation()}>
                            <button className="proj-action-btn" onClick={e => openAddTask(project.id, e)} title="Add task">
                              <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                            </button>
                            <button className="proj-action-btn edit" onClick={e => openEditProject(project, e)} title="Edit">
                              <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M11 4H4C3.47 4 2.96 4.21 2.59 4.59C2.21 4.96 2 5.47 2 6V20C2 20.53 2.21 21.04 2.59 21.41C2.96 21.79 3.47 22 4 22H18C18.53 22 19.04 21.79 19.41 21.41C19.79 21.04 20 20.53 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5C18.9 2.1 19.44 1.87 20 1.87C20.56 1.87 21.1 2.1 21.5 2.5C21.9 2.9 22.13 3.44 22.13 4C22.13 4.56 21.9 5.1 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                            <button className="proj-action-btn delete" onClick={e => handleDeleteProject(project.id, e)} title="Delete">
                              <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 6L18.11 19.11C18.05 19.61 17.83 20.07 17.48 20.42C17.13 20.77 16.67 20.97 16.19 21H7.81C7.33 20.97 6.87 20.77 6.52 20.42C6.17 20.07 5.95 19.61 5.89 19.11L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          </div>
                        </div>
                        <div className="proj-card-badges">
                          <span className={`proj-status-badge status-${project.status.toLowerCase().replace(/\s+/g,'-')}`}>{project.status}</span>
                          <span className="proj-priority-badge" style={{ color:priorityColor[project.priority], borderColor:priorityColor[project.priority]+'44', background:priorityColor[project.priority]+'18' }}>
                            {project.priority==='high'?'🔴':project.priority==='medium'?'🟡':'🟢'} {project.priority}
                          </span>
                        </div>
                      </div>

                      {project.description && <p className="proj-card-desc">{project.description}</p>}

                      <div className="proj-card-meta">
                        <span>
                          <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M17 21V19C17 17.93 16.58 16.92 15.83 16.17C15.08 15.42 14.06 15 13 15H5C3.93 15 2.92 15.42 2.17 16.17C1.42 16.92 1 17.93 1 19V21" stroke="currentColor" strokeWidth="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg>
                          {project.team} members
                        </span>
                        <span>
                          <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          {pTasks.length} tasks
                        </span>
                        <span className={`proj-due due-${due.cls}`}>
                          <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                          {due.label}
                        </span>
                      </div>

                      <div className="proj-card-progress">
                        <div className="proj-progress-header">
                          <span>Progress</span>
                          <span className="proj-progress-pct">{project.progress}%</span>
                        </div>
                        <div className="proj-progress-bar">
                          <div className="proj-progress-fill" style={{
                            width:`${project.progress}%`,
                            background: project.progress>=75?'linear-gradient(90deg,#10b981,#059669)':
                                        project.progress>=50?'linear-gradient(90deg,#f59e0b,#d97706)':
                                        'linear-gradient(90deg,#6366f1,#4f46e5)'
                          }}></div>
                        </div>
                      </div>

                      {/* ── TASKS SECTION (was missing) ── */}
                      {pTasks.length > 0 && (
                        <div className="proj-tasks-preview">
                          <div className="proj-tasks-header">
                            Tasks <span className="proj-tasks-count">{pTasks.length}</span>
                          </div>
                          {pTasks.slice(0,3).map(task => {
                            const tDue = getDaysUntil(task.dueDate);
                            return (
                              <div key={task.id} className="proj-task-row" onClick={e => e.stopPropagation()}>
                                {/* Status dot — click to cycle */}
                                <button
                                  className={`proj-task-dot task-status-${task.status}`}
                                  onClick={e => toggleTaskStatus(task.id, e)}
                                  title={`Status: ${task.status} — click to advance`}
                                />
                                <div className="proj-task-info">
                                  <span className="proj-task-title">{task.title}</span>
                                  {task.category && (
                                    <span className="proj-task-cat">{task.category}</span>
                                  )}
                                </div>
                                <div className="proj-task-meta">
                                  {task.assignee && (
                                    <div className="proj-task-avatar" style={{background:task.assignee.color}} title={`Assigned to ${task.assignee.name}`}>
                                      {task.assignee.avatar}
                                    </div>
                                  )}
                                  <span className={`proj-task-due due-${tDue.cls}`}>{tDue.label}</span>
                                  <span className="proj-task-priority-dot" style={{color:priorityColor[task.priority]||'#94a3b8',fontSize:'.7rem'}}>●</span>
                                  <button className="proj-task-delete" onClick={e => handleDeleteTask(task.id, e)} title="Delete task">✕</button>
                                </div>
                              </div>
                            );
                          })}
                          {pTasks.length > 3 && (
                            <div className="proj-tasks-more">+{pTasks.length-3} more tasks</div>
                          )}
                        </div>
                      )}

                      {/* Empty tasks nudge */}
                      {pTasks.length === 0 && (
                        <div className="proj-no-tasks-cta" onClick={e => { e.stopPropagation(); openAddTask(project.id); }}>
                          + Add first task
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ PROJECT DETAIL MODAL ═══ */}
      {selectedProject && (
        <div className="proj-overlay" onClick={() => setSelectedProject(null)}>
          <div className="proj-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="proj-detail-accent" style={{ background: statusColor[selectedProject.status] || '#6366f1' }}></div>
            <div className="proj-detail-header">
              <div>
                <h2>{selectedProject.name}</h2>
                <p>{selectedProject.description}</p>
              </div>
              <button className="proj-modal-close" onClick={() => setSelectedProject(null)}>✕</button>
            </div>
            <div className="proj-detail-body">
              <div className="proj-detail-grid">
                {[
                  { label:'Status',   value: <span className={`proj-status-badge status-${selectedProject.status.toLowerCase().replace(/\s+/g,'-')}`}>{selectedProject.status}</span> },
                  { label:'Priority', value: <span style={{color:priorityColor[selectedProject.priority]}}>{selectedProject.priority?.toUpperCase()}</span> },
                  { label:'Team',     value: `${selectedProject.team} members` },
                  { label:'Deadline', value: selectedProject.deadline ? new Date(selectedProject.deadline).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) : 'Not set' },
                ].map((item,i) => (
                  <div key={i} className="proj-detail-card">
                    <div className="proj-detail-label">{item.label}</div>
                    <div className="proj-detail-value">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="proj-detail-progress">
                <div className="proj-progress-header" style={{marginBottom:'.6rem'}}>
                  <span className="proj-detail-label">Progress</span>
                  <span className="proj-progress-pct">{selectedProject.progress}%</span>
                </div>
                <div className="proj-progress-bar" style={{height:'10px'}}>
                  <div className="proj-progress-fill" style={{
                    width:`${selectedProject.progress}%`,
                    background: selectedProject.progress>=75?'linear-gradient(90deg,#10b981,#059669)':
                                selectedProject.progress>=50?'linear-gradient(90deg,#f59e0b,#d97706)':
                                'linear-gradient(90deg,#6366f1,#4f46e5)'
                  }}></div>
                </div>
                <div className="proj-detail-tasks-summary">
                  {selectedProject.completedTasks} of {selectedProject.tasks} tasks completed
                </div>
              </div>

              {/* Tasks in detail */}
              <div className="proj-detail-tasks">
                <div className="proj-tasks-header" style={{marginBottom:'.75rem',fontSize:'.9rem',fontWeight:700,color:'rgba(226,232,240,.7)',textTransform:'uppercase',letterSpacing:'.4px'}}>
                  Tasks ({projectTasks(selectedProject.id).length})
                </div>
                {projectTasks(selectedProject.id).length === 0 ? (
                  <p className="proj-no-tasks">No tasks yet. Add one below!</p>
                ) : (
                  projectTasks(selectedProject.id).map(task => {
                    const tDue = getDaysUntil(task.dueDate);
                    return (
                      <div key={task.id} className="proj-detail-task-row">
                        <button className={`proj-task-dot task-status-${task.status}`} onClick={e => toggleTaskStatus(task.id, e)} title="Cycle status"/>
                        <div className="proj-detail-task-info">
                          <span className="proj-detail-task-title">{task.title}</span>
                          {task.category && <span className="proj-detail-task-cat">{task.category}</span>}
                        </div>
                        <div className="proj-task-meta">
                          {task.assignee && (
                            <div className="proj-task-avatar" style={{background:task.assignee.color}} title={`Assigned to: ${task.assignee.name}`}>
                              {task.assignee.avatar}
                            </div>
                          )}
                          <span className={`proj-task-due due-${tDue.cls}`}>{tDue.label}</span>
                          <span className="proj-task-priority" style={{color:priorityColor[task.priority]||'#94a3b8',fontSize:'.78rem',fontWeight:600}}>{task.priority}</span>
                          <button className="proj-task-delete" onClick={e => handleDeleteTask(task.id, e)}>✕</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="proj-detail-footer">
              <button className="proj-btn-danger" onClick={e => handleDeleteProject(selectedProject.id, e)}>Delete</button>
              <button className="proj-btn-task" onClick={() => { openAddTask(selectedProject.id); setSelectedProject(null); }}>+ Add Task</button>
              <div style={{flex:1}}></div>
              <button className="proj-btn-secondary" onClick={() => setSelectedProject(null)}>Close</button>
              <button className="proj-btn-primary" onClick={e => openEditProject(selectedProject, e)}>Edit Project</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ADD/EDIT PROJECT MODAL ═══ */}
      {showProjectModal && (
        <div className="proj-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="proj-modal" onClick={e => e.stopPropagation()}>
            <div className="proj-modal-header">
              <h3>{editingProject ? 'Edit Project' : 'New Project'}</h3>
              <button className="proj-modal-close" onClick={() => setShowProjectModal(false)}>✕</button>
            </div>
            <div className="proj-modal-body">
              <div className="pform-group">
                <label>Project Name *</label>
                <input type="text" placeholder="e.g. Mobile App Redesign" autoFocus
                  value={projectForm.name} onChange={e => setProjectForm({...projectForm,name:e.target.value})}
                  className={projectErrors.name?'error':''}/>
                {projectErrors.name && <span className="perror">{projectErrors.name}</span>}
              </div>
              <div className="pform-group">
                <label>Description</label>
                <textarea placeholder="Brief project description…" rows="3"
                  value={projectForm.description} onChange={e => setProjectForm({...projectForm,description:e.target.value})}></textarea>
              </div>
              <div className="pform-row">
                <div className="pform-group">
                  <label>Deadline *</label>
                  <input type="date" value={projectForm.deadline}
                    onChange={e => setProjectForm({...projectForm,deadline:e.target.value})}
                    className={projectErrors.deadline?'error':''}/>
                  {projectErrors.deadline && <span className="perror">{projectErrors.deadline}</span>}
                </div>
                <div className="pform-group">
                  <label>Priority</label>
                  <select value={projectForm.priority} onChange={e => setProjectForm({...projectForm,priority:e.target.value})}>
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>
              <div className="pform-row">
                <div className="pform-group">
                  <label>Team Size *</label>
                  <input type="number" placeholder="e.g. 5" min="1"
                    value={projectForm.team} onChange={e => setProjectForm({...projectForm,team:e.target.value})}
                    className={projectErrors.team?'error':''}/>
                  {projectErrors.team && <span className="perror">{projectErrors.team}</span>}
                </div>
                <div className="pform-group">
                  <label>Status</label>
                  <select value={projectForm.status} onChange={e => setProjectForm({...projectForm,status:e.target.value})}>
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="pform-row">
                <div className="pform-group">
                  <label>Total Tasks *</label>
                  <input type="number" placeholder="e.g. 20" min="1"
                    value={projectForm.tasks} onChange={e => setProjectForm({...projectForm,tasks:e.target.value})}
                    className={projectErrors.tasks?'error':''}/>
                  {projectErrors.tasks && <span className="perror">{projectErrors.tasks}</span>}
                </div>
                <div className="pform-group">
                  <label>Completed Tasks</label>
                  <input type="number" placeholder="0" min="0" max={projectForm.tasks||0}
                    value={projectForm.completedTasks} onChange={e => setProjectForm({...projectForm,completedTasks:parseInt(e.target.value)||0})}/>
                </div>
              </div>
            </div>
            <div className="proj-modal-footer">
              <button className="proj-btn-secondary" onClick={() => setShowProjectModal(false)}>Cancel</button>
              <button className="proj-btn-primary" onClick={handleSaveProject}>{editingProject?'Update':'Create Project'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ADD TASK MODAL ═══ */}
      {showTaskModal && (
        <div className="proj-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="proj-modal" onClick={e => e.stopPropagation()}>
            <div className="proj-modal-header">
              <h3>Add New Task</h3>
              <button className="proj-modal-close" onClick={() => setShowTaskModal(false)}>✕</button>
            </div>
            <div className="proj-modal-body">
              <div className="pform-group">
                <label>Task Title *</label>
                <input type="text" placeholder="e.g. Design login screen" autoFocus
                  value={taskForm.title} onChange={e => setTaskForm({...taskForm,title:e.target.value})}
                  className={taskErrors.title?'error':''}/>
                {taskErrors.title && <span className="perror">{taskErrors.title}</span>}
              </div>
              <div className="pform-group">
                <label>Description</label>
                <textarea placeholder="What needs to be done?" rows="2"
                  value={taskForm.description} onChange={e => setTaskForm({...taskForm,description:e.target.value})}></textarea>
              </div>
              <div className="pform-row">
                <div className="pform-group">
                  <label>Project *</label>
                  <select value={taskForm.projectId} onChange={e => setTaskForm({...taskForm,projectId:e.target.value})}
                    className={taskErrors.projectId?'error':''}>
                    <option value="">— Select —</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  {taskErrors.projectId && <span className="perror">{taskErrors.projectId}</span>}
                </div>
                <div className="pform-group">
                  <label>Category</label>
                  <select value={taskForm.category} onChange={e => setTaskForm({...taskForm,category:e.target.value})}>
                    {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Assignee picker */}
              <div className="pform-group">
                <label>Assign To</label>
                <div className="proj-assignee-row">
                  <div className={`proj-assignee-opt ${taskForm.assigneeId===''?'selected':''}`}
                    onClick={() => setTaskForm({...taskForm,assigneeId:''})}>
                    <div className="proj-assignee-avatar unassigned">?</div>
                    <span>None</span>
                  </div>
                  {teamMembers.length === 0 && (
                    <span style={{fontSize:'.8rem',color:'rgba(148,163,184,.6)',alignSelf:'center'}}>No team members yet — add them in Team page</span>
                  )}
                  {teamMembers.map(m => (
                    <div key={m.id}
                      className={`proj-assignee-opt ${taskForm.assigneeId===m.id?'selected':''}`}
                      onClick={() => setTaskForm({...taskForm,assigneeId:m.id})}>
                      <div className="proj-assignee-avatar" style={{background:m.color}}>{m.avatar}</div>
                      <span>{m.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pform-row">
                <div className="pform-group">
                  <label>Priority</label>
                  <div className="proj-priority-row">
                    {['high','medium','low'].map(v => (
                      <button key={v} type="button"
                        className={`proj-pri-btn proj-pri-${v} ${taskForm.priority===v?'selected':''}`}
                        onClick={() => setTaskForm({...taskForm,priority:v})}>
                        {v==='high'?'🔴 High':v==='medium'?'🟡 Med':'🟢 Low'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pform-group">
                  <label>Status</label>
                  <select value={taskForm.status} onChange={e => setTaskForm({...taskForm,status:e.target.value})}>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div className="pform-group">
                <label>Due Date *</label>
                <input type="date" value={taskForm.dueDate}
                  onChange={e => setTaskForm({...taskForm,dueDate:e.target.value})}
                  className={taskErrors.dueDate?'error':''}/>
                {taskErrors.dueDate && <span className="perror">{taskErrors.dueDate}</span>}
              </div>
            </div>
            <div className="proj-modal-footer">
              <button className="proj-btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
              <button className="proj-btn-primary" onClick={handleSaveTask}>Create Task</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Projects;