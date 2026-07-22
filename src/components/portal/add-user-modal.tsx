'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Hash, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function AddUserModal({ open, onClose, role, instituteId, branchId, onCreated }: any) {
  const [form, setForm] = useState({
    name: '',
    rollNo: '',
    email: '',
    password: '',
    classId: '',
    section: '',
  });
  const [classes, setClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<any>(null);

  // Fetch classes when modal opens (for teacher & student)
  useEffect(() => {
    if (!open) return;
    if (role !== 'teacher' && role !== 'student') return;
    let cancelled = false;
    setLoadingClasses(true);
    api.getClasses(branchId)
      .then(rows => { if (!cancelled) setClasses(Array.isArray(rows) ? rows : []); })
      .catch(() => { if (!cancelled) setClasses([]); })
      .finally(() => { if (!cancelled) setLoadingClasses(false); });
    return () => { cancelled = true; };
  }, [open, role, branchId]);

  // Fetch courses when class is selected (teacher only — only courses assigned to that class)
  useEffect(() => {
    if (role !== 'teacher') { setCourses([]); setSelectedCourseIds([]); return; }
    if (!form.classId) { setCourses([]); setSelectedCourseIds([]); return; }
    let cancelled = false;
    setLoadingCourses(true);
    setSelectedCourseIds([]);
    api.getCourses({ classId: form.classId })
      .then(rows => { if (!cancelled) setCourses(Array.isArray(rows) ? rows : []); })
      .catch(() => { if (!cancelled) setCourses([]); })
      .finally(() => { if (!cancelled) setLoadingCourses(false); });
    return () => { cancelled = true; };
  }, [role, form.classId]);

  const reset = () => {
    setForm({ name: '', rollNo: '', email: '', password: '', classId: '', section: '' });
    setClasses([]);
    setCourses([]);
    setSelectedCourseIds([]);
    setCreated(null);
  };

  const toggleCourse = (id: string) => {
    setSelectedCourseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const submit = async () => {
    if (!form.name) { toast({ title: 'Full name is required', variant: 'destructive' }); return; }
    if (!form.rollNo) { toast({ title: 'Roll No / ID is required', variant: 'destructive' }); return; }
    if (!form.password || form.password.length < 4) { toast({ title: 'Assign a password', description: 'At least 4 characters', variant: 'destructive' }); return; }
    if (!form.classId) { toast({ title: 'Please select a class', variant: 'destructive' }); return; }
    // Course assignment is OPTIONAL — teacher can be assigned courses later

    setCreating(true);
    try {
      // Resolve the class NAME (e.g. "Class 5") from the selected classId
      const selectedClass = classes.find((c: any) => c.id === form.classId);
      const body: any = {
        name: form.name,
        rollNo: form.rollNo,
        password: form.password,
        role,
        instituteId,
        branchId,
      };
      if (form.email) body.email = form.email;
      if (form.classId) {
        body.classId = form.classId;
        if (selectedClass?.name) body.class = selectedClass.name;
        // Section: prefer the explicit student-typed section; otherwise fall back to the class row's section.
        const sectionValue = (form.section || '').trim() || selectedClass?.section || 'A';
        body.section = sectionValue;
      }
      if (role === 'teacher' && selectedCourseIds.length > 0) {
        body.courseIds = selectedCourseIds;
      }
      const res = await api.createPlatformUser(body);
      setCreated(res);
      onCreated();
    } catch (e: any) {
      const msg = e.message || 'Something went wrong';
      // Show user-friendly error messages
      if (msg.includes('Email already in use')) {
        toast({ title: 'Email already registered', description: 'This email is already in use. Use a different email or leave it blank (email is optional for teachers and students).', variant: 'destructive' });
      } else if (msg.includes('Roll Number already exists')) {
        toast({ title: 'Roll No already exists', description: 'A user with this Roll Number already exists in this branch. Use a different Roll No.', variant: 'destructive' });
      } else if (msg.includes('Authentication required') || msg.includes('session')) {
        toast({ title: 'Session expired', description: 'Please sign out and sign in again, then retry.', variant: 'destructive' });
      } else {
        toast({ title: 'Failed to add user', description: msg, variant: 'destructive' });
      }
    }
    finally { setCreating(false); }
  };

  if (!open) return null;
  const roleLabel = role === 'teacher' ? 'Teacher' : 'Student';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 overflow-y-auto"
      onClick={() => { onClose(); setTimeout(reset, 200); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md my-4"
      >
        <Card className="p-6 max-h-[90vh] overflow-y-auto scroll-fancy">
          {created ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-emerald-500/15 grid place-items-center"><CheckCircle2 className="h-6 w-6 text-emerald-600" /></div>
                <div>
                  <h3 className="font-bold text-lg">{roleLabel} added!</h3>
                  <p className="text-sm text-muted-foreground">{created.user.name}</p>
                </div>
              </div>
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 space-y-2 text-sm">
                <div className="font-semibold text-emerald-700 dark:text-emerald-300">Login credentials</div>
                {created.user.email && (
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Email</span><span className="font-mono text-xs">{created.user.email}</span></div>
                )}
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Roll No / ID</span><span className="font-mono text-xs">{created.user.rollNo || '—'}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Password</span><span className="font-mono">{created.defaultPassword}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Portal</span><span className="font-medium capitalize">{role.replace('-', ' ')}</span></div>
                <p className="text-[11px] text-muted-foreground pt-1 border-t border-emerald-500/10 mt-2">
                  The user will be asked to set a new password on first sign-in.
                </p>
              </div>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full mt-5" onClick={() => { onClose(); setTimeout(reset, 200); }}>Done</Button>
            </>
          ) : (
            <>
              <h3 className="font-bold text-lg mb-1">Add {roleLabel}</h3>
              <p className="text-sm text-muted-foreground mb-5">
                A login will be created with the Roll No / ID and password you assign. The user must change their password on first sign-in.
              </p>
              <div className="space-y-3">
                <div>
                  <Label>Full name *</Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder={role === 'teacher' ? 'Ms. Olivia Davis' : 'Aiden Carter'}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Roll No / ID *</Label>
                  <div className="relative mt-1">
                    <Hash className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={form.rollNo}
                      onChange={e => setForm({ ...form, rollNo: e.target.value })}
                      placeholder={role === 'teacher' ? 'TCH-001' : 'STU-2025-001'}
                      className="pl-9"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Used by the {roleLabel.toLowerCase()} to sign in (alongside the assigned password).
                  </p>
                </div>

                <div>
                  <Label>Email (optional)</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder={role === 'teacher' ? 'teacher.davis@school.edu' : 'aiden@student.school.edu'}
                    className="mt-1"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    If provided, the user can also sign in with this email.
                  </p>
                </div>

                <div>
                  <Label>Assign Password *</Label>
                  <Input
                    type="text"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="e.g. esm123"
                    className="mt-1"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Temporary password — the user must change it on first sign-in.
                  </p>
                </div>

                <div>
                  <Label>Class *</Label>
                  <Select
                    value={form.classId}
                    onValueChange={(v) => setForm({ ...form, classId: v, section: '' })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={loadingClasses ? 'Loading classes…' : 'Select a class'} />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.length === 0 && !loadingClasses && (
                        <div className="px-3 py-2 text-xs text-muted-foreground">No classes found in this branch.</div>
                      )}
                      {classes.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}{c.section ? ` — ${c.section}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {role === 'teacher' && form.classId && loadingCourses && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading courses assigned to this class…
                  </div>
                )}

                {role === 'teacher' && form.classId && !loadingCourses && courses.length === 0 && (
                  <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
                    <strong>No courses assigned to this class yet.</strong> Please assign courses to this class first in <em>Classes &amp; Courses</em> before adding a teacher.
                  </div>
                )}

                {role === 'teacher' && form.classId && courses.length > 0 && (
                  <div>
                    <Label>Courses (assign to this teacher)</Label>
                    <div className="mt-1 rounded-xl border border-border max-h-44 overflow-y-auto p-2 space-y-1">
                      {courses.map((c: any) => {
                        const checked = selectedCourseIds.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleCourse(c.id)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition ${
                              checked ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'hover:bg-accent text-foreground'
                            }`}
                          >
                            <span className={`h-4 w-4 rounded border flex items-center justify-center transition ${
                              checked ? 'bg-emerald-600 border-emerald-600' : 'border-input bg-background'
                            }`}>
                              {checked && <CheckCircle2 className="h-3 w-3 text-white" />}
                            </span>
                            <span className="font-medium">{c.name}</span>
                            {c.code && <span className="text-[10px] text-muted-foreground uppercase">{c.code}</span>}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {selectedCourseIds.length} of {courses.length} course{courses.length === 1 ? '' : 's'} selected.
                    </p>
                  </div>
                )}

                {role === 'student' && form.classId && (
                  <div>
                    <Label>Section (optional)</Label>
                    <Input
                      value={form.section}
                      onChange={e => setForm({ ...form, section: e.target.value })}
                      placeholder="e.g. B — leave blank to use the class default"
                      className="mt-1"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Used to place this student into a specific section like “1B”. Leave blank to use the class's default section.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-5">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1" disabled={creating} onClick={submit}>
                  {creating ? 'Adding…' : `Add ${roleLabel}`}
                </Button>
                <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
