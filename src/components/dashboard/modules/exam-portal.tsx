'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  FileCheck, Clock, Brain, TrendingUp, BarChart3, Calendar, Timer,
  ChevronRight, CheckCircle2, XCircle, AlertCircle, Loader2, Zap,
  Eye, RotateCcw, Sparkles, Target,
  BookOpen, Calculator, Atom, FlaskConical, Languages, Code2,
  Inbox, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart, Legend,
} from 'recharts';
import { ModuleHeader } from './students';
import { api } from '@/lib/api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UpcomingExam {
  id: string;
  subject: string;
  date: string;          // ISO date string
  totalMarks: number;
  duration: number;      // minutes
  chapters: string[];
  type: 'Mid-Term' | 'Final' | 'Quiz' | 'Unit Test';
}

interface PastResult {
  id: string;
  subject: string;
  score: number;
  totalMarks: number;
  percentage: number;
  date: string;
  grade?: string;
}

/* ------------------------------------------------------------------ */
/*  Static UI metadata (subjects list for the test builder — NOT data) */
/* ------------------------------------------------------------------ */

const SUBJECTS_LIST = [
  { id: 'math', name: 'Mathematics', icon: Calculator, chapters: ['Algebra', 'Trigonometry', 'Calculus', 'Statistics', 'Geometry'] },
  { id: 'physics', name: 'Physics', icon: Atom, chapters: ['Mechanics', 'Thermodynamics', 'Optics', 'Electromagnetism', 'Waves'] },
  { id: 'chemistry', name: 'Chemistry', icon: FlaskConical, chapters: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Periodic Table'] },
  { id: 'english', name: 'English', icon: Languages, chapters: ['Grammar', 'Comprehension', 'Essay Writing', 'Vocabulary'] },
  { id: 'cs', name: 'Computer Science', icon: Code2, chapters: ['Data Structures', 'Algorithms', 'OOP', 'Databases', 'Networking'] },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getCountdown(isoDate: string): { label: string; urgent: 'red' | 'amber' | 'green' } {
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return { label: 'Started', urgent: 'red' };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (days < 1) return { label: `${hours}h ${minutes}m`, urgent: 'red' };
  if (days < 3) return { label: `${days}d ${hours}h`, urgent: 'amber' };
  return { label: `${days}d ${hours}h`, urgent: 'green' };
}

const urgentColor: Record<string, string> = {
  red: 'border-red-500/40 bg-red-500/5',
  amber: 'border-amber-500/40 bg-amber-500/5',
  green: 'border-emerald-500/40 bg-emerald-500/5',
};

const urgentBadge: Record<string, string> = {
  red: 'bg-red-500/15 text-red-600 border-red-500/30',
  amber: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  green: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
};

const subjectBadge: Record<string, string> = {
  Mathematics: 'bg-violet-500/15 text-violet-700 border-violet-500/30',
  Physics: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  Chemistry: 'bg-rose-500/15 text-rose-700 border-rose-500/30',
  English: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  'Computer Science': 'bg-purple-500/15 text-purple-700 border-purple-500/30',
};

const gradeColor: Record<string, string> = {
  'A+': 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
  'A': 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
  'B': 'text-teal-600 bg-teal-500/10 border-teal-500/20',
  'C': 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  'D': 'text-orange-600 bg-orange-500/10 border-orange-500/20',
  'F': 'text-rose-600 bg-rose-500/10 border-rose-500/20',
};

function formatDuration(mins: number): string {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}` : `${m}m`;
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' } }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

/* ------------------------------------------------------------------ */
/*  Shared state components                                            */
/* ------------------------------------------------------------------ */

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/60 mb-3" />
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <div className="h-14 w-14 rounded-2xl bg-rose-500/10 grid place-items-center mb-3">
        <AlertCircle className="h-7 w-7 text-rose-500" />
      </div>
      <div className="font-semibold text-sm">{message}</div>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" /> Try Again
        </Button>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon, title, description,
}: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="h-16 w-16 rounded-2xl bg-muted grid place-items-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs text-muted-foreground mt-1.5 max-w-md">{description}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-Components                                                     */
/* ------------------------------------------------------------------ */

function CountdownTimer({ isoDate }: { isoDate: string }) {
  const [cd, setCd] = useState(getCountdown(isoDate));

  useEffect(() => {
    const iv = setInterval(() => setCd(getCountdown(isoDate)), 30000);
    return () => clearInterval(iv);
  }, [isoDate]);

  return <Badge variant="outline" className={`${urgentBadge[cd.urgent]} font-mono text-xs`}>{cd.label}</Badge>;
}

/* ---- Upcoming Exams ---- */
function UpcomingExams({ exams }: { exams: UpcomingExam[] }) {
  if (exams.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Calendar}
          title="No upcoming exams scheduled"
          description="When your teachers schedule tests, mid-terms or finals, they will appear here with countdowns and details."
        />
      </Card>
    );
  }

  const next = exams[0];
  const cd = getCountdown(next.date);

  return (
    <div className="space-y-6">
      {/* Next exam hero card */}
      <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0}>
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-r from-primary to-primary/70 p-6 text-white">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="size-4" />
              <span className="text-sm font-medium opacity-90">Next Exam</span>
            </div>
            <h3 className="text-2xl font-bold">{next.subject}</h3>
            <p className="text-sm opacity-80 mt-1">{next.type} &middot; {next.chapters.join(', ')}</p>
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="flex items-center gap-1.5 bg-white/15 rounded-md px-3 py-1.5 text-sm">
                <Calendar className="size-3.5" />
                {new Date(next.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 rounded-md px-3 py-1.5 text-sm">
                <Timer className="size-3.5" />
                {formatDuration(next.duration)}
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 rounded-md px-3 py-1.5 text-sm">
                <FileCheck className="size-3.5" />
                {next.totalMarks} marks
              </div>
            </div>
          </div>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Starts in</span>
              <span className={`font-mono text-lg font-bold ${cd.urgent === 'red' ? 'text-red-500' : cd.urgent === 'amber' ? 'text-amber-500' : 'text-emerald-500'}`}>
                {cd.label}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Remaining exams grid */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4" variants={stagger} initial="hidden" animate="show">
        {exams.slice(1).map((exam, i) => {
          const cd = getCountdown(exam.date);
          return (
            <motion.div key={exam.id} variants={fadeUp} custom={i + 1}>
              <Card className={`transition-shadow hover:shadow-md ${urgentColor[cd.urgent]}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={subjectBadge[exam.subject] ?? 'bg-slate-500/15 text-slate-700 border-slate-500/30'}>
                      {exam.subject}
                    </Badge>
                    <CountdownTimer isoDate={exam.date} />
                  </div>
                  <CardTitle className="text-base mt-2">{exam.type}</CardTitle>
                  <CardDescription>{exam.chapters.join(', ')}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="size-3.5" />{new Date(exam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span className="flex items-center gap-1"><Timer className="size-3.5" />{formatDuration(exam.duration)}</span>
                    <span className="flex items-center gap-1"><FileCheck className="size-3.5" />{exam.totalMarks}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

/* ---- Create Practice Test ---- */
function CreatePracticeTest() {
  const [subject, setSubject] = useState('');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState('Mixed');
  const [questionCount, setQuestionCount] = useState([30]);
  const [timeLimit, setTimeLimit] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const currentSubject = SUBJECTS_LIST.find(s => s.id === subject);

  const toggleChapter = (ch: string) => {
    setSelectedChapters(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const handleGenerate = () => {
    setGenerating(true);
    // Neutral confirmation — no fake question content is fabricated.
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2500);
  };

  const handleReset = () => {
    setSubject(''); setSelectedChapters([]); setDifficulty('Mixed');
    setQuestionCount([30]); setTimeLimit(true); setGenerated(false);
  };

  if (generated) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 className="size-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold">Practice Test Configured</h3>
            <p className="text-sm text-muted-foreground">
              Your {questionCount[0]}-question {currentSubject?.name ?? 'subject'} test ({difficulty} difficulty
              {timeLimit ? `, ~${Math.round(questionCount[0] * 1.2)} min` : ''}) is ready.
              Question content will load when the test engine is enabled.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Button onClick={handleReset} variant="outline"><RotateCcw className="size-4 mr-1" />Create Another</Button>
              <Button className="bg-primary text-white hover:bg-primary/90"><FileCheck className="size-4 mr-1" />Start Test</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Brain className="size-5 text-primary" />Test Configuration</CardTitle>
          <CardDescription>Customize your practice test parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subject */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Select value={subject} onValueChange={v => { setSubject(v); setSelectedChapters([]); }}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select a subject" /></SelectTrigger>
              <SelectContent>
                {SUBJECTS_LIST.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2"><s.icon className="size-4" />{s.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chapters multi-select */}
          {currentSubject && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
              <label className="text-sm font-medium">Chapters / Topics</label>
              <div className="grid grid-cols-2 gap-2">
                {currentSubject.chapters.map(ch => (
                  <label key={ch} className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors text-sm">
                    <Checkbox checked={selectedChapters.includes(ch)} onCheckedChange={() => toggleChapter(ch)} />
                    {ch}
                  </label>
                ))}
              </div>
              {selectedChapters.length === 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertCircle className="size-3" />Select at least one chapter</p>
              )}
            </motion.div>
          )}

          {/* Difficulty */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Difficulty Level</label>
            <div className="flex gap-2 flex-wrap">
              {(['Easy', 'Medium', 'Hard', 'Mixed'] as const).map(d => (
                <Button
                  key={d}
                  variant={difficulty === d ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDifficulty(d)}
                  className={difficulty === d ? 'bg-primary text-white border-0 hover:bg-primary/90' : ''}
                >
                  {d === 'Easy' && <Zap className="size-3.5 mr-1" />}
                  {d === 'Medium' && <Target className="size-3.5 mr-1" />}
                  {d === 'Hard' && <AlertCircle className="size-3.5 mr-1" />}
                  {d === 'Mixed' && <Sparkles className="size-3.5 mr-1" />}
                  {d}
                </Button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Number of Questions</label>
              <span className="text-sm font-mono font-bold text-primary">{questionCount[0]}</span>
            </div>
            <Slider value={questionCount} onValueChange={setQuestionCount} min={10} max={100} step={5} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10</span><span>100</span>
            </div>
          </div>

          {/* Time Limit Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <label className="text-sm font-medium flex items-center gap-2"><Clock className="size-4" />Time Limit</label>
              <p className="text-xs text-muted-foreground">
                {timeLimit ? `~${Math.round(questionCount[0] * 1.2)} minutes` : 'No time constraint'}
              </p>
            </div>
            <Switch checked={timeLimit} onCheckedChange={setTimeLimit} />
          </div>

          <Separator />

          {/* Generate */}
          <Button
            onClick={handleGenerate}
            disabled={!subject || selectedChapters.length === 0 || generating}
            className="w-full h-11 text-base bg-primary text-white border-0 hover:bg-primary/90 transition-opacity"
          >
            {generating ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Generating Test...
              </>
            ) : (
              <>
                <Sparkles className="size-5" />
                Generate Practice Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---- Past Results ---- */
function PastResults({
  results, loading, error, onRetry,
}: { results: PastResult[]; loading: boolean; error: string | null; onRetry: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) {
    return <LoadingState label="Loading your past results…" />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }
  if (results.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={FileCheck}
          title="No past results yet"
          description="Once you take a test or exam, your results will be listed here with full breakdowns."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((r, i) => (
        <motion.div key={r.id} initial="hidden" animate="show" variants={fadeUp} custom={i}>
          <Card className="transition-shadow hover:shadow-md overflow-hidden">
            <CardContent className="pt-0">
              <button
                className="w-full flex items-center justify-between py-1 text-left"
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant="outline" className={subjectBadge[r.subject] ?? 'bg-slate-500/15 text-slate-700 border-slate-500/30'}>
                    {r.subject}
                  </Badge>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">
                      {r.score}/{r.totalMarks}
                      <span className="ml-2 text-muted-foreground font-normal">({r.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Clock className="size-3" />
                      {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.grade && (
                    <Badge variant="outline" className={`text-xs ${gradeColor[r.grade] ?? ''}`}>Grade {r.grade}</Badge>
                  )}
                  <ChevronRight className={`size-4 text-muted-foreground transition-transform ${expanded === r.id ? 'rotate-90' : ''}`} />
                </div>
              </button>

              <AnimatePresence>
                {expanded === r.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <Separator className="my-3" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Score</p>
                        <p className="font-semibold">{r.score}/{r.totalMarks}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Percentage</p>
                        <p className="font-semibold">{r.percentage.toFixed(1)}%</p>
                      </div>
                      {r.grade && (
                        <div>
                          <p className="text-muted-foreground text-xs">Grade</p>
                          <p className="font-semibold">{r.grade}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <Progress value={r.percentage} className="h-2" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

/* ---- Performance Analytics ---- */
function PerformanceAnalytics({ results }: { results: PastResult[] }) {
  if (results.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={BarChart3}
          title="No data yet — take a test to see your analytics"
          description="Subject-wise performance, improvement trends, strengths and weaknesses will be visualised here once you have at least one graded result."
        />
      </Card>
    );
  }

  // Derive subject-wise averages from real results
  const subjects = Array.from(new Set(results.map(r => r.subject)));
  const subjectPerformance = subjects.map(sub => {
    const subjectResults = results.filter(r => r.subject === sub);
    const avg = subjectResults.reduce((a, r) => a + r.percentage, 0) / subjectResults.length;
    return { subject: sub.length > 10 ? sub.slice(0, 8) : sub, score: Math.round(avg) };
  });

  // Sort results by date for trend
  const sortedByDate = [...results].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const improvementTrend = sortedByDate.map((r, i) => ({
    month: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    average: Math.round(r.percentage),
    idx: i,
  }));

  const avgScore = results.reduce((a, r) => a + r.percentage, 0) / results.length;
  const bestResult = results.reduce((best, r) => r.percentage > best.percentage ? r : best, results[0]);
  const strengths = subjectPerformance.filter(s => s.score >= 80).map(s => s.subject);
  const weaknesses = subjectPerformance.filter(s => s.score < 60).map(s => s.subject);

  const NAVY = '#1a365d';
  const NAVY_LIGHT = '#3b5b8c';

  return (
    <div className="space-y-6">
      {/* Subject-wise Bar Chart */}
      <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="size-5 text-primary" />Subject-wise Performance</CardTitle>
            <CardDescription>Your average score per subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="subject" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: number) => [`${value}%`, 'Average']}
                  />
                  <Bar dataKey="score" name="Average" fill={NAVY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Improvement Trend */}
      <motion.div initial="hidden" animate="show" variants={fadeUp} custom={1}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="size-5 text-emerald-500" />Improvement Trend</CardTitle>
            <CardDescription>Score across recent attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={improvementTrend}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={NAVY} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={NAVY} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: number) => [`${value}%`, 'Score']}
                  />
                  <Area type="monotone" dataKey="average" stroke={NAVY} strokeWidth={2} fill="url(#trendGradient)" name="Score" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Strengths & Weaknesses */}
      <motion.div initial="hidden" animate="show" variants={fadeUp} custom={2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-500" />Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {strengths.length > 0 ? strengths.map(s => (
                  <Badge key={s} className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">{s}</Badge>
                )) : <p className="text-sm text-muted-foreground">Keep practicing — your strongest subjects will appear here.</p>}
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><AlertCircle className="size-4 text-amber-500" />Needs Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {weaknesses.length > 0 ? weaknesses.map(s => (
                  <Badge key={s} className="bg-amber-500/15 text-amber-700 border-amber-500/30">{s}</Badge>
                )) : <p className="text-sm text-muted-foreground">No weak areas detected — great job!</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div initial="hidden" animate="show" variants={fadeUp} custom={3}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Avg Score', value: `${avgScore.toFixed(0)}%`, icon: BarChart3, color: 'from-primary to-primary/70' },
            { label: 'Best Subject', value: bestResult.subject.length > 10 ? bestResult.subject.slice(0, 8) : bestResult.subject, icon: CheckCircle2, color: 'from-emerald-500 to-teal-600' },
            { label: 'Tests Taken', value: results.length, icon: FileCheck, color: 'from-violet-500 to-purple-600' },
            { label: 'Highest Score', value: `${Math.round(bestResult.percentage)}%`, icon: TrendingUp, color: 'from-amber-500 to-orange-600' },
          ].map(stat => (
            <Card key={stat.label} className="overflow-hidden">
              <div className={`bg-gradient-to-br ${stat.color} p-3 flex items-center justify-center`}>
                <stat.icon className="size-6 text-white" />
              </div>
              <CardContent className="pt-3 text-center">
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ---- Answer Key & Review ---- */
function AnswerKeyReview() {
  // No test is selected by the user yet — show an honest placeholder.
  return (
    <Card>
      <EmptyState
        icon={Eye}
        title="No test selected"
        description="Take a practice test or click 'Review' on a past result to see the answer key with detailed explanations for each question."
      />
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function ExamPortal({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState('upcoming');

  // ── Real results from GET /api/results?studentId=<user.id> ──
  const [results, setResults] = useState<PastResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [resultsError, setResultsError] = useState<string | null>(null);

  const fetchResults = () =>
    api.getResults({ studentId: user?.id })
      .then(raw => {
        const list = Array.isArray(raw) ? raw : [];
        const mapped: PastResult[] = list.map((r: any) => {
          const marks = Number(r.marks ?? r.score ?? 0);
          const total = Number(r.totalMarks ?? 100);
          return {
            id: String(r.id ?? Math.random()),
            subject: r.exam || r.subject || 'Exam',
            score: marks,
            totalMarks: total,
            percentage: total ? (marks / total) * 100 : 0,
            date: r.date || new Date().toISOString(),
            grade: r.grade,
          };
        });
        setResults(mapped);
        setResultsError(null);
      })
      .catch(e => { setResultsError(e.message || 'Failed to load results.'); })
      .finally(() => setResultsLoading(false));

  useEffect(() => {
    let cancelled = false;
    api.getResults({ studentId: user?.id })
      .then(raw => {
        if (cancelled) return;
        const list = Array.isArray(raw) ? raw : [];
        const mapped: PastResult[] = list.map((r: any) => {
          const marks = Number(r.marks ?? r.score ?? 0);
          const total = Number(r.totalMarks ?? 100);
          return {
            id: String(r.id ?? Math.random()),
            subject: r.exam || r.subject || 'Exam',
            score: marks,
            totalMarks: total,
            percentage: total ? (marks / total) * 100 : 0,
            date: r.date || new Date().toISOString(),
            grade: r.grade,
          };
        });
        setResults(mapped);
        setResultsError(null);
      })
      .catch(e => { if (!cancelled) setResultsError(e.message || 'Failed to load results.'); })
      .finally(() => { if (!cancelled) setResultsLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id]);

  // ── Upcoming exams — no endpoint exists; honest empty state ──
  const upcomingExams: UpcomingExam[] = [];

  return (
    <div className="space-y-6">
      {/* Module Header — navy gradient (NOT indigo/blue) */}
      <ModuleHeader
        title="Exam Portal"
        subtitle="Practice tests, results & performance analytics"
        actions={
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
            <BookOpen className="size-3 mr-1" />{SUBJECTS_LIST.length} Subjects
          </Badge>
        }
      />

      <div className="rounded-xl bg-gradient-to-r from-primary to-primary/70 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/15 rounded-lg">
            <FileCheck className="size-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Exam Portal</h1>
            <p className="text-sm opacity-80">Practice tests, results &amp; performance analytics</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
            <BookOpen className="size-3 mr-1" />{SUBJECTS_LIST.length} Subjects
          </Badge>
          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
            <Calendar className="size-3 mr-1" />{upcomingExams.length} Upcoming
          </Badge>
          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
            <FileCheck className="size-3 mr-1" />{results.length} Past Results
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="upcoming" className="gap-1.5 text-xs sm:text-sm">
            <Calendar className="size-3.5" />Upcoming
          </TabsTrigger>
          <TabsTrigger value="create" className="gap-1.5 text-xs sm:text-sm">
            <Brain className="size-3.5" />Create Test
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-1.5 text-xs sm:text-sm">
            <FileCheck className="size-3.5" />Results
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="size-3.5" />Analytics
          </TabsTrigger>
          <TabsTrigger value="review" className="gap-1.5 text-xs sm:text-sm">
            <Eye className="size-3.5" />Review
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          <UpcomingExams exams={upcomingExams} />
        </TabsContent>

        <TabsContent value="create" className="mt-4">
          <CreatePracticeTest />
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          <PastResults results={results} loading={resultsLoading} error={resultsError} onRetry={fetchResults} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <PerformanceAnalytics results={results} />
        </TabsContent>

        <TabsContent value="review" className="mt-4">
          <AnswerKeyReview />
        </TabsContent>
      </Tabs>
    </div>
  );
}
