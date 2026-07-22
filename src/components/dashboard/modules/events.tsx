'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModuleHeader } from './students';
import { Trophy, Calendar, Users, MapPin, Plus, Medal, Award, Star } from 'lucide-react';

const typeColor: Record<string, string> = {
  Academic: 'from-emerald-500 to-emerald-700',
  Competition: 'from-amber-500 to-orange-600',
  Sports: 'from-teal-500 to-cyan-600',
  Cultural: 'from-rose-500 to-pink-600',
};

export function EventsModule() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => { api.events().then(setEvents).catch(()=>{}); }, []);

  const upcoming = events.filter(e => e.status === 'Upcoming');
  const completed = events.filter(e => e.status === 'Completed');
  const totalParticipants = events.reduce((a,e) => a + e.participants, 0);

  const cards = [
    { label: 'Total Events', value: events.length, icon: Trophy, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Upcoming', value: upcoming.length, icon: Calendar, color: 'from-amber-500 to-yellow-600' },
    { label: 'Participants', value: totalParticipants.toLocaleString(), icon: Users, color: 'from-teal-500 to-cyan-600' },
    { label: 'Completed', value: completed.length, icon: Medal, color: 'from-violet-500 to-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Event Management"
        subtitle="Elevate every event with effortless precision"
        actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"><Plus className="h-4 w-4 mr-1.5" /> New Event</Button>}
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

      <div>
        <h3 className="font-bold text-base mb-3">Upcoming Events</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcoming.map((e, i) => (
            <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="p-5 hover:shadow-lg hover:-translate-y-0.5 transition relative overflow-hidden">
                <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${typeColor[e.type]} opacity-15 blur-2xl`} />
                <div className="flex items-start justify-between">
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${typeColor[e.type]} grid place-items-center shadow-md`}>
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/20">{e.status}</Badge>
                </div>
                <h3 className="font-bold text-base mt-3">{e.name}</h3>
                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> {e.date}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {e.venue}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-3.5 w-3.5" /> {e.participants} participants</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Award className="h-3.5 w-3.5" /> Prize: {e.prize}</div>
                </div>
                <div className="mt-4 pt-3 border-t border-border/40 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">Assign</Button>
                  <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">Result</Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <Card className="p-5">
        <h3 className="font-bold text-base mb-4 flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> Recent Winners</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: 'Aiden Carter', event: 'Science Fair 2024', pos: '1st', color: 'amber' },
            { name: 'Sofia Reyes', event: 'Debate Competition', pos: '2nd', color: 'slate' },
            { name: 'Liam Patel', event: 'Spelling Bee', pos: '3rd', color: 'orange' },
            { name: 'Emma Kim', event: 'Art Exhibition', pos: '1st', color: 'amber' },
            { name: 'Noah Nguyen', event: 'Sports Day', pos: '2nd', color: 'slate' },
            { name: 'Olivia Ahmed', event: 'Annual Day', pos: '3rd', color: 'orange' },
          ].map((w, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition">
              <div className={`h-10 w-10 rounded-full bg-${w.color}-500/15 grid place-items-center`}>
                {w.pos === '1st' ? <Trophy className="h-5 w-5 text-amber-500" /> : w.pos === '2nd' ? <Medal className="h-5 w-5 text-slate-400" /> : <Award className="h-5 w-5 text-orange-500" />}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{w.name}</div>
                <div className="text-[11px] text-muted-foreground">{w.event}</div>
              </div>
              <Badge variant="outline" className="font-bold">{w.pos}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
