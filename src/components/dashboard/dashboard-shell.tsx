'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MODULES, MODULE_GROUPS } from '@/lib/modules';
import { useApp } from '@/lib/store';
import { api, type Stats } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrandLogo } from '@/components/brand-logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Search, Bell, Menu, LogOut, ChevronDown, ChevronRight,
  Settings, Globe, Sparkles, PanelLeftClose, PanelLeft, Command,
} from 'lucide-react';

import { DashboardOverview } from './modules/dashboard-overview';
import { StudentsModule } from './modules/students';
import { AttendanceModule } from './modules/attendance';
import { FeesModule } from './modules/fees';
import { ResultsModule } from './modules/results';
import { SmsModule } from './modules/sms';
import { LibraryModule } from './modules/library';
import { TransportModule } from './modules/transport';
import { HrModule } from './modules/hr';
import { EventsModule } from './modules/events';
import { FinanceModule } from './modules/finance';
import { InquiriesModule } from './modules/inquiries';
import { ComplaintsModule } from './modules/complaints';
import { AcademicsModule } from './modules/academics';
import { GenericModule } from './modules/generic';
import { OnlineAdmissions } from './modules/online-admissions';
import { ELearningHub } from './modules/e-learning-hub';
import { ExamPortal } from './modules/exam-portal';
import { ComplaintPortal } from './modules/complaint-portal';

type SidebarProps = {
  collapsed: boolean;
  groupOpen: Record<string, boolean>;
  setGroupOpen: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  activeModule: string;
  setActiveModule: (m: string) => void;
  setMobileOpen: (v: boolean) => void;
  user: { name?: string; role?: string } | null;
  logout: () => void;
};

function SidebarContent({ collapsed, groupOpen, setGroupOpen, activeModule, setActiveModule, setMobileOpen, user, logout }: SidebarProps) {
  return (
    <div className="flex flex-col h-full text-sidebar-foreground">
      {/* brand */}
      <div className={cn('flex items-center px-4 h-16 border-b border-sidebar-border shrink-0', collapsed ? 'justify-center px-2' : 'gap-2.5')}>
        {collapsed ? (
          <BrandLogo size="xs" variant="light" />
        ) : (
          <BrandLogo size="sm" variant="light" />
        )}
      </div>

      {/* modules nav */}
      <nav className="flex-1 overflow-y-auto scroll-fancy px-2 py-3 space-y-1">
        {MODULE_GROUPS.map(group => {
          const items = MODULES.filter(m => m.group === group);
          if (items.length === 0) return null;
          const isOpen = groupOpen[group];
          return (
            <div key={group} className="mb-1">
              {!collapsed && (
                <button
                  onClick={() => setGroupOpen(g => ({ ...g, [group]: !g[group] }))}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition"
                >
                  {group}
                  <ChevronDown className={cn('h-3 w-3 transition', !isOpen && '-rotate-90')} />
                </button>
              )}
              <AnimatePresence initial={false}>
                {(isOpen || collapsed) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {items.map(m => {
                      const isActive = activeModule === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => { setActiveModule(m.id); setMobileOpen(false); }}
                          title={collapsed ? m.name : undefined}
                          className={cn(
                            'group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition mb-0.5',
                            collapsed && 'justify-center',
                            isActive
                              ? 'bg-gradient-to-r from-emerald-600/90 to-emerald-700/80 text-white shadow-md'
                              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white'
                          )}
                        >
                          <m.icon className={cn('h-[18px] w-[18px] shrink-0', isActive && 'text-amber-300')} />
                          {!collapsed && <span className="truncate font-medium">{m.short}</span>}
                          {!collapsed && isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto text-amber-300" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* user card */}
      <div className="border-t border-sidebar-border p-3 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 rounded-xl bg-sidebar-accent/60 p-2.5">
            <Avatar className="h-9 w-9 border border-white/20">
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-xs font-bold">
                {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{user?.name || 'Administrator'}</div>
              <div className="text-[10px] text-sidebar-foreground/60 truncate">{user?.role || 'Super Admin'}</div>
            </div>
            <button onClick={logout} title="Sign out" className="h-8 w-8 grid place-items-center rounded-lg text-sidebar-foreground/70 hover:text-white hover:bg-rose-500/20 transition">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button onClick={logout} title="Sign out" className="w-full h-9 grid place-items-center rounded-lg text-sidebar-foreground/70 hover:text-white hover:bg-rose-500/20 transition">
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function DashboardShell() {
  const { user, activeModule, setActiveModule, logout } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState('');
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>(
    Object.fromEntries(MODULE_GROUPS.map(g => [g, g === 'Overview' || g === 'Academics']))
  );

  useEffect(() => {
    api.stats().then(setStats).catch(() => {});
  }, []);

  const active = MODULES.find(m => m.id === activeModule) || MODULES[0];

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <DashboardOverview stats={stats} />;
      case 'inquiry': return <InquiriesModule />;
      case 'admission': return <StudentsModule mode="admission" />;
      case 'attendance': return <AttendanceModule />;
      case 'results': return <ResultsModule />;
      case 'academics': return <AcademicsModule />;
      case 'fee': return <FeesModule />;
      case 'finance': return <FinanceModule />;
      case 'sms': return <SmsModule />;
      case 'complaints': return <ComplaintsModule />;
      case 'events': return <EventsModule />;
      case 'library': return <LibraryModule />;
      case 'transport': return <TransportModule />;
      case 'hr': return <HrModule />;
      case 'hostel': return <GenericModule id="hostel" name="Hostel Management" icon="Building2" />;
      case 'assets': return <GenericModule id="assets" name="Fixed Assets Management" icon="Boxes" />;
      case 'franchise': return <GenericModule id="franchise" name="Franchise Management" icon="Network" />;
      case 'config': return <GenericModule id="config" name="Configuration" icon="Settings" />;
      case 'users': return <GenericModule id="users" name="User & Privileges" icon="ShieldCheck" />;
      case 'branding': return <GenericModule id="branding" name="Institute Branding" icon="Palette" />;
      case 'consultancy': return <GenericModule id="consultancy" name="Student Consultancy" icon="Compass" />;
      case 'online-admissions': return <OnlineAdmissions user={user} />;
      case 'e-learning': return <ELearningHub user={user} />;
      case 'exam-portal': return <ExamPortal user={user} />;
      case 'complaint-portal': return <ComplaintPortal user={user} />;
      default: return <DashboardOverview stats={stats} />;
    }
  };

  const sidebarProps: SidebarProps = {
    collapsed, groupOpen, setGroupOpen, activeModule, setActiveModule, setMobileOpen, user, logout,
  };

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 fixed inset-y-0 left-0 z-30',
        collapsed ? 'w-[68px]' : 'w-64'
      )}>
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-sidebar"
            >
              <SidebarContent {...sidebarProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className={cn('flex-1 flex flex-col min-w-0', collapsed ? 'lg:ml-[68px]' : 'lg:ml-64')}>
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-16 glass border-b border-border/60 flex items-center gap-3 px-4 sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden h-9 w-9 grid place-items-center rounded-lg hover:bg-accent">
            <Menu className="h-5 w-5" />
          </button>
          <button onClick={() => setCollapsed(v => !v)} className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent text-muted-foreground">
            {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className={cn('h-8 w-8 rounded-lg bg-gradient-to-br', active.color, 'grid place-items-center shrink-0')}>
              <active.icon className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-display font-bold text-sm sm:text-base truncate">{active.name}</div>
              <div className="text-[11px] text-muted-foreground truncate hidden sm:block">{active.tagline}</div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search students, staff…"
                className="pl-9 pr-12 h-9 w-56 lg:w-72 bg-card"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 hidden lg:flex items-center gap-0.5">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </div>

            <button className="relative h-9 w-9 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{user?.campus || 'Main Campus'}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {renderModule()}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="mt-auto border-t border-border/60 px-6 py-3 text-xs text-muted-foreground flex items-center justify-between bg-card/40">
          <span>© {new Date().getFullYear()} Concordia College</span>
          <span className="hidden sm:flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-amber-500" /> Powered by Cyber Advance Solutions</span>
        </footer>
      </div>
    </div>
  );
}
