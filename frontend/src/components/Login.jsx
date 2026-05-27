import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import './Login.css';
import { loginUser, googleLoginUser } from '../services/api.js';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

import LogoIcon from './icons/LogoIcon';
import AlertIcon from './icons/AlertIcon';
import EmailIcon from './icons/EmailIcon';
import LockIcon from './icons/LockIcon';
import CheckIcon from './icons/CheckIcon';
import EyeIcon from './icons/EyeIcon';
import EyeOffIcon from './icons/EyeOffIcon';
import GoogleIcon from './icons/GoogleIcon';

const MAX_LOGIN_ATTEMPTS = 5;

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(6, 'At least 6 characters')
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [rememberMe, setRememberMe]       = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [generalError, setGeneralError]   = useState('');
  const [isLoading, setIsLoading]         = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');

  useEffect(() => {
    const savedEmail = localStorage.getItem('planora_saved_email');
    if (savedEmail) {
      setValue('email', savedEmail);
      setRememberMe(true);
    }
  }, [setValue]);

  // ── Particle Network Animation ──────────────────────────
  useEffect(() => {
    const canvas = document.getElementById('particle-canvas-login');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, particles, animId;
    const PARTICLE_COUNT = 60;
    const CONNECT_DIST   = 130;
    const REPEL_DIST     = 90;
    const mouse = { x: -999, y: -999 };

    const init = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x:    Math.random() * W,
        y:    Math.random() * H,
        ox:   0,
        oy:   0,
        dx:   (Math.random() - 0.5) * 0.55,
        dy:   (Math.random() - 0.5) * 0.55,
        size: Math.random() * 1.8 + 0.8,
      }));
    };

    const onMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onMouseLeave = ()   => { mouse.x = -999;      mouse.y = -999; };
    const onResize = () => { init(); };

    window.addEventListener('mousemove',  onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('resize',     onResize);

    const animate = () => {
      ctx.clearRect(0, 0, W, H);

      particles.forEach((p, i) => {
        // Mouse repulsion
        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        const md  = Math.hypot(mdx, mdy);
        if (md < REPEL_DIST) {
          const force = (REPEL_DIST - md) / REPEL_DIST;
          p.ox += mdx / md * force * 1.5;
          p.oy += mdy / md * force * 1.5;
        }

        // Apply offset with damping
        p.x += p.dx + p.ox * 0.04;
        p.y += p.dy + p.oy * 0.04;
        p.ox *= 0.88;
        p.oy *= 0.88;

        // Bounce walls
        if (p.x < 0 || p.x > W) p.dx *= -1;
        if (p.y < 0 || p.y > H) p.dy *= -1;
        p.x = Math.max(0, Math.min(W, p.x));
        p.y = Math.max(0, Math.min(H, p.y));

        // Draw node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20,184,166,0.75)';
        ctx.fill();

        // Glow on nodes
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
        glow.addColorStop(0, 'rgba(20,184,166,0.12)');
        glow.addColorStop(1, 'rgba(20,184,166,0)');
        ctx.fillStyle = glow;
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const d  = Math.hypot(p2.x - p.x, p2.y - p.y);
          if (d < CONNECT_DIST) {
            const alpha = (1 - d / CONNECT_DIST) * 0.22;
            ctx.strokeStyle = `rgba(20,184,166,${alpha})`;
            ctx.lineWidth   = 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animId = requestAnimationFrame(animate);
    };

    init();
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove',  onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize',     onResize);
    };
  }, []);

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
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      setGeneralError('Too many attempts. Please try again later.');
      return;
    }
    setIsLoading(true);
    setGeneralError('');
    try {
      const result = await loginUser({ email: data.email, password: data.password });
      if (result.success) {
        if (rememberMe) localStorage.setItem('planora_saved_email', data.email);
        else localStorage.removeItem('planora_saved_email');
        login(result.user, result.token, result.refreshToken);
        navigate('/home');
      } else {
        setLoginAttempts(prev => prev + 1);
        setGeneralError(result.message || 'Invalid email or password');
      }
    } catch (err) {
      setGeneralError('Server error. Make sure backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setGeneralError('');
      try {
        const result = await googleLoginUser(tokenResponse.access_token);
        if (result && result.success) {
          login(result.user, result.token, result.refreshToken);
          navigate('/home');
        } else {
          setGeneralError(result?.message || 'Google sign-in failed. Please try again.');
        }
      } catch (err) {
        setGeneralError('Google sign-in failed. Make sure the backend is running.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setGeneralError('Google sign-in was cancelled or failed.');
    },
  });

  return (
    <div className="cu-page">
      <canvas id="particle-canvas-login" className="particle-canvas" />
      {/* ── LEFT PANEL ── */}
      <div className="cu-left">
        <div className="cu-blob cu-blob-1"></div>
        <div className="cu-blob cu-blob-2"></div>
        <div className="cu-nav">
          <div className="cu-logo">
            <div className="cu-logo-icon" style={{ fontSize: '1.2rem', fontWeight: 800 }}>P</div>
            <span className="cu-logo-text">Planora</span>
          </div>
          <div className="cu-nav-right">
            <span className="cu-nav-label">New to Planora?</span>
            <button className="cu-nav-btn" onClick={() => navigate('/register')}>Sign Up Free</button>
          </div>
        </div>
        <div className="cu-hero">
          <div className="cu-hero-content">
            <div className="cu-eyebrow">
              <span className="cu-eyebrow-dot"></span>
              Modern project management
            </div>
            <h1 className="cu-title">
              Project management<br />
              <span className="cu-title-accent">built for teams</span>
            </h1>
            <p className="cu-subtitle">
              Bring projects, tasks, and teams together in one place that keeps everyone aligned automatically.
            </p>
            <div className="cu-pills-row">
              <div className="cu-pill">
                <span className="cu-pill-icon">✨</span>
                <span>Real-time sync</span>
              </div>
              <div className="cu-pill">
                <span className="cu-pill-icon">✓</span>
                <span>Team sync</span>
              </div>
              <div className="cu-pill">
                <span className="cu-pill-icon">📊</span>
                <span>Analytics</span>
              </div>
            </div>
          </div>
          <div className="cu-app-preview">
            {/* Browser chrome */}
            <div className="cu-preview-header">
              <div className="cu-ph-dots"><span className="r"></span><span className="y"></span><span className="g"></span></div>
              <div className="cu-ph-title">planora.app/dashboard</div>
              <div className="cu-ph-actions">
                <div className="cu-ph-btn"></div>
                <div className="cu-ph-btn"></div>
              </div>
            </div>
            {/* Desktop dashboard layout: sidebar + main */}
            <div className="cu-preview-desktop">
              {/* Sidebar */}
              <div className="cu-desk-sidebar">
                <div className="cu-ds-logo">P</div>
                <div className="cu-ds-nav">
                  <div className="cu-ds-item active">📋 Projects</div>
                  <div className="cu-ds-item">✅ Tasks</div>
                  <div className="cu-ds-item">💬 Chat</div>
                  <div className="cu-ds-item">📈 Reports</div>
                </div>
              </div>
              {/* Main content */}
              <div className="cu-desk-main">
                {/* Stats row */}
                <div className="cu-desk-stats">
                  <div className="cu-desk-stat">
                    <span className="cu-ds-val">12</span>
                    <span className="cu-ds-lbl">Projects</span>
                  </div>
                  <div className="cu-desk-stat">
                    <span className="cu-ds-val">48</span>
                    <span className="cu-ds-lbl">Tasks Done</span>
                  </div>
                  <div className="cu-desk-stat">
                    <span className="cu-ds-val">75%</span>
                    <span className="cu-ds-lbl">On Track</span>
                  </div>
                </div>
                {/* Task list */}
                <div className="cu-desk-tasks">
                  <div className="cu-desk-task">
                    <span className="cu-t-dot done"></span>
                    <span className="cu-dtask-name">Homepage Redesign</span>
                    <span className="cu-dtask-tag design">Design</span>
                  </div>
                  <div className="cu-desk-task">
                    <span className="cu-t-dot prog"></span>
                    <span className="cu-dtask-name">API Integration</span>
                    <span className="cu-dtask-tag dev">Dev</span>
                  </div>
                  <div className="cu-desk-task">
                    <span className="cu-t-dot rev"></span>
                    <span className="cu-dtask-name">Security Audit</span>
                    <span className="cu-dtask-tag review">Review</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="cu-right">
        <div className="cu-right-blob cu-right-blob-1"></div>
        <div className="cu-right-blob cu-right-blob-2"></div>
        <div className="cu-form-box">
          <div className="cu-mobile-logo">
            <div className="cu-logo-icon-sm" style={{ fontSize: '1rem', fontWeight: 800 }}>P</div>
            <span>Planora</span>
          </div>
          <div className="cu-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your Planora account</p>
          </div>
          {generalError && (
            <div className="cu-alert" role="alert">
              <AlertIcon />{generalError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="cu-form">
            {/* Email */}
            <div className="cu-field">
              <label htmlFor="email">Email Address</label>
              <div className="cu-input-wrap">
                <EmailIcon className="cu-input-icon" />
                <input
                  type="email" id="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className={errors.email ? 'cu-err' : ''}
                  disabled={isLoading}
                  autoFocus
                />
                {emailValue && !errors.email && <CheckIcon className="cu-check-icon" />}
              </div>
              {errors.email && <span className="cu-error-msg">{errors.email.message}</span>}
            </div>
            {/* Password */}
            <div className="cu-field">
              <label htmlFor="password">Password</label>
              <div className="cu-input-wrap">
                <LockIcon className="cu-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={errors.password ? 'cu-err' : ''}
                  disabled={isLoading}
                />
                <button type="button" className="cu-eye" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && <span className="cu-error-msg">{errors.password.message}</span>}
              {passwordValue && !errors.password && (
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
              <button
                type="button"
                className="cu-social google"
                disabled={isLoading || googleLoading}
                onClick={() => handleGoogleLogin()}
              >
                {googleLoading ? (
                  <><span className="cu-spinner"></span>Signing in with Google...</>
                ) : (
                  <><GoogleIcon /> Continue with Google</>
                )}
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