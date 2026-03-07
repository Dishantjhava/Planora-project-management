const BASE_URL = '/api';

// Helper function - adds token to every request automatically
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// ─── AUTH ───────────────────────────────────────────
export const registerUser = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const loginUser = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getMe = async () => {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: authHeaders(),
  });
  return res.json();
};

// ─── PROJECTS ───────────────────────────────────────
export const getProjects = async () => {
  const res = await fetch(`${BASE_URL}/projects`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const createProject = async (data) => {
  const res = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateProject = async (id, data) => {
  const res = await fetch(`${BASE_URL}/projects/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteProject = async (id) => {
  const res = await fetch(`${BASE_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return res.json();
};

// ─── TASKS ──────────────────────────────────────────
export const getTasks = async (projectId = '') => {
  const query = projectId ? `?project=${projectId}` : '';
  const res = await fetch(`${BASE_URL}/tasks${query}`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const createTask = async (data) => {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateTask = async (id, data) => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteTask = async (id) => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return res.json();
};

// ─── TEAM ───────────────────────────────────────────
export const getTeamMembers = async () => {
  const res = await fetch(`${BASE_URL}/team`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const updateTeamMember = async (id, data) => {
  const res = await fetch(`${BASE_URL}/team/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const removeTeamMember = async (id) => {
  const res = await fetch(`${BASE_URL}/team/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return res.json();
};