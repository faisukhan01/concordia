'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useApp } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock, Eye, EyeOff, CheckCircle2, Mail, Shield, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function SettingsPage({ user }: { user: any }) {
  const setUser = useApp(s => s.setUser);
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
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (newPassword === currentPassword) {
      toast({ title: 'Choose a different password', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      // Update the user in store to clear mustChangePassword
      setUser({ ...user, mustChangePassword: false });
      toast({ title: 'Password updated!', description: 'Your password has been changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.message || 'Unknown error';
      if (msg.includes('incorrect') || msg.includes('401') || msg.includes('Current password')) {
        toast({ title: 'Wrong password', description: 'The current password you entered is incorrect. Please try again.', variant: 'destructive' });
      } else if (msg.includes('short')) {
        toast({ title: 'Password too short', description: 'New password must be at least 4 characters.', variant: 'destructive' });
      } else if (msg.includes('Authentication') || msg.includes('session') || msg.includes('expired')) {
        toast({ title: 'Session expired', description: 'Please sign out and sign in again.', variant: 'destructive' });
      } else {
        toast({ title: 'Could not update password', description: msg, variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and security</p>
      </div>

      {/* Profile info */}
      <Card className="p-6">
        <h3 className="font-bold text-base mb-4 flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Profile Information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-muted/40 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Name</div>
            <div className="font-medium text-sm mt-0.5">{user?.name || '—'}</div>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Role</div>
            <div className="font-medium text-sm mt-0.5">{user?.roleLabel || '—'}</div>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Email</div>
            <div className="font-medium text-sm mt-0.5 flex items-center gap-1.5"><Mail className="h-3 w-3 text-muted-foreground" /> {user?.email || '—'}</div>
          </div>
          {(user?.rollNo) && (
            <div className="rounded-xl bg-muted/40 p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Roll No / ID</div>
              <div className="font-medium text-sm mt-0.5 font-mono">{user.rollNo}</div>
            </div>
          )}
          {user?.instituteName && (
            <div className="rounded-xl bg-muted/40 p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Institute</div>
              <div className="font-medium text-sm mt-0.5">{user.instituteName}</div>
            </div>
          )}
          {user?.branchName && (
            <div className="rounded-xl bg-muted/40 p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Branch</div>
              <div className="font-medium text-sm mt-0.5">{user.branchName}</div>
            </div>
          )}
        </div>
      </Card>

      {/* Change Password */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> Change Password</h3>
          {user?.mustChangePassword && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent border border-accent px-2.5 py-1 text-[11px] font-medium text-primary">
              <Shield className="h-3 w-3" /> Action required
            </span>
          )}
        </div>

        {user?.mustChangePassword && (
          <div className="rounded-xl bg-accent border border-accent p-3 mb-4">
            <p className="text-sm text-primary">
              <strong>Please change your password.</strong> You're using a password assigned by your administrator. Change it now to secure your account.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Current password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showCurrent ? 'text' : 'password'} value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)} className="pl-10 pr-10 h-11"
                placeholder="Enter current password"
              />
              <button type="button" onClick={() => setShowCurrent(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label className="text-xs">New password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showNew ? 'text' : 'password'} value={newPassword}
                onChange={e => setNewPassword(e.target.value)} className="pl-10 pr-10 h-11"
                placeholder="Enter new password"
              />
              <button type="button" onClick={() => setShowNew(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label className="text-xs">Confirm new password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} className="pl-10 pr-10 h-11"
                placeholder="Re-enter new password"
              />
              <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            onClick={submit}
          >
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating…</> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Update Password</>}
          </Button>
        </div>
      </Card>
    </div>
  );
}
