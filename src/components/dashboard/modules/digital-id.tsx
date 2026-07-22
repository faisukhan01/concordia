'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover, PopoverTrigger, PopoverContent,
} from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { ModuleHeader } from './students';
import {
  IdCard, QrCode, Download, Printer, Ban, Plus, ShieldCheck,
  GraduationCap, Calendar, Phone, MoreVertical, Mail, Search,
} from 'lucide-react';

type IdStatus = 'active' | 'expired' | 'revoked';

type StudentIdCard = {
  id: string;
  name: string;
  rollNo: string;
  className: string;
  section: string;
  institute: string;
  validThru: string;
  status: IdStatus;
  bloodGroup: string;
  contact: string;
};

const INITIAL_CARDS: StudentIdCard[] = [
  {
    id: 'ESM-2025-0421', name: 'Ayesha Khan', rollNo: 'AGR-8-A-12', className: 'Grade 8', section: 'A',
    institute: 'Punjab College for Girls', validThru: 'Mar 2026', status: 'active',
    bloodGroup: 'B+', contact: '+92 300 1234567',
  },
  {
    id: 'ESM-2025-0422', name: 'Hamza Tariq', rollNo: 'AGR-9-B-07', className: 'Grade 9', section: 'B',
    institute: 'Punjab College for Boys', validThru: 'Mar 2026', status: 'active',
    bloodGroup: 'O+', contact: '+92 301 7654321',
  },
  {
    id: 'ESM-2025-0423', name: 'Zainab Ali', rollNo: 'AGR-10-A-21', className: 'Grade 10', section: 'A',
    institute: 'Punjab College for Girls', validThru: 'Mar 2026', status: 'expired',
    bloodGroup: 'A+', contact: '+92 302 9876543',
  },
  {
    id: 'ESM-2025-0424', name: 'Bilal Raza', rollNo: 'AGR-7-C-04', className: 'Grade 7', section: 'C',
    institute: 'Punjab College for Boys', validThru: 'Mar 2026', status: 'active',
    bloodGroup: 'AB+', contact: '+92 303 5550100',
  },
  {
    id: 'ESM-2025-0425', name: 'Fatima Noor', rollNo: 'AGR-9-A-15', className: 'Grade 9', section: 'A',
    institute: 'Punjab College for Girls', validThru: 'Mar 2026', status: 'revoked',
    bloodGroup: 'O−', contact: '+92 311 4442020',
  },
  {
    id: 'ESM-2025-0426', name: 'Usman Sheikh', rollNo: 'AGR-11-B-09', className: 'Grade 11', section: 'B',
    institute: 'Punjab College for Boys', validThru: 'Mar 2026', status: 'active',
    bloodGroup: 'B−', contact: '+92 321 8883030',
  },
];

const STATUS_META: Record<IdStatus, { label: string; badge: string }> = {
  active: { label: 'ACTIVE', badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' },
  expired: { label: 'EXPIRED', badge: 'bg-amber-500/20 text-amber-200 border-amber-400/30' },
  revoked: { label: 'REVOKED', badge: 'bg-rose-500/20 text-rose-200 border-rose-400/30' },
};

const CLASS_OPTIONS = ['Class 7-A', 'Class 8-A', 'Class 8-B', 'Class 9-A', 'Class 10-A', 'Class 11-B'];

export default function DigitalIdModule() {
  const [cards, setCards] = useState<StudentIdCard[]>(INITIAL_CARDS);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | IdStatus>('all');
  const [qrOpen, setQrOpen] = useState<StudentIdCard | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkClass, setBulkClass] = useState<string>('Class 10-A');

  // Fetch digital ID cards from the API on mount. Falls back to the
  // INITIAL_CARDS mock list on error so the grid is never empty.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCardsLoading(true);
      try {
        const resp = await api.getDigitalIds();
        if (cancelled) return;
        if (resp.cards && resp.cards.length > 0) {
          const mapped: StudentIdCard[] = resp.cards.map((c) => ({
            id: c.id,
            name: c.studentName,
            rollNo: c.rollNo,
            className: c.className,
            section: c.section,
            institute: c.instituteName || c.branchName,
            validThru: c.validThru,
            status: c.status,
            bloodGroup: c.bloodGroup,
            contact: c.contact,
          }));
          setCards(mapped);
        }
      } catch {
        // keep INITIAL_CARDS fallback
      } finally {
        if (!cancelled) setCardsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const counts = useMemo(() => {
    const c: Record<IdStatus, number> = { active: 0, expired: 0, revoked: 0 };
    for (const card of cards) c[card.status] += 1;
    return c;
  }, [cards]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.rollNo.toLowerCase().includes(q);
    });
  }, [cards, query, statusFilter]);

  const revoke = (id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'revoked' as IdStatus } : c)));
    const card = cards.find((c) => c.id === id);
    toast({ title: 'Card revoked', description: `${card?.name ?? 'Student'} — card deactivated.` });
  };

  const printCard = (card: StudentIdCard) => {
    toast({ title: 'Opening print dialog', description: `${card.name} · ${card.id}` });
    if (typeof window !== 'undefined') window.print();
  };

  const emailParent = (card: StudentIdCard) => {
    toast({ title: 'Emailed to parent', description: `Digital ID for ${card.name} sent to registered email.` });
  };

  const confirmBulk = () => {
    setBulkOpen(false);
    toast({
      title: 'IDs generated',
      description: `24 digital IDs queued for ${bulkClass}.`,
    });
  };

  const summaryStats = [
    { label: 'Total Issued', value: 1284, icon: IdCard, tint: 'from-rose-500 to-pink-600' },
    { label: 'Active', value: counts.active, icon: ShieldCheck, tint: 'from-emerald-500 to-emerald-700' },
    { label: 'Expired', value: counts.expired, icon: Calendar, tint: 'from-amber-500 to-orange-600' },
    { label: 'Revoked', value: counts.revoked, icon: Ban, tint: 'from-rose-500 to-rose-700' },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Digital ID Center"
        subtitle="Wallet-style digital student IDs with QR check-in — for library, cafeteria, exam hall & campus entry"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1.5" /> Export</Button>
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => setBulkOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Bulk Generate
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryStats.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-4 relative overflow-hidden">
                <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${c.tint} opacity-10 blur-2xl`} />
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${c.tint} grid place-items-center mb-3`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-extrabold tabular-nums">
                  {typeof c.value === 'number' ? c.value.toLocaleString() : c.value}
                </div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Count summary + search + filter */}
      <Card className="p-4 flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="text-sm flex flex-wrap items-center gap-2">
          <span className="font-semibold">Status:</span>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
            {counts.active} Active
          </Badge>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20">
            {counts.expired} Expired
          </Badge>
          <Badge variant="outline" className="bg-rose-500/10 text-rose-700 border-rose-500/20">
            {counts.revoked} Revoked
          </Badge>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or roll…"
              className="pl-8 w-full sm:w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | IdStatus)}>
            <SelectTrigger className="w-full sm:w-40 h-9">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* ID card grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">Student ID Cards</h2>
          <span className="text-xs text-muted-foreground">{filtered.length} showing · 1,284 total</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cardsLoading ? (
            <>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="p-0 overflow-hidden">
                  <div className="p-5 bg-muted/40 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-14 w-14 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-16 w-16 rounded-lg ml-auto" />
                  </div>
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </Card>
              ))}
            </>
          ) : (
          filtered.map((c, i) => {
            const isRevoked = c.status === 'revoked';
            const initials = c.name.split(' ').map((n) => n[0]).join('').slice(0, 2);
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <Card className="p-0 overflow-hidden shadow-sm hover:shadow-lg transition-shadow relative">
                  {/* REVOKED diagonal banner */}
                  {isRevoked && (
                    <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
                      <div className="rotate-[-20deg] bg-rose-600 text-white font-extrabold tracking-widest text-sm px-12 py-1 shadow-lg">
                        REVOKED
                      </div>
                    </div>
                  )}
                  {/* Card face — navy gradient */}
                  <div className={`relative p-5 bg-gradient-to-br from-primary via-primary to-primary/85 text-white overflow-hidden ${isRevoked ? 'grayscale opacity-70' : ''}`}>
                    <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-400/15 blur-3xl" />
                    <div className="absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-rose-500/20 blur-3xl" />

                    <div className="relative flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-white/15 grid place-items-center">
                          <GraduationCap className="h-4 w-4 text-amber-300" />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold tracking-wide">Concordia College</div>
                          <div className="text-[9px] text-white/70 uppercase tracking-wider">Student ID</div>
                        </div>
                      </div>
                      <Badge className={`shrink-0 text-[10px] ${STATUS_META[c.status].badge}`} variant="outline">
                        {STATUS_META[c.status].label}
                      </Badge>
                    </div>

                    <div className="relative mt-4 flex items-center gap-3">
                      <Avatar className="h-14 w-14 border-2 border-white/30">
                        <AvatarFallback className="bg-white/15 text-white text-base font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-bold text-base leading-tight truncate">{c.name}</div>
                        <div className="text-[11px] text-white/75 mt-0.5">Roll {c.rollNo}</div>
                        <div className="text-[11px] text-white/75">{c.className} · Sec {c.section}</div>
                      </div>
                    </div>

                    <div className="relative mt-4 flex items-end justify-between">
                      <div>
                        <div className="text-[9px] text-white/60 uppercase tracking-wider">Institute</div>
                        <div className="text-[11px] font-medium leading-tight max-w-[160px]">{c.institute}</div>
                        <div className="text-[9px] text-white/60 uppercase tracking-wider mt-2">Valid Thru</div>
                        <div className="text-[11px] font-medium">{c.validThru}</div>
                      </div>
                      <button
                        onClick={() => setQrOpen(c)}
                        className="h-16 w-16 rounded-lg bg-white grid place-items-center shadow-md shrink-0 hover:scale-105 transition"
                        aria-label="View QR"
                      >
                        <QrCode className="h-12 w-12 text-primary" />
                      </button>
                    </div>

                    <div className="relative mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-[10px] text-white/70">
                      <span className="font-mono">{c.id}</span>
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-emerald-300" /> Verified
                      </span>
                    </div>
                  </div>

                  {/* Card footer — actions */}
                  <div className="p-3 flex items-center justify-between gap-2 bg-card">
                    <div className="text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.contact}</div>
                      <div className="flex items-center gap-1 mt-0.5"><Calendar className="h-3 w-3" /> Blood {c.bloodGroup}</div>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => printCard(c)}>
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`h-8 px-2 ${isRevoked ? 'text-emerald-600' : 'text-rose-600'}`}
                        onClick={() => revoke(c.id)}
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="outline" className="h-8 px-2">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-44 p-1">
                          <button
                            onClick={() => { setQrOpen(c); }}
                            className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-md hover:bg-muted text-left"
                          >
                            <QrCode className="h-3.5 w-3.5 text-muted-foreground" /> View QR
                          </button>
                          <button
                            onClick={() => emailParent(c)}
                            className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-md hover:bg-muted text-left"
                          >
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email to parent
                          </button>
                          <button
                            onClick={() => printCard(c)}
                            className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-md hover:bg-muted text-left"
                          >
                            <Printer className="h-3.5 w-3.5 text-muted-foreground" /> Print
                          </button>
                          <button
                            onClick={() => revoke(c.id)}
                            className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-md hover:bg-rose-500/10 text-rose-700 text-left"
                          >
                            <Ban className="h-3.5 w-3.5" /> Revoke card
                          </button>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
          )}
        </div>
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No cards match your search.
          </Card>
        )}
      </div>

      {/* Bulk operations footer */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 grid place-items-center">
            <IdCard className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <div className="font-semibold text-sm">Bulk Operations</div>
            <div className="text-xs text-muted-foreground">Generate IDs by class, expire old batches, or revoke lost cards.</div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Generate by Class
          </Button>
          <Button size="sm" variant="outline" onClick={() => toast({ title: 'Print queue started', description: '1,284 cards queued for printer ESM-PRT-02.' })}>
            <Download className="h-4 w-4 mr-1.5" /> Print All
          </Button>
          <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => toast({ title: 'No selection', description: 'Tick cards first to bulk-revoke.' })}>
            <Ban className="h-4 w-4 mr-1.5" /> Revoke Selected
          </Button>
        </div>
      </Card>

      {/* QR Dialog */}
      <Dialog open={!!qrOpen} onOpenChange={(o) => !o && setQrOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Student QR Code</DialogTitle>
            <DialogDescription>Scan at any campus checkpoint for instant verification.</DialogDescription>
          </DialogHeader>
          {qrOpen && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="h-56 w-56 rounded-xl bg-white border border-border grid place-items-center shadow-inner">
                <QrCode className="h-44 w-44 text-primary" />
              </div>
              <div className="text-center">
                <div className="font-bold text-base">{qrOpen.name}</div>
                <div className="text-xs text-muted-foreground">{qrOpen.id} · Roll {qrOpen.rollNo}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => qrOpen && printCard(qrOpen)}>
              <Printer className="h-4 w-4 mr-1.5" /> Print
            </Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => setQrOpen(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Generate Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Generate Digital IDs</DialogTitle>
            <DialogDescription>Issue IDs to every student in a class. Existing cards are left untouched.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Select class</label>
              <Select value={bulkClass} onValueChange={setBulkClass}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Pick class" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              You&rsquo;re about to generate <strong className="text-foreground">24 digital IDs</strong> for <strong className="text-foreground">{bulkClass}</strong>. Parent notifications will be sent automatically.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={confirmBulk}>
              <Plus className="h-4 w-4 mr-1.5" /> Generate 24 IDs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
