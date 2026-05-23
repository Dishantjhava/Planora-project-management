import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { vi } from 'vitest';

// Mock the AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ logout: vi.fn() })
}));

// Mock the DataContext
vi.mock('../context/DataContext', () => ({
  useData: () => ({
    projects: [{ id: 1, name: 'Project 1', status: 'In Progress', tasks: 10, completedTasks: 5, progress: 50, deadline: new Date().toISOString(), priority: 'high', team: 5 }],
    setProjects: vi.fn(),
    tasks: [{ id: 1, title: 'Task 1', status: 'todo' }, { id: 2, title: 'Task 2', status: 'done' }],
    setTasks: vi.fn(),
    teamMembers: [{ id: 1, name: 'John Doe', role: 'Developer', status: 'online' }],
    setTeamMembers: vi.fn(),
    notifications: [],
    setNotifications: vi.fn(),
    pendingInvites: [],
    setPendingInvites: vi.fn(),
    loading: false,
    fetchData: vi.fn()
  })
}));

describe('Dashboard Component', () => {
  it('renders stats correctly based on mocked context', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    // Total Projects should be 1
    expect(screen.getByText('Total Projects')).toBeInTheDocument();
    
    // Active tasks should be 1
    expect(screen.getByText('Active Tasks')).toBeInTheDocument();
  });
});
