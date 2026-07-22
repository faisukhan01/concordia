'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModuleHeader } from './students';
import { BookOpen, CalendarCheck, FileText, ClipboardList, Bell, GraduationCap, Plus, Download } from 'lucide-react';

const days = ['Mon','Tue','Wed','Thu','Fri'];

export function AcademicsModule() {
  const [timetable, setTimetable] = useState<any[]>([]);

  useEffect(() => { api.timetable().then(setTimetable).catch(()=>{}); }, []);

  const cards = [
    { label: 'Active Classes', value: '14', icon: BookOpen, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Teachers', value: '48', icon: GraduationCap, color: 'from-teal-500 to-cyan-600' },
    { label: 'Lessons This Week', value: '210', icon: FileText, color: 'from-amber-500 to-yellow-600' },
    { label: 'Homework Assigned', value: '86', icon: ClipboardList, color: 'from-violet-500 to-purple-600' },
  ];

  const features = [
    { icon: BookOpen, title: 'Academic History', desc: 'Complete record of every student\'s academic journey' },
    { icon: FileText, title: 'Dossier Setting', desc: 'Configure student dossiers and academic profiles' },
    { icon: GraduationCap, title: 'Promote / Transfer', desc: 'Promote, transfer or pass-out students in bulk' },
    { icon: ClipboardList, title: 'Course & Lesson Plan', desc: 'Define course content, lesson plans & syllabus' },
    { icon: Bell, title: 'Diary & Homework', desc: 'Daily diary & homework with parent app notifications' },
    { icon: CalendarCheck, title: 'Academic Calendar', desc: 'Term dates, exams, holidays & events calendar' },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Academics"
        subtitle="Elevating user experience — the complete academic lifecycle"
        actions={<>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" /> Syllabus</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"><Plus className="h-4 w-4 mr-1.5" /> Lesson Plan</Button>
        </>}
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-5 hover:shadow-md transition">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 grid place-items-center mb-3">
                <f.icon className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="font-bold text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="font-bold text-base mb-4">Teacher Timetable — Grade 8, Section A</h3>
        <div className="overflow-x-auto scroll-fancy">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left p-2 text-xs text-muted-foreground font-medium">Day</th>
                {timetable[0]?.periods.map((_: any, i: number) => (
                  <th key={i} className="text-left p-2 text-xs text-muted-foreground font-medium">{`P${i+1}`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timetable.map((day) => (
                <tr key={day.day} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="p-2 font-bold text-sm">{day.day}</td>
                  {day.periods.map((p: any, i: number) => (
                    <td key={i} className="p-2">
                      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2">
                        <div className="font-medium text-xs text-emerald-700 dark:text-emerald-300">{p.subject}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{p.teacher}</div>
                        <div className="text-[9px] text-muted-foreground">{p.time}</div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
