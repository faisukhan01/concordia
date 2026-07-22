'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModuleHeader } from './students';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts';
import { Trophy, Medal, Award, TrendingUp, FileText, GraduationCap, Download } from 'lucide-react';

const gradeColor: Record<string, string> = {
  'A+': 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
  'A': 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
  'B': 'text-teal-600 bg-teal-500/10 border-teal-500/20',
  'C': 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  'D': 'text-orange-600 bg-orange-500/10 border-orange-500/20',
  'F': 'text-rose-600 bg-rose-500/10 border-rose-500/20',
};

export function ResultsModule() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    api.resultsSubjects().then(setSubjects).catch(()=>{});
    api.resultsCards().then(setCards).catch(()=>{});
  }, []);

  const topThree = cards.slice(0, 3);
  const avgPassRate = subjects.reduce((a,s) => a + s.passRate, 0) / Math.max(subjects.length, 1);
  const avgScore = subjects.reduce((a,s) => a + s.avgScore, 0) / Math.max(subjects.length, 1);

  const stats = [
    { label: 'Avg Score', value: avgScore.toFixed(1) + '%', icon: TrendingUp, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Pass Rate', value: avgPassRate.toFixed(1) + '%', icon: GraduationCap, color: 'from-teal-500 to-cyan-600' },
    { label: 'Exams This Term', value: '24', icon: FileText, color: 'from-amber-500 to-yellow-600' },
    { label: 'Top Scorer', value: cards[0]?.obtained + '/500', icon: Trophy, color: 'from-violet-500 to-purple-600' },
  ];

  const radialData = [{ name: 'Pass Rate', value: avgPassRate, fill: '#10b981' }];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Results Management"
        subtitle="Valuable insights for educators to support student success"
        actions={<>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" /> Export Report</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"><FileText className="h-4 w-4 mr-1.5" /> New Exam</Button>
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

      {/* Top 3 podium */}
      <Card className="p-5">
        <h3 className="font-bold text-base mb-4 flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500" /> Top Performers — Latest Exam</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {topThree.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-5 text-center ${i === 0 ? 'bg-gradient-to-br from-amber-400/20 to-amber-600/10 border-2 border-amber-400/40' : i === 1 ? 'bg-gradient-to-br from-slate-300/20 to-slate-400/10 border border-slate-300/40' : 'bg-gradient-to-br from-orange-400/15 to-orange-600/5 border border-orange-400/30'}`}>
              {i === 0 && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Trophy className="h-7 w-7 text-amber-500 fill-amber-400/30" /></div>}
              {i === 1 && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Medal className="h-6 w-6 text-slate-400 fill-slate-300/30" /></div>}
              {i === 2 && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Award className="h-6 w-6 text-orange-500 fill-orange-400/30" /></div>}
              <div className="text-3xl font-extrabold font-display mt-2">#{c.rank}</div>
              <div className="font-semibold text-sm mt-1">{c.studentName}</div>
              <div className="text-[11px] text-muted-foreground">{c.class} · {c.exam}</div>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Badge variant="outline" className={gradeColor[c.grade]}>{c.grade}</Badge>
                <span className="text-sm font-bold">{c.percentage}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-bold text-base mb-1">Subject-wise Performance</h3>
          <p className="text-xs text-muted-foreground mb-4">Average, highest & lowest scores</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={subjects} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="subject" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" angle={-20} textAnchor="end" height={60} />
              <YAxis domain={[0,100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="highest" fill="#10b981" radius={[3,3,0,0]} />
              <Bar dataKey="avgScore" fill="#f59e0b" radius={[3,3,0,0]} />
              <Bar dataKey="lowest" fill="#f43f5e" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-emerald-500" /> Highest</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-amber-500" /> Average</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-rose-500" /> Lowest</span>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-base mb-1">Overall Pass Rate</h3>
          <p className="text-xs text-muted-foreground mb-4">Across all subjects</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart innerRadius="70%" outerRadius="100%" data={radialData} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0,100]} angleAxisId={0} tick={false} />
              <RadialBar background dataKey="value" cornerRadius={20} fill="#10b981" />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="text-center -mt-32 mb-12">
            <div className="text-4xl font-extrabold font-display text-emerald-600">{avgPassRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">pass rate</div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-bold text-base mb-4">Recent Result Cards</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cards.map(c => (
            <div key={c.id} className="p-3 rounded-xl border border-border/60 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{c.studentName}</div>
                  <div className="text-[11px] text-muted-foreground">{c.class} · {c.exam}</div>
                </div>
                <Badge variant="outline" className={gradeColor[c.grade]}>{c.grade}</Badge>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                <div>
                  <div className="text-[10px] text-muted-foreground">Marks</div>
                  <div className="font-bold text-sm">{c.obtained}/{c.totalMarks}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Percent</div>
                  <div className="font-bold text-sm text-emerald-600">{c.percentage}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Rank</div>
                  <div className="font-bold text-sm">#{c.rank}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
