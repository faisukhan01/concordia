'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModuleHeader } from './students';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Play, BookOpen, FileText, Brain, TrendingUp, Clock, Star, Flame,
  CheckCircle2, ChevronRight, Download, Eye, Timer, Award, Zap,
  MonitorPlay, GraduationCap, Target, Loader2, AlertCircle,
  RefreshCw, Lock, BarChart3,
} from 'lucide-react';
import { api } from '@/lib/api';

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

type SubjectId = 'math' | 'physics' | 'chemistry' | 'biology' | 'english' | 'cs';

interface VideoLecture {
  id: string;
  title: string;
  subject: SubjectId;
  duration: string;
  views: number;
  progress: number;
  chapter: string;
}

interface PastPaper {
  id: string;
  year: number;
  subject: string;
  board: string;
  totalMarks: number;
}

interface ScoreRecord {
  id: string;
  subject: string;
  score: number;
  total: number;
  date: string;
}

/* ────────────────────────────────────────────
   Static UI metadata (subjects + gradients — NOT data)
   ──────────────────────────────────────────── */

const SUBJECTS: { id: SubjectId; name: string; icon: typeof Play; gradient: string }[] = [
  { id: 'math', name: 'Mathematics', icon: Target, gradient: 'from-violet-500 to-purple-600' },
  { id: 'physics', name: 'Physics', icon: Zap, gradient: 'from-sky-500 to-blue-600' },
  { id: 'chemistry', name: 'Chemistry', icon: Brain, gradient: 'from-rose-500 to-pink-600' },
  { id: 'biology', name: 'Biology', icon: BookOpen, gradient: 'from-emerald-500 to-green-600' },
  { id: 'english', name: 'English', icon: GraduationCap, gradient: 'from-amber-500 to-orange-600' },
  { id: 'cs', name: 'Computer Science', icon: MonitorPlay, gradient: 'from-cyan-500 to-teal-600' },
];

const VIDEO_THUMBNAIL_GRADIENTS: Record<SubjectId, string> = {
  math: 'from-violet-600 via-purple-700 to-indigo-800',
  physics: 'from-sky-600 via-blue-700 to-indigo-800',
  chemistry: 'from-rose-600 via-pink-700 to-fuchsia-800',
  biology: 'from-emerald-600 via-green-700 to-teal-800',
  english: 'from-amber-600 via-orange-700 to-red-800',
  cs: 'from-cyan-600 via-teal-700 to-emerald-800',
};

// Practice-test subject picker options (UI scaffolding, not data).
const MCQ_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'];

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

const fmtViews = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

const subjectName = (sub: SubjectId) => SUBJECTS.find(s => s.id === sub)?.name ?? sub;

const progressColor = (p: number) => {
  if (p === 100) return 'bg-emerald-500';
  if (p >= 60) return 'bg-violet-500';
  if (p >= 30) return 'bg-amber-500';
  return 'bg-rose-500';
};

const scoreBadge = (score: number) => {
  if (score >= 90) return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
  if (score >= 75) return 'text-violet-600 bg-violet-500/10 border-violet-500/20';
  if (score >= 60) return 'text-amber-600 bg-amber-500/10 border-amber-500/20';
  return 'text-rose-600 bg-rose-500/10 border-rose-500/20';
};

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

/* ────────────────────────────────────────────
   Shared state components
   ──────────────────────────────────────────── */

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
  icon: Icon, title, description, action,
}: { icon: any; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="h-16 w-16 rounded-2xl bg-muted grid place-items-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs text-muted-foreground mt-1.5 max-w-md">{description}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Attempts a GET fetch for an e-learning resource. The endpoint likely does
 * not exist yet — the function resolves to `[]` in that case so the UI can
 * show a clean empty state. Any other error is re-thrown for the caller.
 */
async function fetchElearning<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch('/api/' + path.replace(/^\//, ''));
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.items ?? data?.videos ?? data?.papers ?? []);
  } catch {
    return [];
  }
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function ELearningHub({ user }: { user: any }) {
  const [videoSubject, setVideoSubject] = useState<SubjectId | 'all'>('all');
  const [mcqSubject, setMcqSubject] = useState('Mathematics');
  const [mcqCount, setMcqCount] = useState(20);

  // ── Data state ──
  const [videos, setVideos] = useState<VideoLecture[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videosError, setVideosError] = useState<string | null>(null);

  const [papers, setPapers] = useState<PastPaper[]>([]);
  const [papersLoading, setPapersLoading] = useState(true);
  const [papersError, setPapersError] = useState<string | null>(null);

  const [recentScores, setRecentScores] = useState<ScoreRecord[]>([]);
  const [scoresLoading, setScoresLoading] = useState(true);

  // ── Fetch on mount (endpoints may not exist — empty state is fine) ──
  // All setState calls live inside async callbacks so the effect never
  // calls setState synchronously.
  useEffect(() => {
    let cancelled = false;
    // Videos
    fetchElearning<VideoLecture>('e-learning/videos')
      .then(d => { if (!cancelled) setVideos(d); })
      .catch(() => { if (!cancelled) setVideosError('Unable to load video lectures.'); })
      .finally(() => { if (!cancelled) setVideosLoading(false); });
    // Papers
    fetchElearning<PastPaper>('e-learning/papers')
      .then(d => { if (!cancelled) setPapers(d); })
      .catch(() => { if (!cancelled) setPapersError('Unable to load past papers.'); })
      .finally(() => { if (!cancelled) setPapersLoading(false); });
    // Scores
    fetchElearning<ScoreRecord>('e-learning/progress')
      .then(d => { if (!cancelled) setRecentScores(d); })
      .catch(() => { if (!cancelled) setRecentScores([]); })
      .finally(() => { if (!cancelled) setScoresLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Retry handlers — invoked from JSX onClick, not from effects.
  const retryVideos = () => {
    setVideosLoading(true); setVideosError(null);
    fetchElearning<VideoLecture>('e-learning/videos')
      .then(setVideos)
      .catch(() => setVideosError('Unable to load video lectures.'))
      .finally(() => setVideosLoading(false));
  };
  const retryPapers = () => {
    setPapersLoading(true); setPapersError(null);
    fetchElearning<PastPaper>('e-learning/papers')
      .then(setPapers)
      .catch(() => setPapersError('Unable to load past papers.'))
      .finally(() => setPapersLoading(false));
  };

  /* Filtered videos */
  const filteredVideos = videoSubject === 'all'
    ? videos
    : videos.filter(v => v.subject === videoSubject);

  /* ── Stats cards (all 0 until data exists) ── */
  const videosWatched = recentScores.length; // honest proxy
  const statsCards = [
    { label: 'Videos Watched', value: videosWatched, icon: MonitorPlay, gradient: 'from-violet-500 to-fuchsia-600', sub: 'Start watching to track' },
    { label: 'Practice Tests', value: recentScores.length, icon: Brain, gradient: 'from-emerald-500 to-teal-600', sub: 'Take a test to begin' },
    { label: 'Average Score', value: recentScores.length ? `${Math.round(recentScores.reduce((a, s) => a + (s.score / s.total) * 100, 0) / recentScores.length)}%` : '—', icon: Award, gradient: 'from-amber-500 to-orange-600', sub: 'No tests yet' },
    { label: 'Day Streak', value: 0, icon: Flame, gradient: 'from-rose-500 to-red-600', sub: 'Watch daily to build' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Module Header ── */}
      <ModuleHeader
        title="E-Learning Hub"
        subtitle="Video lectures, past papers & MCQ practice — learn smarter, score higher"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1.5" /> Offline Content
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0">
              <Play className="h-4 w-4 mr-1.5" /> Continue Learning
            </Button>
          </>
        }
      />

      {/* ── Hero Banner ── */}
      <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
        <Card className="relative overflow-hidden border-0">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 opacity-95" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
          <CardContent className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                <span className="text-sm font-semibold text-white/90">Featured Course</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold font-display mb-1">
                Welcome to your learning hub
              </h2>
              <p className="text-sm text-white/75 max-w-lg">
                Video lectures, chapter-wise MCQs, and solved past papers will appear here as your teachers publish them.
              </p>
            </div>
            <Button className="bg-white text-violet-700 hover:bg-white/90 font-bold shrink-0">
              Browse Library <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((c, i) => (
          <motion.div key={c.label} {...fadeIn} transition={{ delay: 0.08 + i * 0.04 }}>
            <Card className="p-4 relative overflow-hidden">
              <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${c.gradient} opacity-10 blur-2xl`} />
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${c.gradient} grid place-items-center mb-3`}>
                <c.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-extrabold font-display">{c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className="text-[11px] text-muted-foreground/70 mt-0.5">{c.sub}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Main Tabs ── */}
      <Tabs defaultValue="videos" className="space-y-5">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="videos" className="gap-1.5">
            <Play className="h-4 w-4" /> Video Library
          </TabsTrigger>
          <TabsTrigger value="papers" className="gap-1.5">
            <FileText className="h-4 w-4" /> Past Papers
          </TabsTrigger>
          <TabsTrigger value="mcq" className="gap-1.5">
            <Brain className="h-4 w-4" /> MCQ Practice
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-1.5">
            <TrendingUp className="h-4 w-4" /> My Progress
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════
            VIDEO LIBRARY TAB
            ══════════════════════════════════════ */}
        <TabsContent value="videos" className="space-y-4">
          {/* Subject filter pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setVideoSubject('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                videoSubject === 'all'
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All Subjects
            </button>
            {SUBJECTS.map(s => (
              <button
                key={s.id}
                onClick={() => setVideoSubject(s.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  videoSubject === s.id
                    ? `bg-gradient-to-r ${s.gradient} text-white shadow-md`
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Video grid */}
          {videosLoading ? (
            <LoadingState label="Loading video lectures…" />
          ) : videosError ? (
            <ErrorState message={videosError} onRetry={retryVideos} />
          ) : filteredVideos.length === 0 ? (
            <Card>
              <EmptyState
                icon={MonitorPlay}
                title="No video lectures available yet"
                description="Lectures published by your teachers will appear here. Check back soon, or ask your branch manager about the content schedule."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredVideos.map((video, i) => (
                  <motion.div
                    key={video.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      {/* Thumbnail */}
                      <div className={`relative h-40 bg-gradient-to-br ${VIDEO_THUMBNAIL_GRADIENTS[video.subject]} flex items-center justify-center`}>
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute top-4 left-4 w-16 h-16 rounded-full border-2 border-white/30" />
                          <div className="absolute bottom-4 right-4 w-20 h-20 rounded-full border-2 border-white/20" />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-white/10" />
                        </div>
                        <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm grid place-items-center group-hover:bg-white/30 transition-all group-hover:scale-110 cursor-pointer">
                          <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Timer className="h-3 w-3" /> {video.duration}
                        </div>
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-[11px] font-medium">
                            {subjectName(video.subject)}
                          </Badge>
                        </div>
                        {video.progress === 100 && (
                          <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-emerald-500 grid place-items-center">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="text-[11px] text-muted-foreground mb-1">{video.chapter}</div>
                        <h3 className="font-semibold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {video.title}
                        </h3>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {fmtViews(video.views)} views
                          </span>
                          <span className={video.progress === 100 ? 'text-emerald-600 font-medium' : ''}>
                            {video.progress}% complete
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${progressColor(video.progress)}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${video.progress}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════
            PAST PAPERS TAB
            ══════════════════════════════════════ */}
        <TabsContent value="papers" className="space-y-4">
          {papersLoading ? (
            <LoadingState label="Loading past papers…" />
          ) : papersError ? (
            <ErrorState message={papersError} onRetry={retryPapers} />
          ) : papers.length === 0 ? (
            <Card>
              <EmptyState
                icon={FileText}
                title="No past papers available yet"
                description="Past papers will be published here by your teachers once they are uploaded to the e-learning library."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {papers.map((paper, i) => (
                <motion.div key={paper.id} {...fadeIn} transition={{ delay: i * 0.04 }}>
                  <Card className="group hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white border-0 text-xs font-bold">
                          {paper.year}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">{paper.board}</span>
                      </div>
                      <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                        {paper.subject}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mb-4">
                        Total Marks: {paper.totalMarks} • Board Exam
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs h-8">
                          <Download className="h-3.5 w-3.5" /> Download PDF
                        </Button>
                        <Button size="sm" className="flex-1 gap-1.5 text-xs h-8 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0">
                          <Play className="h-3.5 w-3.5" /> Attempt Online
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════
            MCQ PRACTICE TAB
            ══════════════════════════════════════ */}
        <TabsContent value="mcq" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Setup panel */}
            <div className="lg:col-span-2 space-y-4">
              <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
                <Card className="overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-violet-500 to-fuchsia-600" />
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Brain className="h-5 w-5 text-violet-500" /> Start Practice Session
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Subject */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">Select Subject</label>
                      <div className="grid grid-cols-2 gap-2">
                        {MCQ_SUBJECTS.map(s => (
                          <button
                            key={s}
                            onClick={() => setMcqSubject(s)}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${
                              mcqSubject === s
                                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-md'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Question count */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">Number of Questions</label>
                      <div className="flex gap-2">
                        {[10, 20, 50, 100].map(n => (
                          <button
                            key={n}
                            onClick={() => setMcqCount(n)}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                              mcqCount === n
                                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-md'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Start button */}
                    <Button className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0 font-bold text-sm gap-2">
                      <Zap className="h-4 w-4" /> Start {mcqCount}-Question Practice
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent scores */}
              <motion.div {...fadeIn} transition={{ delay: 0.12 }}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="h-5 w-5 text-amber-500" /> Recent Scores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {scoresLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : recentScores.length === 0 ? (
                      <div className="text-center py-4">
                        <Award className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">No practice tests yet — start practicing to see your scores here.</p>
                      </div>
                    ) : (
                      recentScores.map(s => (
                        <div key={s.id} className="flex items-center justify-between py-1.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-muted grid place-items-center">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">{s.subject}</div>
                              <div className="text-[11px] text-muted-foreground">{s.date}</div>
                            </div>
                          </div>
                          <Badge variant="outline" className={`font-bold ${scoreBadge(s.score)}`}>
                            {s.score}/{s.total}
                          </Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Performance chart */}
            <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="lg:col-span-3">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" /> Subject Performance
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Average MCQ scores by subject</p>
                </CardHeader>
                <CardContent>
                  {recentScores.length === 0 ? (
                    <EmptyState
                      icon={BarChart3}
                      title="No data yet"
                      description="Start watching lectures to track your progress. Your average MCQ scores per subject will be visualised here."
                    />
                  ) : (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={SUBJECTS.map(s => {
                            const subjectScores = recentScores.filter(r => r.subject.toLowerCase().includes(s.name.toLowerCase().split(' ')[0]));
                            const avg = subjectScores.length
                              ? Math.round(subjectScores.reduce((a, r) => a + (r.score / r.total) * 100, 0) / subjectScores.length)
                              : 0;
                            return { subject: s.name.split(' ')[0], score: avg };
                          })}
                          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="subject" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                            formatter={(value: number) => [`${value}%`, 'Score']}
                          />
                          <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="url(#barGradient)" />
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8b5cf6" />
                              <stop offset="100%" stopColor="#d946ef" />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════
            MY PROGRESS TAB
            ══════════════════════════════════════ */}
        <TabsContent value="progress" className="space-y-5">
          {/* Weekly overview cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Videos This Week', value: 0, change: '—', icon: MonitorPlay, gradient: 'from-violet-500 to-purple-600' },
              { label: 'Tests Completed', value: recentScores.length, change: '—', icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-600' },
              { label: 'Avg Score', value: recentScores.length ? `${Math.round(recentScores.reduce((a, s) => a + (s.score / s.total) * 100, 0) / recentScores.length)}%` : '—', change: '—', icon: Award, gradient: 'from-amber-500 to-orange-600' },
              { label: 'Current Streak', value: '0 days', change: '—', icon: Flame, gradient: 'from-rose-500 to-red-600' },
            ].map((c, i) => (
              <motion.div key={c.label} {...fadeIn} transition={{ delay: i * 0.05 }}>
                <Card className="p-4 relative overflow-hidden">
                  <div className={`absolute -top-4 -right-4 h-16 w-16 rounded-full bg-gradient-to-br ${c.gradient} opacity-10 blur-xl`} />
                  <div className="flex items-start justify-between mb-3">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${c.gradient} grid place-items-center`}>
                      <c.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold font-display">{c.value}</div>
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Weekly watch activity */}
          <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5 text-violet-500" /> Weekly Watch Activity
                </CardTitle>
                <p className="text-xs text-muted-foreground">Hours spent watching lectures this week</p>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={TrendingUp}
                  title="No watch activity yet"
                  description="Start watching lectures to track your progress. Your weekly watch activity will appear here as a chart."
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Subject progress breakdown */}
          <motion.div {...fadeIn} transition={{ delay: 0.25 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-500" /> Subject Completion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {SUBJECTS.map((s) => (
                  <div key={s.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`h-6 w-6 rounded-md bg-gradient-to-br ${s.gradient} grid place-items-center`}>
                          <s.icon className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-sm font-medium">{s.name}</span>
                      </div>
                      <span className="text-sm font-bold">0%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${s.gradient}`}
                        initial={{ width: 0 }}
                        animate={{ width: `0%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Achievements — all locked until user actually earns them */}
          <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" /> Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { title: 'First Lecture', desc: 'Watch your first video', icon: Play },
                    { title: 'Quiz Master', desc: 'Score 90%+ on a quiz', icon: Brain },
                    { title: 'Streak Hero', desc: '7-day learning streak', icon: Flame },
                    { title: 'Scholar', desc: 'Complete all subjects', icon: GraduationCap },
                  ].map((a) => (
                    <div
                      key={a.title}
                      className="p-3 rounded-xl border border-dashed border-muted-foreground/25 opacity-60 text-center"
                    >
                      <div className="h-10 w-10 mx-auto rounded-xl bg-muted grid place-items-center mb-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-xs font-bold flex items-center justify-center gap-1">
                        <a.icon className="h-3 w-3 text-muted-foreground" />
                        {a.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{a.desc}</div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Achievements unlock as you watch lectures and complete practice tests.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
