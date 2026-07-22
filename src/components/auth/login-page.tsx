'use client';

import React, { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useApp } from '@/lib/store';
import {
  User, Lock, Mail, Eye, EyeOff, Loader2, ArrowRight, Shield,
  Building2, Users, BookOpen, GraduationCap, ArrowLeft,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { BrandLogo } from '@/components/brand-logo';

// ==================== Waving Person Illustration (from uploaded design) ====================
function WavingPerson() {
  return (
    <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-w-[360px] mx-auto">
      {/* Legs */}
      <rect x="175" y="210" width="14" height="70" rx="6" fill="#1a2744" />
      <rect x="210" y="210" width="14" height="70" rx="6" fill="#1a2744" />
      {/* Shoes */}
      <ellipse cx="182" cy="282" rx="12" ry="6" fill="#1a2744" />
      <ellipse cx="217" cy="282" rx="12" ry="6" fill="#1a2744" />
      {/* Body / Shirt */}
      <path d="M168 100 C165 120 162 150 164 210 L235 210 C237 150 234 120 231 100 Z" fill="#1e3a8a" />
      {/* Left arm */}
      <path d="M168 110 C145 100 130 80 135 55 L140 50" fill="#1e3a8a" stroke="#172554" strokeWidth="1" />
      <ellipse cx="138" cy="48" rx="7" ry="6" fill="#fde68a" transform="rotate(-20, 138, 48)" />
      {/* Right arm waving */}
      <path d="M231 110 C255 95 265 70 258 48" fill="#1e3a8a" stroke="#172554" strokeWidth="1">
        <animateTransform attributeName="transform" type="rotate" values="0 231 110;8 231 110;0 231 110;-8 231 110;0 231 110" dur="1.5s" repeatCount="indefinite" />
      </path>
      <ellipse cx="260" cy="46" rx="7" ry="6" fill="#fde68a" transform="rotate(15, 260, 46)">
        <animateTransform attributeName="transform" type="rotate" values="15 260 46;22 260 46;15 260 46;8 260 46;15 260 46" dur="1.5s" repeatCount="indefinite" />
      </ellipse>
      {/* Neck */}
      <rect x="192" y="72" width="16" height="22" rx="7" fill="#fde68a" />
      {/* Head */}
      <ellipse cx="200" cy="50" rx="26" ry="30" fill="#fde68a" />
      {/* Hair */}
      <path d="M174 42 C174 22 187 15 200 15 C213 15 226 22 226 42 C226 37 223 25 200 25 C177 25 174 37 174 42 Z" fill="#92400e" />
      <path d="M172 42 C170 38 173 32 178 28" stroke="#92400e" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M228 42 C230 38 227 32 222 28" stroke="#92400e" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* Eyes - happy squint */}
      <path d="M186 48 Q190 44 194 48" stroke="#1a2744" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M206 48 Q210 44 214 48" stroke="#1a2744" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Big smile */}
      <path d="M188 58 Q200 70 212 58" stroke="#c0785c" strokeWidth="2" fill="#e17055" opacity="0.5" strokeLinecap="round" />
      {/* Blush */}
      <ellipse cx="183" cy="56" rx="6" ry="3" fill="#fab1a0" opacity="0.4" />
      <ellipse cx="217" cy="56" rx="6" ry="3" fill="#fab1a0" opacity="0.4" />
    </svg>
  );
}

// ==================== Input (simple placeholder, no floating label) ====================
function FloatingInput({ id, type, placeholder, icon, value, onChange, success, togglePassword, showPassword, autoComplete }: any) {
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10">{icon}</div>
      <input
        id={id} type={type} value={value} onChange={onChange} autoComplete={autoComplete}
        className="login-input w-full h-12 pl-11 pr-4 rounded-xl text-gray-800 text-sm outline-none transition-all"
        placeholder={placeholder}
      />
      {togglePassword && (
        <button type="button" onClick={togglePassword} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
}

// ==================== Particle Background ====================
function ParticleBackground() {
  const particles = useMemo(() => Array.from({ length: 25 }).map((_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 15,
    duration: 12 + Math.random() * 10, drift: (Math.random() - 0.5) * 60,
  })), []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map(p => (
        <div key={p.id} className="particle" style={{ left: `${p.left}%`, '--delay': `${p.delay}s`, '--duration': `${p.duration}s`, '--drift': `${p.drift}px` } as React.CSSProperties} />
      ))}
    </div>
  );
}

// ==================== Floating Shapes ====================
function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="float-shape-1 absolute top-10 left-10 w-16 h-16 rounded-2xl bg-white/5 border border-white/10" />
      <div className="float-shape-2 absolute top-20 right-12 w-12 h-12 rounded-full bg-white/5 border border-white/10" />
      <div className="float-shape-3 absolute bottom-16 left-16 w-14 h-14 rounded-xl bg-white/5 border border-white/10" />
      <div className="float-shape-4 absolute bottom-10 right-20 w-10 h-10 rounded-lg bg-white/5 border border-white/10" />
    </div>
  );
}

// ==================== Cover Panel (left side — warm emerald gradient, not blue) ====================
function CoverPanel() {
  return (
    <div className="cover-gradient relative flex flex-col items-center justify-center px-6 py-8 md:p-12 min-h-[200px] md:min-h-full rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none overflow-hidden">
      <FloatingShapes />
      <div className="glow-circle absolute w-48 h-48 rounded-full bg-white/10 -top-10 -left-10" />
      <div className="glow-circle absolute w-36 h-36 rounded-full bg-white/10 -bottom-8 -right-8" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 text-center">
        {/* Waving cartoon illustration — larger */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 150, damping: 12 }}
          className="mb-4 fade-in-slide"
          style={{ '--delay': '0.2s' } as React.CSSProperties}
        >
          <WavingPerson />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-2xl md:text-3xl font-bold text-white mb-2"
        >
          Welcome to Concordia College
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-white/70 text-sm md:text-base max-w-[260px] mx-auto"
        >
          One platform for your entire institution — admissions, attendance, fees, academics & more.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-6"
        >
          <BrandLogo size="md" variant="light" priority />
        </motion.div>

      </div>
    </div>
  );
}

// ==================== Role Definitions ====================
type Role = 'institute-admin' | 'branch-manager' | 'teacher' | 'student';

const ROLES: { id: Role; label: string; icon: any; note: string }[] = [
  { id: 'institute-admin', label: 'Institute', icon: Building2, note: 'Login created by Super Admin. Sign in with your email and password.' },
  { id: 'branch-manager', label: 'Branch', icon: Users, note: 'Login created by Institute Admin. Sign in with your email and password.' },
  { id: 'teacher', label: 'Teacher', icon: BookOpen, note: 'Sign in with your Name, Teacher ID, and Password.' },
  { id: 'student', label: 'Student', icon: User, note: 'Sign in with your Name, Roll Number, and Password.' },
];

// ==================== Change Password Modal (first-time login) ====================
function ChangePasswordModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: 'All fields are required', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 4) {
      toast({ title: 'Password too short', description: 'Use at least 4 characters', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'New password and confirm password must match', variant: 'destructive' });
      return;
    }
    if (newPassword === currentPassword) {
      toast({ title: 'Choose a different password', description: 'New password must differ from the current one', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      toast({ title: 'Password updated', description: 'You can now continue to your portal.' });
      onSuccess();
    } catch (err: any) {
      const raw = err.message || '';
      let msg = raw;
      if (raw.includes('401') || raw.toLowerCase().includes('current password') || raw.toLowerCase().includes('incorrect')) {
        msg = 'The current password you entered is incorrect. Please try again.';
      } else if (raw.toLowerCase().includes('short')) {
        msg = 'New password must be at least 4 characters.';
      }
      toast({ title: 'Could not update password', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-11 w-11 rounded-xl bg-accent grid place-items-center shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Change your password</h3>
            <p className="text-xs text-gray-500">For your security, please set a new password before continuing.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10"><Lock size={18} /></div>
            <input
              id="cp-current" type={showCurrent ? 'text' : 'password'} value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password"
              className="login-input w-full h-12 pl-11 pr-11 rounded-xl text-gray-800 text-sm outline-none transition-all"
              placeholder="Current password"
            />
            <button type="button" onClick={() => setShowCurrent(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10"><Lock size={18} /></div>
            <input
              id="cp-new" type={showNew ? 'text' : 'password'} value={newPassword}
              onChange={e => setNewPassword(e.target.value)} autoComplete="new-password"
              className="login-input w-full h-12 pl-11 pr-11 rounded-xl text-gray-800 text-sm outline-none transition-all"
              placeholder="New password"
            />
            <button type="button" onClick={() => setShowNew(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10"><Lock size={18} /></div>
            <input
              id="cp-confirm" type={showConfirm ? 'text' : 'password'} value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password"
              className="login-input w-full h-12 pl-11 pr-11 rounded-xl text-gray-800 text-sm outline-none transition-all"
              placeholder="Confirm new password"
            />
            <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={saving}
          onClick={submit}
          className="btn-gradient w-full h-12 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 mt-5 disabled:opacity-70"
        >
          {saving ? <div className="spinner" /> : <>Update & continue <ArrowRight size={18} /></>}
        </motion.button>
        <p className="text-center text-xs text-gray-400 mt-3">
          You won't be able to access the portal until your password is changed.
        </p>
      </motion.div>
    </motion.div>
  );
}

// ==================== Login Form with Role Selector ====================
function LoginForm({ setView }: { setView: (v: any) => void }) {
  const setUser = useApp(s => s.setUser);
  const setToken = useApp(s => s.setToken);
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const activeRole = role ? ROLES.find(r => r.id === role) : null;
  const needsName = role === 'teacher' || role === 'student';
  const idLabel = role === 'teacher' ? 'Teacher ID' : role === 'student' ? 'Roll Number' : 'Email or ID';
  const noRoleSelected = !role;

  const pickRole = (r: Role) => {
    setRole(r);
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (needsName && !name) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    if (!email || !password) { toast({ title: 'All fields are required', variant: 'destructive' }); return; }

    const btn = buttonRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = `${rect.width / 2}px`;
      ripple.style.top = `${rect.height / 2}px`;
      ripple.style.width = ripple.style.height = `${Math.max(rect.width, rect.height)}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }

    setIsLoading(true);
    try {
      const { token, user } = await api.login(email, password, needsName ? name : undefined);
      setToken(token);
      setUser(user);
      // If user is blocked, still let them into the portal — the portal will show the blocked screen
      if (user.blockedMessage) {
        toast({ title: 'Access Blocked', description: user.blockedMessage, variant: 'destructive' });
      } else {
        toast({ title: `Welcome, ${user.name}`, description: `Signed in as ${user.roleLabel}` });
      }
      setView('portal');
    } catch (err: any) {
      const msg = err.message || 'Sign in failed';
      if (msg.includes('Cannot connect') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        toast({ title: 'Connection Error', description: 'Cannot reach the server. Please wait a moment and try again.', variant: 'destructive' });
      } else if (msg.includes('locked') || msg.includes('Too many') || msg.includes('429')) {
        toast({ title: 'Account Temporarily Locked', description: msg, variant: 'destructive' });
      } else if (msg.includes('Invalid') || msg.includes('401') || msg.includes('incorrect')) {
        toast({ title: 'Sign in failed', description: msg, variant: 'destructive' });
      } else if (msg.includes('blocked') || msg.includes('Blocked')) {
        toast({ title: 'Access Blocked', description: 'Your access has been blocked by your administration. Please contact your administrator.', variant: 'destructive' });
      } else {
        toast({ title: 'Sign in failed', description: msg, variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white flex flex-col justify-center p-6 sm:p-8 md:p-10 rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none">
      <div className="slide-up">
        <div className="mb-4 flex justify-center md:justify-start">
          <BrandLogo size="sm" priority />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Sign In</h2>
        <p className="text-gray-400 text-xs sm:text-sm mb-4">Select your role and enter credentials</p>
      </div>

      {/* Role selector — 2x2 grid for 4 roles */}
      <div className="mb-5 slide-up slide-up-delay-1">
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map(r => {
            const isActive = role === r.id;
            return (
              <button
                key={r.id} type="button" onClick={() => pickRole(r.id)}
                className={`role-pill flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-primary to-primary/80 border-transparent shadow-md text-white'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'
                }`}
              >
                <r.icon className="h-4 w-4" />
                <span className="text-[11px] font-semibold">{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Name field — only for teacher and student */}
        {needsName && (
          <div className="slide-up slide-up-delay-2">
            <FloatingInput
              id="login-name" type="text" placeholder="Full Name" icon={<User size={18} />}
              value={name} onChange={(e: any) => setName(e.target.value)}
              success={name.trim().length >= 2} autoComplete="name"
            />
          </div>
        )}
        <div className="slide-up slide-up-delay-2">
          <FloatingInput
            id="login-email" type="text" placeholder={idLabel} icon={<Mail size={18} />}
            value={email} onChange={(e: any) => setEmail(e.target.value)}
            success={email.trim().length >= 2} autoComplete="username"
          />
        </div>
        <div className="slide-up slide-up-delay-3">
          <FloatingInput
            id="login-password" type={showPassword ? 'text' : 'password'} placeholder="Password" icon={<Lock size={18} />}
            value={password} onChange={(e: any) => setPassword(e.target.value)}
            success={password.length >= 4} togglePassword={() => setShowPassword(!showPassword)}
            showPassword={showPassword} autoComplete="current-password"
          />
        </div>

        <div className="flex items-center justify-between slide-up slide-up-delay-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="custom-checkbox w-4 h-4 rounded" />
            <span className="text-sm text-gray-500">Remember me</span>
          </label>
          <button type="button" className="text-sm text-primary hover:text-primary font-medium transition-colors">
            Forgot password?
          </button>
        </div>

        <div className="slide-up slide-up-delay-4">
          <motion.button
            ref={buttonRef} type="submit" disabled={isLoading || noRoleSelected}
            whileTap={{ scale: 0.98 }}
            className="btn-gradient w-full h-12 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <div className="spinner" /> : <>{noRoleSelected ? 'Select a role to continue' : <>Sign in as {activeRole?.label} <ArrowRight size={18} /></>}</>}
          </motion.button>
        </div>
      </form>

      {/* Role-specific info */}
      <div className="slide-up slide-up-delay-5 mt-4 space-y-3">
        <div className="rounded-xl bg-accent border border-accent p-3 text-center">
          <p className="text-primary text-[11px]">{noRoleSelected ? 'Please select your role above to sign in.' : activeRole?.note}</p>
        </div>
      </div>
    </div>
  );
}

// ==================== Main Login Page ====================
export function LoginPage() {
  const setView = useApp(s => s.setView);
  return (
    <div className="login-bg flex items-center justify-center min-h-screen p-3 sm:p-4 md:p-6 relative">
      <ParticleBackground />
      <button onClick={() => setView('landing')} className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm text-white/70 hover:text-white transition">
        <ArrowLeft className="h-4 w-4" /> Home
      </button>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-[900px]"
      >
        <div className="flex flex-col md:flex-row rounded-2xl shadow-2xl shadow-black/30 overflow-hidden bg-white" style={{ minHeight: '560px' }}>
          <div className="w-full md:w-[45%]"><CoverPanel /></div>
          <div className="w-full md:w-[55%]"><LoginForm setView={setView} /></div>
        </div>
      </motion.div>
    </div>
  );
}
