import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import './Register.css';
import { registerUser } from '../services/api.js';
import { useAuth } from '../context/AuthContext';

import LogoIcon from './icons/LogoIcon';
import AlertIcon from './icons/AlertIcon';
import EmailIcon from './icons/EmailIcon';
import LockIcon from './icons/LockIcon';
import EyeIcon from './icons/EyeIcon';
import EyeOffIcon from './icons/EyeOffIcon';

const registerSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading]       = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', role: 'Developer' }
  });

  const passwordValue = watch('password');

  const getPasswordStrength = (password) => {
    if (!password || password.length === 0) return { strength: '', color: '' };
    if (password.length < 6)   return { strength: 'Weak',   color: '#ef4444' };
    if (password.length < 10)  return { strength: 'Medium', color: '#f59e0b' };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password))
      return { strength: 'Strong', color: '#10b981' };
    return { strength: 'Medium', color: '#f59e0b' };
  };

  const passwordStrength = getPasswordStrength(passwordValue);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setGeneralError('');
    try {
      const result = await registerUser({
        name: data.name.trim(), email: data.email,
        password: data.password, role: data.role,
      });
      if (result.success) {
        login(result.user, result.token, result.refreshToken);
        navigate('/home');
      } else {
        setGeneralError(result.message || 'Registration failed');
      }
    } catch (err) {
      setGeneralError('Server error. Make sure backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        {/* Header */}
        <div className="register-header">
          <div className="register-logo-wrap">
            <LogoIcon className="register-logo-icon" aria-hidden="true" />
          </div>
          <h1>Planora</h1>
          <p>Create your account</p>
        </div>
        {generalError && (
          <div className="register-alert" role="alert">
            <AlertIcon aria-hidden="true" />{generalError}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="register-form">
          {/* Full Name */}
          <div className="register-field">
            <label htmlFor="name">Full Name</label>
            <div className="register-input-wrap">
              <svg className="register-input-icon" viewBox="0 0 24 24" fill="none">
                <path d="M20 21V19C20 17.93 19.58 16.92 18.83 16.17C18.08 15.42 17.07 15 16 15H8C6.93 15 5.92 15.42 5.17 16.17C4.42 16.92 4 17.93 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <input type="text" id="name" placeholder="Dishant Java"
                {...register('name')}
                className={errors.name ? 'error' : ''} disabled={isLoading} autoFocus />
            </div>
            {errors.name && <span className="register-error-msg">{errors.name.message}</span>}
          </div>
          {/* Email */}
          <div className="register-field">
            <label htmlFor="email">Email Address</label>
            <div className="register-input-wrap">
              <EmailIcon className="register-input-icon" aria-hidden="true" />
              <input type="email" id="email" placeholder="you@example.com"
                {...register('email')}
                className={errors.email ? 'error' : ''} disabled={isLoading} />
            </div>
            {errors.email && <span className="register-error-msg">{errors.email.message}</span>}
          </div>
          {/* Role */}
          <div className="register-field">
            <label htmlFor="role">Your Role</label>
            <div className="register-input-wrap">
              <svg className="register-input-icon" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 7V5C16 3.93 15.58 2.92 14.83 2.17C14.08 1.42 13.07 1 12 1C10.93 1 9.92 1.42 9.17 2.17C8.42 2.92 8 3.93 8 5V7" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <select id="role" {...register('role')} disabled={isLoading}>
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
          <div className="register-field">
            <label htmlFor="password">Password</label>
            <div className="register-input-wrap">
              <LockIcon className="register-input-icon" aria-hidden="true" />
              <input type={showPassword ? 'text' : 'password'} id="password"
                placeholder="••••••••" {...register('password')}
                className={errors.password ? 'error' : ''} disabled={isLoading} />
              <button type="button" className="register-eye" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
              </button>
            </div>
            {errors.password && <span className="register-error-msg">{errors.password.message}</span>}
            {passwordValue && !errors.password && (
              <div className="register-strength">
                <div className="register-strength-bar">
                  <div className="register-strength-fill" style={{
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
          {/* Confirm Password */}
          <div className="register-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="register-input-wrap">
              <LockIcon className="register-input-icon" aria-hidden="true" />
              <input type={showConfirm ? 'text' : 'password'} id="confirmPassword"
                placeholder="••••••••" {...register('confirmPassword')}
                className={errors.confirmPassword ? 'error' : ''} disabled={isLoading} />
              <button type="button" className="register-eye" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
              </button>
            </div>
            {errors.confirmPassword && <span className="register-error-msg">{errors.confirmPassword.message}</span>}
          </div>
          {/* Submit */}
          <button type="submit" className="register-btn" disabled={isLoading}>
            {isLoading ? (
              <><span className="register-spinner"></span>Creating account...</>
            ) : (
              <>Create Account
                <svg className="register-btn-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
          <div className="register-login-link">
            Already have an account?{' '}
            <a href="#" onClick={e => { e.preventDefault(); navigate('/login'); }}>Sign in</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;