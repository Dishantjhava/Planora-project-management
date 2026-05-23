import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Login from './Login';
import { vi } from 'vitest';

// Mock the API service
vi.mock('../services/api.js', () => ({
  loginUser: vi.fn().mockResolvedValue({ success: true, user: { name: 'Test' }, token: 'abc', refreshToken: 'def' })
}));

describe('Login Component', () => {
  it('renders login form and shows validation errors on empty submit', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Check form is there
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    
    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    
    // Check validation errors
    await waitFor(() => {
      expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/At least 6 characters/i)).toBeInTheDocument();
    });
  });
});
