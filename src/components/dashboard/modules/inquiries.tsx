'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModuleHeader } from './students';
import { PhoneCall, Plus, UserCheck, TrendingUp, Phone, MessageSquare, Calendar } from 'lucide-react';

const statusStyle: Record<string, string> = {
  New: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
  'Follow-up': 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  Mature: 'text-teal-600 bg-teal-500/10 border-teal-500/20',
  Immature: 'text-slate-600 bg-slate-500/10 border-slate-500/20',
  Admitted: 'text-violet-600 bg-violet-500/10 border-violet-500/20',
  Lost: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
};

export function InquiriesModule() {
  const [inquiries, setInquiries] = useState<any[]>([]);

  useEffect(() => { api.inquiries().then(setInquiries).catch(()=>{}); }, []);

  const mature = inquiries.filter(i => i.status === 'Mature' || i.status === 'Admitted').length;
  const admitted = inquiries.filter(i => i.status === 'Admitted').length;
  const followUps = inquiries.filter(i => i.followUp).length;

  const cards = [
    { label: 'Total Inquiries', value: inquiries.length, icon: PhoneCall, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Mature Leads', value: mature, icon: TrendingUp, color: 'from-teal-500 to-cyan-600' },
    { label: 'Admitted', value: admitted, icon: UserCheck, color: 'from-amber-500 to-yellow-600' },
    { label: 'Need Follow-up', value: followUps, icon: Phone, color: 'from-violet-500 to-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Inquiry Management"
        subtitle="Empower your school's potential — track every lead to enrollment"
        actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"><Plus className="h-4 w-4 mr-1.5" /> New Inquiry</Button>}
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

      <Card className="p-5">
        <h3 className="font-bold text-base mb-4">Inquiry Pipeline</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {inquiries.map((inq, i) => (
            <motion.div key={inq.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
              <Card className="p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-sm">{inq.name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{inq.id}</div>
                  </div>
                  <Badge variant="outline" className={`font-normal ${statusStyle[inq.status]}`}>{inq.status}</Badge>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {inq.phone}</div>
                  <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {inq.date}</div>
                  <div className="flex items-center gap-1.5"><UserCheck className="h-3 w-3" /> Class: {inq.class}</div>
                  <div className="flex items-center gap-1.5"><MessageSquare className="h-3 w-3" /> {inq.notes}</div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
                  <Badge variant="secondary" className="text-[10px]">{inq.source}</Badge>
                  {inq.followUp && <span className="text-[10px] text-amber-600 flex items-center gap-1"><Phone className="h-3 w-3" /> Follow-up</span>}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
