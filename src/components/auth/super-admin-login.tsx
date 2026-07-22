'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useApp } from '@/lib/store';
import {
  User, Lock, Eye, EyeOff, Loader2, ArrowRight, Shield, GraduationCap,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { BrandLogo } from '@/components/brand-logo';

export function SuperAdminLoginPage() {
  const setUser = useApp(s => s.setUser);
  const setToken = useApp(s => s.setToken);
  const setView = useApp(s => s.setView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast({ title: 'All fields are required', variant: 'destructive' }); return; }

    setIsLoading(true);
    try {
      const { token, user } = await api.login(email, password);
      // Only allow super-admin role
      if (user.role !== 'super-admin') {
        toast({ title: 'Access Denied', description: 'This portal is for Super Admins only.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      setToken(token);
      setUser(user);
      toast({ title: `Welcome, ${user.name}`, description: 'Signed in as Super Admin' });
      setView('portal');
    } catch (err: any) {
      const msg = err.message || 'Sign in failed';
      if (msg.includes('Cannot connect') || msg.includes('Failed to fetch')) {
        toast({ title: 'Connection Error', description: 'Cannot reach the server. Please try again.', variant: 'destructive' });
      } else if (msg.includes('locked') || msg.includes('Too many')) {
        toast({ title: 'Account Locked', description: msg, variant: 'destructive' });
      } else {
        toast({ title: 'Sign in failed', description: msg, variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-bg flex items-center justify-center min-h-screen p-4 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="float-shape-1 absolute top-10 left-10 w-16 h-16 rounded-2xl bg-white/5 border border-white/10" />
        <div className="float-shape-2 absolute top-20 right-12 w-12 h-12 rounded-full bg-white/5 border border-white/10" />
        <div className="float-shape-3 absolute bottom-16 left-16 w-14 h-14 rounded-xl bg-white/5 border border-white/10" />
        <div className="float-shape-4 absolute bottom-10 right-20 w-10 h-10 rounded-lg bg-white/5 border border-white/10" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="rounded-2xl shadow-2xl shadow-black/30 overflow-hidden bg-white">
          {/* Header */}
          <div className="cover-gradient relative px-6 py-8 text-center">
            <div className="glow-circle absolute w-36 h-36 rounded-full bg-white/10 -top-8 -left-8" />
            <div className="glow-circle absolute w-28 h-28 rounded-full bg-white/10 -bottom-6 -right-6" style={{ animationDelay: '2s' }} />

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 150, damping: 12 }}
                className="mb-3 flex justify-center"
              >
                <BrandLogo size="md" variant="light" priority />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-xl font-bold text-white mb-1"
              >
                Concordia College
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="text-white/60 text-xs"
              >
                Platform Administration Portal
              </motion.p>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8">
            <div className="mb-5">
              <h3 className="font-bold text-base text-gray-800">Sign In</h3>
              <p className="text-xs text-gray-400 mt-0.5">Super Admin credentials required</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Email */}
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10"><User size={18} /></div>
                <input
                  id="sa-email"
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="login-input w-full h-12 pl-11 pr-4 rounded-xl text-gray-800 text-sm outline-none transition-all"
                  placeholder="Email"
                  autoComplete="username"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10"><Lock size={18} /></div>
                <input
                  id="sa-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="login-input w-full h-12 pl-11 pr-11 rounded-xl text-gray-800 text-sm outline-none transition-all"
                  placeholder="Password"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="custom-checkbox w-4 h-4 rounded" />
                  <span className="text-sm text-gray-500">Remember me</span>
                </label>
              </div>

              <div>
                <motion.button
                  ref={buttonRef}
                  type="submit"
                  disabled={isLoading}
                  whileTap={{ scale: 0.98 }}
                  className="btn-gradient w-full h-12 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isLoading ? <div className="spinner" /> : <>Sign In <ArrowRight size={18} /></>}
                </motion.button>
              </div>
            </form>

            {/* Security note */}
            <div className="mt-5 rounded-xl bg-accent border border-border p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-semibold text-primary">Secure Access</span>
              </div>
              <p className="text-[11px] text-muted-foreground">This portal is restricted to authorized platform administrators only.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
