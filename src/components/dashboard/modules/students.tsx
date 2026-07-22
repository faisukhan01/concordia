'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api, type Student } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Search, UserPlus, Download, Filter, Users, GraduationCap, DollarSign, TrendingUp, Mail, Phone,
} from 'lucide-react';

const feeColor: Record<string, string> = {
  Paid: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
  Pending: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  Overdue: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
  Partial: 'text-violet-600 bg-violet-500/10 border-violet-500/20',
};
const avatarBg: Record<string, string> = {
  emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500',
  violet: 'bg-violet-500', cyan: 'bg-cyan-500', orange: 'bg-orange-500',
};

export function StudentsModule({ mode = 'admission' }: { mode?: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [q, setQ] = useState('');
  const [cls, setCls] = useState('All');
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Student | null>(null);

  useEffect(() => {
    let active = true;
    api.students(q)
      .then(d => { if (active) { setStudents(d.students); setLoading(false); } })
      .catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [q]);

  const filtered = students.filter(s =>
    (cls === 'All' || s.class === cls) &&
    (status === 'All' || s.feeStatus === status)
  );

  const stats = [
    { label: 'Total Admitted', value: students.length, icon: Users, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Active', value: students.filter(s => s.status === 'Active').length, icon: GraduationCap, color: 'from-teal-500 to-cyan-600' },
    { label: 'Fee Paid', value: students.filter(s => s.feeStatus === 'Paid').length, icon: DollarSign, color: 'from-amber-500 to-yellow-600' },
    { label: 'Avg GPA', value: (students.reduce((a,s)=>a+s.gpa,0)/Math.max(students.length,1)).toFixed(2), icon: TrendingUp, color: 'from-violet-500 to-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Admission Management"
        subtitle="Complete student records, sibling tracking, ID cards & certificates"
        actions={<>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" /> Export</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"><UserPlus className="h-4 w-4 mr-1.5" /> New Admission</Button>
        </>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4 relative overflow-hidden">
              <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${s.color} opacity-10 blur-2xl`} />
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.color} grid place-items-center mb-3`}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-extrabold font-display">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, ID, roll no…" className="pl-9" />
          </div>
          <Select value={cls} onValueChange={setCls}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              {['All','Pre-K','KG','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Fee status" /></SelectTrigger>
            <SelectContent>
              {['All','Paid','Pending','Overdue','Partial'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="sm:w-auto"><Filter className="h-4 w-4 mr-1.5" /> More</Button>
        </div>

        <div className="rounded-lg border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[60px]">ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="hidden md:table-cell">Guardian</TableHead>
                <TableHead className="hidden lg:table-cell">Attendance</TableHead>
                <TableHead>GPA</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({length: 6}).map((_,i) => (
                  <TableRow key={i}>
                    {Array.from({length: 8}).map((_,j) => <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>)}
                  </TableRow>
                ))
              ) : filtered.slice(0, 20).map(st => (
                <TableRow key={st.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelected(st)}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{st.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8"><AvatarFallback className={`${avatarBg[st.avatarColor]} text-white text-xs font-bold`}>{st.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</AvatarFallback></Avatar>
                      <div>
                        <div className="font-medium text-sm">{st.name}</div>
                        <div className="text-[11px] text-muted-foreground">{st.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="font-normal">{st.class} · {st.section}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{st.guardian}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${st.attendance >= 90 ? 'bg-emerald-500' : st.attendance >= 80 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${st.attendance}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{st.attendance}%</span>
                    </div>
                  </TableCell>
                  <TableCell><span className={`font-bold text-sm ${st.gpa >= 3.5 ? 'text-emerald-600' : st.gpa >= 3.0 ? 'text-amber-600' : 'text-rose-600'}`}>{st.gpa.toFixed(2)}</span></TableCell>
                  <TableCell><Badge variant="outline" className={`font-normal ${feeColor[st.feeStatus]}`}>{st.feeStatus}</Badge></TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={(e)=>{e.stopPropagation(); setSelected(st);}}>View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <span>Showing {Math.min(20, filtered.length)} of {filtered.length} students</span>
          <span>Page 1 of {Math.max(1, Math.ceil(filtered.length / 20))}</span>
        </div>
      </Card>

      {selected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50" onClick={() => setSelected(null)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-md">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16"><AvatarFallback className={`${avatarBg[selected.avatarColor]} text-white text-xl font-bold`}>{selected.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</AvatarFallback></Avatar>
                <div>
                  <h3 className="font-display font-bold text-lg">{selected.name}</h3>
                  <p className="text-sm text-muted-foreground">{selected.id} · {selected.class} {selected.section}</p>
                  <Badge variant="outline" className={`mt-1 ${feeColor[selected.feeStatus]}`}>{selected.feeStatus}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
                <Info label="Roll No" value={selected.rollNo} />
                <Info label="Gender" value={selected.gender} />
                <Info label="City" value={selected.city} />
                <Info label="Enrolled" value={selected.enrolledOn} />
                <Info label="Attendance" value={`${selected.attendance}%`} />
                <Info label="GPA" value={selected.gpa.toFixed(2)} />
                <Info label="Fee Amount" value={`$${selected.feeAmount}`} />
                <Info label="Fee Paid" value={`$${selected.feePaid}`} />
              </div>
              <div className="mt-4 space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {selected.email}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {selected.phone}</div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1">Edit Record</Button>
                <Button size="sm" variant="outline" className="flex-1">Print ID Card</Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2.5">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-medium text-sm mt-0.5">{value}</div>
    </div>
  );
}

export function ModuleHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
