import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';

// Reuse same icons as Login
import LogoIcon from './icons/LogoIcon';
import AlertIcon from './icons/AlertIcon';
import EmailIcon from './icons/EmailIcon';
import LockIcon from './icons/LockIcon';
import EyeIcon from './icons/EyeIcon';
import EyeOffIcon from './icons/EyeOffIcon';

const Register = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Developer',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [errors, setErrors]             = useState({});
  const [isLoading, setIsLoading]       = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: '', color: '' };
    if (password.length < 6)   return { strength: 'Weak',   color: '#ef4444' };
    if (password.length < 10)  return { strength: 'Medium', color: '#f59e0b' };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password))
      return { strength: 'Strong', color: '#10b981' };
    return { strength: 'Medium', color: '#f59e0b' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim())          newErrors.name = 'Full name is required';
    if (!formData.email)                newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Enter a valid email';
    if (!formData.password)             newErrors.password = 'Password is required';
    else if (formData.password.length < 6)   newErrors.password = 'At least 6 characters';
    if (!formData.confirmPassword)      newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const result = await registerUser({
        name:     formData.name.trim(),
        email:    formData.email,
        password: formData.password,
        role:     formData.role,
      });
      if (result.success) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('planora_user', JSON.stringify(result.user));
        onLogin();
        navigate('/home');
      } else {
        setErrors({ general: result.message || 'Registration failed' });
      }
    } catch (err) {
      setErrors({ general: 'Server error. Make sure backend is running.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="shape"></div>
        <div className="shape"></div>
      </div>

      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="logo-container">
            <LogoIcon className="logo-icon" aria-hidden="true" />
          </div>
          <h1>Planora</h1>
          <p>Create your account</p>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="alert alert-error" role="alert">
            <AlertIcon aria-hidden="true" />
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">

          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                <path d="M20 21V19C20 17.93 19.58 16.92 18.83 16.17C18.08 15.42 17.07 15 16 15H8C6.93 15 5.92 15.42 5.17 16.17C4.42 16.92 4 17.93 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <input
                type="text" id="name" name="name"
                placeholder="Dishant Java"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
                disabled={isLoading} autoFocus
              />
            </div>
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <EmailIcon className="input-icon" aria-hidden="true" />
              <input
                type="email" id="email" name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                disabled={isLoading}
              />
            </div>
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {/* Role */}
          <div className="form-group">
            <label htmlFor="role">Your Role</label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 7V5C16 3.93 15.58 2.92 14.83 2.17C14.08 1.42 13.07 1 12 1C10.93 1 9.92 1.42 9.17 2.17C8.42 2.92 8 3.93 8 5V7" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <select
                id="role" name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={isLoading}
                style={{ background: 'transparent', border: 'none', color: 'inherit', width: '100%', outline: 'none', paddingLeft: '2.5rem' }}
              >
                <option value="Developer">Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Designer">Designer</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <LockIcon className="input-icon" aria-hidden="true" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password" name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
                disabled={isLoading}
              />
              <button type="button" className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
            {formData.password && !errors.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div className="strength-fill" style={{
                    width: passwordStrength.strength === 'Weak' ? '33%' : passwordStrength.strength === 'Medium' ? '66%' : '100%',
                    backgroundColor: passwordStrength.color
                  }}></div>
                </div>
                <span className="strength-text" style={{ color: passwordStrength.color }}>
                  {passwordStrength.strength}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <LockIcon className="input-icon" aria-hidden="true" />
              <input
                type={showConfirm ? 'text' : 'password'}
                id="confirmPassword" name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'error' : ''}
                disabled={isLoading}
              />
              <button type="button" className="password-toggle"
                onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          {/* Submit */}
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <><span className="spinner"></span>Creating account...</>
            ) : (
              <>
                Create Account
                <svg className="button-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>

          {/* Login link */}
          <div className="signup-link">
            Already have an account?{' '}
            <a href="#" onClick={e => { e.preventDefault(); navigate('/login'); }}>
              Sign in
            </a>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Register;