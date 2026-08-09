import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths, addWeeks, subWeeks,
  addDays, subDays, isSameDay, isSameMonth, isToday,
  getDay, getDate, getMonth, getYear,
  parseISO, isValid, differenceInCalendarDays
} from 'date-fns';
import './Calendar.css';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { createTask } from '../services/api.js';
import LogoIcon from './icons/LogoIcon';
import LogoText from './icons/LogoText';

// ── Color maps ────────────────────────────────────────────────────────────────
const PROJECT_COLORS = {
  'Planning':    { bg: 'rgba(99,102,241,0.18)',  border: '#6366f1', text: '#a5b4fc', dot: '#6366f1' },
  'In Progress': { bg: 'rgba(245,158,11,0.18)',  border: '#f59e0b', text: '#fde68a', dot: '#f59e0b' },
  'On Hold':     { bg: 'rgba(239,68,68,0.18)',   border: '#ef4444', text: '#fca5a5', dot: '#ef4444' },
  'Completed':   { bg: 'rgba(16,185,129,0.18)',  border: '#10b981', text: '#a7f3d0', dot: '#10b981' },
};

const TASK_COLORS = {
  high:   { bg: 'rgba(239,68,68,0.15)',   border: '#ef4444', text: '#fca5a5', dot: '#ef4444' },
  medium: { bg: 'rgba(0,180,166,0.15)',   border: '#00b4a6', text: '#5eead4', dot: '#00b4a6' },
  low:    { bg: 'rgba(100,116,139,0.15)', border: '#64748b', text: '#94a3b8', dot: '#94a3b8' },
  High:   { bg: 'rgba(239,68,68,0.15)',   border: '#ef4444', text: '#fca5a5', dot: '#ef4444' },
  Medium: { bg: 'rgba(0,180,166,0.15)',   border: '#00b4a6', text: '#5eead4', dot: '#00b4a6' },
  Low:    { bg: 'rgba(100,116,139,0.15)', border: '#64748b', text: '#94a3b8', dot: '#94a3b8' },
};

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// ── Sidebar Nav Icons ─────────────────────────────────────────────────────────
const Icons = {
  home:          <svg viewBox="0 0 24 24" fill="none"><path d="M3 9L12 2L21 9V20C21 20.53 20.79 21.04 20.41 21.41C20.04 21.79 19.53 22 19 22H5C4.47 22 3.96 21.79 3.59 21.41C3.21 21.04 3 20.53 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  dashboard:     <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  projects:      <svg viewBox="0 0 24 24" fill="none"><path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12V19C21 19.53 20.79 20.04 20.41 20.41C20.04 20.79 19.53 21 19 21H5C4.47 21 3.96 20.79 3.59 20.41C3.21 20.04 3 19.53 3 19V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  team:          <svg viewBox="0 0 24 24" fill="none"><path d="M17 21V19C17 17.93 16.58 16.92 15.83 16.17C15.08 15.42 14.06 15 13 15H5C3.93 15 2.92 15.42 2.17 16.17C1.42 16.92 1 17.93 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg>,
  calendar:      <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  reports:       <svg viewBox="0 0 24 24" fill="none"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  notifications: <svg viewBox="0 0 24 24" fill="none"><path d="M18 8C18 6.41 17.37 4.88 16.24 3.76C15.12 2.63 13.59 2 12 2C10.41 2 8.88 2.63 7.76 3.76C6.63 4.88 6 6.41 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21C13.55 21.3 13.3 21.55 12.99 21.73C12.69 21.9 12.35 22 12 22C11.65 22 11.31 21.9 11.01 21.73C10.7 21.55 10.45 21.3 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  settings:      <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><path d="M19.4 15A7.5 7.5 0 1 1 12 7.5" stroke="currentColor" strokeWidth="2"/></svg>,
  chevLeft:      <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevRight:     <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  menu:          <svg viewBox="0 0 24 24" fill="none"><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  logout:        <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M9 21H5C4.47 21 3.96 20.79 3.59 20.41C3.21 20.04 3 19.53 3 19V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H9" stroke="currentColor" strokeWidth="2"/><path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2"/><path d="M21 12H9" stroke="currentColor" strokeWidth="2"/></svg>,
};

// ── MiniCalendar Widget ──────────────────────────────────────────────────────
const MiniCalendar = ({ currentDate, onSelectDate, eventDays }) => {
  const [miniMonth, setMiniMonth] = React.useState(() => startOfMonth(currentDate));

  // Keep mini calendar in sync when main view month changes
  React.useEffect(() => {
    setMiniMonth(startOfMonth(currentDate));
  }, [format(currentDate, 'yyyy-MM')]);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(miniMonth)),
    end:   endOfWeek(endOfMonth(miniMonth)),
  });

  return (
    <div className="mini-cal">
      <div className="mini-cal-hd">
        <button className="mini-nav" onClick={() => setMiniMonth(m => subMonths(m, 1))}>‹</button>
        <span className="mini-month-lbl">{format(miniMonth, 'MMM yyyy')}</span>
        <button className="mini-nav" onClick={() => setMiniMonth(m => addMonths(m, 1))}>›</button>
      </div>
      <div className="mini-cal-dow">
        {['S','M','T','W','T','F','S'].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="mini-cal-grid">
        {days.map((day, i) => {
          const key      = format(day, 'yyyy-MM-dd');
          const inMonth  = isSameMonth(day, miniMonth);
          const todayDay = isToday(day);
          const selected = isSameDay(day, currentDate);
          const hasEvts  = eventDays.has(key) && inMonth;
          return (
            <button
              key={i}
              className={[
                'mini-day',
                inMonth  ? ''            : 'mini-other',
                todayDay ? 'mini-today'  : '',
                selected ? 'mini-sel'    : '',
              ].join(' ').trim()}
              onClick={() => onSelectDate(day)}
              title={format(day, 'MMMM d, yyyy')}
            >
              <span className="mini-day-num">{getDate(day)}</span>
              {hasEvts && <span className="mini-ev-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const parseDate = (d) => {
  if (!d) return null;
  const parsed = d instanceof Date ? d : parseISO(String(d));
  return isValid(parsed) ? parsed : null;
};

// ── EventChip ─────────────────────────────────────────────────────────────────
const EventChip = ({ event, onClick, compact = false }) => {
  const colors = event.type === 'project'
    ? (PROJECT_COLORS[event.status] || PROJECT_COLORS['Planning'])
    : (TASK_COLORS[event.priority] || TASK_COLORS.medium);

  return (
    <button
      className={`ev-chip ev-${event.type} ${compact ? 'ev-compact' : ''}`}
      style={{ background: colors.bg, borderLeft: `3px solid ${colors.border}`, color: colors.text }}
      onClick={e => { e.stopPropagation(); onClick(event); }}
      title={event.title}
    >
      <span className="ev-dot" style={{ background: colors.dot }} />
      <span className="ev-label">{event.title}</span>
      {!compact && event.type === 'task' && (
        <span className="ev-badge" style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
          {String(event.priority || 'med').slice(0, 3).toUpperCase()}
        </span>
      )}
    </button>
  );
};

// ── EventDetailModal ──────────────────────────────────────────────────────────
const EventDetailModal = ({ event, onClose }) => {
  if (!event) return null;
  const isProject = event.type === 'project';
  const colors = isProject
    ? (PROJECT_COLORS[event.status] || PROJECT_COLORS['Planning'])
    : (TASK_COLORS[event.priority] || TASK_COLORS.medium);

  const daysAway = differenceInCalendarDays(event.date, new Date());

  return (
    <div className="cal-overlay" onClick={onClose}>
      <div className="cal-modal" onClick={e => e.stopPropagation()}>
        <button className="cal-modal-x" onClick={onClose}>✕</button>
        <div className="cal-modal-top" style={{ borderColor: colors.border }}>
          <div className="cal-modal-badge" style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
            {isProject ? '📁 Project Deadline' : '✅ Task Due Date'}
          </div>
          <h2 className="cal-modal-title">{event.title}</h2>
          {event.description && <p className="cal-modal-desc">{event.description}</p>}
        </div>
        <div className="cal-modal-body">
          <div className="cal-modal-row">
            <span className="cal-modal-lbl">📅 Date</span>
            <span className="cal-modal-val">{format(event.date, 'MMMM d, yyyy')}</span>
          </div>
          <div className="cal-modal-row">
            <span className="cal-modal-lbl">⏳ Countdown</span>
            <span className="cal-modal-val" style={{ color: daysAway < 0 ? '#ef4444' : daysAway === 0 ? '#f59e0b' : daysAway < 7 ? '#fbbf24' : '#94a3b8' }}>
              {daysAway < 0 ? `${Math.abs(daysAway)}d overdue` : daysAway === 0 ? 'Due today!' : `${daysAway} days left`}
            </span>
          </div>
          {isProject ? (
            <>
              <div className="cal-modal-row">
                <span className="cal-modal-lbl">📊 Status</span>
                <span className="cal-modal-val">
                  <span className="cal-dot" style={{ background: colors.dot }} /> {event.status}
                </span>
              </div>
              <div className="cal-modal-row">
                <span className="cal-modal-lbl">⚡ Priority</span>
                <span className="cal-modal-val">{event.priority || 'Medium'}</span>
              </div>
              {event.memberCount > 0 && (
                <div className="cal-modal-row">
                  <span className="cal-modal-lbl">👥 Members</span>
                  <span className="cal-modal-val">{event.memberCount} members</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="cal-modal-row">
                <span className="cal-modal-lbl">🎯 Priority</span>
                <span className="cal-modal-val">
                  <span className="cal-dot" style={{ background: colors.dot }} /> {event.priority}
                </span>
              </div>
              <div className="cal-modal-row">
                <span className="cal-modal-lbl">📋 Status</span>
                <span className="cal-modal-val">{event.status}</span>
              </div>
              {event.projectName && (
                <div className="cal-modal-row">
                  <span className="cal-modal-lbl">📁 Project</span>
                  <span className="cal-modal-val">{event.projectName}</span>
                </div>
              )}
              {event.assigneeName && (
                <div className="cal-modal-row">
                  <span className="cal-modal-lbl">👤 Assignee</span>
                  <span className="cal-modal-val">{event.assigneeName}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Calendar Component ───────────────────────────────────────────────────
const Calendar = () => {
  const { logout, user } = useAuth();
  const { projects, tasks, setTasks, teamMembers, loading, notifications = [] } = useData();
  const navigate = useNavigate();
  const unreadCount = notifications.filter(n => !n.read).length;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState('month');   // 'month' | 'week' | 'day'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Filter toggles
  const [showProjects, setShowProjects] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [filterPriority, setFilterPriority] = useState('All');

  // Add Task modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', projectId: '', priority: 'Medium', dueDate: '' });
  const [addErrors, setAddErrors] = useState({});
  const [addLoading, setAddLoading] = useState(false);

  const today = new Date();

  // ── Build Events from real data ───────────────────────────────────────────
  const allEvents = useMemo(() => {
    const events = [];

    if (showProjects) {
      projects.forEach(proj => {
        const d = parseDate(proj.dueDate || proj.deadline);
        if (!d) return;
        events.push({
          id: `proj-${proj.id || proj._id}`,
          type: 'project',
          title: proj.name,
          description: proj.description || '',
          date: d,
          status: proj.status || 'Planning',
          priority: proj.priority || 'Medium',
          memberCount: proj.members?.length || proj.team || 0,
        });
      });
    }

    if (showTasks) {
      tasks.forEach(task => {
        const d = parseDate(task.dueDate);
        if (!d) return;
        if (filterPriority !== 'All' &&
            (task.priority || '').toLowerCase() !== filterPriority.toLowerCase()) return;

        const proj = projects.find(p =>
          (p.id || p._id?.toString()) === (task.projectId || task.project?.toString()));
        const assignee = teamMembers.find(m =>
          m.id === (task.assigneeId || task.assignedTo?.toString()));

        events.push({
          id: `task-${task.id || task._id}`,
          type: 'task',
          title: task.title,
          description: task.description || '',
          date: d,
          status: task.status || 'Todo',
          priority: task.priority || 'Medium',
          projectName: proj?.name || '',
          assigneeName: assignee?.name || task.assignee?.name || '',
        });
      });
    }

    return events;
  }, [projects, tasks, teamMembers, showProjects, showTasks, filterPriority]);

  const getEventsForDay = useCallback(
    (date) => allEvents.filter(e => isSameDay(e.date, date)),
    [allEvents]
  );

  // ── Navigation ────────────────────────────────────────────────────────────
  const navigate_cal = (dir) => {
    setCurrentDate(prev => {
      if (view === 'month') return dir > 0 ? addMonths(prev, 1) : subMonths(prev, 1);
      if (view === 'week')  return dir > 0 ? addWeeks(prev, 1)  : subWeeks(prev, 1);
      return dir > 0 ? addDays(prev, 1) : subDays(prev, 1);
    });
  };

  // ── Period label ──────────────────────────────────────────────────────────
  const periodLabel = useMemo(() => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy');
    if (view === 'week') {
      const ws = startOfWeek(currentDate);
      const we = endOfWeek(currentDate);
      return getMonth(ws) === getMonth(we)
        ? `${format(ws, 'MMMM d')}–${format(we, 'd, yyyy')}`
        : `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'EEEE, MMMM d, yyyy');
  }, [view, currentDate]);

  // ── Month grid days ───────────────────────────────────────────────────────
  const monthDays = useMemo(() => {
    const first = startOfMonth(currentDate);
    const last  = endOfMonth(currentDate);
    const gridStart = startOfWeek(first);
    const gridEnd   = endOfWeek(last);
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentDate]);

  // ── Week days ─────────────────────────────────────────────────────────────
  const weekDays = useMemo(() => {
    const ws = startOfWeek(currentDate);
    return eachDayOfInterval({ start: ws, end: endOfWeek(currentDate) });
  }, [currentDate]);

  // ── Upcoming events (sorted, next 7) ─────────────────────────────────────
  const upcomingEvents = useMemo(() => {
    return [...allEvents]
      .filter(e => e.date >= today)
      .sort((a, b) => a.date - b.date)
      .slice(0, 7);
  }, [allEvents]);

  // ── Set of date strings that have events (for mini calendar dots) ────────
  const eventDaysSet = useMemo(
    () => new Set(allEvents.map(e => format(e.date, 'yyyy-MM-dd'))),
    [allEvents]
  );

  // ── Open add-task modal pre-filled with selected date ────────────────────
  const openAddModal = () => {
    setAddForm({
      title: '', projectId: '',
      priority: 'Medium',
      dueDate: format(currentDate, 'yyyy-MM-dd'),
    });
    setAddErrors({});
    setShowAddModal(true);
  };

  // ── Submit new task to backend ────────────────────────────────────────────
  const handleAddTask = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!addForm.title.trim())  errs.title     = 'Title is required';
    if (!addForm.projectId)     errs.projectId = 'Select a project';
    if (!addForm.dueDate)       errs.dueDate   = 'Due date is required';
    if (Object.keys(errs).length) { setAddErrors(errs); return; }
    setAddLoading(true);
    try {
      const result = await createTask({
        title:    addForm.title.trim(),
        project:  addForm.projectId,
        priority: addForm.priority,
        dueDate:  addForm.dueDate,
        status:   'Todo',
      });
      if (result.success) {
        const raw = result.task;
        const pid = typeof raw.project === 'object'
          ? raw.project?._id?.toString()
          : raw.project?.toString();
        setTasks(prev => [{ ...raw, id: raw._id?.toString(), projectId: pid || addForm.projectId }, ...prev]);
        setShowAddModal(false);
      } else {
        setAddErrors({ title: result.message || 'Failed to create task.' });
      }
    } catch {
      setAddErrors({ title: 'Server error. Please try again.' });
    } finally {
      setAddLoading(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="cal-wrap">
        <div className="cal-loading-state">
          <div className="cal-spinner" />
          <p>Loading calendar data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cal-wrap">
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
            {Icons.home}{sidebarOpen && <span>Home</span>}
          </a>
          <a href="#" className="nav-item" onClick={e => { e.preventDefault(); navigate('/dashboard'); }}>
            {Icons.dashboard}{sidebarOpen && <span>Dashboard</span>}
          </a>
          <a href="#" className="nav-item" onClick={e => { e.preventDefault(); navigate('/projects'); }}>
            {Icons.projects}{sidebarOpen && <span>Projects</span>}
          </a>
          <a href="#" className="nav-item" onClick={e => { e.preventDefault(); navigate('/team'); }}>
            {Icons.team}{sidebarOpen && <span>Team</span>}
          </a>
          <a href="#" className="nav-item active" onClick={e => e.preventDefault()}>
            {Icons.calendar}{sidebarOpen && <span>Calendar</span>}
          </a>
          <a href="#" className="nav-item" onClick={e => { e.preventDefault(); navigate('/reports'); }}>
            {Icons.reports}{sidebarOpen && <span>Reports</span>}
          </a>
          <a href="#" className="nav-item" onClick={e => { e.preventDefault(); navigate('/notifications'); }}>
            {Icons.notifications}
            {sidebarOpen && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>Notifications</span>
                {unreadCount > 0 && <span className="sidebar-notif-badge" style={{ background: '#00b4a6', color: '#0f172a', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>{unreadCount}</span>}
              </div>
            )}
          </a>
        </nav>

        {/* Mini Calendar — only visible when sidebar is open */}
        {sidebarOpen && (
          <div className="sidebar-mini-cal">
            <MiniCalendar
              currentDate={currentDate}
              onSelectDate={(d) => { setCurrentDate(d); setView('day'); }}
              eventDays={eventDaysSet}
            />
          </div>
        )}

        <div className="sidebar-footer">
          <a href="#" className="nav-item" onClick={e => { e.preventDefault(); navigate('/settings'); }}>
            {Icons.settings}{sidebarOpen && <span>Settings</span>}
          </a>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="cal-main">
        {/* Page Header */}
        <header className="cal-page-header">
          <div className="cal-header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(o => !o)}>
              {Icons.menu}
            </button>
            <div>
              <h2>Calendar</h2>
              <span className="cal-header-sub">
                {allEvents.length === 0
                  ? 'No events scheduled'
                  : allEvents.length === 1
                  ? '1 event scheduled'
                  : `${allEvents.length} events scheduled`}
              </span>
            </div>
          </div>
          <div className="cal-header-right">
            <button className="cal-add-btn" onClick={openAddModal} title="Add new task">
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              New Task
            </button>
            <button className="icon-button" title="Notifications" onClick={() => navigate('/notifications')} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '50%', marginRight: '0.5rem', position: 'relative' }}>
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8C18 6.41 17.37 4.88 16.24 3.76C15.12 2.63 13.59 2 12 2C10.41 2 8.88 2.63 7.76 3.76C6.63 4.88 6 6.41 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"/><path d="M13.73 21C13.55 21.3 13.3 21.55 12.99 21.73C12.69 21.9 12.35 22 12 22C11.65 22 11.31 21.9 11.01 21.73C10.7 21.55 10.45 21.3 10.27 21"/></svg>
              {unreadCount > 0 && <span className="notification-badge" style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: 'bold', borderRadius: '50%', width: '15px', height: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>}
            </button>
            <div className="user-pill" onClick={logout} title="Logout">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=14b8a6&color=fff`}
                alt="avatar"
              />
              {Icons.logout}
            </div>
          </div>
        </header>

        {/* Toolbar */}
        <div className="cal-toolbar">
          <div className="cal-toolbar-left">
            <button className="cal-nav-btn" onClick={() => navigate_cal(-1)} title="Previous">
              {Icons.chevLeft}
            </button>
            <button className="cal-today-btn" onClick={() => setCurrentDate(new Date())}>
              Today
            </button>
            <button className="cal-nav-btn" onClick={() => navigate_cal(1)} title="Next">
              {Icons.chevRight}
            </button>
            <h3 className="cal-period">{periodLabel}</h3>
          </div>
          <div className="cal-toolbar-right">
            <div className="cal-filters">
              <button
                className={`cal-filter-pill ${showProjects ? 'active-proj' : ''}`}
                onClick={() => setShowProjects(v => !v)}
              >
                <span className="cal-fdot" style={{ background: '#6366f1' }} /> Projects
              </button>
              <button
                className={`cal-filter-pill ${showTasks ? 'active-task' : ''}`}
                onClick={() => setShowTasks(v => !v)}
              >
                <span className="cal-fdot" style={{ background: '#00b4a6' }} /> Tasks
              </button>
              <select
                className="cal-pri-select"
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value)}
              >
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="cal-views">
              {['month', 'week', 'day'].map(v => (
                <button
                  key={v}
                  className={`cal-view-btn ${view === v ? 'active' : ''}`}
                  onClick={() => setView(v)}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════ MONTH VIEW ═══════════════ */}
        {view === 'month' && (
          <div className="cal-month-wrap">
            {/* Day of week headers */}
            <div className="cal-dow-row">
              {DAYS_SHORT.map(d => (
                <div key={d} className="cal-dow">{d}</div>
              ))}
            </div>
            {/* Grid */}
            <div className="cal-month-grid">
              {monthDays.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const inMonth   = isSameMonth(day, currentDate);
                const todayDay  = isToday(day);
                const MAX = 3;
                return (
                  <div
                    key={idx}
                    className={`cal-cell ${inMonth ? '' : 'cal-cell-other'} ${todayDay ? 'cal-cell-today' : ''}`}
                    onClick={() => { setCurrentDate(day); setView('day'); }}
                  >
                    <div className="cal-cell-num">
                      <span className={todayDay ? 'cal-today-badge' : ''}>{getDate(day)}</span>
                    </div>
                    <div className="cal-cell-events">
                      {dayEvents.slice(0, MAX).map(ev => (
                        <EventChip key={ev.id} event={ev} onClick={setSelectedEvent} compact />
                      ))}
                      {dayEvents.length > MAX && (
                        <button
                          className="cal-more"
                          onClick={e => { e.stopPropagation(); setCurrentDate(day); setView('day'); }}
                        >
                          +{dayEvents.length - MAX} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════ WEEK VIEW ═══════════════ */}
        {view === 'week' && (
          <div className="cal-week-wrap">
            <div className="cal-week-head">
              <div className="cal-time-gutter" />
              {weekDays.map((d, i) => (
                <div key={i} className={`cal-week-col-hd ${isToday(d) ? 'wh-today' : ''}`}>
                  <span className="wh-dow">{DAYS_SHORT[getDay(d)]}</span>
                  <span className={`wh-num ${isToday(d) ? 'cal-today-badge' : ''}`}>{getDate(d)}</span>
                </div>
              ))}
            </div>
            <div className="cal-week-body">
              <div className="cal-time-col">
                {HOURS.map(h => (
                  <div key={h} className="cal-hr-label">
                    {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                  </div>
                ))}
              </div>
              {weekDays.map((day, di) => {
                const dayEvents = getEventsForDay(day);
                return (
                  <div key={di} className={`cal-week-col ${isToday(day) ? 'wc-today' : ''}`}>
                    <div className="cal-week-slots">
                      {HOURS.map(h => <div key={h} className="cal-hr-slot" />)}
                    </div>
                    <div className="cal-week-events">
                      {dayEvents.length === 0 ? (
                        <span className="cal-week-empty">—</span>
                      ) : (
                        dayEvents.map(ev => (
                          <EventChip key={ev.id} event={ev} onClick={setSelectedEvent} />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════ DAY VIEW ═══════════════ */}
        {view === 'day' && (
          <div className="cal-day-wrap">
            <div className="cal-day-head">
              <div className="cal-time-gutter" />
              <div className={`cal-day-title ${isToday(currentDate) ? 'dt-today' : ''}`}>
                <span className="dt-dow">{format(currentDate, 'EEEE')}</span>
                <span className={`dt-num ${isToday(currentDate) ? 'cal-today-badge' : ''}`}>
                  {getDate(currentDate)}
                </span>
                <span className="dt-month">{format(currentDate, 'MMMM yyyy')}</span>
              </div>
            </div>
            <div className="cal-day-body">
              <div className="cal-time-col">
                {HOURS.map(h => (
                  <div key={h} className="cal-hr-label">
                    {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                  </div>
                ))}
              </div>
              <div className="cal-day-col">
                {HOURS.map(h => <div key={h} className="cal-hr-slot" />)}
                <div className="cal-day-events-panel">
                  {getEventsForDay(currentDate).length === 0 ? (
                    <div className="cal-day-empty-state">
                      <span className="cal-day-empty-icon">📅</span>
                      <p>No events on this day</p>
                      <span className="cal-day-empty-hint">
                        Task due dates and project deadlines will appear here
                      </span>
                    </div>
                  ) : (
                    getEventsForDay(currentDate).map(ev => (
                      <EventChip key={ev.id} event={ev} onClick={setSelectedEvent} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Right Panel: Upcoming + Legend + Stats ── */}
      <aside className="cal-sidebar-right">
        <div className="csr-section">
          <div className="csr-header">
            <h4>Upcoming Events</h4>
            {upcomingEvents.length > 0 && (
              <span className="csr-badge">{upcomingEvents.length}</span>
            )}
          </div>
          <div className="csr-upcoming-list">
            {upcomingEvents.length === 0 ? (
              <div className="csr-empty">
                <span>🎉</span>
                <p>All clear!</p>
              </div>
            ) : (
              upcomingEvents.map(ev => {
                const colors = ev.type === 'project'
                  ? (PROJECT_COLORS[ev.status] || PROJECT_COLORS['Planning'])
                  : (TASK_COLORS[ev.priority] || TASK_COLORS.medium);
                const days = differenceInCalendarDays(ev.date, today);
                return (
                  <button
                    key={ev.id}
                    className="csr-ev-item"
                    style={{ borderLeft: `3px solid ${colors.border}` }}
                    onClick={() => setSelectedEvent(ev)}
                  >
                    <div className="csr-ev-top">
                      <span className="csr-ev-type" style={{ background: colors.bg, color: colors.text }}>
                        {ev.type === 'project' ? '📁' : '✅'} {ev.type}
                      </span>
                      <span
                        className="csr-ev-days"
                        style={{ color: days === 0 ? '#f59e0b' : days <= 2 ? '#ef4444' : '#94a3b8' }}
                      >
                        {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                      </span>
                    </div>
                    <p className="csr-ev-title">{ev.title}</p>
                    <span className="csr-ev-date">{format(ev.date, 'MMM d, yyyy')}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="csr-section">
          <h4 className="csr-legend-title">Legend</h4>
          <div className="csr-legend">
            {[
              { dot: '#6366f1', label: 'Project (Planning)' },
              { dot: '#f59e0b', label: 'Project (In Progress)' },
              { dot: '#10b981', label: 'Project (Completed)' },
              { dot: '#ef4444', label: 'Task (High priority)' },
              { dot: '#00b4a6', label: 'Task (Medium priority)' },
              { dot: '#64748b', label: 'Task (Low priority)' },
            ].map(({ dot, label }) => (
              <div key={label} className="csr-legend-item">
                <span className="csr-ldot" style={{ background: dot }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="csr-section">
          <h4 className="csr-legend-title">Stats</h4>
          <div className="csr-stats">
            {[
              { num: allEvents.filter(e => e.type === 'project').length, lbl: 'Deadlines', activeColor: '#6366f1' },
              { num: allEvents.filter(e => e.type === 'task').length,    lbl: 'Task Dues', activeColor: '#00b4a6' },
              {
                num: allEvents.filter(e => {
                  const d = differenceInCalendarDays(e.date, today);
                  return d >= 0 && d <= 7;
                }).length,
                lbl: 'This Week',
                activeColor: '#f59e0b'
              },
              {
                num: allEvents.filter(e => differenceInCalendarDays(e.date, today) < 0).length,
                lbl: 'Overdue',
                activeColor: '#ef4444'
              },
            ].map(({ num, lbl, activeColor }) => (
              <div key={lbl} className="csr-stat">
                <span
                  className="csr-stat-num"
                  style={{ color: num === 0 ? '#475569' : activeColor }}
                >
                  {num}
                </span>
                <span className="csr-stat-lbl">{lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Add Task Modal ── */}
      {showAddModal && (
        <div className="cal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="cal-modal cal-add-modal" onClick={e => e.stopPropagation()}>
            <button className="cal-modal-x" onClick={() => setShowAddModal(false)}>✕</button>
            <div className="cal-add-hd">
              <div className="cal-add-icon">✅</div>
              <div>
                <h2>Add New Task</h2>
                <p>Task will appear on the calendar on its due date</p>
              </div>
            </div>
            <form className="cal-add-form" onSubmit={handleAddTask}>
              <div className="cal-add-field">
                <label>Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Complete wireframes…"
                  value={addForm.title}
                  onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                  className={addErrors.title ? 'field-err' : ''}
                  autoFocus
                />
                {addErrors.title && <span className="cal-err-msg">{addErrors.title}</span>}
              </div>
              <div className="cal-add-field">
                <label>Project *</label>
                <select
                  value={addForm.projectId}
                  onChange={e => setAddForm(f => ({ ...f, projectId: e.target.value }))}
                  className={addErrors.projectId ? 'field-err' : ''}
                >
                  <option value="">Select a project…</option>
                  {projects.map(p => (
                    <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                  ))}
                </select>
                {addErrors.projectId && <span className="cal-err-msg">{addErrors.projectId}</span>}
              </div>
              <div className="cal-add-row">
                <div className="cal-add-field">
                  <label>Priority</label>
                  <select
                    value={addForm.priority}
                    onChange={e => setAddForm(f => ({ ...f, priority: e.target.value }))}
                  >
                    <option value="High">🔴 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </div>
                <div className="cal-add-field">
                  <label>Due Date *</label>
                  <input
                    type="date"
                    value={addForm.dueDate}
                    onChange={e => setAddForm(f => ({ ...f, dueDate: e.target.value }))}
                    className={addErrors.dueDate ? 'field-err' : ''}
                  />
                  {addErrors.dueDate && <span className="cal-err-msg">{addErrors.dueDate}</span>}
                </div>
              </div>
              <div className="cal-add-actions">
                <button type="button" className="cal-add-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="cal-add-submit" disabled={addLoading}>
                  {addLoading ? 'Creating…' : '+ Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Event Detail Modal ── */}
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
};

export default Calendar;
