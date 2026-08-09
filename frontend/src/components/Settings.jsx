import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import './Settings.css';
import LogoIcon from './icons/LogoIcon';
import LogoText from './icons/LogoText';

// ── Axios instance ──────────────────────────────────────────────────────────
const api = axios.create({ baseURL: '/api', withCredentials: true });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('planora_token') || localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Accent colour presets ───────────────────────────────────────────────────
const ACCENT_PRESETS = [
  { name: 'Teal',   hex: '#00b4a6' },
  { name: 'Blue',   hex: '#3b82f6' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Green',  hex: '#22c55e' },
];

// ── Password strength helper ───────────────────────────────────────────────
const getPwStrength = (pw) => {
  if (!pw) return { score: 0, label: '', cls: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = ['', 'weak', 'fair', 'good', 'strong'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[score], cls: map[score] };
};

const PwRule = ({ met, children }) => (
  <div className={`pw-rule${met ? ' met' : ''}`}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {met
        ? <path d="M5 13l4 4L19 7" />
        : <path d="M18 6L6 18M6 6l12 12" />}
    </svg>
    <span>{children}</span>
  </div>
);

// ── Tab icons ──────────────────────────────────────────────────────────────
const TabIcons = {
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  account: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  appearance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 1 7 7c0 2-1 4-3 5-1 .5-2 1-2 2v1h-4v-1c0-1-1-1.5-2-2-2-1-3-3-3-5a7 7 0 0 1 7-7z"/>
    </svg>
  ),
  notifications: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  privacy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  danger: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
};

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: 'profile' },
  { id: 'account',       label: 'Account',        icon: 'account' },
  { id: 'appearance',    label: 'Appearance',     icon: 'appearance' },
  { id: 'notifications', label: 'Notifications',  icon: 'notifications' },
  { id: 'privacy',       label: 'Privacy',        icon: 'privacy' },
  { id: 'danger',        label: 'Danger Zone',    icon: 'danger', isDanger: true },
];

// ── Toggle component ────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, label, desc, id }) => (
  <div className="toggle-row">
    <div className="toggle-info">
      <span className="toggle-label">{label}</span>
      {desc && <span className="toggle-desc">{desc}</span>}
    </div>
    <label className="toggle-switch" htmlFor={id} title={label}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} />
      <span className="toggle-slider" />
    </label>
  </div>
);

// ── Eye icon ────────────────────────────────────────────────────────────────
const EyeIcon = ({ open }) => open
  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const Settings = () => {
  const { user, logout, updateUser } = useAuth();
  const { notifications = [] } = useData();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab]     = useState('profile');
  const [saving, setSaving]           = useState(false);
  const [hasChanges, setHasChanges]   = useState(false);

  // ── Profile form ──────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    name: '', email: '', jobTitle: '', department: '',
    bio: '', phone: '', location: '', avatar: ''
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);

  // ── Password form ─────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);

  // ── Appearance ────────────────────────────────────────────────────────────
  const [accentColor, setAccentColor] = useState(() =>
    localStorage.getItem('planora_accent') || '#00b4a6'
  );
  const [fontSize, setFontSize] = useState(() =>
    localStorage.getItem('planora_fontsize') || 'medium'
  );
  const [compactSidebar, setCompactSidebar] = useState(() =>
    localStorage.getItem('planora_compact') === 'true'
  );

  // ── Notification prefs ────────────────────────────────────────────────────
  const defaultNotifPrefs = {
    emailProjects: true, emailTasks: true, emailTeam: true,
    emailDeadlines: true, emailWeekly: false,
    inAppSound: false, inAppDesktop: true, inAppRealtime: true,
    showOnline: true, showLastActive: true,
    quietHoursEnabled: false, quietHoursFrom: '22:00', quietHoursTo: '08:00',
    frequency: 'realtime',
  };
  const [notifPrefs, setNotifPrefs] = useState(defaultNotifPrefs);

  // ── Privacy ───────────────────────────────────────────────────────────────
  const [profileVisibility, setProfileVisibility] = useState('public');

  // ── Modal states ──────────────────────────────────────────────────────────
  const [deleteModal, setDeleteModal]   = useState(false);
  const [leaveModal, setLeaveModal]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [leaveConfirm, setLeaveConfirm]   = useState('');
  const [deleting, setDeleting]           = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Fetch profile from API on mount ───────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data?.success) {
          const u = res.data.user;
          setProfile({
            name: u.name || '',
            email: u.email || '',
            jobTitle: u.jobTitle || '',
            department: u.department || '',
            bio: u.bio || '',
            phone: u.phone || '',
            location: u.location || '',
            avatar: u.avatar || '',
          });
          setAvatarPreview(u.avatar || '');
          if (u.notificationPrefs) {
            setNotifPrefs(prev => ({ ...prev, ...u.notificationPrefs }));
          }
          if (u.profileVisibility) setProfileVisibility(u.profileVisibility);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // ── Apply accent colour to CSS variable ───────────────────────────────────
  useEffect(() => {
    document.documentElement.style.setProperty('--planora-accent', accentColor);
    localStorage.setItem('planora_accent', accentColor);
  }, [accentColor]);

  // ── Apply font size ───────────────────────────────────────────────────────
  useEffect(() => {
    const sizes = { small: '13px', medium: '15px', large: '17px' };
    document.documentElement.style.setProperty('--planora-fontsize', sizes[fontSize]);
    localStorage.setItem('planora_fontsize', fontSize);
  }, [fontSize]);

  // ── Unsaved changes warning on navigate away ───────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);

  // ── Profile field change ──────────────────────────────────────────────────
  const handleProfileChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const handleAvatarFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG and WebP images are supported');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setAvatarPreview(base64);
      setProfile(prev => ({ ...prev, avatar: base64 }));
      setHasChanges(true);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview('');
    setProfile(prev => ({ ...prev, avatar: '' }));
    setHasChanges(true);
  };

  // ── SAVE PROFILE ──────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!profile.name.trim()) { toast.error('Name is required'); return; }
    if (!profile.email.trim()) { toast.error('Email is required'); return; }
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', profile);
      if (res.data?.success) {
        updateUser(res.data.user);
        setHasChanges(false);
        toast.success('Profile saved successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // ── SAVE NOTIFICATIONS ────────────────────────────────────────────────────
  const handleSaveNotifPrefs = async () => {
    setSaving(true);
    try {
      const res = await api.put('/auth/notification-preferences', { notificationPrefs: notifPrefs, profileVisibility });
      if (res.data?.success) {
        updateUser(res.data.user);
        setHasChanges(false);
        toast.success('Notification preferences saved!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  // ── SAVE PRIVACY ──────────────────────────────────────────────────────────
  const handleSavePrivacy = async () => {
    setSaving(true);
    try {
      const res = await api.put('/auth/notification-preferences', { profileVisibility });
      if (res.data?.success) {
        updateUser(res.data.user);
        setHasChanges(false);
        toast.success('Privacy settings saved!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save privacy settings');
    } finally {
      setSaving(false);
    }
  };

  // ── Determine which save to call based on active tab ─────────────────────
  const handleSave = () => {
    if (activeTab === 'profile') return handleSaveProfile();
    if (activeTab === 'notifications') return handleSaveNotifPrefs();
    if (activeTab === 'privacy') return handleSavePrivacy();
    // Appearance saves automatically via useEffect, just acknowledge
    toast.success('Settings saved!');
    setHasChanges(false);
  };

  // ── CHANGE PASSWORD ───────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword) { toast.error('Current password is required'); return; }
    if (!pwForm.newPassword)     { toast.error('New password is required'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match'); return;
    }
    const strength = getPwStrength(pwForm.newPassword);
    if (strength.score < 2) {
      toast.error('Password is too weak. Add uppercase, numbers and special characters.'); return;
    }
    setPwSaving(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      if (res.data?.success) {
        toast.success('Password changed successfully!');
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  // ── EXPORT DATA ───────────────────────────────────────────────────────────
  const handleExportData = async () => {
    try {
      const res = await api.get('/auth/export-data');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'planora-data.json';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully!');
    } catch (err) {
      toast.error('Failed to export data');
    }
  };

  // ── DELETE ACCOUNT ────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    try {
      const res = await api.delete('/auth/account');
      if (res.data?.success) {
        toast.success('Account deleted. Goodbye!');
        logout();
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  // ── COPY USER ID ──────────────────────────────────────────────────────────
  const handleCopyId = () => {
    if (user?._id) {
      navigator.clipboard.writeText(user._id).then(() => toast.success('User ID copied!'));
    }
  };

  // ── INITIALS ──────────────────────────────────────────────────────────────
  const getInitials = (name = '') =>
    name.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('');

  const pwStrength = getPwStrength(pwForm.newPassword);

  // ── Sidebar nav ───────────────────────────────────────────────────────────
  const SidebarNav = () => (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon"><LogoIcon /></div>
          {sidebarOpen && <LogoText className="logo-text" />}
        </div>
      </div>
      <nav className="sidebar-nav">
        {[
          { path: '/home',          label: 'Home',
            svg: <svg viewBox="0 0 24 24" fill="none"><path d="M3 9L12 2L21 9V20C21 20.53 20.79 21.04 20.41 21.41C20.04 21.79 19.53 22 19 22H5C4.47 22 3.96 21.79 3.59 21.41C3.21 21.04 3 20.53 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
          { path: '/dashboard',     label: 'Dashboard',
            svg: <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
          { path: '/projects',      label: 'Projects',
            svg: <svg viewBox="0 0 24 24" fill="none"><path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12V19C21 19.53 20.79 20.04 20.41 20.41C20.04 20.79 19.53 21 19 21H5C4.47 21 3.96 20.79 3.59 20.41C3.21 20.04 3 19.53 3 19V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
          { path: '/team',          label: 'Team',
            svg: <svg viewBox="0 0 24 24" fill="none"><path d="M17 21V19C17 17.93 16.58 16.92 15.83 16.17C15.08 15.42 14.06 15 13 15H5C3.93 15 2.92 15.42 2.17 16.17C1.42 16.92 1 17.93 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg> },
          { path: '/calendar',      label: 'Calendar',
            svg: <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
          { path: '/reports',       label: 'Reports',
            svg: <svg viewBox="0 0 24 24" fill="none"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
          { path: '/notifications',  label: 'Notifications', extra: unreadCount,
            svg: <svg viewBox="0 0 24 24" fill="none"><path d="M18 8C18 6.41 17.37 4.88 16.24 3.76C15.12 2.63 13.59 2 12 2C10.41 2 8.88 2.63 7.76 3.76C6.63 4.88 6 6.41 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21C13.55 21.3 13.3 21.55 12.99 21.73C12.69 21.9 12.35 22 12 22C11.65 22 11.31 21.9 11.01 21.73C10.7 21.55 10.45 21.3 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
        ].map(({ path, label, svg, extra }) => (
          <a key={path} href="#" className="nav-item" onClick={e => { e.preventDefault(); navigate(path); }}>
            {svg}
            {sidebarOpen && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>{label}</span>
                {extra > 0 && <span className="sidebar-notif-badge" style={{ background: '#00b4a6', color: '#0f172a', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>{extra}</span>}
              </div>
            )}
          </a>
        ))}
      </nav>
      <div className="sidebar-footer">
        <a href="#" className="nav-item active" onClick={e => e.preventDefault()}>
          <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><path d="M19.4 15A7.5 7.5 0 1 1 12 7.5" stroke="currentColor" strokeWidth="2"/></svg>
          {sidebarOpen && <span>Settings</span>}
        </a>
      </div>
    </aside>
  );

  // ════════════════════════════════════════
  //  TAB PANELS
  // ════════════════════════════════════════

  // ── PROFILE TAB ───────────────────────────────────────────────────────────
  const ProfileTab = () => (
    <div>
      <div className="settings-card">
        <h3 className="settings-card-title">Profile Picture</h3>
        {profileLoading ? (
          <div className="avatar-section">
            <div className="avatar-circle skeleton-shimmer skeleton-circle" style={{ width: 88, height: 88 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="skeleton-bar skeleton-shimmer" style={{ width: 120, height: 14 }} />
              <div className="skeleton-bar skeleton-shimmer" style={{ width: 80, height: 10 }} />
            </div>
          </div>
        ) : (
          <div className="avatar-section">
            <div className="avatar-preview-wrap" onClick={() => fileInputRef.current?.click()}>
              <div className="avatar-circle">
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" />
                  : <span>{getInitials(profile.name) || 'U'}</span>
                }
              </div>
              <div className="avatar-upload-overlay">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleAvatarFile} />
            <div className="avatar-actions">
              <div className="avatar-name-display">{profile.name || user?.name || 'Your Name'}</div>
              <div className="avatar-role-display">{user?.role || 'Developer'}</div>
              <button className="btn-upload-avatar" onClick={() => fileInputRef.current?.click()}>
                Upload Photo
              </button>
              {avatarPreview && (
                <button className="btn-remove-avatar" onClick={handleRemoveAvatar}>
                  Remove photo
                </button>
              )}
              <span className="avatar-hint">JPG, PNG or WebP · Max 2MB</span>
            </div>
          </div>
        )}
      </div>

      <div className="settings-card">
        <h3 className="settings-card-title">Personal Information</h3>
        {profileLoading ? (
          <div className="form-grid">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="form-group">
                <div className="skeleton-bar skeleton-shimmer" style={{ width: 80, height: 10, marginBottom: 4 }} />
                <div className="skeleton-bar skeleton-shimmer" style={{ width: '100%', height: 38 }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name <span className="label-required">*</span></label>
              <input className="form-input" type="text" value={profile.name} onChange={e => handleProfileChange('name', e.target.value)} placeholder="e.g. Alex Johnson" />
            </div>
            <div className="form-group">
              <label className="form-label">
                Email Address <span className="label-required">*</span>
                <span className="verified-badge">✓ Verified</span>
              </label>
              <input className="form-input" type="email" value={profile.email} onChange={e => handleProfileChange('email', e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Job Title</label>
              <input className="form-input" type="text" value={profile.jobTitle} onChange={e => handleProfileChange('jobTitle', e.target.value)} placeholder="e.g. Frontend Developer" />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-input" type="text" value={profile.department} onChange={e => handleProfileChange('department', e.target.value)} placeholder="e.g. Engineering" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" type="tel" value={profile.phone} onChange={e => handleProfileChange('phone', e.target.value)} placeholder="+91 99999 00000" />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" type="text" value={profile.location} onChange={e => handleProfileChange('location', e.target.value)} placeholder="e.g. Delhi, India" />
            </div>
            <div className="form-group full-width">
              <label className="form-label">Bio</label>
              <textarea className="form-textarea" value={profile.bio} onChange={e => handleProfileChange('bio', e.target.value.slice(0, 200))} placeholder="Tell your team a bit about yourself..." rows={3} />
              <div className={`char-counter${profile.bio.length >= 190 ? ' near-limit' : ''}${profile.bio.length >= 200 ? ' at-limit' : ''}`}>
                {profile.bio.length}/200
              </div>
            </div>
          </div>
        )}
        <div className="form-btn-row">
          <button className="btn-primary" onClick={handleSaveProfile} disabled={saving || !hasChanges}>
            {saving ? <><span className="btn-spinner" /> Saving...</> : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );

  // ── ACCOUNT TAB ───────────────────────────────────────────────────────────
  const AccountTab = () => (
    <div>
      {/* Change Password */}
      <div className="settings-card">
        <h3 className="settings-card-title">Change Password</h3>
        {user?.authProvider === 'google' && !user?.password ? (
          <div className="coming-soon-card" style={{ marginBottom: 0 }}>
            <div className="coming-soon-icon">🔐</div>
            <div className="coming-soon-text">
              <h4>Google Account</h4>
              <p>Your account uses Google Sign-In. Password management is handled through your Google account.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleChangePassword}>
            <div className="form-grid full-width">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div className="input-password-wrapper">
                  <input className="form-input" type={showPw.current ? 'text' : 'password'} value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} placeholder="Enter current password" />
                  <button type="button" className="toggle-pw-visibility" onClick={() => setShowPw(p => ({ ...p, current: !p.current }))}><EyeIcon open={showPw.current} /></button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-password-wrapper">
                  <input className="form-input" type={showPw.newPw ? 'text' : 'password'} value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min 8 characters" />
                  <button type="button" className="toggle-pw-visibility" onClick={() => setShowPw(p => ({ ...p, newPw: !p.newPw }))}><EyeIcon open={showPw.newPw} /></button>
                </div>
                {pwForm.newPassword && (
                  <div className="pw-strength-wrap">
                    <div className="pw-strength-bar">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`pw-strength-seg${pwStrength.score >= i ? ` active-${pwStrength.score}` : ''}`} />
                      ))}
                    </div>
                    {pwStrength.label && <div className={`pw-strength-label ${pwStrength.cls}`}>{pwStrength.label}</div>}
                    <div className="pw-rules">
                      <PwRule met={pwForm.newPassword.length >= 8}>At least 8 characters</PwRule>
                      <PwRule met={/[A-Z]/.test(pwForm.newPassword)}>One uppercase letter</PwRule>
                      <PwRule met={/[0-9]/.test(pwForm.newPassword)}>One number</PwRule>
                      <PwRule met={/[^A-Za-z0-9]/.test(pwForm.newPassword)}>One special character</PwRule>
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div className="input-password-wrapper">
                  <input
                    className={`form-input${pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword ? ' error' : ''}`}
                    type={showPw.confirm ? 'text' : 'password'}
                    value={pwForm.confirmPassword}
                    onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Repeat new password"
                  />
                  <button type="button" className="toggle-pw-visibility" onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}><EyeIcon open={showPw.confirm} /></button>
                </div>
                {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                  <span className="input-hint" style={{ color: '#ef4444' }}>Passwords do not match</span>
                )}
              </div>
            </div>
            <div className="form-btn-row">
              <button type="submit" className="btn-primary" disabled={pwSaving}>
                {pwSaving ? <><span className="btn-spinner" /> Updating...</> : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Connected Accounts */}
      <div className="settings-card">
        <h3 className="settings-card-title">Connected Accounts</h3>
        <div className="connected-account-row">
          <div className="connected-account-left">
            <div className="connected-account-icon">G</div>
            <div>
              <div className="connected-account-name">Google</div>
              <div className="connected-account-detail">
                {user?.authProvider === 'google' ? user?.email : 'Not connected'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user?.authProvider === 'google'
              ? <span className="connected-badge">✓ Connected</span>
              : <span className="not-connected-badge">Not Connected</span>
            }
            {user?.authProvider === 'google' && (
              <button className="btn-disconnect" title="Disconnect Google account">Disconnect</button>
            )}
          </div>
        </div>
        <div className="connected-account-row">
          <div className="connected-account-left">
            <div className="connected-account-icon" style={{ fontWeight: 700, fontSize: '0.95rem' }}>GH</div>
            <div>
              <div className="connected-account-name">GitHub</div>
              <div className="connected-account-detail">Not connected</div>
            </div>
          </div>
          <span className="not-connected-badge">Not Connected</span>
        </div>
      </div>

      {/* Account Information */}
      <div className="settings-card">
        <h3 className="settings-card-title">Account Information</h3>
        <div className="account-info-grid">
          <div className="account-info-item">
            <span className="account-info-label">Member Since</span>
            <span className="account-info-value">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
            </span>
          </div>
          <div className="account-info-item">
            <span className="account-info-label">Account Type</span>
            <span className="account-info-value">
              <span style={{ color: '#00b4a6', fontWeight: 700 }}>Free</span>
            </span>
          </div>
          <div className="account-info-item">
            <span className="account-info-label">User ID</span>
            <span className="account-info-value">
              {user?._id ? `${user._id.slice(0, 8)}...` : '—'}
              <button className="copy-id-btn" onClick={handleCopyId} title="Copy User ID">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </span>
          </div>
          <div className="account-info-item">
            <span className="account-info-label">Last Login</span>
            <span className="account-info-value">
              {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Now'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // ── APPEARANCE TAB ────────────────────────────────────────────────────────
  const AppearanceTab = () => (
    <div>
      {/* Theme */}
      <div className="settings-card">
        <h3 className="settings-card-title">Theme</h3>
        <div className="theme-grid">
          {[
            { id: 'dark',   label: 'Dark Mode', previewClass: 'theme-preview-dark', active: true },
            { id: 'light',  label: 'Light Mode', previewClass: 'theme-preview-light', active: false },
            { id: 'system', label: 'System Default', previewClass: 'theme-preview-system', active: false },
          ].map(t => (
            <button key={t.id} className={`theme-option${t.id === 'dark' ? ' selected' : ''}`} onClick={() => !t.active && toast('This theme is coming soon!')}>
              <div className={`theme-preview ${t.previewClass}`}>
                {t.id !== 'system' && (
                  <>
                    <div className={`preview-bar${t.id === 'light' ? ' preview-bar-light' : ''}`} />
                    <div className={`preview-bar short${t.id === 'light' ? ' preview-bar-light' : ''}`} />
                    <div className={`preview-bar shorter${t.id === 'light' ? ' preview-bar-light' : ''}`} />
                  </>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="theme-name">{t.label}</span>
                {t.id !== 'dark' && <span className="coming-soon-badge">Soon</span>}
              </div>
              {t.id === 'dark' && <div className="theme-check">✓</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div className="settings-card">
        <h3 className="settings-card-title">Accent Color</h3>
        <p className="settings-card-subtitle">Personalise the highlight colour used throughout Planora</p>
        <div className="accent-swatches">
          {ACCENT_PRESETS.map(c => (
            <div
              key={c.hex}
              className={`color-swatch${accentColor === c.hex ? ' active' : ''}`}
              style={{ background: c.hex }}
              title={c.name}
              onClick={() => { setAccentColor(c.hex); setHasChanges(true); }}
            />
          ))}
          <input
            type="color"
            value={accentColor}
            onChange={e => { setAccentColor(e.target.value); setHasChanges(true); }}
            title="Custom color"
            style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.15)', borderRadius: '50%', cursor: 'pointer', background: 'none', padding: 0, overflow: 'hidden' }}
          />
        </div>
        <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#64748b' }}>
          Current: <code style={{ color: accentColor, fontWeight: 700 }}>{accentColor}</code>
        </div>
      </div>

      {/* Font Size */}
      <div className="settings-card">
        <h3 className="settings-card-title">Font Size</h3>
        <div className="font-size-options">
          {[
            { id: 'small',  sample: 'Aa', label: 'Small' },
            { id: 'medium', sample: 'Aa', label: 'Medium' },
            { id: 'large',  sample: 'Aa', label: 'Large' },
          ].map(f => (
            <button key={f.id} className={`font-size-btn${fontSize === f.id ? ' active' : ''}`} onClick={() => { setFontSize(f.id); setHasChanges(true); }}>
              <span style={{ fontSize: f.id === 'small' ? '0.9rem' : f.id === 'large' ? '1.25rem' : '1.05rem' }}>{f.sample}</span>
              <span className="fs-label">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar Options */}
      <div className="settings-card">
        <h3 className="settings-card-title">Sidebar</h3>
        <Toggle
          id="compact-sidebar"
          checked={compactSidebar}
          onChange={e => { setCompactSidebar(e.target.checked); localStorage.setItem('planora_compact', e.target.checked); setHasChanges(true); }}
          label="Compact Mode"
          desc="Show only icons without labels — useful on smaller screens"
        />
      </div>
    </div>
  );

  // ── NOTIFICATIONS TAB ─────────────────────────────────────────────────────
  const NotificationsTab = () => {
    const pref = (key, val) => {
      setNotifPrefs(p => ({ ...p, [key]: val }));
      setHasChanges(true);
    };
    return (
      <div>
        <div className="settings-card">
          <h3 className="settings-card-title">Email Notifications</h3>
          <Toggle id="ep" checked={notifPrefs.emailProjects}  onChange={e => pref('emailProjects', e.target.checked)}  label="Project Updates" desc="Get emailed when a project is created, updated or deleted" />
          <Toggle id="et" checked={notifPrefs.emailTasks}     onChange={e => pref('emailTasks', e.target.checked)}     label="Task Assignments" desc="Notify me when a task is assigned to me" />
          <Toggle id="ete" checked={notifPrefs.emailTeam}     onChange={e => pref('emailTeam', e.target.checked)}      label="Team Member Changes" desc="When someone joins or leaves your workspace" />
          <Toggle id="ed" checked={notifPrefs.emailDeadlines} onChange={e => pref('emailDeadlines', e.target.checked)} label="Deadline Reminders" desc="Receive reminders before tasks and projects are due" />
          <Toggle id="ew" checked={notifPrefs.emailWeekly}    onChange={e => pref('emailWeekly', e.target.checked)}    label="Weekly Summary Email" desc="A digest of your week's activity every Monday" />
        </div>

        <div className="settings-card">
          <h3 className="settings-card-title">In-App Notifications</h3>
          <Toggle id="id" checked={notifPrefs.inAppDesktop}  onChange={e => pref('inAppDesktop', e.target.checked)}  label="Desktop Notifications" desc="Show browser notifications when the app is in background" />
          <Toggle id="is" checked={notifPrefs.inAppSound}    onChange={e => pref('inAppSound', e.target.checked)}    label="Sound Alerts" desc="Play a sound when a new notification arrives" />
          <Toggle id="ir" checked={notifPrefs.inAppRealtime} onChange={e => pref('inAppRealtime', e.target.checked)} label="Real-time Updates" desc="Instantly reflect changes from teammates without refresh" />
        </div>

        <div className="settings-card">
          <h3 className="settings-card-title">Notification Frequency</h3>
          <div className="radio-group">
            {[
              { id: 'realtime', label: 'Real-time', desc: 'Receive notifications as they happen' },
              { id: 'daily',    label: 'Daily Digest', desc: 'Bundled summary once per day at 9:00 AM' },
              { id: 'weekly',   label: 'Weekly Digest', desc: 'Summary every Monday morning' },
            ].map(opt => (
              <label key={opt.id} className="radio-option">
                <input type="radio" name="notif-freq" value={opt.id} checked={notifPrefs.frequency === opt.id} onChange={() => pref('frequency', opt.id)} />
                <div>
                  <div className="radio-text">{opt.label}</div>
                  <div className="radio-desc">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="settings-card">
          <h3 className="settings-card-title">Quiet Hours</h3>
          <Toggle id="qh" checked={notifPrefs.quietHoursEnabled} onChange={e => pref('quietHoursEnabled', e.target.checked)} label="Enable Quiet Hours" desc="Pause all notifications during specified hours" />
          {notifPrefs.quietHoursEnabled && (
            <div className="quiet-hours-grid" style={{ marginTop: '1rem' }}>
              <div className="time-input-group">
                <label className="time-label">From</label>
                <input type="time" className="time-input" value={notifPrefs.quietHoursFrom} onChange={e => pref('quietHoursFrom', e.target.value)} />
              </div>
              <div className="time-input-group">
                <label className="time-label">To</label>
                <input type="time" className="time-input" value={notifPrefs.quietHoursTo} onChange={e => pref('quietHoursTo', e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="form-btn-row">
          <button className="btn-primary" onClick={handleSaveNotifPrefs} disabled={saving || !hasChanges}>
            {saving ? <><span className="btn-spinner" /> Saving...</> : 'Save Preferences'}
          </button>
        </div>
      </div>
    );
  };

  // ── PRIVACY TAB ───────────────────────────────────────────────────────────
  const PrivacyTab = () => (
    <div>
      <div className="settings-card">
        <h3 className="settings-card-title">Profile Visibility</h3>
        <p className="settings-card-subtitle">Control who can see your profile within your workspace</p>
        <div className="visibility-options">
          {[
            { id: 'public',  label: 'Public',  icon: '🌐', desc: 'All team members can see your profile, tasks and activity' },
            { id: 'private', label: 'Private', icon: '🔒', desc: 'Only workspace admins can view your full profile details' },
          ].map(v => (
            <button key={v.id} className={`visibility-option${profileVisibility === v.id ? ' selected' : ''}`} onClick={() => { setProfileVisibility(v.id); setHasChanges(true); }}>
              <div className="visibility-opt-label">
                <span>{v.icon}</span> {v.label}
                {profileVisibility === v.id && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </div>
              <div className="visibility-opt-desc">{v.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-card">
        <h3 className="settings-card-title">Activity Status</h3>
        <Toggle id="so" checked={notifPrefs.showOnline}     onChange={e => { setNotifPrefs(p => ({ ...p, showOnline: e.target.checked })); setHasChanges(true); }} label="Show When Online" desc="Display the green dot on your avatar when you're active" />
        <Toggle id="sl" checked={notifPrefs.showLastActive} onChange={e => { setNotifPrefs(p => ({ ...p, showLastActive: e.target.checked })); setHasChanges(true); }} label="Show Last Active Time" desc="Let team members see when you were last online" />
      </div>

      <div className="settings-card">
        <h3 className="settings-card-title">Data &amp; Privacy</h3>
        <div className="danger-row" style={{ border: 'none', padding: '0.85rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="danger-row-info">
            <h4>Export My Data</h4>
            <p>Download a JSON file containing all your projects, tasks, and account data</p>
          </div>
          <button className="btn-secondary" onClick={handleExportData}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Data
          </button>
        </div>
        <div className="danger-row" style={{ border: 'none', padding: '0.85rem 0' }}>
          <div className="danger-row-info">
            <h4>Two-Factor Authentication</h4>
            <p>Add an extra layer of security to your account</p>
          </div>
          <div>
            <span className="not-connected-badge" style={{ marginRight: '0.5rem' }}>Not Enabled</span>
            <button className="btn-secondary" onClick={() => toast('Two-factor authentication is coming soon!')} style={{ opacity: 0.6 }}>
              Enable 2FA
              <span className="coming-soon-badge" style={{ marginLeft: '0.3rem' }}>Soon</span>
            </button>
          </div>
        </div>
      </div>

      <div className="form-btn-row">
        <button className="btn-primary" onClick={handleSavePrivacy} disabled={saving || !hasChanges}>
          {saving ? <><span className="btn-spinner" /> Saving...</> : 'Save Privacy Settings'}
        </button>
      </div>
    </div>
  );

  // ── DANGER ZONE TAB ───────────────────────────────────────────────────────
  const DangerTab = () => (
    <div>
      <div className="danger-zone-card">
        <div className="danger-zone-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <h3>Danger Zone</h3>
        </div>

        <div className="danger-row">
          <div className="danger-row-info">
            <h4>Leave Workspace</h4>
            <p>You will lose access to all shared projects and tasks in this workspace. Your personal data will remain.</p>
          </div>
          <button className="btn-warn" onClick={() => setLeaveModal(true)}>
            Leave Workspace
          </button>
        </div>

        <div className="danger-row">
          <div className="danger-row-info">
            <h4>Export Data Before Deleting</h4>
            <p>We recommend downloading your data before deleting your account. This cannot be undone.</p>
          </div>
          <button className="btn-secondary" onClick={handleExportData}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Data
          </button>
        </div>

        <div className="danger-row">
          <div className="danger-row-info">
            <h4>Delete Account</h4>
            <p>Permanently delete your account and all associated data. This action is irreversible and cannot be undone.</p>
          </div>
          <button className="btn-danger" onClick={() => setDeleteModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Delete My Account
          </button>
        </div>
      </div>
    </div>
  );

  // ── Render active tab content ──────────────────────────────────────────────
  const renderTab = () => {
    switch (activeTab) {
      case 'profile':       return <ProfileTab />;
      case 'account':       return <AccountTab />;
      case 'appearance':    return <AppearanceTab />;
      case 'notifications': return <NotificationsTab />;
      case 'privacy':       return <PrivacyTab />;
      case 'danger':        return <DangerTab />;
      default:              return <ProfileTab />;
    }
  };

  // ════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════
  return (
    <div className="settings-container">
      <SidebarNav />

      <div className="settings-main">
        {/* Header */}
        <header className="settings-header">
          <div className="settings-header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(o => !o)}>
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="3" y1="6"  x2="21" y2="6"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <div>
              <h2>Settings</h2>
              <span className="settings-header-sub">Manage your account and preferences</span>
            </div>
          </div>
          <div className="settings-header-right">
            {hasChanges && <span className="unsaved-badge">● Unsaved changes</span>}
            {['profile', 'notifications', 'privacy', 'appearance'].includes(activeTab) && (
              <button className={`save-btn${hasChanges ? ' has-changes' : ''}`} onClick={handleSave} disabled={saving || !hasChanges}>
                {saving
                  ? <><span className="btn-spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Saving...</>
                  : '✓ Save Changes'
                }
              </button>
            )}
            <div className="user-pill" onClick={logout} title="Logout">
              {(user?.avatar || avatarPreview)
                ? <img src={user?.avatar || avatarPreview} alt="avatar" />
                : <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=00b4a6&color=fff`} alt="avatar" />
              }
            </div>
          </div>
        </header>

        <div className="settings-body">
          {/* Left settings tab nav */}
          <nav className="settings-tab-nav">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`settings-tab-btn${activeTab === tab.id ? ' active' : ''}${tab.isDanger ? ' danger-tab' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{TabIcons[tab.icon]}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Right content panel */}
          <main className="settings-content">
            {renderTab()}
          </main>
        </div>
      </div>

      {/* ── Leave Workspace Modal ── */}
      {leaveModal && (
        <div className="modal-overlay" onClick={() => setLeaveModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-icon warn">⚠️</div>
            <h3 className="modal-title">Leave Workspace?</h3>
            <p className="modal-desc">
              You will immediately lose access to all projects, tasks, and team resources in this workspace. 
              Your personal account will not be deleted.
            </p>
            <div className="modal-confirm-hint">
              Type <code>leave</code> to confirm
            </div>
            <input
              className="modal-confirm-input"
              type="text"
              placeholder="leave"
              value={leaveConfirm}
              onChange={e => setLeaveConfirm(e.target.value.toLowerCase())}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setLeaveModal(false); setLeaveConfirm(''); }}>Cancel</button>
              <button className="btn-warn" disabled={leaveConfirm !== 'leave'} onClick={() => { toast.success('Left workspace'); setLeaveModal(false); setLeaveConfirm(''); }}>
                Leave Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Account Modal ── */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(false)}>
          <div className="modal-card danger-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon danger">🗑️</div>
            <h3 className="modal-title">Delete Account</h3>
            <p className="modal-desc">
              This action is <strong style={{ color: '#f87171' }}>permanent and cannot be undone</strong>.
              All your projects, tasks, notifications and data will be erased immediately.
              <br /><br />
              Consider <button style={{ background: 'none', border: 'none', color: '#00b4a6', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 'inherit' }} onClick={() => { handleExportData(); }}>exporting your data</button> first.
            </p>
            <div className="modal-confirm-hint">
              Type <code>DELETE</code> to confirm
            </div>
            <input
              className="modal-confirm-input"
              type="text"
              placeholder="DELETE"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setDeleteModal(false); setDeleteConfirm(''); }}>Cancel</button>
              <button className="btn-danger" disabled={deleteConfirm !== 'DELETE' || deleting} onClick={handleDeleteAccount}>
                {deleting ? <><span className="btn-spinner" /> Deleting...</> : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
