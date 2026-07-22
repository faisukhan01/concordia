'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { api, type PtmApiSlot } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { ModuleHeader } from './students';
import {
  Video, Calendar, Plus, Clock, Users, Bell, ChevronRight, CheckCircle2,
  CalendarPlus, X,
} from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'];

type SlotState = 'open' | 'booked' | 'past';

type SlotInfo = {
  state: SlotState;
  teacher?: string;
  subject?: string;
  parent?: string;
  student?: string;
  agenda?: string;
  isMine?: boolean;
};

const DEFAULT_TEACHERS: Record<string, string> = {
  Mon: 'Ms. Saima', Tue: 'Mr. Ali', Wed: 'Mr. Imran', Thu: 'Ms. Saima', Fri: 'Mr. Naveed', Sat: 'Ms. Sana',
};

const INITIAL_SLOTS: Record<string, SlotInfo> = {
  'Mon-09:00': { state: 'booked', teacher: 'Ms. Saima', parent: 'Mr. Khan', student: 'Ayesha Khan', subject: 'Mathematics', agenda: 'Discuss Q2 performance.', isMine: true },
  'Mon-11:00': { state: 'booked', teacher: 'Mr. Ali', parent: 'Mrs. Iqbal', student: 'Hamza Tariq', subject: 'Physics' },
  'Tue-10:00': { state: 'booked', teacher: 'Ms. Sana', parent: 'Mrs. Tariq', student: 'Zainab Ali', subject: 'English', isMine: true },
  'Wed-14:00': { state: 'past', teacher: 'Mr. Imran', parent: 'Mr. Yousaf', student: 'Bilal Raza', subject: 'Chemistry', agenda: 'Reviewed lab reports.' },
  'Thu-15:00': { state: 'past', teacher: 'Ms. Saima', parent: 'Mrs. Bilal', student: 'Sara Bilal', subject: 'Mathematics' },
  'Fri-09:00': { state: 'booked', teacher: 'Mr. Naveed', parent: 'Mr. Ahmed', student: 'Usman Sheikh', subject: 'Biology' },
  'Sat-12:00': { state: 'booked', teacher: 'Ms. Sana', parent: 'Mr. Raza', student: 'Fatima Noor', subject: 'English' },
};

type UpcomingItem = {
  id: string;
  teacher: string;
  subject: string;
  date: string;
  time: string;
  countdown: string;
  status: 'confirmed' | 'pending';
};

const UPCOMING: UpcomingItem[] = [
  { id: 'u1', teacher: 'Ms. Saima Khan', subject: 'Mathematics', date: 'Today', time: '03:00 PM', countdown: 'in 2h 15m', status: 'confirmed' },
  { id: 'u2', teacher: 'Mr. Ali Raza', subject: 'Physics', date: 'Tomorrow', time: '11:00 AM', countdown: 'tomorrow at 11 AM', status: 'pending' },
  { id: 'u3', teacher: 'Ms. Sana Tariq', subject: 'English', date: 'Tue, Oct 22', time: '10:00 AM', countdown: 'in 3 days', status: 'confirmed' },
];

type Filter = 'all' | 'mine' | 'open';

function initialsOf(name?: string) {
  if (!name) return '';
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatCountdown(mins: number): string {
  if (mins <= 0) return 'now';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `in ${m} min`;
  if (h < 24) return `in ${h}h${m > 0 ? ` ${m}m` : ''}`;
  const days = Math.round(h / 24);
  return `in ${days} day${days === 1 ? '' : 's'}`;
}

const DAY_LABELS: Record<string, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat',
};

// Convert the flat API slots array into the Record<string, SlotInfo> the
// component uses (keyed by `${Day}-${time}`).
function apiSlotsToMap(slots: PtmApiSlot[]): Record<string, SlotInfo> {
  const out: Record<string, SlotInfo> = {};
  for (const s of slots) {
    const day = DAY_LABELS[s.day] ?? s.day;
    const key = `${day}-${s.startTime}`;
    out[key] = {
      state: s.booked ? 'booked' : 'open',
      teacher: s.teacherName,
      parent: s.parentName,
      student: s.studentName,
      agenda: s.agenda,
      isMine: s.isMine,
    };
  }
  return out;
}

export default function PtmSchedulingModule() {
  const [slots, setSlots] = useState<Record<string, SlotInfo>>(INITIAL_SLOTS);
  const [upcomingItems, setUpcomingItems] = useState<UpcomingItem[]>(UPCOMING);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [bookingSlot, setBookingSlot] = useState<string | null>(null);
  const [detailSlot, setDetailSlot] = useState<string | null>(null);
  const [form, setForm] = useState({ parent: '', student: '', agenda: '' });

  // Fetch the weekly PTM slot grid from the API on mount. Falls back to
  // INITIAL_SLOTS + UPCOMING on error so the calendar is never empty.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSlotsLoading(true);
      try {
        const resp = await api.getPtmSlots();
        if (cancelled) return;
        if (resp.slots && resp.slots.length > 0) {
          setSlots(apiSlotsToMap(resp.slots));
        }
        if (resp.upcomingPtm) {
          const u = resp.upcomingPtm;
          const dayLabel = DAY_LABELS[u.day] ?? u.day;
          const upcomingItem: UpcomingItem = {
            id: u.id,
            teacher: u.teacherName,
            subject: u.agenda || 'Meeting',
            date: dayLabel,
            time: `${u.startTime}`,
            countdown: formatCountdown(u.countdownMinutes),
            status: 'confirmed',
          };
          setUpcomingItems((prev) => [upcomingItem, ...prev.filter((p) => p.id !== upcomingItem.id)].slice(0, 5));
        }
      } catch {
        // keep INITIAL_SLOTS + UPCOMING fallback
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const visible = useMemo(() => {
    return (key: string, info: SlotInfo | undefined) => {
      if (!info) return true; // open slot — show if filter is open or all
      if (filter === 'all') return true;
      if (filter === 'open') return info.state === 'open';
      if (filter === 'mine') return info.state === 'booked' && Boolean(info.isMine);
      return true;
    };
  }, [filter]);

  const counts = useMemo(() => {
    let open = 0, booked = 0, past = 0;
    for (const d of DAYS) for (const s of SLOTS) {
      const info = slots[`${d}-${s}`];
      if (!info || info.state === 'open') open += 1;
      else if (info.state === 'booked') booked += 1;
      else if (info.state === 'past') past += 1;
    }
    return { open, booked, past };
  }, [slots]);

  const stats = [
    { label: 'Open Slots', value: counts.open, tint: 'text-cyan-700 bg-cyan-500/10' },
    { label: 'Booked', value: counts.booked, tint: 'text-emerald-700 bg-emerald-500/10' },
    { label: 'Past', value: counts.past, tint: 'text-muted-foreground bg-muted' },
  ];

  const openBooking = (key: string) => {
    const info = slots[key];
    if (info?.state === 'booked') {
      setDetailSlot(key);
      return;
    }
    if (info?.state === 'past') return;
    setBookingSlot(key);
    setForm({ parent: '', student: '', agenda: '' });
  };

  const confirmBooking = () => {
    if (!bookingSlot) return;
    if (!form.parent.trim() || !form.student.trim()) {
      toast({ title: 'Missing info', description: 'Parent and student name are required.', variant: 'destructive' });
      return;
    }
    const day = bookingSlot.split('-')[0];
    setSlots((prev) => ({
      ...prev,
      [bookingSlot]: {
        state: 'booked',
        teacher: DEFAULT_TEACHERS[day] ?? 'Teacher',
        parent: form.parent.trim(),
        student: form.student.trim(),
        agenda: form.agenda.trim() || undefined,
        isMine: true,
      },
    }));
    setBookingSlot(null);
    toast({ title: 'PTM booked', description: `Meeting confirmed for ${bookingSlot.replace('-', ' ')}.` });
  };

  const cancelBooking = (key: string) => {
    setSlots((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setDetailSlot(null);
    toast({ title: 'Booking cancelled', description: `Slot ${key.replace('-', ' ')} is open again.` });
  };

  const syncCalendar = () => {
    toast({ title: 'Added to your Google Calendar', description: 'All confirmed PTMs synced.' });
  };

  const bookingInfo = bookingSlot ? slots[bookingSlot] : null;
  const bookingDay = bookingSlot?.split('-')[0] ?? '';
  const detailInfo = detailSlot ? slots[detailSlot] : null;

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="PTM Scheduling"
        subtitle="Book parent-teacher meetings with video calls, calendar invites, and automatic reminders"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={syncCalendar}>
              <CalendarPlus className="h-4 w-4 mr-1.5" /> Sync to Calendar
            </Button>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
              <Plus className="h-4 w-4 mr-1.5" /> Book PTM
            </Button>
          </div>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-2xl font-extrabold tabular-nums">{s.value}</div>
            </div>
            <Badge variant="outline" className={s.tint}>{s.label}</Badge>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4">
        {/* Weekly calendar */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-600" /> Week of Oct 21 – 26, 2025
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Tap any open slot to book</p>
            </div>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="mine" className="text-xs">Mine</TabsTrigger>
                <TabsTrigger value="open" className="text-xs">Open</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Calendar grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[640px] grid grid-cols-[80px_repeat(6,1fr)] gap-1.5">
              {/* Header row */}
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-1">Time</div>
              {DAYS.map((d) => (
                <div key={d} className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-1 text-center">
                  {d}
                </div>
              ))}

              {/* Slot rows */}
              {slotsLoading ? (
                <>
                  {SLOTS.map((slot) => (
                    <div key={slot} className="contents">
                      <div className="text-xs text-muted-foreground font-medium flex items-center pr-2 justify-end tabular-nums">{slot}</div>
                      {DAYS.map((d) => (
                        <Skeleton key={`${d}-${slot}`} className="min-h-[58px] rounded-lg" />
                      ))}
                    </div>
                  ))}
                </>
              ) : (
              SLOTS.map((slot) => (
                <SlotRow
                  key={slot}
                  slot={slot}
                  slots={slots}
                  visible={visible}
                  onSelect={openBooking}
                />
              ))
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-cyan-100 border border-cyan-500/40" /> Open</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-emerald-100 border border-emerald-500/40" /> Booked</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-muted border border-border" /> Past</span>
          </div>
        </Card>

        {/* Upcoming PTMs sidebar */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" /> Upcoming PTMs
            </h3>
            <Badge variant="outline" className="text-xs">{upcomingItems.length}</Badge>
          </div>
          <div className="space-y-2.5">
            {upcomingItems.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border p-3 hover:shadow-sm transition"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-teal-600 text-white text-xs">
                      {u.teacher.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{u.teacher}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{u.subject}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      u.status === 'confirmed'
                        ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-amber-700 bg-amber-500/10 border-amber-500/20'
                    }
                  >
                    {u.status === 'confirmed' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                    {u.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {u.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {u.time}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{u.countdown}</Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 h-8">
                    <Video className="h-3.5 w-3.5 mr-1.5" /> Join
                  </Button>
                  <Button size="sm" variant="ghost" className="flex-1 h-8 text-xs">
                    Agenda <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-border">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Quick Actions</div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs">
                <Video className="h-3.5 w-3.5 mr-1.5" /> Recordings
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs">
                <Users className="h-3.5 w-3.5 mr-1.5" /> Multi-teacher
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Booking Dialog */}
      <Dialog open={!!bookingSlot} onOpenChange={(o) => !o && setBookingSlot(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book PTM Slot</DialogTitle>
            <DialogDescription>
              {bookingSlot && `${bookingDay} · ${bookingSlot.split('-').slice(1).join(':')} — 30 minutes`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Teacher</label>
              <Input value={bookingInfo?.teacher ?? DEFAULT_TEACHERS[bookingDay] ?? 'Teacher'} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Parent name</label>
              <Input value={form.parent} onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))} placeholder="e.g. Mr. Khan" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Student name</label>
              <Input value={form.student} onChange={(e) => setForm((f) => ({ ...f, student: e.target.value }))} placeholder="e.g. Ayesha Khan · Grade 8-A" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Agenda</label>
              <Textarea
                value={form.agenda}
                onChange={(e) => setForm((f) => ({ ...f, agenda: e.target.value }))}
                placeholder="Topics you'd like to discuss…"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingSlot(null)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={confirmBooking}>
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Detail Sheet */}
      <Sheet open={!!detailSlot} onOpenChange={(o) => !o && setDetailSlot(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>PTM Booking</SheetTitle>
            <SheetDescription>{detailSlot?.replace('-', ' ')}</SheetDescription>
          </SheetHeader>
          {detailInfo && (
            <div className="px-4 pb-4 space-y-4 overflow-y-auto">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-teal-600 text-white">
                    {initialsOf(detailInfo.teacher)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-sm">{detailInfo.teacher}</div>
                  <div className="text-xs text-muted-foreground">{detailInfo.subject}</div>
                </div>
              </div>
              <div className="rounded-xl border border-border p-4 space-y-2.5 text-sm">
                <DetailRow label="Parent" value={detailInfo.parent ?? '—'} />
                <DetailRow label="Student" value={detailInfo.student ?? '—'} />
                <DetailRow label="Agenda" value={detailInfo.agenda ?? 'No agenda set.'} />
                <DetailRow label="Status" value={detailInfo.state === 'booked' ? 'Confirmed' : detailInfo.state} />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Video className="h-4 w-4 mr-1.5" /> Join Video Call
                </Button>
              </div>
            </div>
          )}
          <SheetFooter>
            <Button variant="outline" onClick={() => setDetailSlot(null)}>Close</Button>
            <Button variant="destructive" onClick={() => detailSlot && cancelBooking(detailSlot)}>
              <X className="h-4 w-4 mr-1.5" /> Cancel Booking
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground text-xs shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function SlotRow({
  slot,
  slots,
  visible,
  onSelect,
}: {
  slot: string;
  slots: Record<string, SlotInfo>;
  visible: (key: string, info: SlotInfo | undefined) => boolean;
  onSelect: (key: string) => void;
}) {
  return (
    <>
      <div className="text-xs text-muted-foreground font-medium flex items-center pr-2 justify-end tabular-nums">
        {slot}
      </div>
      {DAYS.map((d) => {
        const key = `${d}-${slot}`;
        const info = slots[key];
        const state: SlotState = info?.state ?? 'open';
        const show = visible(key, info);
        const base =
          'min-h-[58px] rounded-lg border p-2 text-[11px] transition cursor-pointer flex flex-col justify-between';
        const cls =
          state === 'past'
            ? 'bg-muted/40 border-border text-muted-foreground/70 cursor-not-allowed'
            : state === 'booked'
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/15'
            : 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-500/25 hover:bg-cyan-100 dark:hover:bg-cyan-500/15';

        if (!show) {
          return (
            <div key={key} className="min-h-[58px] rounded-lg border border-dashed border-border/60 bg-transparent opacity-40" />
          );
        }

        return (
          <motion.button
            layout
            key={key}
            onClick={() => onSelect(key)}
            className={`${base} ${cls}`}
            title={info ? `${info.teacher} · ${info.subject ?? ''}` : 'Open slot'}
          >
            {state === 'open' ? (
              <div className="text-cyan-700/70 dark:text-cyan-300/70 text-[10px] flex items-center gap-1">
                <Plus className="h-3 w-3" /> Open
              </div>
            ) : (
              <>
                <div className="font-medium leading-tight truncate flex items-center gap-1">
                  {state === 'booked' && info?.parent && (
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="bg-emerald-600 text-white text-[8px]">
                        {initialsOf(info.parent)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span className="truncate">{info?.teacher}</span>
                </div>
                <div className="text-[10px] truncate text-muted-foreground">
                  {info?.subject}
                </div>
                {state === 'booked' && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Video className="h-3 w-3 text-emerald-600" />
                  </div>
                )}
              </>
            )}
          </motion.button>
        );
      })}
    </>
  );
}
