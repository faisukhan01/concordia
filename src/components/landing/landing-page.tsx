'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MODULES } from '@/lib/modules';
import { useApp } from '@/lib/store';
import {
  GraduationCap, ArrowRight, ShieldCheck, Users, Building2,
  Menu, X, Zap,
  Smartphone, Mail,
  Layers, Globe, Rocket, BookOpen, DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrandLogo } from '@/components/brand-logo';

// Real features the platform actually offers — no fake stats
const PLATFORM_FEATURES = [
  { icon: Layers, title: `${MODULES.length}+ Integrated Modules`, desc: 'Admissions, attendance, fees, academics, HR, finance, library, transport & more — all in one place.' },
  { icon: Users, title: '4 Role-Based Portals', desc: 'Scoped dashboards for Institute Admins, Branch Managers, Teachers & Students — each sees exactly what they need.' },
  { icon: Building2, title: 'Multi-Tenant SaaS', desc: 'Provision unlimited institutions. Each gets its own admin, branches, and isolated data.' },
  { icon: ShieldCheck, title: 'Role-Based Access', desc: 'Granular permissions — every user sees exactly what they need, nothing more.' },
  { icon: Smartphone, title: 'Mobile-Ready', desc: 'Responsive portals for teachers, students and admins — works beautifully on any device.' },
  { icon: Zap, title: 'Real-Time Data', desc: 'Live dashboards. No imports, no delays. Teachers mark attendance → admins see it instantly.' },
];

// Curated subset of representative modules for the showcase grid.
// Mix of core modules + newer PGC-parity modules — pulled from src/lib/modules.ts.
const HIGHLIGHT_MODULE_IDS = [
  'online-admissions', 'attendance', 'e-learning', 'exam-portal',
  'fee', 'campus-wallet', 'hr', 'library',
  'live-transport', 'digital-id', 'ptm-scheduling', 'complaint-portal',
];
const HIGHLIGHTED_MODULES = MODULES.filter(m => HIGHLIGHT_MODULE_IDS.includes(m.id));

const TECH_STACK = [
  { label: 'Next.js 16', desc: 'Modern React framework' },
  { label: 'Recharts', desc: 'Interactive data visualizations' },
  { label: 'Node.js + Express', desc: 'Scalable backend API' },
  { label: 'TypeScript', desc: 'Type-safe throughout' },
  { label: 'Tailwind CSS', desc: 'Premium responsive UI' },
  { label: 'Role-Based Auth', desc: 'Secure multi-tenant access' },
];

export function LandingPage() {
  const setView = useApp(s => s.setView);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return <LandingPageInner setView={setView} menuOpen={menuOpen} setMenuOpen={setMenuOpen} scrolled={scrolled} />;
}

function HeroSlider({ setView }: { setView: (v: any) => void }) {
  return (
    <section id="top" className="relative w-full overflow-hidden hero-gradient-bg">
      {/* Dot grid overlay */}
      <div className="absolute inset-0 hero-dot-grid opacity-40 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* LEFT: Headline + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-left"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-[#1a365d]/5 border border-[#1a365d]/10 px-3.5 py-1.5 text-[11px] font-semibold text-[#1a365d] mb-6 tracking-wide uppercase">
              College Management Portal
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight leading-[1.15] text-[#0f1e3a]">
              Manage your entire institution from a single platform
            </h1>

            <p className="mt-5 text-base sm:text-lg text-gray-500 leading-relaxed max-w-md">
              Admissions, attendance, fees, academics, and staff &amp; student communication — all in one place. Built for multi-campus institutions.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="bg-[#1a365d] text-white hover:bg-[#0f1e3a] font-semibold rounded-lg shadow-sm cta-glow" onClick={() => setView('login')}>
                Launch Portal <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <button
                onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium h-11 px-6 border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all"
              >
                Explore Modules
              </button>
            </div>

            {/* Trust indicators — real, not fake */}
            <div className="mt-10 flex items-center gap-6 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {MODULES.length} integrated modules
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Multi-tenant architecture
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Role-based access
              </div>
            </div>

            {/* Social proof bar */}
            <div className="mt-8 pt-6 border-t border-gray-200/60">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-7 w-7 rounded-full bg-gradient-to-br from-[#1a365d]/15 to-[#1a365d]/5 border-2 border-white ring-1 ring-gray-100" />
                  ))}
                </div>
                <p className="text-xs text-gray-500">Trusted by growing institutions</p>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: Product preview — CSS dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            {/* Browser frame */}
            <div className="rounded-xl border border-gray-200 shadow-xl overflow-hidden bg-white">
              {/* Browser top bar */}
              <div className="flex items-center gap-2 px-4 h-9 bg-gray-50 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                </div>
                <div className="flex-1 text-center text-[10px] text-gray-400 font-medium tracking-wide">concordia.portal/dashboard</div>
              </div>

              {/* Dashboard content */}
              <div className="flex h-[360px]">
                {/* Mini sidebar */}
                <div className="w-40 shrink-0 bg-[#1a365d] p-3 hidden sm:block">
                  <div className="flex items-center gap-2 mb-5">
                    <BrandLogo size="xs" variant="light" />
                  </div>
                  <div className="space-y-1">
                    {['Dashboard', 'Institutes', 'Analytics', 'Announcements'].map((item, i) => (
                      <div key={item} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] ${i === 0 ? 'bg-white/15 text-white' : 'text-white/60'}`}>
                        <div className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 p-4 overflow-hidden">
                  {/* KPI row */}
                  <div className="grid grid-cols-3 gap-2.5 mb-3">
                    {[
                      { label: 'Institutions', value: '3', icon: Building2 },
                      { label: 'Students', value: '1,247', icon: Users },
                      { label: 'Revenue', value: 'PKR 890K', icon: DollarSign },
                    ].map(kpi => (
                      <div key={kpi.label} className="border border-gray-200 rounded-lg p-2.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="h-6 w-6 rounded-md bg-[#1a365d]/8 grid place-items-center">
                            <kpi.icon className="h-3 w-3 text-[#1a365d]" />
                          </div>
                        </div>
                        <div className="text-sm font-bold text-[#0f1e3a] tabular-nums">{kpi.value}</div>
                        <div className="text-[9px] text-gray-400 mt-0.5">{kpi.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Chart mockup */}
                  <div className="border border-gray-200 rounded-lg p-3 mb-2.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-gray-600">Revenue vs Salary</span>
                      <span className="text-[9px] text-gray-400">Last 6 months</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-20">
                      {[45, 60, 50, 75, 65, 85].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col gap-0.5 items-center">
                          <div className="w-full bg-[#1a365d] rounded-t-sm" style={{ height: `${h}%` }} />
                          <div className="w-full bg-[#e11d48]/40 rounded-b-sm" style={{ height: `${h * 0.35}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Table mockup */}
                  <div className="border border-gray-200 rounded-lg p-2.5">
                    <div className="text-[10px] font-semibold text-gray-600 mb-2">Institute Performance</div>
                    <div className="space-y-1.5">
                      {[
                        { name: 'North Campus', rev: 'PKR 450K', pct: '75%' },
                        { name: 'South Campus', rev: 'PKR 280K', pct: '48%' },
                      ].map(row => (
                        <div key={row.name} className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-700 font-medium">{row.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 tabular-nums">{row.rev}</span>
                            <div className="w-12 h-1 rounded-full bg-gray-100">
                              <div className="h-full rounded-full bg-[#1a365d]" style={{ width: row.pct }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtle shadow under the browser frame */}
            <div className="absolute -bottom-2 left-4 right-4 h-4 bg-[#1a365d]/5 blur-xl rounded-full" />
          </motion.div>

        </div>
      </div>
    </section>
  );
}

function LandingPageInner({ setView, menuOpen, setMenuOpen, scrolled }: any) {

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'navbar-scrolled border-b border-gray-100/60' : 'bg-white/80 backdrop-blur-sm'}`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5 group">
            <BrandLogo size="sm" priority className="group-hover:opacity-90 transition" />
          </a>

          <div className="hidden md:flex items-center gap-1">
            {['Modules', 'Features', 'Tech'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="px-3 py-2 text-sm font-medium rounded-lg transition text-gray-600 hover:text-[#0f1e3a] hover:bg-gray-50">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:flex text-gray-600 hover:text-[#0f1e3a]" onClick={() => setView('login')}>
              Sign in
            </Button>
            <Button size="sm" className="bg-[#1a365d] text-white hover:bg-[#0f1e3a] shadow-sm" onClick={() => setView('login')}>
              Launch Portal <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden text-gray-600" onClick={() => setMenuOpen(v => !v)}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </nav>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden glass border-b border-border/60 overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                {['Modules', 'Features', 'Tech'].map(item => (
                  <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
                    {item}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero — full-bleed image slider with clean text overlay */}
      <HeroSlider setView={setView} />


      {/* Platform features (replaces fake stats) */}
      <section id="features" className="py-20 sm:py-28 relative diagonal-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-3 border-primary/40 text-primary">Platform Capabilities</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Built to run{' '}
              <span className="emerald-text">your entire institution</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              From the first inquiry to graduation day — every workflow is connected, scoped, and real-time.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PLATFORM_FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group relative rounded-2xl border border-border/60 bg-card p-6 hover:shadow-xl hover:-translate-y-1 transition-all gradient-border-hover"
              >
                <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition" />
                <span className="text-[11px] font-bold text-primary/25 mb-2 block">0{i + 1}</span>
                <div className="inline-flex h-12 w-12 rounded-xl glass-icon items-center justify-center mb-4 group-hover:scale-110 transition">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules showcase */}
      <section id="modules" className="py-20 sm:py-28 relative bg-gradient-to-b from-accent to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-3 border-primary/40 text-primary">{MODULES.length}+ Integrated Modules</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Every module your institution needs,{' '}
              <span className="emerald-text">in one place</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              A curated look at what powers modern campuses — explore the full catalog inside the platform.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {HIGHLIGHTED_MODULES.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.08 }}
                className="group relative rounded-2xl border border-border/60 bg-card p-5 overflow-hidden hover:shadow-xl transition-shadow gradient-border-hover"
              >
                <div className={`absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${m.color} opacity-10 group-hover:opacity-25 blur-2xl transition`} />
                <div className="relative inline-flex h-11 w-11 rounded-xl items-center justify-center mb-4 glass-icon">
                  <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${m.color} opacity-15`} />
                  <m.icon className="relative h-5 w-5 text-primary" aria-hidden />
                </div>
                <h3 className="font-bold text-base mb-1">{m.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{m.tagline}</p>
                <div className="flex flex-wrap gap-1.5">
                  {m.features.slice(0, 3).map(f => (
                    <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{f}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button variant="outline" size="lg" className="border-primary/30 text-primary hover:bg-primary/5" onClick={() => setView('login')}>
              Explore all {MODULES.length} modules <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* How it works — four role-based portals */}
      <section id="tech" className="py-20 sm:py-28 bg-gradient-to-b from-background to-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-3 border-primary/40 text-primary">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Four role-based portals,{' '}
              <span className="emerald-text">working as one</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Each portal is purpose-built for its role — scoped, secure, and connected in real time.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" aria-hidden />
            {[
              { step: '01', icon: Building2, title: 'Institute Admin', desc: 'Provisions branches, configures the academic structure, and oversees the whole institute from one dashboard.', color: 'from-primary to-primary/80' },
              { step: '02', icon: Users, title: 'Branch Manager', desc: 'Runs daily operations — teachers, students, attendance, fees, transport, and events.', color: 'from-primary to-primary/80' },
              { step: '03', icon: BookOpen, title: 'Teacher', desc: 'Marks attendance, posts results, assigns homework, and runs the classroom digitally.', color: 'from-primary/80 to-primary' },
              { step: '04', icon: GraduationCap, title: 'Student', desc: 'Tracks attendance, results, timetable, wallet, digital ID, and e-learning — all in one portal.', color: 'from-primary/70 to-primary' },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl border border-border/60 bg-card p-6 text-center hover:shadow-xl hover:-translate-y-1 transition-all z-10"
              >
                <div className={`inline-flex h-12 w-12 rounded-xl bg-gradient-to-br ${s.color} items-center justify-center shadow-md mb-4`}>
                  <s.icon className="h-6 w-6 text-white" aria-hidden />
                </div>
                <div className="text-xs font-bold text-primary/70 mb-1">STEP {s.step}</div>
                <h3 className="font-bold text-base mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — honest early access */}
      <section className="py-20 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 p-8 sm:p-12 text-center text-white">
            <div className="absolute inset-0 bg-grid-dark opacity-30" />
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative">
              <Rocket className="h-8 w-8 mx-auto text-amber-400 mb-4" />
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Ready to modernize your campus?
              </h2>
              <p className="mt-4 text-white/90 max-w-xl mx-auto">
                Explore the full Concordia College platform now. Provision an
                institute, add branches, create teachers and students, and see how each
                role gets their own scoped experience.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="bg-white text-primary hover:bg-primary/10" onClick={() => setView('login')}>
                  Launch the Portal <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <button
                  onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 px-8 border-2 border-white/40 text-white hover:bg-white hover:text-primary transition-all duration-300"
                >
                  See all modules
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wave divider above footer */}
      <div className="relative -mb-1">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" preserveAspectRatio="none">
          <path d="M0 30C240 60 480 0 720 30C960 60 1200 0 1440 30V60H0V30Z" className="fill-card/50" />
        </svg>
      </div>

      {/* Footer */}
      <footer className="bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <BrandLogo size="sm" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Intelligent solutions for a better institution. A modern, multi-tenant school management platform.
            </p>
            {/* Download App CTA */}
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Get the mobile app</p>
              <Button size="sm" className="bg-primary text-white hover:bg-primary/90 shadow-sm" onClick={() => window.open('https://esm-rose.vercel.app/download', '_blank')}>
                <Smartphone className="h-3.5 w-3.5 mr-1.5" /> Download App
              </Button>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Modules</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {MODULES.slice(0, 5).map(m => (
                <li key={m.id}><button className="hover:text-foreground transition" onClick={() => setView('login')}>{m.name}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Features</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Multi-tenant SaaS</li>
              <li>Role-based portals</li>
              <li>Real-time data</li>
              <li>PDF report cards</li>
              <li>Secure authentication</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Get in touch</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> faisalkhan00297@gmail.com</li>
              <li className="flex items-center gap-2"><Globe className="h-4 w-4 shrink-0" /> Available worldwide</li>
            </ul>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setView('login')}>Request Demo</Button>
          </div>
        </div>
        <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Concordia College. Built for modern educational institutions.
        </div>
      </footer>
    </div>
  );
}
