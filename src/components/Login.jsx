import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { loginUser } from '../services/api.js';

import LogoIcon from './icons/LogoIcon';
import AlertIcon from './icons/AlertIcon';
import EmailIcon from './icons/EmailIcon';
import LockIcon from './icons/LockIcon';
import CheckIcon from './icons/CheckIcon';
import EyeIcon from './icons/EyeIcon';
import EyeOffIcon from './icons/EyeOffIcon';
import GoogleIcon from './icons/GoogleIcon';
import GithubIcon from './icons/GithubIcon';

const MAX_LOGIN_ATTEMPTS = 5;



const Login = ({ onLogin }) => {
  const [formData, setFormData]           = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe]       = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [errors, setErrors]               = useState({});
  const [isLoading, setIsLoading]         = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('planora_saved_email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Enter a valid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'At least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'email' && value && !validateEmail(value))
      setErrors(prev => ({ ...prev, email: 'Enter a valid email address' }));
    else if (name === 'password' && value && value.length < 6)
      setErrors(prev => ({ ...prev, password: 'At least 6 characters' }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      setErrors({ general: 'Too many attempts. Please try again later.' });
      return;
    }
    setIsLoading(true);
    try {
      const result = await loginUser({ email: formData.email, password: formData.password });
      if (result.success) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('planora_user', JSON.stringify(result.user));
        if (rememberMe) localStorage.setItem('planora_saved_email', formData.email);
        else localStorage.removeItem('planora_saved_email');
        onLogin();
        navigate('/home');
      } else {
        setLoginAttempts(prev => prev + 1);
        setErrors({ general: result.message || 'Invalid email or password' });
      }
    } catch (err) {
      setErrors({ general: 'Server error. Make sure backend is running.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cu-page">

      {/* ── LEFT PANEL ── */}
      <div className="cu-left">
        <div className="cu-blob cu-blob-1"></div>
        <div className="cu-blob cu-blob-2"></div>

        {/* Navbar */}
        <div className="cu-nav">
          <div className="cu-logo">
            <div className="cu-logo-icon"><LogoIcon /></div>
            <span className="cu-logo-text">Planora</span>
          </div>
          <div className="cu-nav-right">
            <span className="cu-nav-label">New to Planora?</span>
            <button className="cu-nav-btn" onClick={() => navigate('/register')}>Sign Up Free</button>
          </div>
        </div>

        {/* Hero content */}
        <div className="cu-hero">
          <div className="cu-eyebrow">
            <span className="cu-eyebrow-dot"></span>
            AI-powered project management
          </div>

          <h1 className="cu-title">
            Project management<br />
            <span className="cu-title-accent">built for teams</span>
          </h1>

          <p className="cu-subtitle">
            Bring projects, tasks, and teams together in one place that keeps everyone aligned automatically.
          </p>


          <button className="cu-cta" onClick={() => navigate('/register')}>
            Get Started. It's FREE →
          </button>

          <div className="cu-proof">
            <span className="cu-stars">★★★★★</span>
            <span className="cu-proof-text">Trusted by 10,000+ teams worldwide</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="cu-right">
        <div className="cu-right-blob cu-right-blob-1"></div>
        <div className="cu-right-blob cu-right-blob-2"></div>

        <div className="cu-form-box">

          <div className="cu-mobile-logo">
            <div className="cu-logo-icon-sm"><LogoIcon /></div>
            <span>Planora</span>
          </div>

          <div className="cu-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your Planora account</p>
          </div>

          {errors.general && (
            <div className="cu-alert" role="alert">
              <AlertIcon />{errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="cu-form">

            {/* Email */}
            <div className="cu-field">
              <label htmlFor="email">Email Address</label>
              <div className="cu-input-wrap">
                <EmailIcon className="cu-input-icon" />
                <input
                  type="email" id="email" name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.email ? 'cu-err' : ''}
                  disabled={isLoading}
                  autoFocus
                />
                {formData.email && !errors.email && <CheckIcon className="cu-check-icon" />}
              </div>
              {errors.email && <span className="cu-error-msg">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="cu-field">
              <label htmlFor="password">Password</label>
              <div className="cu-input-wrap">
                <LockIcon className="cu-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password" name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.password ? 'cu-err' : ''}
                  disabled={isLoading}
                />
                <button type="button" className="cu-eye" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && <span className="cu-error-msg">{errors.password}</span>}
              {formData.password && !errors.password && (
                <div className="cu-strength">
                  <div className="cu-strength-bar">
                    <div className="cu-strength-fill" style={{
                      width: passwordStrength.strength === 'Weak' ? '33%' : passwordStrength.strength === 'Medium' ? '66%' : '100%',
                      backgroundColor: passwordStrength.color
                    }} />
                  </div>
                  <span style={{ color: passwordStrength.color, fontSize: '0.75rem', fontWeight: 600 }}>
                    {passwordStrength.strength}
                  </span>
                </div>
              )}
            </div>

            {/* Options */}
            <div className="cu-options">
              <label className="cu-remember">
                <input type="checkbox" checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)} disabled={isLoading} />
                <span>Remember me</span>
              </label>
              <a href="#" className="cu-forgot">Forgot password?</a>
            </div>

            {/* Submit */}
            <button type="submit" className="cu-submit" disabled={isLoading}>
              {isLoading ? (
                <><span className="cu-spinner"></span>Signing in...</>
              ) : (
                <>Sign In
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </>
              )}
            </button>

            <div className="cu-divider"><span>OR</span></div>

            <div className="cu-socials">
              <button type="button" className="cu-social google" disabled={isLoading}>
                <GoogleIcon /> Continue with Google
              </button>
              <button type="button" className="cu-social github" disabled={isLoading}>
                <GithubIcon /> Continue with GitHub
              </button>
            </div>

            <div className="cu-link">
              Don't have an account?{' '}
              <a href="#" onClick={e => { e.preventDefault(); navigate('/register'); }}>Sign up free</a>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
};

export default Login;