'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useApp } from '@/lib/store';
import {
  Lock, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, Shield,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { BrandLogo } from '@/components/brand-logo';

// ==================== Unified Login Page (UCP-inspired) ====================
// Design: split-screen, glassmorphism panel over a campus hero image,
// diagonal slant divider, NO role selection — the backend auto-detects
// the user's role from their credentials and routes them to the right portal.

export function LoginPage() {
  const setView = useApp(s => s.setView);
  const setUser = useApp(s => s.setUser);
  const setToken = useApp(s => s.setToken);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'All fields are required', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { token, user } = await api.login(email, password);
      setToken(token);
      setUser(user);
      if (user.blockedMessage) {
        toast({ title: 'Access Blocked', description: user.blockedMessage, variant: 'destructive' });
      } else {
        toast({
          title: `Welcome back, ${user.name?.split(' ')[0] || ''}`,
          description: `Signed in as ${user.roleLabel}`,
        });
      }
      setView('portal');
    } catch (err: any) {
      const msg = err.message || 'Sign in failed';
      if (msg.includes('Cannot connect') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        toast({ title: 'Connection Error', description: 'Cannot reach the server. Please wait a moment and try again.', variant: 'destructive' });
      } else if (msg.includes('locked') || msg.includes('Too many') || msg.includes('429')) {
        toast({ title: 'Account Temporarily Locked', description: msg, variant: 'destructive' });
      } else if (msg.includes('Invalid') || msg.includes('401') || msg.includes('incorrect')) {
        toast({ title: 'Sign in failed', description: 'Invalid email or password. Please try again.', variant: 'destructive' });
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
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1a1a1a]">
      {/* ─── Background: campus hero image ─── */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: 'url(/campus-hero.jpg)' }}
      />
      {/* Warm orange-tinted overlay for text contrast on the image side */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-[#F26522]/20" />

      {/* ─── Home button ─── */}
      <button
        onClick={() => setView('landing')}
        className="absolute top-5 left-5 z-30 flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-white transition-colors group"
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Home
      </button>

      {/* ─── Login Card (left side, glassmorphism) ─── */}
      <div className="relative z-20 min-h-screen flex items-center">
        <div className="w-full max-w-md mx-auto md:mx-0 md:ml-[6%] lg:ml-[8%] px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            className="relative"
          >
            {/* Diagonal slant accent — decorative top border in Concordia orange */}
            <div
              className="absolute -top-px -left-6 -right-6 h-1.5 bg-gradient-to-r from-transparent via-[#F26522] to-transparent"
              style={{ clipPath: 'polygon(8% 0, 100% 0, 92% 100%, 0 100%)' }}
            />

            {/* Glass card */}
            <div className="bg-white/[0.97] backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 border border-white/40 p-7 sm:p-9">
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex justify-center mb-6"
              >
                <BrandLogo size="lg" priority />
              </motion.div>

              {/* Heading */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-center mb-7"
              >
                <h1 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">Sign in to your account</h1>
                <p className="text-sm text-gray-500 mt-1.5">
                  Enter your credentials — we&apos;ll take you to the right portal.
                </p>
              </motion.div>

              {/* Form */}
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="space-y-4"
              >
                {/* Email / ID */}
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <input
                    id="login-email"
                    type="text"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="username"
                    placeholder="Email or ID"
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-orange-100 bg-orange-50/40 text-gray-800 text-sm outline-none transition-all focus:border-[#F26522] focus:bg-white focus:ring-2 focus:ring-[#F26522]/15 placeholder:text-gray-400"
                  />
                </div>

                {/* Password */}
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
                    <Lock size={18} />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Password"
                    className="w-full h-12 pl-11 pr-11 rounded-xl border border-orange-100 bg-orange-50/40 text-gray-800 text-sm outline-none transition-all focus:border-[#F26522] focus:bg-white focus:ring-2 focus:ring-[#F26522]/15 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <button
                      type="button"
                      onClick={() => setRemember(r => !r)}
                      className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                        remember
                          ? 'bg-[#F26522] border-[#F26522]'
                          : 'bg-white border-gray-300 group-hover:border-gray-400'
                      }`}
                      aria-label="Remember me"
                    >
                      {remember && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <span className="text-gray-600">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-[#F26522] hover:text-[#D4541E] font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#F26522] to-[#D4541E] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#F26522]/30 hover:shadow-xl hover:shadow-[#F26522]/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </motion.form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-orange-100" />
                <span className="text-[11px] uppercase tracking-wider text-[#F26522] font-semibold">
                  Secure Access
                </span>
                <div className="flex-1 h-px bg-orange-100" />
              </div>

              {/* Trust badges — all 5 roles auto-detected */}
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { label: 'Super Admin', icon: Shield },
                  { label: 'Institute', icon: Shield },
                  { label: 'Branch', icon: Shield },
                  { label: 'Teacher', icon: Shield },
                  { label: 'Student', icon: Shield },
                ].map(r => (
                  <div
                    key={r.label}
                    className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg bg-orange-50/60 border border-orange-100"
                  >
                    <r.icon className="h-3.5 w-3.5 text-[#F26522]" />
                    <span className="text-[9px] font-medium text-gray-500 text-center leading-tight">
                      {r.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer note */}
            <p className="text-center text-xs text-white/60 mt-5">
              © {new Date().getFullYear()} Concordia College · All rights reserved
            </p>
          </motion.div>
        </div>
      </div>

      {/* ─── Right side: college name overlay on the image (desktop only) ─── */}
      <div className="hidden md:flex absolute right-0 top-0 bottom-0 w-[45%] flex-col justify-end pointer-events-none z-10">
        <div className="p-12 lg:p-16 max-w-lg">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="h-0.5 w-12 bg-[#F26522] mb-4" />
            <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight drop-shadow-lg">
              Excellence in Education
            </h2>
            <p className="text-white/85 mt-3 text-sm lg:text-base drop-shadow">
              A unified management portal for administration, staff, teachers, and students —
              all in one place.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
