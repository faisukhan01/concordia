'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModuleHeader } from './students';
import { MessageCircleWarning, AlertCircle, CheckCircle2, Clock, Send, MessageSquare, Plus } from 'lucide-react';

const statusStyle: Record<string, string> = {
  Open: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
  'In Progress': 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  Resolved: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
  Closed: 'text-slate-600 bg-slate-500/10 border-slate-500/20',
};
const priorityStyle: Record<string, string> = {
  High: 'text-rose-600 bg-rose-500/10',
  Medium: 'text-amber-600 bg-amber-500/10',
  Low: 'text-emerald-600 bg-emerald-500/10',
};

export function ComplaintsModule() {
  const [complaints, setComplaints] = useState<any[]>([]);

  useEffect(() => { api.complaints().then(setComplaints).catch(()=>{}); }, []);

  const open = complaints.filter(c => c.status === 'Open').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress').length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;

  const cards = [
    { label: 'Total Complaints', value: complaints.length, icon: MessageCircleWarning, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Open', value: open, icon: AlertCircle, color: 'from-rose-500 to-red-600' },
    { label: 'In Progress', value: inProgress, icon: Clock, color: 'from-amber-500 to-yellow-600' },
    { label: 'Resolved', value: resolved, icon: CheckCircle2, color: 'from-teal-500 to-cyan-600' },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Complaint Management"
        subtitle="Two-way communication — parents track status, staff resolve fast"
        actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"><Plus className="h-4 w-4 mr-1.5" /> New Complaint</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4 relative overflow-hidden">
              <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${c.color} opacity-10 blur-2xl`} />
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${c.color} grid place-items-center mb-3`}>
                <c.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-extrabold font-display">{c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {complaints.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`h-9 w-9 rounded-lg ${priorityStyle[c.priority]} grid place-items-center`}>
                    <MessageCircleWarning className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{c.subject}</div>
                    <div className="text-[11px] text-muted-foreground">{c.student} · {c.id}</div>
                  </div>
                </div>
                <Badge variant="outline" className={`font-normal ${statusStyle[c.status]}`}>{c.status}</Badge>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="text-[10px]">{c.type}</Badge>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${priorityStyle[c.priority]}`}>{c.priority} priority</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{c.date}</span>
              </div>
              <div className="rounded-lg bg-muted/40 p-2.5 text-xs">
                <div className="flex items-start gap-1.5">
                  <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{c.lastReply}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="flex-1"><MessageSquare className="h-3.5 w-3.5 mr-1" /> Reply</Button>
                <Button size="sm" variant="outline" className="flex-1">Track Status</Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
