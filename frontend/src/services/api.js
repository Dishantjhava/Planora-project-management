import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api'
});

// Auto-attach the JWT Bearer token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/register') || originalRequest.url.includes('/auth/refresh')) {
        return error.response.data || { success: false, message: error.message };
      }

      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return err.response ? err.response.data : { success: false, message: err.message };
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('planora_user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
        return error.response.data || { success: false, message: error.message };
      }

      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        if (data.success) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('refreshToken', data.refreshToken);
          api.defaults.headers.common['Authorization'] = 'Bearer ' + data.token;
          originalRequest.headers.Authorization = 'Bearer ' + data.token;
          processQueue(null, data.token);
          return api(originalRequest);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('planora_user');
        toast.error('Session expired. Please log in again.');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
        return err.response ? err.response.data : { success: false, message: err.message };
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response && error.response.data) {
      if (error.response.status !== 401) {
        toast.error(error.response.data.message || 'An error occurred');
      }
      return error.response.data;
    }
    toast.error(error.message || 'Network error');
    return { success: false, message: error.message };
  }
);

// ─── AUTH ───────────────────────────────────────────
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// ─── PROJECTS ───────────────────────────────────────
export const getProjects = (page = 1, limit = 10, filters = {}) => {
  const query = new URLSearchParams({ page, limit, ...filters }).toString();
  return api.get(`/projects?${query}`);
};
export const createProject = (data) => api.post('/projects', data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);

// ─── TASKS ──────────────────────────────────────────
export const getTasks = (projectId = '', page = 1, limit = 10, filters = {}) => {
  const params = { page, limit, ...filters };
  if (projectId) params.project = projectId;
  const query = new URLSearchParams(params).toString();
  return api.get(`/tasks?${query}`);
};
export const createTask = (data) => api.post('/tasks', data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

// ─── TEAM ───────────────────────────────────────────
export const getTeamMembers = () => api.get('/team');
export const updateTeamMember = (id, data) => api.put(`/team/${id}`, data);
export const removeTeamMember = (id) => api.delete(`/team/${id}`);

// ─── NOTIFICATIONS ────────────────────────────────────
export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);