'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ModuleHeader } from './students';
import { toast } from '@/hooks/use-toast';
import {
  MessageSquare, Send, Smartphone, Users, CheckCircle2, Clock, XCircle,
  Bell, PhoneCall, AlertCircle,
} from 'lucide-react';

const statusStyle: Record<string, string> = {
  Delivered: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
  Pending: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  Failed: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
};

export function SmsModule() {
  const [log, setLog] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [recipients, setRecipients] = useState('1248');
  const [type, setType] = useState('Custom');
  const [sending, setSending] = useState(false);

  useEffect(() => { api.smsLog().then(setLog).catch(()=>{}); }, []);

  const stats = [
    { label: 'Sent Today', value: '3,481', icon: Send, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Delivered', value: '96.4%', icon: CheckCircle2, color: 'from-teal-500 to-cyan-600' },
    { label: 'Recipients', value: '1,248', icon: Users, color: 'from-amber-500 to-yellow-600' },
    { label: 'Pending', value: log.filter(l => l.status === 'Pending').length, icon: Clock, color: 'from-violet-500 to-purple-600' },
  ];

  const templates = [
    { type: 'Absent Alert', icon: AlertCircle, text: 'Dear Parent, your child was absent today. Please contact the school office.', color: 'rose' },
    { type: 'Fee Deposit', icon: CheckCircle2, text: 'Fee of $1,200 has been received. Thank you. — Concordia College', color: 'emerald' },
    { type: 'Result Announcement', icon: Bell, text: 'Monthly test results have been published. Check the parent app.', color: 'violet' },
    { type: 'Holiday Notice', icon: MessageSquare, text: 'School will remain closed on Monday for the federal holiday.', color: 'amber' },
    { type: 'PTM Reminder', icon: PhoneCall, text: 'Parent-Teacher Meeting scheduled for Saturday 10:00 AM.', color: 'cyan' },
    { type: 'Late Arrival', icon: Clock, text: 'Your child arrived late to school today. Please ensure punctuality.', color: 'orange' },
  ];

  const send = async () => {
    if (!text.trim()) { toast({ title: 'Empty message', variant: 'destructive' }); return; }
    setSending(true);
    try {
      await api.smsSend(text, parseInt(recipients) || 0, type);
      toast({ title: 'SMS sent', description: `Delivered to ${recipients} recipients` });
      setText('');
      api.smsLog().then(setLog).catch(()=>{});
    } catch (e: any) {
      toast({ title: 'Send failed', description: e.message, variant: 'destructive' });
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="SMS Portal"
        subtitle="Branded masked SMS & automated alerts across every module"
        actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"><Send className="h-4 w-4 mr-1.5" /> Bulk Send</Button>}
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

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Composer */}
        <Card className="p-5 lg:col-span-1">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2"><Send className="h-4 w-4 text-emerald-600" /> Compose Message</h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Type</Label>
              <Input value={type} onChange={e => setType(e.target.value)} placeholder="e.g. Holiday Notice" className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Recipients</Label>
              <Input value={recipients} onChange={e => setRecipients(e.target.value)} type="number" className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Message</Label>
              <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Type your branded SMS…" rows={4} className="mt-1 resize-none" />
              <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
                <span>{text.length} chars · {Math.ceil(text.length/160)} SMS</span>
                <span>Sender: <span className="font-mono">Concordia Alerts</span></span>
              </div>
            </div>
            <Button onClick={send} disabled={sending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              {sending ? 'Sending…' : <><Send className="h-4 w-4 mr-1.5" /> Send to {recipients} recipients</>}
            </Button>
          </div>
        </Card>

        {/* Templates */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2"><Smartphone className="h-4 w-4 text-amber-600" /> Quick Templates</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {templates.map(t => (
              <button key={t.type} onClick={() => { setText(t.text); setType(t.type); }}
                className="text-left p-3 rounded-xl border border-border/60 hover:shadow-md hover:border-emerald-500/40 transition group">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`h-7 w-7 rounded-lg bg-${t.color}-500/15 grid place-items-center`}>
                    <t.icon className={`h-4 w-4 text-${t.color}-600`} />
                  </div>
                  <span className="font-medium text-sm">{t.type}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{t.text}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Log */}
      <Card className="p-5">
        <h3 className="font-bold text-base mb-4">Recent SMS Log</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto scroll-fancy">
          {log.map(sms => (
            <div key={sms.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition">
              <div className={`h-9 w-9 rounded-lg grid place-items-center shrink-0 ${sms.status === 'Delivered' ? 'bg-emerald-500/15' : sms.status === 'Pending' ? 'bg-amber-500/15' : 'bg-rose-500/15'}`}>
                {sms.status === 'Delivered' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : sms.status === 'Pending' ? <Clock className="h-4 w-4 text-amber-600" /> : <XCircle className="h-4 w-4 text-rose-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`font-normal ${statusStyle[sms.status]}`}>{sms.status}</Badge>
                  <span className="font-medium text-sm">{sms.type}</span>
                  <span className="text-[11px] text-muted-foreground">· {sms.recipients} recipients</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{sms.text}</p>
              </div>
              <div className="text-[11px] text-muted-foreground shrink-0 text-right">
                <div>{new Date(sms.sentAt).toLocaleDateString()}</div>
                <div>{new Date(sms.sentAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
