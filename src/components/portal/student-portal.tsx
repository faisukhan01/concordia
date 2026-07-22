'use client';

import { lazy, Suspense, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  CalendarCheck, GraduationCap, Calendar, ClipboardList,
  CheckCircle2, XCircle, Clock, BookOpen, Award, Inbox,
  ArrowLeft, FileText, Link2, Download, Loader2,
  Wallet, DollarSign, ChevronRight, CreditCard,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/lib/store';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ReportCardDocument, ReportCardActions, type ReportCardData } from './report-card-view';

// Lazy-loaded v1.5.0 unique modules (code-split per route)
// Lazy-loaded modules — named-export modules use .then() to satisfy React.lazy's default-export requirement
const DigitalIdModule = lazy(() => import('@/components/dashboard/modules/digital-id'));
const CampusWalletModule = lazy(() => import('@/components/dashboard/modules/campus-wallet'));
const ELearningModule = lazy(() => import('@/components/dashboard/modules/e-learning-hub').then(m => ({ default: m.ELearningHub })));
const ExamPortalModule = lazy(() => import('@/components/dashboard/modules/exam-portal').then(m => ({ default: m.ExamPortal })));
const ComplaintPortalModule = lazy(() => import('@/components/dashboard/modules/complaint-portal').then(m => ({ default: m.ComplaintPortal })));

function ModuleFallback() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

type Course = { id: string; name: string; code?: string };

type MaterialItem = {
  id: string;
  title: string;
  description?: string;
  fileType?: string;
  fileName?: string;
  linkUrl?: string;
  createdAt?: number | string;
  classId?: string;
  courseId?: string;
};

type Announcement = {
  id: string;
  title: string;
  message: string;
  senderRole?: string;
  targetRole?: string;
  targetScope?: string;
  classId?: string | null;
  createdAt?: number | string;
};

export function StudentPortal({ activeModule, user }: { activeModule: string; user: any }) {
  const [attendance, setAttendance] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [diary, setDiary] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classId, setClassId] = useState<string>('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<{ course: Course; initialTab: 'materials' | 'results' | 'attendance' } | null>(null);

  const refresh = () => {
    if (user?.id) {
      api.getAttendance({ studentId: user.id }).then(setAttendance).catch(() => {});
      api.getResults({ studentId: user.id }).then(setResults).catch(() => {});
      if (user?.branchId) api.getDiary({ branchId: user.branchId }).then(setDiary).catch(() => {});
      api.getStudentCourses().then(setCourses).catch(() => setCourses([]));
      api.getAnnouncements().then(setAnnouncements).catch(() => setAnnouncements([]));
    }
  };

  // Resolve the student's classId from the branch's classes by matching user.class (class name)
  useEffect(() => {
    if (user?.branchId) {
      api.getClasses(user.branchId)
        .then((cls: any[]) => {
          const match = cls.find(c => c.name === user.class);
          setClassId(match?.id || '');
        })
        .catch(() => setClassId(''));
    }
  }, [user?.branchId, user?.class]);

  useEffect(() => { refresh(); }, [user?.id, user?.branchId]);

  if ((activeModule === 'student-overview' || activeModule === 'my-courses') && selectedCourse) {
    return (
      <CourseDetail
        course={selectedCourse.course}
        classId={classId}
        studentId={user?.id}
        initialTab={selectedCourse.initialTab}
        onBack={() => setSelectedCourse(null)}
      />
    );
  }

  if (activeModule === 'my-courses') return <MyCoursesPage courses={courses} onOpenCourse={(course: any) => setSelectedCourse({ course, initialTab: 'materials' })} />;
  if (activeModule === 'my-attendance') return <MyAttendance attendance={attendance} />;
  if (activeModule === 'my-results') return <MyResults results={results} />;
  if (activeModule === 'my-report-card') return <MyReportCard user={user} />;
  if (activeModule === 'my-timetable') return <MyTimetable user={user} classId={classId} />;
  if (activeModule === 'my-diary') return <MyDiary diary={diary} />;
  if (activeModule === 'my-announcements') return <MyAnnouncements announcements={announcements} loading={false} />;
  if (activeModule === 'my-invoices') return <MyInvoices user={user} />;
  if (activeModule === 'digital-id') return <Suspense fallback={<ModuleFallback />}><DigitalIdModule /></Suspense>;
  if (activeModule === 'campus-wallet') return <Suspense fallback={<ModuleFallback />}><CampusWalletModule /></Suspense>;
  if (activeModule === 'e-learning') return <Suspense fallback={<ModuleFallback />}><ELearningModule user={user} /></Suspense>;
  if (activeModule === 'exam-portal') return <Suspense fallback={<ModuleFallback />}><ExamPortalModule user={user} /></Suspense>;
  if (activeModule === 'complaint-portal') return <Suspense fallback={<ModuleFallback />}><ComplaintPortalModule user={user} /></Suspense>;
  return (
    <StudentOverview
      user={user}
      attendance={attendance}
      results={results}
      courses={courses}
      announcements={announcements}
      onOpenCourse={(course, tab) => setSelectedCourse({ course, initialTab: tab })}
    />
  );
}

function ModuleHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div><h1 className="text-2xl font-extrabold tracking-tight">{title}</h1><p className="text-sm text-muted-foreground mt-1">{subtitle}</p></div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }: any) {
  return (
    <Card className="p-10 text-center">
      <div className="inline-flex h-14 w-14 rounded-2xl bg-muted/60 items-center justify-center mb-4"><Icon className="h-7 w-7 text-muted-foreground" /></div>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{desc}</p>
    </Card>
  );
}

// Weekly timetable grid constants
const TIMETABLE_DAYS_ST = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMETABLE_PERIODS_ST = [1, 2, 3, 4, 5, 6, 7, 8];

// ---- Student Overview helpers (analytics) ----
const ATTENDANCE_COLOR: Record<string, string> = {
  Present: '#059669', // emerald
  Late: '#d97706',    // amber
  Absent: '#e11d48',  // rose
};
const ATTENDANCE_VALUE: Record<string, number> = {
  Present: 3,
  Late: 2,
  Absent: 1,
};
const GRADE_COLORS: Record<string, string> = {
  'A+': '#1a365d',
  'A': '#2c5282',
  'B': '#3182ce',
  'C': '#4299e1',
  'D': '#63b3ed',
  'F': '#e11d48',
};
const GRADE_ORDER = ['A+', 'A', 'B', 'C', 'D', 'F'];

function gradeBadgeClass(grade: string) {
  switch (grade) {
    case 'A+':
    case 'A':
      return 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20';
    case 'B':
      return 'text-primary bg-primary/10 border-primary/20';
    case 'C':
      return 'text-amber-700 bg-amber-500/10 border-amber-500/20';
    case 'D':
      return 'text-muted-foreground bg-muted/40 border-border';
    case 'F':
      return 'text-rose-700 bg-rose-500/10 border-rose-500/20';
    default:
      return 'text-muted-foreground bg-muted/40 border-border';
  }
}

function AttendanceTrendTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md">
      <div className="font-medium">Date: {p.label}</div>
      <div className="text-muted-foreground">Status: {p.status}</div>
    </div>
  );
}

// ============== Student Overview (course cards + analytics) ==============
function StudentOverview({ user, attendance, results, courses, announcements, onOpenCourse }: any) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStudentAnalytics()
      .then(setAnalytics)
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false));
  }, []);

  const kpi = analytics?.kpi;

  const kpiCards = [
    { label: 'Attendance', value: kpi ? kpi.attendanceRate + '%' : '—', sub: kpi ? `${kpi.totalSessions} sessions` : 'Loading…', icon: CalendarCheck },
    { label: 'Avg Score', value: kpi ? kpi.avgScore + '%' : '—', sub: kpi ? `${kpi.totalResults} results` : 'Loading…', icon: GraduationCap },
    { label: 'Fee Status', value: kpi ? `${kpi.paidInvoices}/${kpi.totalInvoices} paid` : '—', sub: kpi ? (Number(kpi.totalPending) > 0 ? `${fmtPKR(kpi.totalPending)} pending` : 'All cleared') : 'Loading…', icon: Wallet },
    { label: 'Courses', value: courses?.length || 0, sub: 'enrolled this term', icon: BookOpen },
  ];

  const quickActions = [
    { label: 'My Attendance', icon: CalendarCheck, desc: 'View attendance history', module: 'my-attendance' },
    { label: 'My Results', icon: GraduationCap, desc: 'Check exam results', module: 'my-results' },
    { label: 'Invoices', icon: CreditCard, desc: 'Download fee challan', module: 'my-invoices' },
    { label: 'Report Card', icon: Award, desc: 'View your report card', module: 'my-report-card' },
  ];

  const setActiveModule = useApp(s => s.setActiveModule);

  return (
    <div className="space-y-6">
      {/* 1. Welcome banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 sm:p-8 text-white">
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15"><GraduationCap className="h-3 w-3 text-primary/70" /> Student · {user?.class} {user?.section} · Roll #{user?.rollNo}</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Hi, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-white/80 text-sm mt-1.5">{user?.branchName} · {user?.instituteName}</p>
        </div>
      </motion.div>

      {/* 2. KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {kpiCards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-2.5 sm:p-3 border border-border rounded-lg shadow-sm hover:shadow-md transition">
              <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center mb-2"><c.icon className="h-5 w-5 text-primary" /></div>
              <div className="text-base font-bold tabular-nums">{c.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.label}</div>
              <div className="text-[11px] text-muted-foreground/80 mt-0.5 truncate">{c.sub}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 3. Quick Actions */}
      <div>
        <h2 className="font-bold text-base mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {quickActions.map((a, i) => (
            <motion.div key={a.module} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <div onClick={() => setActiveModule(a.module)} className="group cursor-pointer border border-border rounded-lg shadow-sm hover:shadow-md transition p-3 sm:p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center shrink-0"><a.icon className="h-4 w-4 text-primary" /></div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm">{a.label}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{a.desc}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition shrink-0" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 4. My Courses — larger cards on dashboard */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">My Courses</h2>
          <button onClick={() => setActiveModule('my-courses')} className="text-xs text-primary hover:underline font-medium">View all →</button>
        </div>
        {courses?.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="inline-flex h-12 w-12 rounded-2xl bg-muted/60 items-center justify-center mb-3"><BookOpen className="h-6 w-6 text-muted-foreground" /></div>
            <p className="text-sm text-muted-foreground">No courses assigned yet. Your Branch Manager will assign courses to your class.</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {courses?.slice(0, 4).map((c: any) => (
              <Card key={c.id} className="p-4 border border-border rounded-lg shadow-sm hover:shadow-md transition cursor-pointer group" onClick={() => onOpenCourse?.(c)}>
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center shrink-0"><BookOpen className="h-5 w-5 text-primary" /></div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm truncate">{c.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.code ? `Code: ${c.code}` : 'Course'}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// ============== Course Detail (Materials / Results / Attendance tabs) ==============
const COURSE_TABS = [
  { id: 'materials', label: 'Materials', icon: FileText },
  { id: 'results', label: 'Results', icon: GraduationCap },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
] as const;

function MyCoursesPage({ courses, onOpenCourse }: { courses: any[]; onOpenCourse?: (c: any) => void }) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="My Courses" subtitle={`${courses?.length || 0} course${courses?.length === 1 ? '' : 's'} enrolled this term`} />
      {courses?.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses assigned yet" desc="Your Branch Manager will assign courses to your class." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c: any) => (
            <Card key={c.id} className="p-4 border border-border rounded-lg shadow-sm hover:shadow-md transition cursor-pointer group" onClick={() => onOpenCourse?.(c)}>
              <div className="flex items-center gap-4 mb-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center shrink-0"><BookOpen className="h-5 w-5 text-primary" /></div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm truncate">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.code ? `Code: ${c.code}` : 'Course'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/40">
                <span className="text-xs text-muted-foreground">Click to view materials, results & attendance</span>
                <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CourseDetail({ course, classId, studentId, initialTab, onBack }: {
  course: Course;
  classId: string;
  studentId: string;
  initialTab: 'materials' | 'results' | 'attendance';
  onBack: () => void;
}) {
  const [tab, setTab] = useState(initialTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="h-9 w-9 grid place-items-center rounded-lg border border-border hover:bg-accent transition" title="Back to courses">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{course.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{course.code ? `Code ${course.code} · ` : ''}Course materials, results & attendance</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-muted/60 overflow-x-auto scroll-fancy">
        {COURSE_TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${active ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {tab === 'materials' && <CourseMaterialsView classId={classId} courseId={course.id} />}
          {tab === 'results' && <CourseResultsView courseId={course.id} studentId={studentId} />}
          {tab === 'attendance' && <CourseAttendanceView studentId={studentId} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function CourseMaterialsView({ classId, courseId }: { classId: string; courseId: string }) {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId || !courseId) return;
    api.getCourseMaterials({ classId, courseId })
      .then(setMaterials)
      .catch(() => setMaterials([]))
      .finally(() => setLoading(false));
  }, [classId, courseId]);

  if (!classId) {
    return <EmptyState icon={FileText} title="Class not found" desc="We couldn't resolve your class. Please contact your Branch Manager." />;
  }

  if (loading) {
    return <Card className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></Card>;
  }

  if (materials.length === 0) {
    return <EmptyState icon={FileText} title="No materials yet" desc="Your teacher hasn't uploaded any materials for this course yet. Check back later." />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{materials.length} material{materials.length === 1 ? '' : 's'} available</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {materials.map(m => <MaterialCard key={m.id} material={m} />)}
      </div>
    </div>
  );
}

function MaterialCard({ material }: { material: MaterialItem }) {
  const [downloading, setDownloading] = useState(false);
  const isLink = !!material.linkUrl;
  const Icon = isLink ? Link2 : FileText;
  const ext = material.fileName?.split('.').pop()?.toUpperCase() || (isLink ? 'LINK' : 'FILE');
  const createdAt = material.createdAt ? new Date(material.createdAt).toLocaleDateString() : '';

  const handleDownload = async () => {
    if (isLink && material.linkUrl) {
      window.open(material.linkUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setDownloading(true);
    try {
      const res = await api.downloadMaterialBlob(material.id);
      if ('linkUrl' in res) {
        window.open(res.linkUrl, '_blank', 'noopener,noreferrer');
      } else {
        const url = URL.createObjectURL(res.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.fileName || material.fileName || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      toast({ title: 'Download failed', description: e.message, variant: 'destructive' });
    } finally { setDownloading(false); }
  };

  return (
    <Card className="p-4 hover:shadow-md transition">
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-lg grid place-items-center shrink-0 ${isLink ? 'bg-accent0/15' : 'bg-accent0/15'}`}>
          <Icon className={`h-5 w-5 ${isLink ? 'text-primary' : 'text-primary'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="font-medium text-sm truncate">{material.title}</h4>
            <Badge variant="outline" className="text-[10px] font-mono shrink-0">{ext}</Badge>
          </div>
          {material.description && <p className="text-xs text-muted-foreground line-clamp-2">{material.description}</p>}
          <div className="text-[11px] text-muted-foreground mt-1">{createdAt}{isLink ? ' · External link' : ''}</div>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button size="sm" variant="outline" onClick={handleDownload} disabled={downloading}>
          {downloading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
          {isLink ? 'Open Link' : 'Download'}
        </Button>
      </div>
    </Card>
  );
}

function CourseResultsView({ courseId, studentId }: { courseId: string; studentId: string }) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getResults({ studentId })
      .then((r: any) => {
        const entries = r?.entries || [];
        // Filter to this course; backend may not return courseId on student-scoped results, so include all if courseId missing
        const filtered = entries.filter((e: any) => !e.courseId || e.courseId === courseId);
        setResults(filtered.length > 0 ? filtered : entries);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [courseId, studentId]);

  if (loading) return <Card className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></Card>;
  if (results.length === 0) {
    return <EmptyState icon={GraduationCap} title="No results yet" desc="Your teacher hasn't posted any results for this course yet." />;
  }

  return (
    <Card className="p-5">
      <div className="space-y-3">
        {results.map((r: any, idx: number) => (
          <div key={r.id || idx} className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-accent0/15 grid place-items-center shrink-0"><BookOpen className="h-4 w-4 text-primary" /></div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1"><span className="font-medium text-sm">{r.exam || 'Exam'}</span><span className="font-bold text-sm">{r.marks}/{r.totalMarks}</span></div>
              <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${r.percentage || (r.totalMarks ? (r.marks / r.totalMarks) * 100 : 0)}%` }} /></div>
              <div className="text-[11px] text-muted-foreground mt-1">{r.date}</div>
            </div>
            <Badge variant="outline" className="font-bold">{r.grade}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CourseAttendanceView({ studentId }: { studentId: string }) {
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAttendance({ studentId })
      .then(setAttendance)
      .catch(() => setAttendance(null))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <Card className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></Card>;
  if (!attendance || attendance.total === 0) {
    return <EmptyState icon={CalendarCheck} title="No attendance records" desc="Your teacher hasn't marked any attendance for you yet." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-4 text-center"><CheckCircle2 className="h-6 w-6 text-primary mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.present}</div><div className="text-xs text-muted-foreground">Present</div></Card>
        <Card className="p-4 text-center"><XCircle className="h-6 w-6 text-rose-600 mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.absent}</div><div className="text-xs text-muted-foreground">Absent</div></Card>
        <Card className="p-4 text-center"><Clock className="h-6 w-6 text-sky-700 mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.late}</div><div className="text-xs text-muted-foreground">Late</div></Card>
        <Card className="p-4 text-center bg-accent0/10"><CalendarCheck className="h-6 w-6 text-primary mx-auto mb-1" /><div className="text-2xl font-bold text-primary">{attendance.rate}%</div><div className="text-xs text-muted-foreground">Rate</div></Card>
      </div>
      <Card className="p-4">
        <Table>
          <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {(attendance.entries || []).map((e: any, idx: number) => (
              <TableRow key={e.id || idx}>
                <TableCell className="text-sm">{e.date}</TableCell>
                <TableCell><Badge variant="outline" className={e.status === 'Present' ? 'text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.2]' : e.status === 'Absent' ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-sky-700 bg-sky-500/10 border-sky-500/20'}>{e.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ============== MyAttendance (existing module) ==============
function MyAttendance({ attendance }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="My Attendance" subtitle="Your attendance record" />
      {!attendance || attendance.total === 0 ? (
        <EmptyState icon={CalendarCheck} title="No attendance records yet" desc="Your teachers haven't marked any attendance yet. Check back after your next class." />
      ) : (
        <>
          <div className="grid grid-cols-4 gap-3">
            <Card className="p-4 text-center"><CheckCircle2 className="h-6 w-6 text-primary mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.present}</div><div className="text-xs text-muted-foreground">Present</div></Card>
            <Card className="p-4 text-center"><XCircle className="h-6 w-6 text-rose-600 mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.absent}</div><div className="text-xs text-muted-foreground">Absent</div></Card>
            <Card className="p-4 text-center"><Clock className="h-6 w-6 text-sky-700 mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.late}</div><div className="text-xs text-muted-foreground">Late</div></Card>
            <Card className="p-4 text-center bg-accent0/10"><CalendarCheck className="h-6 w-6 text-primary mx-auto mb-1" /><div className="text-2xl font-bold text-primary">{attendance.rate}%</div><div className="text-xs text-muted-foreground">Rate</div></Card>
          </div>
          <Card className="p-4">
            <Table>
              <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Date</TableHead><TableHead>Class</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {(attendance.entries || []).map((e: any) => (
                  <TableRow key={e.id}><TableCell className="text-sm">{e.date}</TableCell><TableCell className="text-sm">{e.class}</TableCell>
                    <TableCell><Badge variant="outline" className={e.status === 'Present' ? 'text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.2]' : e.status === 'Absent' ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-sky-700 bg-sky-500/10 border-sky-500/20'}>{e.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}

function MyResults({ results }: any) {
  const resultsArray = Array.isArray(results) ? results : (results?.entries || []);
  return (
    <div className="space-y-6">
      <ModuleHeader title="My Results" subtitle="All your test & exam results" />
      {resultsArray.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No results posted yet" desc="Your teachers haven't posted any results yet. Check back after your next exam." />
      ) : (
        <Card className="p-5">
          <div className="space-y-3">
            {resultsArray.map((r: any) => {
              const pct = r.percentage || (r.totalMarks ? Math.round(r.marks / r.totalMarks * 1000) / 10 : 0);
              return (
              <div key={r.id} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-accent0/15 grid place-items-center shrink-0"><BookOpen className="h-4 w-4 text-primary" /></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1"><span className="font-medium text-sm">{r.subject || r.exam}</span><span className="font-bold text-sm">{r.marks}/{r.totalMarks}</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                  <div className="text-[11px] text-muted-foreground mt-1">{r.exam} · {r.date}</div>
                </div>
                <Badge variant="outline" className="font-bold">{r.grade}</Badge>
              </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function MyTimetable({ user, classId }: { user: any; classId: string }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) { return; }
    api.getTimetable({ classId })
      .then(r => setEntries(Array.isArray(r) ? r : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [classId]);

  const entryMap = useMemo(() => {
    const m = new Map<string, any>();
    entries.forEach(e => { if (e?.day && e?.period) m.set(`${e.day}-${e.period}`, e); });
    return m;
  }, [entries]);

  const subtitle = user?.class
    ? `Weekly schedule for ${user.class}${user?.section ? ` · ${user.section}` : ''}`
    : 'Your weekly class schedule';

  return (
    <div className="space-y-6">
      <ModuleHeader title="My Timetable" subtitle={subtitle} />

      {loading ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
          Loading your timetable…
        </Card>
      ) : !classId ? (
        <EmptyState
          icon={Calendar}
          title="Class not resolved"
          desc="We couldn't resolve your class. Please contact your Branch Manager."
        />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Timetable not published yet"
          desc="Your timetable hasn't been published yet. Your Branch Manager will publish it soon."
        />
      ) : (
        <Card className="p-0 overflow-hidden border border-border rounded-lg shadow-sm">
          <div className="overflow-x-auto scroll-fancy">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="bg-primary text-primary-foreground font-semibold p-2 text-left sticky left-0 z-10 w-20 min-w-[80px]">Period</th>
                  {TIMETABLE_DAYS_ST.map(d => (
                    <th key={d} className="bg-primary text-primary-foreground font-semibold p-2 text-left min-w-[160px]">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIMETABLE_PERIODS_ST.map(p => (
                  <tr key={p}>
                    <td className="bg-muted/40 font-bold text-primary p-2 sticky left-0 z-10 border-r border-border text-center">P{p}</td>
                    {TIMETABLE_DAYS_ST.map(d => {
                      const e = entryMap.get(`${d}-${p}`);
                      return (
                        <td key={d} className="border border-border p-2 align-top h-[72px]">
                          {e ? (
                            <div className="h-full">
                              <div className="font-semibold text-primary text-[13px] truncate">{e.subject || '(no subject)'}</div>
                              <div className="text-[11px] text-muted-foreground truncate">{e.teacherName || '—'}</div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {e.roomName ? `Room ${e.roomName}` : ''}
                                {e.startTime && e.endTime ? `${e.roomName ? ' · ' : ''}${e.startTime}–${e.endTime}` : ''}
                              </div>
                            </div>
                          ) : (
                            <div className="h-full grid place-items-center text-muted-foreground/40 text-sm">—</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 text-[11px] text-muted-foreground border-t border-border bg-muted/20">
            {entries.length} class slot{entries.length === 1 ? '' : 's'} this week · Follow the room and time shown for each period.
          </div>
        </Card>
      )}
    </div>
  );
}

function MyDiary({ diary }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Diary & Homework" subtitle="Assignments from your teachers" />
      {diary.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No diary entries yet" desc="Your teachers haven't posted any homework or assignments yet." />
      ) : (
        <div className="space-y-3">
          {diary.map((d: any) => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div><div className="font-medium text-sm">{d.title}</div><div className="text-[11px] text-muted-foreground">{d.subject} · {d.class} · {d.date}</div></div>
                <Badge variant="outline" className={d.due ? 'text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.2]' : 'text-muted-foreground'}>{d.due || 'No deadline'}</Badge>
              </div>
              {d.desc && <p className="text-sm text-muted-foreground">{d.desc}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MyAnnouncements({ announcements, loading }: { announcements: Announcement[]; loading: boolean }) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Announcements" subtitle="Notices from your teachers, branch & institute" />
      {loading ? (
        <Card className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></Card>
      ) : announcements.length === 0 ? (
        <EmptyState icon={Inbox} title="No announcements" desc="You're all caught up! New announcements will appear here." />
      ) : (
        <div className="space-y-3">
          {announcements.map(a => <AnnouncementCard key={a.id} a={a} />)}
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({ a }: { a: Announcement }) {
  const date = a.createdAt ? new Date(a.createdAt).toLocaleString() : '';
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <h4 className="font-semibold text-sm">{a.title}</h4>
        <Badge variant="outline" className="text-[10px] capitalize shrink-0">{a.targetScope || 'all'}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{a.message}</p>
      <div className="text-[11px] text-muted-foreground mt-2">{date}{a.senderRole ? ` · from ${a.senderRole}` : ''}</div>
    </Card>
  );
}

// ============== My Invoices (with PDF challan) ==============
const fmtPKR = (n: number) => 'PKR ' + (Number(n) || 0).toLocaleString('en-PK');

// Generate the challan HTML (used by the html2pdf renderer + the fallback print path)
function buildChallanHTML(challan: any, instituteName?: string): string {
  const amount = Number(challan.amount || 0);
  const status = String(challan.status || 'unpaid').toLowerCase();
  const isPaid = status === 'paid';
  const today = new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });
  const escape = (v: any) => String(v ?? '—').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
  const institute = instituteName?.trim() || challan.instituteName?.trim() || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Fee Challan ${escape(challan.challanNo || '')}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; background: #ffffff; color: #1f2937; padding: 20px; }
  .challan { max-width: 680px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
  .top-bar { background: #1a365d; color: #fff; padding: 20px 32px; display: flex; justify-content: space-between; align-items: center; }
  .top-bar .inst { font-size: 22px; font-weight: 700; }
  .top-bar .inst-sub { font-size: 10px; color: #a0aec0; margin-top: 2px; letter-spacing: 1px; text-transform: uppercase; }
  .top-bar .challan-title { text-align: right; }
  .top-bar .challan-title h2 { font-size: 18px; font-weight: 700; }
  .top-bar .challan-title span { font-size: 10px; color: #a0aec0; }
  .body { padding: 28px 32px; }
  .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
  .info-row:last-child { border-bottom: none; }
  .info-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; min-width: 140px; }
  .info-value { font-size: 13px; font-weight: 600; color: #111827; text-align: right; flex: 1; }
  .amount-box { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 24px 0; display: flex; justify-content: space-between; align-items: center; }
  .amount-box .lbl { font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .amount-box .val { font-size: 24px; font-weight: 800; color: #1a365d; }
  .status-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge-paid { background: #d1fae5; color: #065f46; }
  .badge-unpaid { background: #fee2e2; color: #991b1b; }
  .signatures { display: flex; justify-content: space-between; margin-top: 48px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  .sig { text-align: center; }
  .sig-line { width: 200px; height: 1px; background: #d1d5db; margin: 0 auto 6px; }
  .sig-label { font-size: 11px; color: #6b7280; }
  .footer { background: #f9fafb; padding: 12px 32px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  .footer strong { color: #1a365d; }
</style>
</head>
<body>
  <div class="challan">
    <div class="top-bar">
      <div>
        <div class="inst">${escape(institute || 'Concordia College')}</div>
        <div class="inst-sub">Official Fee Challan</div>
      </div>
      <div class="challan-title">
        <h2>FEE CHALLAN</h2>
        <span>${escape(challan.challanNo || '—')}</span>
      </div>
    </div>
    <div class="body">
      <div class="info-row">
        <span class="info-label">Student Name</span>
        <span class="info-value">${escape(challan.studentName || challan.student || '—')}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Class</span>
        <span class="info-value">${escape(challan.className || challan.class || '—')}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Roll No</span>
        <span class="info-value">${escape(challan.rollNo || '—')}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Month / Year</span>
        <span class="info-value">${escape(challan.month || '—')}${challan.year ? ' ' + escape(challan.year) : ''}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date Issued</span>
        <span class="info-value">${today}</span>
      </div>
      <div class="amount-box">
        <span class="lbl">Amount Payable</span>
        <span class="val">PKR ${amount.toLocaleString('en-PK')}</span>
      </div>
      <div class="status-bar">
        <span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Status</span>
        <span class="badge ${isPaid ? 'badge-paid' : 'badge-unpaid'}">${status.toUpperCase()}</span>
        ${challan.paidDate ? `<span style="font-size:12px;color:#374151;">Paid on ${escape(challan.paidDate)}</span>` : ''}
        ${challan.paymentMethod ? `<span style="font-size:12px;color:#374151;">via ${escape(challan.paymentMethod)}</span>` : ''}
      </div>
      <div class="signatures">
        <div class="sig"><div class="sig-line"></div><div class="sig-label">Student Signature</div></div>
        <div class="sig"><div class="sig-line"></div><div class="sig-label">Authorized Signature</div></div>
      </div>
    </div>
    <div class="footer">Powered by <strong>Concordia College</strong></div>
  </div>
</body>
</html>`;
}

// Fallback: print the challan via a hidden iframe (only used if html2pdf fails).
function printChallanInIframe(html: string) {
  let iframe = document.getElementById('esm-challan-frame') as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'esm-challan-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('title', 'Concordia College challan print frame');
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    toast({ title: 'Print unavailable', description: 'Your browser blocked the print frame.', variant: 'destructive' });
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const win = iframe.contentWindow;
  setTimeout(() => {
    try { win?.focus(); win?.print(); }
    catch {
      toast({ title: 'Print failed', description: 'Please allow popups / printing for this site.', variant: 'destructive' });
    }
  }, 300);
}

// Generate an actual PDF file using jsPDF + html2canvas (no print dialog, ever).
// This directly creates a PDF Blob and triggers a browser download — no print popup.
async function downloadChallanPDF(challan: any, instituteName?: string): Promise<{ via: 'pdf' | 'error' }> {
  const html = buildChallanHTML(challan, instituteName);
  const challanNo = String(challan.challanNo || challan.id?.slice?.(-8) || 'challan').replace(/[^A-Za-z0-9_-]/g, '_');

  // Build a temporary off-screen container so html2canvas can render the styled challan.
  // Use an iframe to fully isolate the challan HTML from the parent page's CSS (which uses
  // oklch/lab color functions that html2canvas can't parse).
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-99999px';
  iframe.style.top = '0';
  iframe.style.width = '800px';
  iframe.style.height = '600px';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return { via: 'error' };
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for the iframe content to render
  await new Promise(resolve => setTimeout(resolve, 200));

  const challanEl = iframeDoc.querySelector('.challan') as HTMLElement | null;
  const renderEl: HTMLElement = challanEl || iframeDoc.body;

  try {
    // Dynamically import jsPDF and html2canvas (client-side only)
    const { default: jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    // Render the challan element to a canvas at high resolution
    // Use the iframe's contentWindow so html2canvas reads only the iframe's CSS (no oklch)
    const canvas = await html2canvas(renderEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 800,
      // @ts-expect-error — html2canvas accepts a `window` option but its types don't expose it
      window: iframe.contentWindow,
    });

    // Create a jsPDF instance (A4 portrait)
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10; // 10mm margin
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // If the content is taller than one page, split it across multiple pages
    if (imgHeight <= pageHeight - margin * 2) {
      // Single page — just add the image
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
    } else {
      // Multi-page: slice the canvas into page-sized chunks
      const pageContentHeight = pageHeight - margin * 2;
      const pxPerMm = canvas.width / imgWidth;
      const pageContentHeightPx = pageContentHeight * pxPerMm;
      let remainingHeight = canvas.height;
      let offset = 0;

      while (remainingHeight > 0) {
        // Create a slice canvas for this page
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.min(pageContentHeightPx, remainingHeight);
        const ctx = sliceCanvas.getContext('2d');
        if (!ctx) break;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(canvas, 0, offset, canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);

        const imgData = sliceCanvas.toDataURL('image/jpeg', 0.98);
        const sliceHeightMm = (sliceCanvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, sliceHeightMm);

        remainingHeight -= sliceCanvas.height;
        offset += sliceCanvas.height;
        if (remainingHeight > 0) pdf.addPage();
      }
    }

    // Save the PDF directly — this triggers a browser download, NOT a print dialog
    pdf.save(`Challan-${challanNo}.pdf`);
    return { via: 'pdf' };
  } catch (err: any) {
    console.error('PDF generation failed:', err);
    return { via: 'error' };
  } finally {
    try { document.body.removeChild(iframe); } catch {}
  }
}

function MyInvoices({ user }: { user: any }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    api.getFeeInvoices()
      .then(r => setInvoices(Array.isArray(r) ? r : []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [user?.id]);

  const stats = useMemo(() => {
    const total = invoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const paid = invoices.filter(i => String(i.status).toLowerCase() === 'paid').reduce((acc, i) => acc + (Number(i.paidAmount || i.amount) || 0), 0);
    const pending = total - paid;
    return { total, paid, pending, count: invoices.length, paidCount: invoices.filter(i => String(i.status).toLowerCase() === 'paid').length };
  }, [invoices]);

  const downloadChallan = async (inv: any) => {
    setDownloadingId(inv.id);
    try {
      const challan = await api.getChallanData(inv.id);
      // Merge with invoice data as a fallback so the PDF is complete even if the challan endpoint returns a partial payload
      const merged = { ...inv, ...challan };
      // Prefer the challan endpoint's instituteName (authoritative), fall back to user's instituteName
      const instituteName = challan.instituteName || user?.instituteName;
      const result = await downloadChallanPDF(merged, instituteName);
      if (result.via === 'pdf') {
        toast({ title: 'Challan downloaded', description: `Challan-${merged.challanNo || inv.id?.slice(-8)}.pdf saved to your downloads.` });
      } else {
        toast({ title: 'Download failed', description: 'Could not generate the PDF. Please try again.', variant: 'destructive' });
      }
    } catch {
      // Fallback: generate PDF using the invoice data we already have
      try {
        const result = await downloadChallanPDF(inv, user?.instituteName);
        if (result.via === 'pdf') {
          toast({ title: 'Challan downloaded', description: `Challan-${inv.challanNo || inv.id?.slice(-8)}.pdf saved to your downloads.` });
        } else {
          toast({ title: 'Download failed', description: 'Could not generate the PDF. Please try again.', variant: 'destructive' });
        }
      } catch {
        toast({ title: 'Failed', description: 'Could not generate the challan PDF. Please try again.', variant: 'destructive' });
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const cards = [
    { label: 'Total Paid', value: fmtPKR(stats.paid), icon: CheckCircle2, color: 'from-primary to-primary/80', sub: `${stats.paidCount} invoice${stats.paidCount === 1 ? '' : 's'}` },
    { label: 'Total Pending', value: fmtPKR(stats.pending), icon: Clock, color: 'from-rose-500 to-rose-700', sub: `${stats.count - stats.paidCount} invoice${stats.count - stats.paidCount === 1 ? '' : 's'}` },
    { label: 'Total Amount', value: fmtPKR(stats.total), icon: Wallet, color: 'from-primary/80 to-primary', sub: `${stats.count} invoice${stats.count === 1 ? '' : 's'}` },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader title="My Invoices" subtitle="View your monthly fee invoices and download challan PDFs" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-2.5 sm:p-3 border border-border rounded-lg shadow-sm hover:shadow-md transition">
              <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center mb-2"><c.icon className="h-5 w-5 text-primary" /></div>
              <div className="text-2xl font-extrabold tabular-nums">{c.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.label} · {c.sub}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-base">Invoice History</h3>
          </div>
          <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading invoices…
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState icon={DollarSign} title="No invoices yet" desc="Your monthly fee invoices will appear here once your Branch Manager generates them." />
        ) : (
          <div className="max-h-[60vh] overflow-y-auto scroll-fancy -mx-4 px-4">
            <Table>
              <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40 sticky top-0">
                <TableHead>Month</TableHead>
                <TableHead className="hidden sm:table-cell">Year</TableHead>
                <TableHead className="hidden md:table-cell">Challan No.</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {invoices.map(inv => {
                  const isPaid = String(inv.status).toLowerCase() === 'paid';
                  return (
                    <TableRow key={inv.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-sm">{inv.month || '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{inv.year || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">{inv.challanNo || inv.id?.slice(-8)}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{fmtPKR(Number(inv.amount) || 0)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={isPaid ? 'text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.3]' : 'text-rose-700 bg-rose-500/10 border-rose-500/30'}>
                          {isPaid ? 'Paid' : 'Unpaid'}
                        </Badge>
                        {isPaid && inv.paidDate && <div className="text-[10px] text-muted-foreground mt-0.5">{inv.paidDate}</div>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="h-8 text-xs border-[oklch(0.5_0.04_260)_/_0.4] text-primary hover:bg-accent0/10" disabled={downloadingId === inv.id} onClick={() => downloadChallan(inv)}>
                          {downloadingId === inv.id ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Preparing…</> : <><Download className="h-3 w-3 mr-1" /> Download Challan</>}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Card className="p-4 bg-accent dark:bg-[oklch(0.12_0.03_260)_/_0.3] border-accent dark:border-[oklch(0.2_0.04_260)]">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-accent0/20 grid place-items-center shrink-0"><Download className="h-4 w-4 text-primary dark:text-[oklch(0.6_0.04_260)]" /></div>
          <div>
            <div className="font-bold text-sm text-primary dark:text-[oklch(0.8_0.03_260)]">Download your challan PDF</div>
            <p className="text-xs text-primary dark:text-primary/70 mt-1 leading-relaxed">
              Click <b>Download Challan</b> on any invoice and a real PDF file is generated and saved directly to your
              downloads folder — no print dialog, no extra steps. The challan includes the institute name, fee details,
              status, and a <b>"Powered by Concordia College"</b> footer.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============== My Report Card ==============
function MyReportCard({ user }: { user: any }) {
  const [report, setReport] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    api.generateReportCard(user.id, 'Current Term')
      .then((r: any) => { if (!cancelled) setReport(r as ReportCardData); })
      .catch((e: any) => { if (!cancelled) setError(e?.message || 'Failed to load report card'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id]);

  const instituteName = user?.instituteName;
  const subjects = Array.isArray(report?.subjects) ? (report?.subjects || []) : [];
  const isEmpty = !loading && !error && report && subjects.length === 0;

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="My Report Card"
        subtitle="Auto-generated from your posted exam results · Current Term"
        actions={
          <ReportCardActions report={report} instituteName={instituteName} disabled={loading || !!isEmpty} />
        }
      />

      {loading && (
        <Card className="p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2 border border-border rounded-lg shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Generating your report card…
        </Card>
      )}

      {!loading && error && (
        <EmptyState icon={Award} title="Couldn't load report card" desc={error || 'Please try again later.'} />
      )}

      {!loading && !error && isEmpty && (
        <EmptyState
          icon={Award}
          title="No results published yet"
          desc="Your teachers need to post exam results before a report card can be generated."
        />
      )}

      {!loading && !error && report && subjects.length > 0 && (
        <ReportCardDocument report={report} instituteName={instituteName} />
      )}
    </div>
  );
}
