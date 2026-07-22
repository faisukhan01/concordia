'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/lib/store';
import { ROLE_MODULES, roleAccent } from '@/lib/role-modules';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BrandLogo } from '@/components/brand-logo';
import {
  GraduationCap, Search, Bell, Menu, LogOut,
  PanelLeftClose, PanelLeft, Crown, Building2, Users, BookOpen, User, Shield,
  CheckCircle2, AlertCircle, Receipt, Award, CalendarCheck, X, Moon, Sun,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import { SuperAdminPortal } from './super-admin-portal';
import { InstituteAdminPortal } from './institute-admin-portal';
import { BranchManagerPortal } from './branch-manager-portal';
import { TeacherPortal } from './teacher-portal';
import { StudentPortal } from './student-portal';
import { SettingsPage } from './settings-page';
import { CommandPalette } from './command-palette';
import { OnboardingTips } from '@/components/onboarding/onboarding-tooltips';
import { HelpWidget } from '@/components/ui/help-widget';
import { api, setOnBlocked } from '@/lib/api';

const roleIcon: Record<string, any> = {
  'super-admin': Crown, 'institute-admin': Building2, 'branch-manager': Users,
  'teacher': BookOpen, 'student': User,
};

// Notification icon + color mapping per type.
// announcement=primary, complaint=danger, fee=gold, result=success, attendance=info
const notifIconMap: Record<string, { Icon: any; text: string; bg: string }> = {
  announcement: { Icon: CheckCircle2, text: 'text-primary', bg: 'bg-primary/10' },
  complaint:    { Icon: AlertCircle,  text: 'text-rose-500', bg: 'bg-rose-500/10' },
  fee:          { Icon: Receipt,      text: 'text-gold',     bg: 'bg-gold/10' },
  result:       { Icon: Award,        text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  attendance:   { Icon: CalendarCheck, text: 'text-sky-500',  bg: 'bg-sky-500/10' },
};

function notifMeta(type: string) {
  return notifIconMap[type] || { Icon: Bell, text: 'text-muted-foreground', bg: 'bg-muted' };
}

// Relative time formatting: "just now", "3m ago", "2h ago", "1d ago", "3w ago", "5mo ago", "1y ago".
function formatRelativeTime(iso: string): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(day / 365)}y ago`;
}

function SidebarContent({ role, collapsed, groupOpen, setGroupOpen, activeModule, setActiveModule, setMobileOpen, user, logout }: any) {
  const groups = ROLE_MODULES[role] || [];
  const accent = roleAccent[role];
  const RoleIcon = roleIcon[role] || GraduationCap;
  return (
    <div className="flex flex-col h-full text-sidebar-foreground bg-sidebar">
      {/* brand — fixed height with orange accent line */}
      <div className={cn('relative flex items-center h-14 border-b border-sidebar-border shrink-0', collapsed ? 'justify-center px-2' : 'px-4 gap-2.5')}>
        {collapsed ? (
          <BrandLogo size="xs" variant="light" />
        ) : (
          <BrandLogo size="sm" variant="light" />
        )}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F26522]/60 to-transparent" />
      </div>

      <nav className="flex-1 overflow-y-auto scroll-fancy px-3 py-4">
        <div className="space-y-5">
          {groups.map((group: any) => {
            const isOpen = groupOpen[group.group];
            return (
              <div key={group.group}>
                {!collapsed && (
                  <button
                    onClick={() => setGroupOpen((g: any) => ({ ...g, [group.group]: !g[group.group] }))}
                    className="w-full flex items-center justify-between px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-sidebar-foreground/55 hover:text-sidebar-foreground/85 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-[#F26522]" />
                      {group.group}
                    </span>
                    {isOpen !== undefined && (
                      <ChevronDown className={cn('h-3 w-3 transition-transform', !isOpen && '-rotate-90')} />
                    )}
                  </button>
                )}
                <div className={cn(!isOpen && !collapsed && 'hidden')}>
                  <div className="space-y-0.5">
                    {group.items.map((m: any) => {
                      const isActive = activeModule === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => { setActiveModule(m.id); setMobileOpen(false); }}
                          title={collapsed ? m.name : undefined}
                          className={cn(
                            'group relative w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150',
                            collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                            isActive
                              ? 'bg-[#F26522] text-white shadow-md shadow-[#F26522]/25'
                              : 'text-sidebar-foreground/80 hover:bg-white/[0.06] hover:text-white'
                          )}
                        >
                          <m.icon className={cn(
                            'h-[18px] w-[18px] shrink-0 transition-colors',
                            isActive ? 'text-white' : 'text-sidebar-foreground/60 group-hover:text-[#FF8C42]'
                          )} />
                          {!collapsed && <span className="truncate flex-1 text-left">{m.name}</span>}
                          {!collapsed && isActive && (
                            <ChevronRight className="h-3.5 w-3.5 text-white/80 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-3 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] p-2.5">
            <Avatar className="h-9 w-9 shrink-0 ring-2 ring-[#F26522]/20">
              <AvatarFallback
                className="text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #F26522 0%, #D4541E 100%)' }}
              >
                {(user?.name || 'Admin').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</div>
              <div className="text-[10px] text-sidebar-foreground/55 truncate">{user?.roleLabel}</div>
            </div>
            <button onClick={logout} title="Sign out" className="h-8 w-8 grid place-items-center rounded-lg text-sidebar-foreground/60 hover:text-white hover:bg-rose-500/20 transition-colors shrink-0">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button onClick={logout} title="Sign out" className="w-full h-10 grid place-items-center rounded-lg text-sidebar-foreground/60 hover:text-white hover:bg-rose-500/20 transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function RolePortal() {
  const { user, activeModule, setActiveModule, logout } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [blockedMsg, setBlockedMsg] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // --- Notifications dropdown state ---
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifItems, setNotifItems] = useState<any[]>([]);
  const [notifUnread, setNotifUnread] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = useCallback(async () => {
    setNotifLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifItems(Array.isArray(data?.items) ? data.items : []);
      setNotifUnread(typeof data?.unread === 'number' ? data.unread : 0);
    } catch {
      // silent — keep last known state
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // Fetch unread count on mount so the bell badge appears without opening the panel.
  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  // next-themes hydration guard
  useEffect(() => setMounted(true), []);

  // Click-away + Escape to close the notifications panel.
  useEffect(() => {
    if (!notifOpen) return;
    function onDocClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setNotifOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [notifOpen]);

  const toggleNotifs = () => {
    const next = !notifOpen;
    setNotifOpen(next);
    if (next) fetchNotifs();
  };

  const role = user?.role || 'student';
  const groups = ROLE_MODULES[role] || [];
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>(
    Object.fromEntries(groups.map((g: any) => [g.group, true]))
  );
  const accent = roleAccent[role];
  const RoleIcon = roleIcon[role] || GraduationCap;

  // Register global blocked handler — when API returns 403/401 with "blocked",
  // show the blocked screen instead of silent errors
  useEffect(() => {
    setOnBlocked((msg: string) => {
      setBlockedMsg(msg);
    });
    return () => setOnBlocked(() => {});
  }, []);

  // Global Cmd+K / Ctrl+K to toggle the command palette.
  // ignoreKey: prevent opening while typing in inputs that explicitly opt out
  // (none currently, but the guard keeps the listener defensive).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Check if user has a blockedMessage from login (set by backend when institute/branch is blocked)
  // Derive blocked state directly from user — no effect needed
  const blockedFromUser = user?.blockedMessage || null;

  // Reset active module when role changes (e.g. on login)
  useEffect(() => {
    const firstModule = groups[0]?.items[0]?.id;
    if (firstModule && !groups.some((g: any) => g.items.some((m: any) => m.id === activeModule))) {
      setActiveModule(firstModule);
    }
  }, [role]);

  const allModules = useMemo(() => groups.flatMap((g: any) => g.items), [groups]);
  const active = allModules.find((m: any) => m.id === activeModule) || allModules[0] || { id: 'none', name: 'Home', icon: GraduationCap, color: 'from-primary to-primary/80' };

  const renderPortal = () => {
    if (activeModule === 'settings') return <SettingsPage user={user} />;
    switch (role) {
      case 'super-admin': return <SuperAdminPortal activeModule={activeModule} user={user} />;
      case 'institute-admin': return <InstituteAdminPortal activeModule={activeModule} user={user} />;
      case 'branch-manager': return <BranchManagerPortal activeModule={activeModule} user={user} />;
      case 'teacher': return <TeacherPortal activeModule={activeModule} user={user} />;
      case 'student': return <StudentPortal activeModule={activeModule} user={user} />;
      default: return <StudentPortal activeModule={activeModule} user={user} />;
    }
  };

  const sidebarProps = { role, collapsed, groupOpen, setGroupOpen, activeModule, setActiveModule, setMobileOpen, user, logout };

  // Blocked screen — shown when Super Admin or Institute Admin blocks access
  // Can be triggered by: 1) blockedMessage from login, 2) 403/401 from API calls
  const effectiveBlockedMsg = blockedMsg || blockedFromUser;
  if (effectiveBlockedMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-950 via-slate-950 to-rose-950 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="rounded-3xl bg-white shadow-2xl p-8 text-center">
            <div className="inline-flex h-16 w-16 rounded-2xl bg-rose-100 items-center justify-center mb-5">
              <Shield className="h-8 w-8 text-rose-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Access Blocked</h1>
            <p className="text-sm text-slate-600 mb-1">Your access has been blocked by your administration.</p>
            <p className="text-xs text-slate-400 mb-6">{effectiveBlockedMsg}</p>
            <p className="text-xs text-slate-500 mb-6">Please contact your administrator to restore access.</p>
            <Button
              className="w-full bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => { logout(); setBlockedMsg(null); }}
            >
              <LogOut className="h-4 w-4 mr-2" /> Back to Sign In
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className={cn('hidden lg:flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 fixed inset-y-0 left-0 z-30', collapsed ? 'w-[68px]' : 'w-64')}>
        <SidebarContent {...sidebarProps} />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-40" />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-sidebar">
              <SidebarContent {...sidebarProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className={cn('flex-1 flex flex-col min-w-0', collapsed ? 'lg:ml-[68px]' : 'lg:ml-64')}>
        <header className="sticky top-0 z-20 h-14 bg-card border-b border-border flex items-center gap-3 px-4 sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden h-8 w-8 grid place-items-center rounded-md hover:bg-accent">
            <Menu className="h-5 w-5" />
          </button>
          <button onClick={() => setCollapsed(v => !v)} className="hidden lg:flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent text-muted-foreground">
            {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0">
              <div className="font-semibold text-sm sm:text-base truncate">{active?.name}</div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              aria-label="Open command palette"
              className="group hidden md:flex items-center gap-2 h-9 w-48 lg:w-64 px-3 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground text-sm transition border border-transparent hover:border-border"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left truncate">Search…</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 h-5 px-1.5 rounded border border-border bg-background/80 text-[10px] font-medium text-muted-foreground/80">
                <span className="text-[11px] leading-none">⌘</span>K
              </kbd>
            </button>
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
                className="h-9 w-9 grid place-items-center rounded-md hover:bg-accent text-muted-foreground transition"
              >
                {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </button>
            )}
            <div className="relative" ref={notifRef}>
              <button
                onClick={toggleNotifs}
                aria-label="Notifications"
                aria-expanded={notifOpen}
                className="relative h-9 w-9 grid place-items-center rounded-md hover:bg-accent text-muted-foreground transition"
              >
                <Bell className="h-[18px] w-[18px]" />
                {notifUnread > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-card" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-[360px] max-h-[480px] bg-card border border-border rounded-xl shadow-lg z-50 flex flex-col overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-primary">Notifications</span>
                      {notifUnread > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold leading-none">
                          {notifUnread > 99 ? '99+' : notifUnread}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setNotifOpen(false)}
                      aria-label="Close notifications"
                      className="h-6 w-6 grid place-items-center rounded-md text-muted-foreground hover:bg-accent transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto scroll-fancy">
                    {notifLoading ? (
                      <div className="p-2 space-y-1">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg">
                            <div className="h-9 w-9 rounded-full bg-muted animate-pulse shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
                              <div className="h-2.5 w-full bg-muted rounded animate-pulse" />
                              <div className="h-2 w-1/3 bg-muted rounded animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : notifItems.length === 0 ? (
                      <div className="px-4 py-10 text-center">
                        <div className="mx-auto h-12 w-12 rounded-full bg-muted grid place-items-center mb-3">
                          <Bell className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="text-sm font-medium text-primary">No notifications</div>
                        <div className="text-xs text-muted-foreground mt-1">You&rsquo;re all caught up.</div>
                      </div>
                    ) : (
                      <ul className="p-2 space-y-1">
                        {notifItems.map((n) => {
                          const { Icon, text, bg } = notifMeta(n?.type);
                          return (
                            <li key={n?.id ?? Math.random()}>
                              <div
                                className={cn(
                                  'flex items-start gap-3 p-3 rounded-lg transition cursor-default',
                                  n?.read ? 'hover:bg-accent' : 'bg-primary/5 hover:bg-primary/10'
                                )}
                              >
                                <div className={cn('h-9 w-9 rounded-full grid place-items-center shrink-0', bg)}>
                                  <Icon className={cn('h-4 w-4', text)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-primary truncate">{n?.title}</span>
                                    {!n?.read && (
                                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                                    )}
                                  </div>
                                  {n?.message && (
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                                  )}
                                  <div className="text-[10px] text-muted-foreground/70 mt-1">
                                    {formatRelativeTime(n?.createdAt)}
                                  </div>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-border">
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">{user?.campus}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {/* Onboarding tips banner — dismissible, remembered via localStorage */}
          <OnboardingTips />
          {/* Must change password banner */}
          {user?.mustChangePassword && activeModule !== 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl bg-accent border border-[oklch(0.6_0.04_260)] p-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[oklch(0.5_0.04_260)_/_0.2] grid place-items-center shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-primary">Please change your password</div>
                  <div className="text-xs text-primary">You're using a password assigned by your administrator. Change it now to secure your account.</div>
                </div>
              </div>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white shrink-0" onClick={() => setActiveModule('settings')}>
                Change now
              </Button>
            </motion.div>
          )}
          <AnimatePresence mode="wait">
            <motion.div key={activeModule} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              {renderPortal()}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="mt-auto border-t border-border px-6 py-3 text-xs text-muted-foreground flex items-center justify-between">
          <span>© {new Date().getFullYear()} Concordia College</span>
        </footer>
      </div>

      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        user={user}
        modules={groups}
        onNavigate={(id) => {
          setActiveModule(id);
          setCmdOpen(false);
        }}
      />
      <HelpWidget />
    </div>
  );
}
