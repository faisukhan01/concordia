'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { ModuleHeader } from './students';
import {
  HeartPulse, Droplet, Ruler, Weight, Activity, ShieldAlert,
  Syringe, Stethoscope, Phone, Plus, TrendingUp, TrendingDown, Calendar,
  Brain, Bandage, Thermometer, Pill, FileDown, X,
} from 'lucide-react';

type Student = { id: string; name: string; className: string; rollNo: string };

const STUDENTS: Student[] = [
  { id: 's1', name: 'Ayesha Khan', className: 'Grade 8 · A', rollNo: 'AGR-8-A-12' },
  { id: 's2', name: 'Hamza Tariq', className: 'Grade 9 · B', rollNo: 'AGR-9-B-07' },
  { id: 's3', name: 'Zainab Ali', className: 'Grade 10 · A', rollNo: 'AGR-10-A-21' },
  { id: 's4', name: 'Bilal Raza', className: 'Grade 7 · C', rollNo: 'AGR-7-C-04' },
];

type Severity = 'high' | 'medium' | 'low';
type Allergy = { id: string; label: string; severity: Severity };

type Vaccination = { id: string; name: string; date: string; next?: string };

type InfirmaryReason = 'headache' | 'injury' | 'fever' | 'stomach' | 'other';
type InfirmaryVisit = {
  id: string;
  date: string;
  reason: string;
  reasonType: InfirmaryReason;
  treatment: string;
  staff: string;
};

type Medication = { id: string; name: string; dose: string; startDate: string; notes?: string };

type EmergencyContact = { id: string; name: string; relationship: string; phone: string };

const INITIAL_ALLERGIES: Record<string, Allergy[]> = {
  s1: [
    { id: 'a1', label: 'Peanuts', severity: 'high' },
    { id: 'a2', label: 'Pollen', severity: 'medium' },
  ],
  s2: [{ id: 'a1', label: 'Dust', severity: 'low' }],
  s3: [{ id: 'a1', label: 'Penicillin', severity: 'high' }],
  s4: [],
};

const INITIAL_VACCINATIONS: Record<string, Vaccination[]> = {
  s1: [
    { id: 'v1', name: 'BCG', date: '2014-03-12' },
    { id: 'v2', name: 'OPV (3 doses)', date: '2015-02-08' },
    { id: 'v3', name: 'MMR', date: '2017-09-20', next: '2027-04-20' },
    { id: 'v4', name: 'COVID-19 (2 doses)', date: '2022-06-15' },
  ],
  s2: [
    { id: 'v1', name: 'BCG', date: '2013-05-22' },
    { id: 'v2', name: 'OPV (3 doses)', date: '2014-04-10' },
    { id: 'v3', name: 'MMR', date: '2016-11-15', next: '2026-05-15' },
  ],
  s3: [
    { id: 'v1', name: 'BCG', date: '2012-08-08' },
    { id: 'v2', name: 'MMR', date: '2016-01-18' },
    { id: 'v3', name: 'Typhoid', date: '2020-03-05' },
  ],
  s4: [
    { id: 'v1', name: 'BCG', date: '2015-11-12' },
    { id: 'v2', name: 'OPV (3 doses)', date: '2016-10-04' },
  ],
};

const INITIAL_INFIRMARY: Record<string, InfirmaryVisit[]> = {
  s1: [
    { id: 'i1', date: 'Oct 12, 2025', reason: 'Headache', reasonType: 'headache', treatment: 'Paracetamol + rest 30 min', staff: 'Nurse Saima' },
    { id: 'i2', date: 'Sep 28, 2025', reason: 'Minor scrape (playground)', reasonType: 'injury', treatment: 'Antiseptic + bandage', staff: 'Nurse Saima' },
  ],
  s2: [
    { id: 'i1', date: 'Oct 03, 2025', reason: 'Stomachache', reasonType: 'stomach', treatment: 'Antacid + observation', staff: 'Nurse Rabia' },
  ],
  s3: [],
  s4: [
    { id: 'i1', date: 'Sep 19, 2025', reason: 'Fever (38.4°C)', reasonType: 'fever', treatment: 'Sent home · Parent notified', staff: 'Nurse Saima' },
  ],
};

const INITIAL_MEDICATIONS: Record<string, Medication[]> = {
  s1: [{ id: 'm1', name: 'Paracetamol', dose: '500 mg · as needed', startDate: 'Oct 12, 2025', notes: 'For headache' }],
  s2: [],
  s3: [{ id: 'm1', name: 'Inhaler (Salbutamol)', dose: '2 puffs · PRN', startDate: 'Sep 01, 2025', notes: 'Mild asthma' }],
  s4: [],
};

const PHYSICAL: Record<string, { bloodGroup: string; heightCm: number; weightKg: number; bmiPrev: number }> = {
  s1: { bloodGroup: 'B+', heightCm: 158, weightKg: 48, bmiPrev: 18.9 },
  s2: { bloodGroup: 'O+', heightCm: 167, weightKg: 58, bmiPrev: 20.5 },
  s3: { bloodGroup: 'A+', heightCm: 162, weightKg: 52, bmiPrev: 19.8 },
  s4: { bloodGroup: 'AB+', heightCm: 142, weightKg: 36, bmiPrev: 17.6 },
};

const EMERGENCY_CONTACTS: Record<string, EmergencyContact[]> = {
  s1: [
    { id: 'e1', name: 'Mrs. Saima Khan', relationship: 'Mother', phone: '+92 300 1234567' },
    { id: 'e2', name: 'Mr. Yousaf Khan', relationship: 'Father', phone: '+92 301 7654321' },
    { id: 'e3', name: 'Dr. Imran Clinic', relationship: 'Family physician', phone: '+92 42 3555 1010' },
  ],
  s2: [
    { id: 'e1', name: 'Mrs. Rabia Tariq', relationship: 'Mother', phone: '+92 302 9876543' },
    { id: 'e2', name: 'Mr. Tariq Mehmood', relationship: 'Father', phone: '+92 303 5550100' },
  ],
  s3: [
    { id: 'e1', name: 'Mrs. Ali Saima', relationship: 'Mother', phone: '+92 311 4442020' },
    { id: 'e2', name: 'Mr. Ali Hassan', relationship: 'Father', phone: '+92 321 8883030' },
  ],
  s4: [
    { id: 'e1', name: 'Mrs. Raza Fatima', relationship: 'Mother', phone: '+92 333 9090909' },
    { id: 'e2', name: 'Mr. Raza Bilal', relationship: 'Father', phone: '+92 345 1212121' },
  ],
};

function bmi(h: number, w: number) {
  const m = h / 100;
  return +(w / (m * m)).toFixed(1);
}
function bmiCategory(v: number) {
  if (v < 18.5) return { label: 'Underweight', cls: 'text-amber-700 bg-amber-500/10' };
  if (v < 25) return { label: 'Normal', cls: 'text-emerald-700 bg-emerald-500/10' };
  if (v < 30) return { label: 'Overweight', cls: 'text-amber-700 bg-amber-500/10' };
  return { label: 'Obese', cls: 'text-rose-700 bg-rose-500/10' };
}

const sevMeta: Record<Severity, { cls: string; label: string }> = {
  high: { cls: 'text-rose-700 bg-rose-500/15 border-rose-500/30', label: 'High' },
  medium: { cls: 'text-amber-700 bg-amber-500/15 border-amber-500/30', label: 'Medium' },
  low: { cls: 'text-emerald-700 bg-emerald-500/15 border-emerald-500/30', label: 'Low' },
};

const reasonIcon: Record<InfirmaryReason, { Icon: typeof Brain; tint: string }> = {
  headache: { Icon: Brain, tint: 'bg-violet-500/15 text-violet-700 dark:text-violet-300' },
  injury: { Icon: Bandage, tint: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  fever: { Icon: Thermometer, tint: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  stomach: { Icon: Activity, tint: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  other: { Icon: Stethoscope, tint: 'bg-primary/15 text-primary' },
};

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr).getTime();
  const today = new Date('2025-10-20').getTime();
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function formatCountdown(days: number): string {
  if (days <= 0) return 'Overdue';
  if (days < 30) return `in ${days} day${days === 1 ? '' : 's'}`;
  if (days < 365) return `in ${Math.round(days / 30)} month${Math.round(days / 30) === 1 ? '' : 's'}`;
  return `in ${Math.round(days / 365)} year${Math.round(days / 365) === 1 ? '' : 's'}`;
}

type AddType = 'allergy' | 'vaccination' | 'infirmary' | 'medication';

const ADD_TYPES: { value: AddType; label: string }[] = [
  { value: 'allergy', label: 'Allergy' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'infirmary', label: 'Infirmary Visit' },
  { value: 'medication', label: 'Medication' },
];

let idCounter = 100;
function nextId() {
  idCounter += 1;
  return `r-${idCounter}`;
}

export default function HealthRecordsModule() {
  const [studentId, setStudentId] = useState<string>('s1');
  const [allergies, setAllergies] = useState<Record<string, Allergy[]>>(INITIAL_ALLERGIES);
  const [vaccinations, setVaccinations] = useState<Record<string, Vaccination[]>>(INITIAL_VACCINATIONS);
  const [infirmary, setInfirmary] = useState<Record<string, InfirmaryVisit[]>>(INITIAL_INFIRMARY);
  const [medications, setMedications] = useState<Record<string, Medication[]>>(INITIAL_MEDICATIONS);
  const [physical, setPhysical] = useState<Record<string, { bloodGroup: string; heightCm: number; weightKg: number; bmiPrev: number }>>(PHYSICAL);
  const [emergencyContacts, setEmergencyContacts] = useState<Record<string, EmergencyContact[]>>(EMERGENCY_CONTACTS);
  const [healthLoading, setHealthLoading] = useState(true);
  const [firstLoadComplete, setFirstLoadComplete] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<AddType>('allergy');
  const [confirmRemove, setConfirmRemove] = useState<{ kind: 'allergy'; id: string } | null>(null);

  // Fetch the active student's health record from the API whenever the
  // student changes. Falls back to the existing INITIAL_* mock data on error
  // so the UI is never empty.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setHealthLoading(true);
      try {
        const resp = await api.getHealthRecords(studentId);
        if (cancelled) return;
        setPhysical((p) => ({
          ...p,
          [studentId]: {
            bloodGroup: resp.student.bloodGroup,
            heightCm: resp.student.height,
            weightKg: resp.student.weight,
            bmiPrev: resp.student.bmiPrev,
          },
        }));
        setAllergies((p) => ({
          ...p,
          [studentId]: resp.allergies.map((a) => ({ id: a.id, label: a.name, severity: a.severity })),
        }));
        setVaccinations((p) => ({
          ...p,
          [studentId]: resp.vaccinations.map((v) => ({ id: v.id, name: v.name, date: v.dateGiven, next: v.nextDue })),
        }));
        setInfirmary((p) => ({
          ...p,
          [studentId]: resp.infirmaryVisits.map((v) => ({
            id: v.id, date: v.date, reason: v.reason, reasonType: v.reasonType,
            treatment: v.treatment, staff: v.attendedBy,
          })),
        }));
        setMedications((p) => ({
          ...p,
          [studentId]: resp.medications.map((m) => ({
            id: m.id, name: m.drugName, dose: m.dose, startDate: m.startDate, notes: m.notes,
          })),
        }));
        setEmergencyContacts((p) => ({
          ...p,
          [studentId]: resp.emergencyContacts.map((c) => ({
            id: c.id, name: c.name, relationship: c.relationship, phone: c.phone,
          })),
        }));
      } catch {
        // keep existing INITIAL_* fallback data for this student
      } finally {
        if (!cancelled) {
          setHealthLoading(false);
          setFirstLoadComplete(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  // form fields (reused across types — only the relevant ones are used per type)
  const [form, setForm] = useState<{
    label: string; severity: Severity;
    vname: string; vdate: string; vnext: string;
    reason: string; reasonType: InfirmaryReason; treatment: string; staff: string; idate: string;
    mname: string; dose: string; mstart: string; mnotes: string;
  }>({
    label: '', severity: 'medium',
    vname: '', vdate: '', vnext: '',
    reason: '', reasonType: 'headache', treatment: '', staff: '', idate: '',
    mname: '', dose: '', mstart: '', mnotes: '',
  });

  const student = STUDENTS.find((s) => s.id === studentId) ?? STUDENTS[0];
  const phys = physical[studentId] ?? { bloodGroup: 'O+', heightCm: 165, weightKg: 58, bmiPrev: 21.0 };
  const bmiVal = bmi(phys.heightCm, phys.weightKg);
  const bmiCat = bmiCategory(bmiVal);
  const bmiDelta = +(bmiVal - phys.bmiPrev).toFixed(1);
  const bmiUp = bmiDelta > 0;
  const myAllergies = allergies[studentId] ?? [];
  const myVaccinations = vaccinations[studentId] ?? [];
  const myInfirmary = infirmary[studentId] ?? [];
  const myMedications = medications[studentId] ?? [];
  const myContacts = emergencyContacts[studentId] ?? [];

  // Find the next-due vaccination (earliest upcoming `next` date).
  const dueNext = useMemo(() => {
    const upcoming = myVaccinations
      .filter((v) => v.next)
      .map((v) => ({ ...v, days: daysUntil(v.next!) }))
      .sort((a, b) => a.days - b.days);
    return upcoming[0] ?? null;
  }, [myVaccinations]);

  const stats = [
    { label: 'Blood Group', value: phys.bloodGroup, icon: Droplet, tint: 'from-rose-500 to-pink-600' },
    { label: 'Height', value: `${phys.heightCm} cm`, icon: Ruler, tint: 'from-primary to-primary/80' },
    { label: 'Weight', value: `${phys.weightKg} kg`, icon: Weight, tint: 'from-amber-500 to-yellow-600' },
    { label: 'BMI', value: `${bmiVal}`, icon: Activity, tint: 'from-emerald-500 to-teal-600', sub: bmiCat.label, delta: bmiDelta },
  ];

  const resetForm = () => {
    setForm({
      label: '', severity: 'medium',
      vname: '', vdate: '', vnext: '',
      reason: '', reasonType: 'headache', treatment: '', staff: '', idate: '',
      mname: '', dose: '', mstart: '', mnotes: '',
    });
  };

  const openAdd = () => {
    setAddType('allergy');
    resetForm();
    setAddOpen(true);
  };

  const submitAdd = () => {
    if (addType === 'allergy') {
      if (!form.label.trim()) { toast({ title: 'Allergy name required', variant: 'destructive' }); return; }
      const a: Allergy = { id: nextId(), label: form.label.trim(), severity: form.severity };
      setAllergies((p) => ({ ...p, [studentId]: [a, ...(p[studentId] ?? [])] }));
      toast({ title: 'Allergy added', description: `${a.label} flagged as ${sevMeta[a.severity].label.toLowerCase()} severity.` });
    } else if (addType === 'vaccination') {
      if (!form.vname.trim() || !form.vdate.trim()) { toast({ title: 'Vaccine name & date required', variant: 'destructive' }); return; }
      const v: Vaccination = { id: nextId(), name: form.vname.trim(), date: form.vdate, next: form.vnext.trim() || undefined };
      setVaccinations((p) => ({ ...p, [studentId]: [v, ...(p[studentId] ?? [])] }));
      toast({ title: 'Vaccination recorded', description: `${v.name} added to history.` });
    } else if (addType === 'infirmary') {
      if (!form.reason.trim() || !form.idate.trim()) { toast({ title: 'Reason & date required', variant: 'destructive' }); return; }
      const visit: InfirmaryVisit = {
        id: nextId(),
        date: form.idate,
        reason: form.reason.trim(),
        reasonType: form.reasonType,
        treatment: form.treatment.trim() || 'Observation',
        staff: form.staff.trim() || 'Nurse on duty',
      };
      setInfirmary((p) => ({ ...p, [studentId]: [visit, ...(p[studentId] ?? [])] }));
      toast({ title: 'Infirmary visit logged', description: `${visit.reason} on ${visit.date}.` });
    } else if (addType === 'medication') {
      if (!form.mname.trim() || !form.dose.trim()) { toast({ title: 'Drug name & dose required', variant: 'destructive' }); return; }
      const m: Medication = {
        id: nextId(),
        name: form.mname.trim(),
        dose: form.dose.trim(),
        startDate: form.mstart || new Date().toISOString().slice(0, 10),
        notes: form.mnotes.trim() || undefined,
      };
      setMedications((p) => ({ ...p, [studentId]: [m, ...(p[studentId] ?? [])] }));
      toast({ title: 'Medication added', description: `${m.name} (${m.dose}) on file.` });
    }
    setAddOpen(false);
  };

  const removeAllergy = (id: string) => {
    setAllergies((p) => ({ ...p, [studentId]: (p[studentId] ?? []).filter((a) => a.id !== id) }));
    setConfirmRemove(null);
    toast({ title: 'Allergy removed', description: 'Record updated.' });
  };

  const callContact = (c: EmergencyContact) => {
    toast({ title: `Calling ${c.name}`, description: `${c.relationship} · ${c.phone}` });
  };

  const downloadPdf = () => {
    toast({ title: 'Generating PDF…', description: `Compiling ${student.name}'s medical history.` });
    setTimeout(() => {
      toast({ title: 'Downloaded', description: `medical-history-${student.rollNo}.pdf saved.` });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Health Records"
        subtitle="Student health & wellness — medical history, allergy alerts, vaccinations, and infirmary visits"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={downloadPdf}>
              <FileDown className="h-4 w-4 mr-1.5" /> Medical History
            </Button>
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Record
            </Button>
          </div>
        }
      />

      {/* Student selector */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-11 w-11">
              <AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-600 text-white">
                {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm truncate">{student.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {student.className} · Roll {student.rollNo}
              </div>
            </div>
          </div>
          <div className="w-full sm:w-72">
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {STUDENTS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · {s.className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Stat cards with gradient backgrounds + hover lift */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {healthLoading && !firstLoadComplete ? (
          <>
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} className="p-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="mt-3 h-7 w-20" />
                <Skeleton className="mt-2 h-3 w-24" />
              </Card>
            ))}
          </>
        ) : (
        stats.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
              <Card className="p-4 relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${c.tint} opacity-[0.06]`} />
                <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${c.tint} opacity-20 blur-2xl`} />
                <div className="relative flex items-center justify-between">
                  <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${c.tint} grid place-items-center`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  {'sub' in c && c.sub ? (
                    <Badge variant="outline" className={bmiCat.cls}>{c.sub}</Badge>
                  ) : null}
                </div>
                <div className="relative mt-3 text-2xl font-extrabold tabular-nums flex items-center gap-2">
                  {c.value}
                  {'delta' in c && c.delta !== undefined && c.delta !== 0 && (
                    <span className={`text-xs font-semibold flex items-center gap-0.5 ${bmiUp ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {bmiUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {bmiUp ? '+' : ''}{c.delta}
                    </span>
                  )}
                </div>
                <div className="relative text-xs text-muted-foreground">{c.label}</div>
              </Card>
            </motion.div>
          );
        })
        )}
      </div>

      {/* Due Next + Allergies + Medications */}
      <div className="grid lg:grid-cols-[1fr_1fr_1fr] gap-4">
        {/* Due Next vaccination card */}
        <Card className="p-5 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-600" /> Due Next
            </h3>
            <Badge variant="outline" className="text-amber-700 bg-amber-500/10 border-amber-500/20">
              Reminder
            </Badge>
          </div>
          {dueNext ? (
            <div>
              <div className="text-lg font-bold">{dueNext.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Booster · scheduled {dueNext.next}</div>
              <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                <div className="text-xs text-amber-700 dark:text-amber-300">Countdown</div>
                <div className="text-xl font-extrabold text-amber-700 dark:text-amber-300 tabular-nums">
                  {formatCountdown(dueNext.days)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {dueNext.days > 0 ? `${dueNext.days} days remaining` : 'Schedule ASAP'}
                </div>
              </div>
              <Button size="sm" variant="outline" className="mt-3 w-full h-8">
                <Calendar className="h-3.5 w-3.5 mr-1.5" /> Schedule Appointment
              </Button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-4 text-center">
              No upcoming vaccinations.
            </div>
          )}
        </Card>

        {/* Allergies */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600" /> Allergy Alerts
            </h3>
            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => { setAddType('allergy'); resetForm(); setAddOpen(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </div>
          {myAllergies.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center bg-muted/30 rounded-lg">
              No known allergies on file.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {myAllergies.map((a) => {
                const sev = sevMeta[a.severity];
                return (
                  <Badge key={a.id} variant="outline" className={`px-3 py-1.5 text-xs ${sev.cls} gap-1.5`}>
                    <ShieldAlert className="h-3 w-3" />
                    {a.label}
                    <span className="opacity-70">· {sev.label}</span>
                    <button
                      onClick={() => setConfirmRemove({ kind: 'allergy', id: a.id })}
                      className="ml-1 -mr-1 hover:bg-rose-500/20 rounded p-0.5"
                      aria-label={`Remove ${a.label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Emergency Contact
            </div>
            {myContacts[0] && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-rose-500/10 grid place-items-center">
                  <Phone className="h-4 w-4 text-rose-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{myContacts[0].name} ({myContacts[0].relationship})</div>
                  <div className="text-xs text-muted-foreground">{myContacts[0].phone}</div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Medications */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Pill className="h-4 w-4 text-violet-600" /> Current Medications
            </h3>
            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => { setAddType('medication'); resetForm(); setAddOpen(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </div>
          {myMedications.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center bg-muted/30 rounded-lg">
              No active medications.
            </div>
          ) : (
            <div className="space-y-2">
              {myMedications.map((m) => (
                <div key={m.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/40 transition">
                  <div className="h-7 w-7 rounded-md bg-violet-500/15 grid place-items-center shrink-0 mt-0.5">
                    <Pill className="h-3.5 w-3.5 text-violet-700 dark:text-violet-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{m.name}</div>
                    <div className="text-[11px] text-muted-foreground">{m.dose}</div>
                    {m.notes && <div className="text-[10px] text-muted-foreground mt-0.5">{m.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Vaccinations */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Syringe className="h-4 w-4 text-primary" /> Vaccination Record
          </h3>
          <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => { setAddType('vaccination'); resetForm(); setAddOpen(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {myVaccinations.map((v) => (
            <div key={v.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/40 transition">
              <div className="h-7 w-7 rounded-md bg-primary/10 grid place-items-center shrink-0 mt-0.5">
                <Syringe className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{v.name}</div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Administered {v.date}
                </div>
                {v.next && (
                  <div className="text-[10px] text-amber-700 mt-0.5 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Next: {v.next}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Infirmary visits timeline */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-rose-600" /> Infirmary Visits
          </h3>
          <Button size="sm" variant="outline" className="h-8" onClick={() => { setAddType('infirmary'); resetForm(); setAddOpen(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Log Visit
          </Button>
        </div>
        {myInfirmary.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center bg-muted/30 rounded-lg flex flex-col items-center gap-2">
            <HeartPulse className="h-8 w-8 text-muted-foreground/50" />
            <div>No infirmary visits on record — this student is healthy!</div>
          </div>
        ) : (
          <ol className="relative border-l-2 border-border/60 ml-3 space-y-5 pl-6">
            {myInfirmary.map((v, i) => {
              const meta = reasonIcon[v.reasonType];
              const Icon = meta.Icon;
              return (
                <motion.li
                  key={v.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative"
                >
                  <span className={`absolute -left-[34px] top-1 h-7 w-7 rounded-full grid place-items-center ring-4 ring-card ${meta.tint}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">{v.reason}</span>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">{v.date}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">Treatment:</span> {v.treatment}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Attended by {v.staff}
                  </div>
                </motion.li>
              );
            })}
          </ol>
        )}
      </Card>

      {/* Emergency Contacts */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Phone className="h-4 w-4 text-rose-600" /> Emergency Contacts
          </h3>
          <Badge variant="outline" className="text-xs">{myContacts.length} on file</Badge>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {myContacts.map((c) => (
            <div key={c.id} className="rounded-xl border border-border p-3 flex items-center gap-3 hover:shadow-sm transition">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-600 text-white text-xs">
                  {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate">{c.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">{c.relationship} · {c.phone}</div>
              </div>
              <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => callContact(c)}>
                <Phone className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Add Record Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Health Record</DialogTitle>
            <DialogDescription>Append to {student.name}&rsquo;s medical history. Record is prepended to the relevant section.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Record type</label>
              <Select value={addType} onValueChange={(v) => { setAddType(v as AddType); resetForm(); }}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ADD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {addType === 'allergy' && (
              <>
                <Field label="Allergen">
                  <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="e.g. Peanuts" />
                </Field>
                <Field label="Severity">
                  <Select value={form.severity} onValueChange={(v) => setForm((f) => ({ ...f, severity: v as Severity }))}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}

            {addType === 'vaccination' && (
              <>
                <Field label="Vaccine name">
                  <Input value={form.vname} onChange={(e) => setForm((f) => ({ ...f, vname: e.target.value }))} placeholder="e.g. MMR Booster" />
                </Field>
                <Field label="Date administered">
                  <Input type="date" value={form.vdate} onChange={(e) => setForm((f) => ({ ...f, vdate: e.target.value }))} />
                </Field>
                <Field label="Next due (optional)">
                  <Input type="date" value={form.vnext} onChange={(e) => setForm((f) => ({ ...f, vnext: e.target.value }))} />
                </Field>
              </>
            )}

            {addType === 'infirmary' && (
              <>
                <Field label="Visit date">
                  <Input type="date" value={form.idate} onChange={(e) => setForm((f) => ({ ...f, idate: e.target.value }))} />
                </Field>
                <Field label="Reason type">
                  <Select value={form.reasonType} onValueChange={(v) => setForm((f) => ({ ...f, reasonType: v as InfirmaryReason }))}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="headache">Headache</SelectItem>
                      <SelectItem value="injury">Injury</SelectItem>
                      <SelectItem value="fever">Fever</SelectItem>
                      <SelectItem value="stomach">Stomach</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Reason detail">
                  <Input value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="e.g. Headache during class" />
                </Field>
                <Field label="Treatment">
                  <Textarea value={form.treatment} onChange={(e) => setForm((f) => ({ ...f, treatment: e.target.value }))} rows={2} placeholder="What was given / done" />
                </Field>
                <Field label="Attended by">
                  <Input value={form.staff} onChange={(e) => setForm((f) => ({ ...f, staff: e.target.value }))} placeholder="Nurse name" />
                </Field>
              </>
            )}

            {addType === 'medication' && (
              <>
                <Field label="Drug name">
                  <Input value={form.mname} onChange={(e) => setForm((f) => ({ ...f, mname: e.target.value }))} placeholder="e.g. Paracetamol" />
                </Field>
                <Field label="Dose">
                  <Input value={form.dose} onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))} placeholder="e.g. 500 mg · twice daily" />
                </Field>
                <Field label="Start date">
                  <Input type="date" value={form.mstart} onChange={(e) => setForm((f) => ({ ...f, mstart: e.target.value }))} />
                </Field>
                <Field label="Notes (optional)">
                  <Textarea value={form.mnotes} onChange={(e) => setForm((f) => ({ ...f, mnotes: e.target.value }))} rows={2} />
                </Field>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={submitAdd}>
              <Plus className="h-4 w-4 mr-1.5" /> Save Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Dialog */}
      <AlertDialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove allergy?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the allergy record. The student&rsquo;s parents will be notified of the change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => confirmRemove && removeAllergy(confirmRemove.id)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
