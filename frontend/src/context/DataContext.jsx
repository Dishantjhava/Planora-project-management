import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProjects, getTeamMembers, getTasks, getNotifications } from '../services/api.js';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Notifications and invites
  const [notifications, setNotifications] = useState([]);
  const [tasksPagination, setTasksPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [projectsPagination, setProjectsPagination] = useState({ page: 1, pages: 1, total: 0 });

  const [pendingInvites, setPendingInvites] = useState(() => {
    const s = localStorage.getItem('planora_invites');
    return s ? JSON.parse(s) : [];
  });

  useEffect(() => {
    localStorage.setItem('planora_invites', JSON.stringify(pendingInvites));
  }, [pendingInvites]);

  const formatTask = (t, members) => {
    const pid = typeof t.project === 'object'
      ? (t.project?._id?.toString() || t.project?.toString())
      : t.project?.toString();

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
  };

  const fetchData = async (filters = {}) => {
    setLoading(true);
    try {
      const [projRes, teamRes, taskRes, notifRes] = await Promise.all([
        getProjects(1, 10, filters).catch(() => ({ success: false })),
        getTeamMembers().catch(() => ({ success: false })),
        getTasks('', 1, 10, filters).catch(() => ({ success: false })),
        getNotifications().catch(() => ({ success: false })),
      ]);

      let members = [];
      if (teamRes && teamRes.success) {
        members = teamRes.members.map(m => ({
          id: m._id?.toString(),
          name: m.user?.name || 'Unknown',
          role: m.role,
          avatar: m.user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??',
          status: m.availability === 'Available' ? 'online' : m.availability === 'Busy' ? 'away' : 'offline',
          color: '#6366f1',
        }));
        setTeamMembers(members);
      }

      if (projRes && projRes.success) {
        setProjects(projRes.projects.map(p => ({
          ...p,
          id: p._id?.toString(),
          team: p.members?.length || 0,
          tasks: 0,
          completedTasks: 0,
          progress: 0,
        })));
        setProjectsPagination({ page: projRes.page, pages: projRes.pages, total: projRes.total });
      }

      if (taskRes && taskRes.success) {
        setTasks(taskRes.tasks.map(t => formatTask(t, members)));
        setTasksPagination({ page: taskRes.page, pages: taskRes.pages, total: taskRes.total });
      }

      if (notifRes && notifRes.success) {
        setNotifications(notifRes.notifications.map(n => ({
          ...n,
          id: n._id,
          title: n.type === 'assignment' ? 'New task assigned' : 'Notification',
          time: 'Just now'
        })));
      }
    } catch (err) {
      console.error('Failed to fetch data globally:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreTasks = async (filters = {}) => {
    if (tasksPagination.page >= tasksPagination.pages) return;
    const nextPage = tasksPagination.page + 1;
    const res = await getTasks('', nextPage, 10, filters);
    if (res.success) {
      setTasks(prev => [...prev, ...res.tasks.map(t => formatTask(t, teamMembers))]);
      setTasksPagination({ page: res.page, pages: res.pages, total: res.total });
    }
  };

  const fetchMoreProjects = async (filters = {}) => {
    if (projectsPagination.page >= projectsPagination.pages) return;
    const nextPage = projectsPagination.page + 1;
    const res = await getProjects(nextPage, 10, filters);
    if (res.success) {
      setProjects(prev => [...prev, ...res.projects.map(p => ({
          ...p,
          id: p._id?.toString(),
          team: p.members?.length || 0,
          tasks: 0,
          completedTasks: 0,
          progress: 0,
        }))]);
      setProjectsPagination({ page: res.page, pages: res.pages, total: res.total });
    }
  };

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const socket = io('http://localhost:5000', { withCredentials: true });

    socket.on('task_created', (newTask) => {
      setTasks(prev => {
        const formatted = formatTask(newTask, teamMembers);
        // Avoid duplicates if this client created it and already added it
        if (prev.some(t => t.id === formatted.id)) return prev;
        return [formatted, ...prev];
      });
    });

    socket.on('task_updated', (updatedTask) => {
      setTasks(prev => {
        const formatted = formatTask(updatedTask, teamMembers);
        return prev.map(t => t.id === formatted.id ? formatted : t);
      });
    });

    socket.on('task_deleted', (taskId) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    });

    const userStr = localStorage.getItem('planora_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user) {
      socket.on(`new_notification_${user._id}`, (notification) => {
        setNotifications(prev => [{
          ...notification,
          id: notification._id,
          title: notification.type === 'assignment' ? 'New task assigned' : 'Notification',
          time: 'Just now'
        }, ...prev]);
        toast.success(`New Notification: ${notification.sender?.name} ${notification.message}`);
      });
    }

    return () => socket.disconnect();
  }, [teamMembers]);

  return (
    <DataContext.Provider value={{
      projects, setProjects,
      tasks, setTasks,
      teamMembers, setTeamMembers,
      notifications, setNotifications,
      pendingInvites, setPendingInvites,
      tasksPagination, projectsPagination,
      loading, fetchData, fetchMoreTasks, fetchMoreProjects
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
