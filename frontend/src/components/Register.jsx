import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import './Register.css';
import { registerUser } from '../services/api.js';
import { useAuth } from '../context/AuthContext';

import AlertIcon from './icons/AlertIcon';
import EmailIcon from './icons/EmailIcon';
import LockIcon from './icons/LockIcon';
import EyeIcon from './icons/EyeIcon';
import EyeOffIcon from './icons/EyeOffIcon';
import LogoIcon from './icons/LogoIcon';
import LogoText from './icons/LogoText';

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
    if (!password || password.length === 0) return { strength: '', color: '', width: '0%' };
    if (password.length < 6)   return { strength: 'Weak',   color: '#ef4444', width: '33%' };
    if (password.length < 10)  return { strength: 'Medium', color: '#f59e0b', width: '66%' };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password))
      return { strength: 'Strong', color: '#10b981', width: '100%' };
    return { strength: 'Medium', color: '#f59e0b', width: '66%' };
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

  // ── Particle Network Animation ──────────────────────────
  useEffect(() => {
    const canvas = document.getElementById('particle-canvas-register');
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

    const onMouseMove  = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onMouseLeave = ()   => { mouse.x = -999;      mouse.y = -999; };
    const onResize     = ()   => { init(); };

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
        if (md < REPEL_DIST && md > 0) {
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

        // Draw node dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20,184,166,0.75)';
        ctx.fill();

        // Soft glow halo around each node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
        glow.addColorStop(0, 'rgba(20,184,166,0.12)');
        glow.addColorStop(1, 'rgba(20,184,166,0)');
        ctx.fillStyle = glow;
        ctx.fill();

        // Draw connections between nearby particles
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

  return (
    <div className="rg-page">
      <canvas id="particle-canvas-register" className="particle-canvas" />

      {/* ── LEFT PANEL ── */}
      <div className="rg-left">
        <div className="rg-blob rg-blob-1"></div>
        <div className="rg-blob rg-blob-2"></div>

        {/* Top nav */}
        <div className="rg-nav">
          <div className="rg-logo">
            <div className="rg-logo-icon">
              <LogoIcon />
            </div>
            <LogoText className="rg-logo-text" />
          </div>
          <div className="rg-nav-right">
            <span className="rg-nav-label">Already have an account?</span>
            <button className="rg-nav-btn" onClick={() => navigate('/login')}>Sign In</button>
          </div>
        </div>

        {/* Hero content */}
        <div className="rg-hero">
          <div className="rg-hero-content">
            <div className="rg-eyebrow">
              <span className="rg-eyebrow-dot"></span>
              Join thousands of teams
            </div>
            <h1 className="rg-title">
              Start managing<br />
              <span className="rg-title-accent">smarter today</span>
            </h1>
            <p className="rg-subtitle">
              Set up your workspace in minutes. Collaborate, track, and deliver projects faster than ever before.
            </p>

            {/* Feature checklist */}
            <div className="rg-features">
              <div className="rg-feature">
                <div className="rg-feature-check">✓</div>
                <div className="rg-feature-text">
                  <strong>Free forever</strong>
                  <span>No credit card required</span>
                </div>
              </div>
              <div className="rg-feature">
                <div className="rg-feature-check">✓</div>
                <div className="rg-feature-text">
                  <strong>Unlimited projects</strong>
                  <span>Scale as your team grows</span>
                </div>
              </div>
              <div className="rg-feature">
                <div className="rg-feature-check">✓</div>
                <div className="rg-feature-text">
                  <strong>Real-time collaboration</strong>
                  <span>Everyone stays in sync</span>
                </div>
              </div>
            </div>

            {/* Social proof */}
            <div className="rg-social-proof">
              <div className="rg-proof-avatars">
                {['#14b8a6','#6366f1','#f59e0b','#ec4899'].map((c, i) => (
                  <div key={i} className="rg-proof-avatar" style={{ background: c, zIndex: 4 - i }}>
                    {['SK','MR','ED','JS'][i]}
                  </div>
                ))}
              </div>
              <div className="rg-proof-text">
                <strong>4,000+</strong> teams trust Planora
              </div>
            </div>
          </div>

          {/* Dashboard mini-preview */}
          <div className="rg-preview">
            <div className="rg-preview-header">
              <div className="rg-ph-dots">
                <span className="r"></span><span className="y"></span><span className="g"></span>
              </div>
              <div className="rg-ph-title">planora.app/dashboard</div>
              <div className="rg-ph-actions">
                <div className="rg-ph-btn"></div>
                <div className="rg-ph-btn"></div>
              </div>
            </div>
            <div className="rg-preview-body">
              {/* Sidebar strip */}
              <div className="rg-prev-sidebar">
                <div className="rg-prev-logo">
                  <LogoIcon />
                </div>
                <div className="rg-prev-nav">
                  {['🏠','📊','📋','👥','📅'].map((icon, i) => (
                    <div key={i} className={`rg-prev-item${i === 0 ? ' active' : ''}`}>{icon}</div>
                  ))}
                </div>
              </div>
              {/* Main area */}
              <div className="rg-prev-main">
                <div className="rg-prev-stats">
                  {[{v:'12',l:'Projects'},{v:'48',l:'Tasks'},{v:'94%',l:'On Track'}].map((s, i) => (
                    <div key={i} className="rg-prev-stat">
                      <span className="rg-pv">{s.v}</span>
                      <span className="rg-pl">{s.l}</span>
                    </div>
                  ))}
                </div>
                <div className="rg-prev-tasks">
                  {[
                    {name:'Website Redesign', tag:'Design', tagCls:'design', done: true},
                    {name:'API Integration',  tag:'Dev',    tagCls:'dev',    done: false},
                    {name:'User Testing',     tag:'QA',     tagCls:'qa',     done: false},
                  ].map((t, i) => (
                    <div key={i} className="rg-prev-task">
                      <span className={`rg-pt-dot${t.done ? ' done' : ' prog'}`}></span>
                      <span className="rg-pt-name">{t.name}</span>
                      <span className={`rg-pt-tag ${t.tagCls}`}>{t.tag}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="rg-right">
        <div className="rg-right-blob rg-right-blob-1"></div>
        <div className="rg-right-blob rg-right-blob-2"></div>

        <div className="rg-form-box">

          {/* Mobile logo */}
          <div className="rg-mobile-logo">
            <div className="rg-logo-icon-sm">
              <LogoIcon />
            </div>
            <LogoText style={{ fontSize: '1.25rem', letterSpacing: '-0.3px', color: 'white' }} />
          </div>

          <div className="rg-form-header">
            <h2>Create your account</h2>
            <p>Start your free workspace — no credit card needed</p>
          </div>

          {generalError && (
            <div className="rg-alert" role="alert">
              <AlertIcon />{generalError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="rg-form">

            {/* Two-column row: Name + Role */}
            <div className="rg-row">
              {/* Full Name */}
              <div className="rg-field">
                <label htmlFor="name">Full Name</label>
                <div className="rg-input-wrap">
                  <svg className="rg-input-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21V19C20 17.93 19.58 16.92 18.83 16.17C18.08 15.42 17.07 15 16 15H8C6.93 15 5.92 15.42 5.17 16.17C4.42 16.92 4 17.93 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <input
                    type="text" id="name" placeholder="Your full name"
                    {...register('name')}
                    className={errors.name ? 'rg-err' : ''}
                    disabled={isLoading} autoFocus
                  />
                </div>
                {errors.name && <span className="rg-error-msg">{errors.name.message}</span>}
              </div>

              {/* Role */}
              <div className="rg-field">
                <label htmlFor="role">Your Role</label>
                <div className="rg-input-wrap">
                  <svg className="rg-input-icon" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 7V5C16 3.93 15.58 2.92 14.83 2.17C14.08 1.42 13.07 1 12 1C10.93 1 9.92 1.42 9.17 2.17C8.42 2.92 8 3.93 8 5V7" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <select id="role" {...register('role')} disabled={isLoading}>
                    <option value="Developer">Developer</option>
                    <option value="Frontend Developer">Frontend Dev</option>
                    <option value="Backend Developer">Backend Dev</option>
                    <option value="Designer">Designer</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="rg-field">
              <label htmlFor="email">Email Address</label>
              <div className="rg-input-wrap">
                <EmailIcon className="rg-input-icon" />
                <input
                  type="email" id="email" placeholder="you@example.com"
                  {...register('email')}
                  className={errors.email ? 'rg-err' : ''}
                  disabled={isLoading}
                />
              </div>
              {errors.email && <span className="rg-error-msg">{errors.email.message}</span>}
            </div>

            {/* Two-column row: Password + Confirm */}
            <div className="rg-row">
              {/* Password */}
              <div className="rg-field">
                <label htmlFor="password">Password</label>
                <div className="rg-input-wrap">
                  <LockIcon className="rg-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'} id="password"
                    placeholder="Min. 6 characters"
                    {...register('password')}
                    className={errors.password ? 'rg-err' : ''}
                    disabled={isLoading}
                  />
                  <button type="button" className="rg-eye" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.password && <span className="rg-error-msg">{errors.password.message}</span>}
                {passwordValue && !errors.password && (
                  <div className="rg-strength">
                    <div className="rg-strength-bar">
                      <div className="rg-strength-fill" style={{ width: passwordStrength.width, backgroundColor: passwordStrength.color }} />
                    </div>
                    <span style={{ color: passwordStrength.color, fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {passwordStrength.strength}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="rg-field">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="rg-input-wrap">
                  <LockIcon className="rg-input-icon" />
                  <input
                    type={showConfirm ? 'text' : 'password'} id="confirmPassword"
                    placeholder="Repeat password"
                    {...register('confirmPassword')}
                    className={errors.confirmPassword ? 'rg-err' : ''}
                    disabled={isLoading}
                  />
                  <button type="button" className="rg-eye" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="rg-error-msg">{errors.confirmPassword.message}</span>}
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="rg-submit" disabled={isLoading}>
              {isLoading ? (
                <><span className="rg-spinner"></span>Creating account...</>
              ) : (
                <>Create Account
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </>
              )}
            </button>

            <div className="rg-link">
              Already have an account?{' '}
              <a href="#" onClick={e => { e.preventDefault(); navigate('/login'); }}>Sign in</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;