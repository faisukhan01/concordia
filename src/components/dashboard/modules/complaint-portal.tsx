'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircleWarning,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Star,
  ChevronDown,
  MessageSquare,
  ShieldCheck,
  Plus,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  Inbox,
} from 'lucide-react';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────
type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved' | 'Escalated' | 'Closed';

interface Complaint {
  id: string;
  subject: string;
  message: string;
  status: ComplaintStatus | string;
  createdAt?: string;
  date: string;
  response?: string | null;
  respondedAt?: string | null;
  // Context (used for filtering / display only)
  parentId?: string;
  instituteId?: string;
  branchId?: string;
}

// ── Style Maps ─────────────────────────────────────────────────────────
const statusStyle: Record<string, string> = {
  Open: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
  'In Progress': 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  Resolved: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
  Escalated: 'text-orange-600 bg-orange-500/10 border-orange-500/20',
  Closed: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
};

const statusDot: Record<string, string> = {
  Open: 'bg-rose-500',
  'In Progress': 'bg-amber-500',
  Resolved: 'bg-emerald-500',
  Escalated: 'bg-orange-500',
  Closed: 'bg-slate-500',
};

// ── Shared state components ────────────────────────────────────────────
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

// ── Helpers ────────────────────────────────────────────────────────────

/** Build a query-params object for /api/complaints based on the user's role. */
function buildComplaintParams(user: any): { parentId?: string; instituteId?: string; branchId?: string } {
  if (!user) return {};
  const role = user.role;
  if (role === 'institute-admin') return { instituteId: user.instituteId };
  if (role === 'branch-manager') return { branchId: user.branchId };
  if (role === 'super-admin') return {}; // see all
  // students, parents, teachers → their own complaints
  return { parentId: user.id };
}

/** True for roles that can post an admin response to a complaint. */
function canRespond(user: any): boolean {
  return user?.role === 'branch-manager' || user?.role === 'institute-admin' || user?.role === 'super-admin';
}

/** Map a raw API complaint row to the local Complaint shape. */
function mapComplaint(r: any): Complaint {
  return {
    id: String(r.id ?? ''),
    subject: r.subject || '(no subject)',
    message: r.message || '',
    status: r.status || 'Open',
    createdAt: r.createdAt,
    date: r.createdAt || r.date || new Date().toISOString(),
    response: r.response ?? null,
    respondedAt: r.respondedAt ?? null,
    parentId: r.parentId,
    instituteId: r.instituteId,
    branchId: r.branchId,
  };
}

/** Derive a honest 5-stage timeline from a complaint's status. */
function deriveTimeline(c: Complaint) {
  const status = (c.status as string) || 'Open';
  const hasResponse = !!c.response;
  const stages = [
    { stage: 'Submitted', timestamp: c.date, actor: 'You', completed: true, description: 'Complaint submitted via portal' },
    { stage: 'Acknowledged', timestamp: '', actor: '', completed: hasResponse || status !== 'Open', description: hasResponse ? 'Administration has responded' : 'Awaiting acknowledgement' },
    { stage: 'In Progress', timestamp: '', actor: '', completed: ['In Progress', 'Resolved', 'Closed'].includes(status), description: 'Under active review' },
    { stage: 'Resolved', timestamp: c.respondedAt || '', actor: hasResponse ? 'Administration' : '', completed: ['Resolved', 'Closed'].includes(status), description: hasResponse ? c.response?.slice(0, 80) || '' : 'Resolution pending' },
    { stage: 'Closed', timestamp: '', actor: '', completed: status === 'Closed', description: 'Case closed' },
  ];
  return stages;
}

// ── Main Component ─────────────────────────────────────────────────────
export function ComplaintPortal({ user }: { user: any }) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [expandedChat, setExpandedChat] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // New complaint form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Chat response state (admin side)
  const [chatInput, setChatInput] = useState('');
  const [responding, setResponding] = useState(false);
  const [respondError, setRespondError] = useState<string | null>(null);

  // ── Fetch complaints on mount ──
  const fetchComplaints = () => {
    setLoading(true); setError(null);
    api.getComplaints(buildComplaintParams(user))
      .then(raw => {
        const list = Array.isArray(raw) ? raw.map(mapComplaint) : [];
        setComplaints(list);
      })
      .catch(e => setError(e.message || 'Failed to load complaints.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    api.getComplaints(buildComplaintParams(user))
      .then(raw => {
        if (cancelled) return;
        const list = Array.isArray(raw) ? raw.map(mapComplaint) : [];
        setComplaints(list);
      })
      .catch(e => { if (!cancelled) setError(e.message || 'Failed to load complaints.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id, user?.role, user?.branchId, user?.instituteId]);

  // ── Computed Stats ─────────────────────────────────────────────────
  const total = complaints.length;
  const open = complaints.filter(c => c.status === 'Open').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress').length;
  const resolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
  const escalated = complaints.filter(c => c.status === 'Escalated').length;

  // ── Filtered Complaints ───────────────────────────────────────────
  const filteredComplaints = filterStatus === 'All'
    ? complaints
    : complaints.filter(c => c.status === filterStatus);

  // ── Handlers ──────────────────────────────────────────────────────
  const handleSubmitComplaint = () => {
    if (!newTitle.trim() || !newDescription.trim()) return;
    setSubmitting(true); setSubmitError(null);
    api.createComplaint({
      subject: newTitle.trim(),
      message: newDescription.trim(),
      parentId: user?.id,
      instituteId: user?.instituteId,
      branchId: user?.branchId,
    })
      .then(() => {
        setNewTitle('');
        setNewDescription('');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        fetchComplaints(); // refresh list
      })
      .catch(e => setSubmitError(e.message || 'Failed to submit complaint.'))
      .finally(() => setSubmitting(false));
  };

  const handleSendResponse = (complaintId: string) => {
    if (!chatInput.trim()) return;
    setResponding(true); setRespondError(null);
    api.respondToComplaint(complaintId, chatInput.trim())
      .then(() => {
        setChatInput('');
        fetchComplaints(); // refresh to show the new response
      })
      .catch(e => setRespondError(e.message || 'Failed to send response.'))
      .finally(() => setResponding(false));
  };

  // ── Stat Cards ────────────────────────────────────────────────────
  const statCards = [
    { label: 'Total Complaints', value: total, icon: MessageCircleWarning, color: 'from-rose-500 to-orange-600' },
    { label: 'Open', value: open, icon: AlertCircle, color: 'from-rose-500 to-red-600' },
    { label: 'In Progress', value: inProgress, icon: Clock, color: 'from-amber-500 to-yellow-600' },
    { label: 'Resolved', value: resolved, icon: CheckCircle2, color: 'from-emerald-500 to-teal-600' },
    { label: 'Escalated', value: escalated, icon: ArrowUpRight, color: 'from-orange-500 to-red-600' },
  ];

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Module Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 to-orange-600 p-6 text-white shadow-lg"
      >
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/20 grid place-items-center backdrop-blur-sm">
              <MessageCircleWarning className="h-5 w-5 text-white" />
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">Complaint Portal</h1>
          </div>
          <p className="text-sm text-white/80 max-w-xl">
            Track, submit, and resolve complaints with full transparency. Two-way communication between you and the administration.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Badge className="bg-white/20 text-white border-0 hover:bg-white/30 backdrop-blur-sm">
              <ShieldCheck className="h-3 w-3 mr-1" /> Tracked & Transparent
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* ── Tab Navigation ────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <ArrowUpRight className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="submit" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Submit
          </TabsTrigger>
          <TabsTrigger value="my-complaints" className="gap-1.5">
            <MessageCircleWarning className="h-3.5 w-3.5" /> My Complaints
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Timeline
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1.5">
            <Star className="h-3.5 w-3.5" /> Feedback
          </TabsTrigger>
        </TabsList>

        {/* ────────────────────────────────────────────────────────────
            TAB 1: OVERVIEW
        ──────────────────────────────────────────────────────────────── */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {loading ? (
              <LoadingState label="Loading complaints…" />
            ) : error ? (
              <ErrorState message={error} onRetry={fetchComplaints} />
            ) : (
              <>
                {/* Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {statCards.map((card, i) => (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Card className="p-4 relative overflow-hidden hover:shadow-md transition-shadow">
                        <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${card.color} opacity-10 blur-2xl`} />
                        <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${card.color} grid place-items-center mb-2.5`}>
                          <card.icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="text-xl font-extrabold font-display">{card.value}</div>
                        <div className="text-[11px] text-muted-foreground leading-tight">{card.label}</div>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Recent Complaints Summary */}
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold">Recent Complaints</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('my-complaints')} className="text-xs gap-1">
                        View All <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {complaints.length === 0 ? (
                      <EmptyState
                        icon={Inbox}
                        title="No complaints yet"
                        description="Submit a complaint using the button above. Your submitted complaints will be listed here."
                        action={
                          <Button size="sm" className="bg-gradient-to-r from-rose-500 to-orange-600 text-white" onClick={() => setActiveTab('submit')}>
                            <Plus className="h-4 w-4 mr-1.5" /> Submit a Complaint
                          </Button>
                        }
                      />
                    ) : (
                      <div className="space-y-2">
                        {complaints.slice(0, 4).map((c, i) => (
                          <motion.div
                            key={c.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => { setSelectedComplaint(c); setActiveTab('timeline'); }}
                          >
                            <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusDot[c.status as string] ?? 'bg-slate-400'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{c.subject}</div>
                              <div className="text-[11px] text-muted-foreground">{c.id} · {new Date(c.date).toLocaleDateString()}</div>
                            </div>
                            <Badge variant="outline" className={`text-[10px] shrink-0 ${statusStyle[c.status as string] ?? ''}`}>{c.status}</Badge>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 grid place-items-center">
                        <AlertCircle className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">Needs Attention</div>
                        <div className="text-[11px] text-muted-foreground">{open + escalated} complaints require action</div>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gradient-to-r from-rose-500 to-orange-600 h-2 rounded-full transition-all" style={{ width: `${((open + escalated) / Math.max(total, 1)) * 100}%` }} />
                    </div>
                  </Card>
                  <Card className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">Resolution Rate</div>
                        <div className="text-[11px] text-muted-foreground">{resolved} of {total} complaints resolved</div>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all" style={{ width: `${(resolved / Math.max(total, 1)) * 100}%` }} />
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* ────────────────────────────────────────────────────────────
            TAB 2: SUBMIT NEW COMPLAINT
        ──────────────────────────────────────────────────────────────── */}
        <TabsContent value="submit">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-rose-500/5 to-orange-600/5 border-b">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Plus className="h-5 w-5 text-rose-600" /> Submit New Complaint
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Provide details about your concern. All complaints are tracked and resolved transparently.</p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Success Toast */}
                <AnimatePresence>
                  {showSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3"
                    >
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-emerald-800">Complaint Submitted Successfully!</div>
                        <div className="text-xs text-emerald-600">You will receive updates as your complaint is processed.</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Toast */}
                <AnimatePresence>
                  {submitError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3"
                    >
                      <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-rose-800">Submission failed</div>
                        <div className="text-xs text-rose-600">{submitError}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Complaint Subject</label>
                  <Input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Brief summary of your complaint..."
                    className="text-sm"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Detailed Description</label>
                  <Textarea
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    placeholder="Describe your complaint in detail. Include relevant dates, locations, and people involved..."
                    className="min-h-32 text-sm resize-none"
                  />
                </div>

                {/* Submit Button */}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    onClick={handleSubmitComplaint}
                    disabled={!newTitle.trim() || !newDescription.trim() || submitting}
                    className="w-full h-12 bg-gradient-to-r from-rose-500 to-orange-600 hover:from-rose-600 hover:to-orange-700 text-white font-bold text-sm shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:shadow-none"
                  >
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" /> Submit Complaint</>
                    )}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ────────────────────────────────────────────────────────────
            TAB 3: MY COMPLAINTS
        ──────────────────────────────────────────────────────────────── */}
        <TabsContent value="my-complaints">
          <div className="space-y-4">
            {loading ? (
              <LoadingState label="Loading your complaints…" />
            ) : error ? (
              <ErrorState message={error} onRetry={fetchComplaints} />
            ) : (
              <>
                {/* Filter Bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  {['All', 'Open', 'In Progress', 'Escalated', 'Resolved', 'Closed'].map(status => (
                    <Button
                      key={status}
                      variant={filterStatus === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus(status)}
                      className={`text-xs h-8 ${filterStatus === status ? 'bg-gradient-to-r from-rose-500 to-orange-600 text-white border-0' : ''}`}
                    >
                      {status}
                      {status !== 'All' && (
                        <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1.5">
                          {complaints.filter(c => c.status === status).length}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>

                {/* Complaint Cards */}
                <div className="space-y-3">
                  {filteredComplaints.length === 0 ? (
                    <Card>
                      <EmptyState
                        icon={Inbox}
                        title="No complaints yet"
                        description="Submit a complaint using the button above. Your submitted complaints will appear here with full conversation history."
                        action={
                          <Button size="sm" className="bg-gradient-to-r from-rose-500 to-orange-600 text-white" onClick={() => setActiveTab('submit')}>
                            <Plus className="h-4 w-4 mr-1.5" /> Submit a Complaint
                          </Button>
                        }
                      />
                    </Card>
                  ) : (
                    filteredComplaints.map((complaint, i) => {
                      const hasResponse = !!complaint.response;
                      const messageCount = 1 + (hasResponse ? 1 : 0);
                      return (
                        <motion.div
                          key={complaint.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <Card className="overflow-hidden hover:shadow-md transition-shadow">
                            {/* Card Header */}
                            <div
                              className="p-4 cursor-pointer"
                              onClick={() => setExpandedChat(expandedChat === complaint.id ? null : complaint.id)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 grid place-items-center shrink-0">
                                  <MessageCircleWarning className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold truncate">{complaint.subject}</div>
                                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                                        <span className="font-mono">{complaint.id}</span>
                                        <span>·</span>
                                        <span>{new Date(complaint.date).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Badge variant="outline" className={`text-[10px] ${statusStyle[complaint.status as string] ?? ''}`}>
                                        {complaint.status}
                                      </Badge>
                                      <motion.div
                                        animate={{ rotate: expandedChat === complaint.id ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                      </motion.div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                                      <MessageSquare className="h-3 w-3" /> {messageCount} message{messageCount === 1 ? '' : 's'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Chat Section */}
                            <AnimatePresence>
                              {expandedChat === complaint.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden"
                                >
                                  <div className="border-t border-border/50">
                                    {/* Description */}
                                    <div className="px-4 py-3 bg-muted/30">
                                      <div className="text-xs text-muted-foreground mb-1 font-medium">Original Complaint</div>
                                      <div className="text-sm leading-relaxed">{complaint.message}</div>
                                    </div>

                                    {/* Conversation */}
                                    <div className="px-4 py-3">
                                      <div className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                                        <MessageSquare className="h-3 w-3" /> Conversation
                                      </div>
                                      <ScrollArea className="h-72 pr-2">
                                        <div className="space-y-3">
                                          {/* Complainant's original message */}
                                          <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex justify-end"
                                          >
                                            <div className="max-w-[85%] sm:max-w-[75%] bg-gradient-to-br from-rose-500 to-orange-600 text-white rounded-2xl rounded-br-md">
                                              <div className="px-3.5 py-2.5">
                                                <div className="text-[10px] font-medium mb-1 text-white/70">You</div>
                                                <div className="text-sm leading-relaxed">{complaint.message}</div>
                                                <div className="text-[10px] mt-1.5 text-white/50">
                                                  {new Date(complaint.date).toLocaleString()}
                                                </div>
                                              </div>
                                            </div>
                                          </motion.div>

                                          {/* Admin response (if any) */}
                                          {hasResponse ? (
                                            <motion.div
                                              initial={{ opacity: 0, y: 5 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              className="flex justify-start"
                                            >
                                              <div className="max-w-[85%] sm:max-w-[75%] bg-muted rounded-2xl rounded-bl-md">
                                                <div className="px-3.5 py-2.5">
                                                  <div className="text-[10px] font-medium mb-1 text-muted-foreground">Administration</div>
                                                  <div className="text-sm leading-relaxed">{complaint.response}</div>
                                                  <div className="text-[10px] mt-1.5 text-muted-foreground/60">
                                                    {complaint.respondedAt ? new Date(complaint.respondedAt).toLocaleString() : ''}
                                                  </div>
                                                </div>
                                              </div>
                                            </motion.div>
                                          ) : (
                                            <div className="text-center py-6">
                                              <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                              <p className="text-xs text-muted-foreground">No response yet — administration will reply here.</p>
                                            </div>
                                          )}
                                        </div>
                                      </ScrollArea>

                                      {/* Chat Input — only for admin roles who can respond */}
                                      {canRespond(user) && complaint.status !== 'Closed' && (
                                        <div className="mt-3 space-y-2">
                                          {respondError && (
                                            <div className="text-xs text-rose-600 flex items-center gap-1">
                                              <AlertCircle className="h-3 w-3" /> {respondError}
                                            </div>
                                          )}
                                          <div className="flex items-center gap-2">
                                            <Input
                                              value={expandedChat === complaint.id ? chatInput : ''}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Type your response as administration..."
              className="text-sm h-10"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendResponse(complaint.id);
                }
              }}
            />
                                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                              <Button
                                                size="icon"
                                                onClick={() => handleSendResponse(complaint.id)}
                                                disabled={!chatInput.trim() || responding}
                                                className="h-10 w-10 bg-gradient-to-r from-rose-500 to-orange-600 hover:from-rose-600 hover:to-orange-700 text-white shrink-0"
                                              >
                                                {responding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                              </Button>
                                            </motion.div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Non-admin note */}
                                      {!canRespond(user) && !hasResponse && (
                                        <div className="mt-3 text-center text-xs text-muted-foreground">
                                          You'll be notified here when the administration responds.
                                        </div>
                                      )}
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="px-4 py-3 border-t border-border/30 flex gap-2 flex-wrap">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs gap-1.5"
                                        onClick={() => { setSelectedComplaint(complaint); setActiveTab('timeline'); }}
                                      >
                                        <Clock className="h-3 w-3" /> View Timeline
                                      </Button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Card>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* ────────────────────────────────────────────────────────────
            TAB 4: RESOLUTION TIMELINE
        ──────────────────────────────────────────────────────────────── */}
        <TabsContent value="timeline">
          <div className="space-y-4">
            {/* Complaint Selector */}
            <Card className="p-4">
              <div className="text-sm font-medium mb-3">Select a complaint to view its timeline</div>
              {complaints.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No complaints to display"
                  description="Submit a complaint first — its resolution timeline will appear here."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {complaints.map(c => (
                    <motion.button
                      key={c.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedComplaint(c)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        selectedComplaint?.id === c.id
                          ? 'border-rose-500 bg-rose-50 shadow-sm'
                          : 'border-border hover:border-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${statusDot[c.status as string] ?? 'bg-slate-400'}`} />
                        <div className="text-sm font-medium truncate flex-1">{c.subject}</div>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${statusStyle[c.status as string] ?? ''}`}>{c.status}</Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">{c.id}</div>
                    </motion.button>
                  ))}
                </div>
              )}
            </Card>

            {/* Timeline View */}
            {selectedComplaint ? (
              <motion.div
                key={selectedComplaint.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-rose-500/5 to-orange-600/5 border-b">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-bold">{selectedComplaint.subject}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-mono text-muted-foreground">{selectedComplaint.id}</span>
                          <Badge variant="outline" className={`text-[10px] ${statusStyle[selectedComplaint.status as string] ?? ''}`}>
                            {selectedComplaint.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="relative">
                      {/* Timeline Line */}
                      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

                      <div className="space-y-6">
                        {deriveTimeline(selectedComplaint).map((stage, si) => {
                          const isLast = si === deriveTimeline(selectedComplaint).length - 1;
                          const isCurrent = stage.completed && (si === deriveTimeline(selectedComplaint).length - 1 || !deriveTimeline(selectedComplaint)[si + 1]?.completed);
                          return (
                            <motion.div
                              key={stage.stage}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: si * 0.1 }}
                              className="relative flex gap-4"
                            >
                              <div className="relative z-10 flex-shrink-0">
                                <div className={`h-10 w-10 rounded-full grid place-items-center ${
                                  stage.completed
                                    ? isCurrent
                                      ? 'bg-gradient-to-br from-rose-500 to-orange-600 text-white shadow-lg shadow-rose-500/20'
                                      : 'bg-emerald-500 text-white'
                                    : 'bg-muted text-muted-foreground border-2 border-border'
                                }`}>
                                  {stage.completed ? (
                                    isCurrent ? (
                                      <Clock className="h-4 w-4" />
                                    ) : (
                                      <CheckCircle2 className="h-4 w-4" />
                                    )
                                  ) : (
                                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                                  )}
                                </div>
                              </div>
                              <div className={`flex-1 pb-${isLast ? '0' : '6'}`}>
                                <div className="flex items-center gap-2">
                                  <div className={`font-semibold text-sm ${stage.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {stage.stage}
                                  </div>
                                  {isCurrent && (
                                    <Badge className="bg-gradient-to-r from-rose-500 to-orange-600 text-white border-0 text-[10px]">
                                      Current
                                    </Badge>
                                  )}
                                </div>
                                {stage.completed && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {stage.actor && <span className="font-medium">{stage.actor}</span>}
                                    {stage.timestamp && <span> · {new Date(stage.timestamp).toLocaleString()}</span>}
                                  </div>
                                )}
                                <div className="text-sm text-muted-foreground mt-1">{stage.description}</div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Current Status Summary */}
                    <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border/50">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <div className={`h-2.5 w-2.5 rounded-full ${
                          selectedComplaint.status === 'Open' ? 'bg-rose-500 animate-pulse' :
                          selectedComplaint.status === 'In Progress' ? 'bg-amber-500 animate-pulse' :
                          selectedComplaint.status === 'Escalated' ? 'bg-orange-500 animate-pulse' :
                          selectedComplaint.status === 'Resolved' ? 'bg-emerald-500' :
                          'bg-slate-500'
                        }`} />
                        Current Status: {selectedComplaint.status}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {deriveTimeline(selectedComplaint).filter(s => s.completed).length} of {deriveTimeline(selectedComplaint).length} stages completed
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="p-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <div className="text-sm text-muted-foreground">Select a complaint above to view its resolution timeline</div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ────────────────────────────────────────────────────────────
            TAB 5: FEEDBACK
        ──────────────────────────────────────────────────────────────── */}
        <TabsContent value="feedback">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-rose-500/5 to-orange-600/5 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" /> Rate & Review Resolved Complaints
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Your feedback helps improve our response quality.</p>
            </CardHeader>
            <CardContent className="p-6">
              <EmptyState
                icon={Star}
                title="Feedback collection isn't available yet"
                description="Rating and review submission for resolved complaints will be enabled in a future update. For now, please share feedback directly with your administration."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
