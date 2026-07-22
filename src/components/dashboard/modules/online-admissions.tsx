'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  UserPlus, FileText, Calendar, CheckCircle2, XCircle, Clock, Upload,
  Share2, Settings, ChevronRight, Filter, Download, Eye, Inbox,
} from 'lucide-react';
import { ModuleHeader } from './students';

// ── Types ──────────────────────────────────────────────────────────────
type PipelineStage = 'New' | 'Under Review' | 'Test Scheduled' | 'Interview' | 'Accepted' | 'Rejected';

type Applicant = {
  id: string;
  name: string;
  fatherName: string;
  program: string;
  className: string;
  stage: PipelineStage;
  date: string;
  email: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: 'deadline' | 'test' | 'interview' | 'merit';
  description: string;
};

// ── UI scaffolding (no fake data — only static stage/event metadata) ───
const STAGES: { key: PipelineStage; label: string; color: string; gradient: string }[] = [
  { key: 'New', label: 'New', color: 'text-blue-600 bg-blue-500/10 border-blue-500/20', gradient: 'from-blue-500 to-blue-600' },
  { key: 'Under Review', label: 'Under Review', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20', gradient: 'from-amber-500 to-amber-600' },
  { key: 'Test Scheduled', label: 'Test Scheduled', color: 'text-violet-600 bg-violet-500/10 border-violet-500/20', gradient: 'from-violet-500 to-violet-600' },
  { key: 'Interview', label: 'Interview', color: 'text-teal-600 bg-teal-500/10 border-teal-500/20', gradient: 'from-teal-500 to-teal-600' },
  { key: 'Accepted', label: 'Accepted', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20', gradient: 'from-emerald-500 to-emerald-600' },
  { key: 'Rejected', label: 'Rejected', color: 'text-rose-600 bg-rose-500/10 border-rose-500/20', gradient: 'from-rose-500 to-rose-600' },
];

const stageColor: Record<string, string> = {
  'New': 'text-blue-600 bg-blue-500/10 border-blue-500/20',
  'Under Review': 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  'Test Scheduled': 'text-violet-600 bg-violet-500/10 border-violet-500/20',
  'Interview': 'text-teal-600 bg-teal-500/10 border-teal-500/20',
  'Accepted': 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
  'Rejected': 'text-rose-600 bg-rose-500/10 border-rose-500/20',
};

const stageIcon: Record<string, React.ReactNode> = {
  'New': <FileText className="h-3 w-3" />,
  'Under Review': <Eye className="h-3 w-3" />,
  'Test Scheduled': <Calendar className="h-3 w-3" />,
  'Interview': <UserPlus className="h-3 w-3" />,
  'Accepted': <CheckCircle2 className="h-3 w-3" />,
  'Rejected': <XCircle className="h-3 w-3" />,
};

const eventTypeColor: Record<string, string> = {
  deadline: 'border-rose-400 bg-rose-500/5',
  test: 'border-violet-400 bg-violet-500/5',
  interview: 'border-teal-400 bg-teal-500/5',
  merit: 'border-emerald-400 bg-emerald-500/5',
};

const eventTypeIcon: Record<string, React.ReactNode> = {
  deadline: <Clock className="h-4 w-4 text-rose-500" />,
  test: <FileText className="h-4 w-4 text-violet-500" />,
  interview: <UserPlus className="h-4 w-4 text-teal-500" />,
  merit: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
};

const eventTypeBadge: Record<string, string> = {
  deadline: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
  test: 'text-violet-600 bg-violet-500/10 border-violet-500/20',
  interview: 'text-teal-600 bg-teal-500/10 border-teal-500/20',
  merit: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
};

// ── Empty-state component ──────────────────────────────────────────────
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

// ── Component ──────────────────────────────────────────────────────────

export function OnlineAdmissions({ user }: { user: any }) {
  const [pipelineFilter, setPipelineFilter] = useState<PipelineStage | 'all'>('all');

  // NOTE: A dedicated `/api/admissions` endpoint does not exist yet.
  // Until it ships, the portal renders honest empty states across every section.
  // When the endpoint is added, swap `applicants` and `calendarEvents` for the
  // real API response and the stats / pipeline / table / calendar below will
  // populate automatically — no UI changes required.
  const applicants: Applicant[] = [];
  const calendarEvents: CalendarEvent[] = [];

  // ── Stats (all 0 with empty data) ──
  const totalApplications = applicants.length;
  const pendingReview = applicants.filter(a => a.stage === 'New' || a.stage === 'Under Review').length;
  const accepted = applicants.filter(a => a.stage === 'Accepted').length;
  const rejected = applicants.filter(a => a.stage === 'Rejected').length;
  const conversionRate = totalApplications > 0 ? ((accepted / totalApplications) * 100).toFixed(1) : '0.0';

  const statsCards = [
    { label: 'Total Applications', value: totalApplications, icon: FileText, color: 'from-emerald-500 to-teal-600' },
    { label: 'Pending Review', value: pendingReview, icon: Clock, color: 'from-amber-500 to-yellow-600' },
    { label: 'Accepted', value: accepted, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Rejected', value: rejected, icon: XCircle, color: 'from-rose-500 to-red-600' },
    { label: 'Conversion Rate', value: `${conversionRate}%`, icon: UserPlus, color: 'from-violet-500 to-purple-600' },
  ];

  // ── Pipeline data (counts will be 0 per stage) ──
  const pipelineData = STAGES.map(stage => ({
    ...stage,
    count: applicants.filter(a => a.stage === stage.key).length,
    applicants: applicants.filter(a => a.stage === stage.key),
  }));

  const filteredPipeline = pipelineFilter === 'all'
    ? pipelineData
    : pipelineData.filter(s => s.key === pipelineFilter);

  const recentApplications = [...applicants].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <ModuleHeader
        title="Online Admissions"
        subtitle="PGC-parity admission portal — from application to enrollment, fully online"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1.5" /> Export
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1.5" /> Filter
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700">
              <UserPlus className="h-4 w-4 mr-1.5" /> New Application
            </Button>
          </div>
        }
      />

      {/* ─── 1. Stats Overview ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statsCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35 }}
          >
            <Card className="p-4 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${s.color} opacity-10 blur-2xl group-hover:opacity-20 transition`} />
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.color} grid place-items-center mb-3 shadow-sm`}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-extrabold font-display">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ─── 2. Application Pipeline ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-emerald-500" />
                Application Pipeline
              </CardTitle>
              <div className="flex gap-1.5 flex-wrap">
                <Button
                  size="sm"
                  variant={pipelineFilter === 'all' ? 'default' : 'outline'}
                  className="h-7 text-xs"
                  onClick={() => setPipelineFilter('all')}
                >
                  All
                </Button>
                {STAGES.map(s => (
                  <Button
                    key={s.key}
                    size="sm"
                    variant={pipelineFilter === s.key ? 'default' : 'outline'}
                    className="h-7 text-xs"
                    onClick={() => setPipelineFilter(pipelineFilter === s.key ? 'all' : s.key)}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Pipeline visual flow */}
            <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-2">
              {pipelineData.map((stage, i) => (
                <div key={stage.key} className="flex items-center shrink-0">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition hover:shadow-sm ${
                      pipelineFilter === stage.key ? 'ring-2 ring-primary/30 border-primary/40' : 'border-border/60'
                    } ${stage.color.split(' ').slice(1).join(' ')}`}
                    onClick={() => setPipelineFilter(pipelineFilter === stage.key ? 'all' : stage.key)}
                  >
                    <div className={`h-7 w-7 rounded-md bg-gradient-to-br ${stage.gradient} grid place-items-center`}>
                      {stageIcon[stage.key]}
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold leading-tight">{stage.label}</div>
                      <div className="text-lg font-extrabold leading-none font-display">{stage.count}</div>
                    </div>
                  </motion.div>
                  {i < pipelineData.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 mx-0.5 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Pipeline cards grid (empty) */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 min-h-[200px]">
              {filteredPipeline.some(s => s.applicants.length > 0) ? (
                filteredPipeline.map(stage =>
                  stage.applicants.map((applicant, idx) => (
                    <motion.div
                      key={applicant.id}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="rounded-xl border border-border/60 p-3 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-sm leading-tight">{applicant.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{applicant.id}</div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${stageColor[applicant.stage]}`}>
                          {stageIcon[applicant.stage]}
                          <span className="ml-1">{applicant.stage}</span>
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5"><FileText className="h-3 w-3" /> {applicant.program} · {applicant.className}</div>
                        <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {applicant.date}</div>
                      </div>
                    </motion.div>
                  ))
                )
              ) : (
                <div className="col-span-full">
                  <EmptyState
                    icon={Inbox}
                    title="No applications in this stage"
                    description="Applications submitted via your online admission form will appear here as they move through the pipeline."
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── 3. Recent Applications Table ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-500" />
              Recent Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs">Applicant</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Father Name</TableHead>
                    <TableHead className="text-xs">Program</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Class</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentApplications.length > 0 ? (
                    recentApplications.map((app) => (
                      <TableRow key={app.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center text-white text-[10px] font-bold shrink-0">
                              {app.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{app.name}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">{app.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{app.fatherName}</TableCell>
                        <TableCell className="text-sm">{app.program}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{app.className}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${stageColor[app.stage]}`}>
                            {stageIcon[app.stage]}
                            <span className="ml-1">{app.stage}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{app.date}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" title="Review">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700" title="Approve">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700" title="Reject">
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="p-0">
                        <EmptyState
                          icon={Inbox}
                          title="No applications yet"
                          description="Applications submitted via your online admission form will appear here."
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── 4. Admission Form Builder ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Settings className="h-4 w-4 text-emerald-500" />
                Admission Form Builder
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-1.5" /> Share Admission Link
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700">
                  <Settings className="h-4 w-4 mr-1.5" /> Customize Form
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="personal" className="text-xs">Personal Info</TabsTrigger>
                <TabsTrigger value="academic" className="text-xs">Academic Info</TabsTrigger>
                <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="mt-0">
                <div className="rounded-xl border border-border/60 p-4 bg-muted/20">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Full Name', placeholder: 'Enter student full name', active: true },
                      { label: 'Father / Guardian Name', placeholder: 'Enter father/guardian name', active: true },
                      { label: 'Date of Birth', placeholder: 'DD/MM/YYYY', active: true },
                      { label: 'Gender', placeholder: 'Select gender', active: true },
                      { label: 'CNIC / B-Form No.', placeholder: 'XXXXX-XXXXXXX-X', active: true },
                      { label: 'Phone Number', placeholder: '+92 XXX XXXXXXX', active: true },
                      { label: 'Email Address', placeholder: 'student@email.com', active: false },
                      { label: 'Home Address', placeholder: 'Full address', active: true },
                    ].map(field => (
                      <div key={field.label} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
                          <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${field.active ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20'}`}>
                            {field.active ? 'Active' : 'Optional'}
                          </Badge>
                        </div>
                        <div className="h-9 rounded-lg border border-border/60 bg-background px-3 flex items-center text-xs text-muted-foreground/60">
                          {field.placeholder}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="academic" className="mt-0">
                <div className="rounded-xl border border-border/60 p-4 bg-muted/20">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Program Applied', placeholder: 'Science / Arts / Commerce', active: true },
                      { label: 'Class / Grade', placeholder: 'Select class', active: true },
                      { label: 'Previous School', placeholder: 'Enter previous school name', active: true },
                      { label: 'Previous Class', placeholder: 'Last attended class', active: true },
                      { label: 'Previous Result (%)', placeholder: 'Percentage marks', active: true },
                      { label: 'Board / Affiliation', placeholder: 'Board name', active: false },
                      { label: 'Subjects of Interest', placeholder: 'Select subjects', active: true },
                      { label: 'Extra-Curricular', placeholder: 'Sports, clubs, etc.', active: false },
                    ].map(field => (
                      <div key={field.label} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
                          <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${field.active ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20'}`}>
                            {field.active ? 'Active' : 'Optional'}
                          </Badge>
                        </div>
                        <div className="h-9 rounded-lg border border-border/60 bg-background px-3 flex items-center text-xs text-muted-foreground/60">
                          {field.placeholder}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="mt-0">
                <div className="rounded-xl border border-border/60 p-4 bg-muted/20">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { label: 'Birth Certificate', required: true },
                      { label: 'CNIC / B-Form Copy', required: true },
                      { label: 'Father CNIC Copy', required: true },
                      { label: 'Previous Result Card', required: true },
                      { label: 'School Leaving Certificate', required: false },
                      { label: 'Passport Size Photos', required: true },
                    ].map(doc => (
                      <div
                        key={doc.label}
                        className="rounded-xl border border-dashed border-border/80 p-4 flex flex-col items-center justify-center gap-2 min-h-[120px] hover:border-emerald-500/40 hover:bg-emerald-500/5 transition cursor-pointer"
                      >
                        <div className="h-10 w-10 rounded-lg bg-muted/60 grid place-items-center">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="text-xs font-medium text-center">{doc.label}</div>
                        <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${doc.required ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20'}`}>
                          {doc.required ? 'Required' : 'Optional'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── 5. Admission Calendar ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-500" />
              Admission Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {calendarEvents.length > 0 ? (
              <div className="relative pl-6 space-y-0">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-500 via-teal-500 to-violet-500 rounded-full" />
                {calendarEvents.map((evt, i) => (
                  <motion.div
                    key={evt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="relative pb-6 last:pb-0"
                  >
                    <div className={`absolute -left-6 top-1.5 h-5 w-5 rounded-full border-2 ${
                      evt.type === 'deadline' ? 'border-rose-500 bg-rose-500/20' :
                      evt.type === 'test' ? 'border-violet-500 bg-violet-500/20' :
                      evt.type === 'interview' ? 'border-teal-500 bg-teal-500/20' :
                      'border-emerald-500 bg-emerald-500/20'
                    } grid place-items-center`}>
                      <div className={`h-2 w-2 rounded-full ${
                        evt.type === 'deadline' ? 'bg-rose-500' :
                        evt.type === 'test' ? 'bg-violet-500' :
                        evt.type === 'interview' ? 'bg-teal-500' :
                        'bg-emerald-500'
                      }`} />
                    </div>
                    <div className={`rounded-xl border-l-4 p-4 ${eventTypeColor[evt.type]}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">{eventTypeIcon[evt.type]}</div>
                          <div>
                            <div className="font-semibold text-sm">{evt.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{evt.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={`text-[10px] ${eventTypeBadge[evt.type]}`}>
                            {evt.type === 'deadline' ? 'Deadline' :
                             evt.type === 'test' ? 'Test' :
                             evt.type === 'interview' ? 'Interview' : 'Merit List'}
                          </Badge>
                          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{evt.date}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No admission events scheduled"
                description="Important dates — application deadlines, entry tests, interviews and merit lists — will be listed here once they are added for the upcoming session."
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
