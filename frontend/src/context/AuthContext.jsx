import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check local storage on initial load
    const token = localStorage.getItem('token') || localStorage.getItem('planora_token');
    const storedUser = localStorage.getItem('planora_user');
    
    if (token && storedUser) {
      setIsAuthenticated(true);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing user data");
      }
    }
  }, []);

  const login = (userData, token, refreshToken) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('planora_token', token); // compatibility alias
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('planora_user', JSON.stringify(userData));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('planora_token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('planora_user');
  };

  // Update user data in state + localStorage (used by Settings page after profile save)
  const updateUser = (updatedUserData) => {
    const merged = { ...user, ...updatedUserData };
    setUser(merged);
    localStorage.setItem('planora_user', JSON.stringify(merged));
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

