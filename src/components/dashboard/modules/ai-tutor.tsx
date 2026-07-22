'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { ModuleHeader } from './students';
import {
  Sparkles, Send, Mic, Bot, User, Calculator, Atom, FlaskConical,
  BookOpen, Languages, Code2, Lightbulb, TrendingUp, Clock,
} from 'lucide-react';

type Subject = { id: string; name: string; icon: typeof Bot; tint: string };

const SUBJECTS: Subject[] = [
  { id: 'math', name: 'Mathematics', icon: Calculator, tint: 'from-violet-500 to-fuchsia-600' },
  { id: 'physics', name: 'Physics', icon: Atom, tint: 'from-emerald-500 to-teal-600' },
  { id: 'chemistry', name: 'Chemistry', icon: FlaskConical, tint: 'from-rose-500 to-pink-600' },
  { id: 'biology', name: 'Biology', icon: BookOpen, tint: 'from-amber-500 to-yellow-600' },
  { id: 'english', name: 'English', icon: Languages, tint: 'from-cyan-500 to-teal-600' },
  { id: 'urdu', name: 'Urdu', icon: Languages, tint: 'from-rose-500 to-orange-600' },
  { id: 'cs', name: 'Computer Sci.', icon: Code2, tint: 'from-violet-500 to-purple-600' },
];

type ChatMsg = { id: string; role: 'user' | 'ai'; content: React.ReactNode; ts: string };

const now = () => new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: false });

const INITIAL_THREAD: ChatMsg[] = [
  {
    id: 'init-1',
    role: 'user',
    content: "Explain Newton's second law of motion in simple terms.",
    ts: '10:42',
  },
  {
    id: 'init-2',
    role: 'ai',
    content: (
      <div className="space-y-3">
        <p>
          Newton&rsquo;s second law says: <strong>the more force you apply to an object, the faster it accelerates</strong> &mdash; and the heavier the object, the slower it accelerates for the same force.
        </p>
        <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-3 font-mono text-sm">
          <span className="text-violet-700 dark:text-violet-300">F = m &middot; a</span>
          <div className="text-xs text-muted-foreground mt-1">
            F = force (Newtons) &middot; m = mass (kg) &middot; a = acceleration (m/s&sup2;)
          </div>
        </div>
        <p>
          <strong>Example:</strong> Pushing a 2&thinsp;kg cart with 10&thinsp;N of force gives it an acceleration of <code className="text-violet-700 dark:text-violet-300">a = F/m = 10/2 = 5 m/s&sup2;</code>. Double the mass and the acceleration halves.
        </p>
      </div>
    ),
    ts: '10:42',
  },
];

// Per-subject suggested questions shown above the input.
const SUGGESTED_BY_SUBJECT: Record<string, string[]> = {
  math: ['Solve: 3x² + 7x − 6 = 0', 'Derivative of x²', 'Pythagoras theorem'],
  physics: ["Newton's second law", "What is Ohm's law?", 'Define velocity vs speed'],
  chemistry: ['Balance: H₂ + O₂ → H₂O', 'What is a mole?', 'Explain pH scale'],
  biology: ['Summarize photosynthesis', 'What is mitosis?', 'Function of the heart'],
  english: ['Difference between their/there', 'Active vs passive voice', 'What is a metaphor?'],
  urdu: ['بحر کیا ہے؟', 'لفظ’’آب‘‘کے معنی', 'نثر اور نظم میں فرق'],
  cs: ['What is a variable?', 'Explain recursion', 'Difference: let vs const'],
};

// Lightweight knowledge base — keyword patterns map to canned answers.
type KBEntry = { q: RegExp; a: () => React.ReactNode };

const KB: Record<string, KBEntry[]> = {
  math: [
    {
      q: /deriv|x²|x\^2|power rule/,
      a: () => (
        <div className="space-y-2">
          <p>The derivative of <strong>x²</strong> is <strong>2x</strong>.</p>
          <p className="text-muted-foreground">This comes from the power rule:</p>
          <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-2.5 font-mono text-xs">
            d/dx[x<sup>n</sup>] = n · x<sup>n−1</sup>
          </div>
          <p className="text-xs">For x², n = 2 → d/dx = 2·x¹ = <strong className="text-violet-700 dark:text-violet-300">2x</strong>.</p>
        </div>
      ),
    },
    {
      q: /pythagor/,
      a: () => (
        <div className="space-y-2">
          <p>The Pythagorean theorem relates the three sides of a right triangle:</p>
          <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-2.5 font-mono text-xs">
            a² + b² = c²
          </div>
          <p className="text-xs">Where <code>c</code> is the hypotenuse and <code>a</code>, <code>b</code> are the legs. For a 3-4-5 triangle: 9 + 16 = 25 ✓</p>
        </div>
      ),
    },
    {
      q: /3x²|3x\^2|solve|quadratic/,
      a: () => (
        <div className="space-y-2">
          <p>To solve <code>3x² + 7x − 6 = 0</code>, use the quadratic formula:</p>
          <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-2.5 font-mono text-xs">
            x = (−b ± √(b² − 4ac)) / 2a
          </div>
          <p className="text-xs">Here a=3, b=7, c=−6. Discriminant = 49 − 4·3·(−6) = 49 + 72 = 121 = 11².</p>
          <p className="text-xs">x = (−7 ± 11) / 6 → <strong className="text-violet-700 dark:text-violet-300">x = 2/3</strong> or <strong className="text-violet-700 dark:text-violet-300">x = −3</strong>.</p>
        </div>
      ),
    },
    {
      q: /integral|∫/,
      a: () => (
        <div className="space-y-2">
          <p>The integral of <strong>x²</strong> is <strong>x³/3 + C</strong>.</p>
          <p className="text-xs">Reverse of the power rule: add 1 to the exponent, then divide by the new exponent. Don&rsquo;t forget the constant of integration <code>C</code>!</p>
        </div>
      ),
    },
  ],
  physics: [
    {
      q: /newton|second law|f\s*=\s*m/,
      a: () => (
        <div className="space-y-2">
          <p>Newton&rsquo;s second law: <strong>force = mass × acceleration</strong>.</p>
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 font-mono text-xs text-emerald-700 dark:text-emerald-300">
            F = m · a
          </div>
          <p className="text-xs">Heavier objects need more force for the same acceleration. Pushing a 2 kg cart with 10 N gives a = 5 m/s².</p>
        </div>
      ),
    },
    {
      q: /ohm/,
      a: () => (
        <div className="space-y-2">
          <p>Ohm&rsquo;s law relates voltage, current, and resistance:</p>
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 font-mono text-xs text-emerald-700 dark:text-emerald-300">
            V = I · R
          </div>
          <p className="text-xs">A 12 V battery pushing current through a 4 Ω resistor delivers I = 12/4 = <strong>3 A</strong>.</p>
        </div>
      ),
    },
    {
      q: /velocity|speed/,
      a: () => (
        <div className="space-y-2">
          <p><strong>Speed</strong> is a scalar (magnitude only); <strong>velocity</strong> is a vector (magnitude + direction).</p>
          <p className="text-xs">A car going 60 km/h north has speed = 60 km/h and velocity = 60 km/h <em>north</em>. Same number, different physics.</p>
        </div>
      ),
    },
    {
      q: /gravity|gravitation/,
      a: () => (
        <div className="space-y-2">
          <p>Gravity is the force that pulls masses together. Near Earth&rsquo;s surface, acceleration due to gravity is <strong>g ≈ 9.8 m/s²</strong>.</p>
          <p className="text-xs">Newton&rsquo;s law of universal gravitation: F = G·m₁·m₂/r², where G = 6.674 × 10⁻¹¹ N·m²/kg².</p>
        </div>
      ),
    },
  ],
  chemistry: [
    {
      q: /balance|h2\s*\+\s*o2|h₂.*o₂/,
      a: () => (
        <div className="space-y-2">
          <p>To balance <code>H₂ + O₂ → H₂O</code>, count atoms on each side:</p>
          <ul className="text-xs list-disc pl-4 space-y-0.5">
            <li>Left: 2 H, 2 O</li>
            <li>Right: 2 H, 1 O</li>
          </ul>
          <p className="text-xs">Add a coefficient 2 to H₂O, then balance H: <strong className="text-rose-700 dark:text-rose-300">2H₂ + O₂ → 2H₂O</strong>.</p>
        </div>
      ),
    },
    {
      q: /mole|avogadro/,
      a: () => (
        <div className="space-y-2">
          <p>A <strong>mole</strong> is a counting unit = 6.022 × 10²³ particles (Avogadro&rsquo;s number).</p>
          <p className="text-xs">1 mole of carbon-12 weighs exactly 12 g. The molar mass of any substance in grams = its atomic/molecular weight.</p>
        </div>
      ),
    },
    {
      q: /ph/,
      a: () => (
        <div className="space-y-2">
          <p>The <strong>pH scale</strong> measures acidity: 0–14.</p>
          <ul className="text-xs list-disc pl-4 space-y-0.5">
            <li>pH &lt; 7 → acidic (lemon juice ≈ 2)</li>
            <li>pH = 7 → neutral (pure water)</li>
            <li>pH &gt; 7 → basic (soap ≈ 10)</li>
          </ul>
          <p className="text-xs">pH = −log₁₀[H⁺]. Each whole number is a 10× change in H⁺ concentration.</p>
        </div>
      ),
    },
    {
      q: /atom|proton|neutron|electron/,
      a: () => (
        <div className="space-y-2">
          <p>An <strong>atom</strong> has three subatomic particles:</p>
          <ul className="text-xs list-disc pl-4 space-y-0.5">
            <li><strong>Protons</strong> — positive charge, in nucleus</li>
            <li><strong>Neutrons</strong> — neutral, in nucleus</li>
            <li><strong>Electrons</strong> — negative charge, orbit nucleus</li>
          </ul>
          <p className="text-xs">Atomic number = number of protons. Mass number = protons + neutrons.</p>
        </div>
      ),
    },
  ],
  biology: [
    {
      q: /photosynth/,
      a: () => (
        <div className="space-y-2">
          <p><strong>Photosynthesis</strong> is how plants convert light into chemical energy:</p>
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 font-mono text-xs text-amber-700 dark:text-amber-300">
            6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂
          </div>
          <p className="text-xs">Occurs in chloroplasts via two stages: light-dependent reactions (thylakoid) and the Calvin cycle (stroma).</p>
        </div>
      ),
    },
    {
      q: /mitosis/,
      a: () => (
        <div className="space-y-2">
          <p><strong>Mitosis</strong> is cell division producing two identical daughter cells. Stages:</p>
          <ol className="text-xs list-decimal pl-4 space-y-0.5">
            <li>Prophase — chromosomes condense</li>
            <li>Metaphase — chromosomes line up at the equator</li>
            <li>Anaphase — sister chromatids separate</li>
            <li>Telophase — nuclei reform around chromosomes</li>
          </ol>
        </div>
      ),
    },
    {
      q: /heart|cardio/,
      a: () => (
        <div className="space-y-2">
          <p>The <strong>heart</strong> pumps blood through the body&rsquo;s circulatory system.</p>
          <p className="text-xs">4 chambers: right atrium &amp; ventricle (pump deoxygenated blood to lungs), left atrium &amp; ventricle (pump oxygenated blood to body). The left ventricle has the thickest wall because it pumps against the highest pressure.</p>
        </div>
      ),
    },
    {
      q: /dna|genetic|gene/,
      a: () => (
        <div className="space-y-2">
          <p><strong>DNA</strong> (deoxyribonucleic acid) carries genetic information as a double helix.</p>
          <p className="text-xs">Made of nucleotides: adenine (A) pairs with thymine (T); cytosine (C) pairs with guanine (G). Genes are sections of DNA that code for proteins.</p>
        </div>
      ),
    },
  ],
  english: [
    {
      q: /their.*there|there.*their/,
      a: () => (
        <div className="space-y-2">
          <p><strong>They&rsquo;re</strong> = they are. <strong>Their</strong> = belonging to them. <strong>There</strong> = a place or pointer.</p>
          <p className="text-xs"><em>&ldquo;They&rsquo;re going to leave their books over there.&rdquo;</em></p>
        </div>
      ),
    },
    {
      q: /active.*passive|passive.*active|voice/,
      a: () => (
        <div className="space-y-2">
          <p><strong>Active voice</strong>: subject does the action. <strong>Passive voice</strong>: subject receives the action.</p>
          <ul className="text-xs list-disc pl-4 space-y-0.5">
            <li>Active: &ldquo;The dog bit the man.&rdquo;</li>
            <li>Passive: &ldquo;The man was bitten by the dog.&rdquo;</li>
          </ul>
          <p className="text-xs">Use active for clarity and directness. Use passive when the actor is unknown or unimportant.</p>
        </div>
      ),
    },
    {
      q: /metaphor|simile/,
      a: () => (
        <div className="space-y-2">
          <p>A <strong>metaphor</strong> says one thing IS another; a <strong>simile</strong> uses &ldquo;like&rdquo; or &ldquo;as&rdquo;.</p>
          <ul className="text-xs list-disc pl-4 space-y-0.5">
            <li>Metaphor: &ldquo;Time is a thief.&rdquo;</li>
            <li>Simile: &ldquo;She runs like the wind.&rdquo;</li>
          </ul>
        </div>
      ),
    },
    {
      q: /essay|write|paragraph/,
      a: () => (
        <div className="space-y-2">
          <p>A strong essay has three parts:</p>
          <ol className="text-xs list-decimal pl-4 space-y-0.5">
            <li><strong>Introduction</strong> — hook + thesis statement</li>
            <li><strong>Body paragraphs</strong> — one idea each, with evidence</li>
            <li><strong>Conclusion</strong> — restate thesis + leave the reader thinking</li>
          </ol>
        </div>
      ),
    },
  ],
};

function findAnswer(subjectId: string, question: string): React.ReactNode {
  const kb = KB[subjectId] ?? [];
  const lowered = question.toLowerCase();
  const hit = kb.find((e) => e.q.test(lowered));
  if (hit) return hit.a();
  const subjectName = SUBJECTS.find((s) => s.id === subjectId)?.name ?? 'this subject';
  return (
    <div className="space-y-2">
      <p>Great question! Let me break this down step by step.</p>
      <p className="text-muted-foreground">
        In <strong>{subjectName}</strong>, the key is to identify what&rsquo;s given, what&rsquo;s asked, and which principle or formula connects them. Try writing out the known values first, then pick a relationship that includes both a known and the unknown.
      </p>
      <p className="text-xs">If you can share the exact problem statement, I&rsquo;ll walk through the full solution with worked steps.</p>
    </div>
  );
}

let msgCounter = 0;
function nextId() {
  msgCounter += 1;
  return `m-${Date.now()}-${msgCounter}`;
}

export default function AiTutorModule() {
  const [activeSubject, setActiveSubject] = useState<Subject>(SUBJECTS[1]);
  const [thread, setThread] = useState<ChatMsg[]>(INITIAL_THREAD);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedBySubject, setSuggestedBySubject] = useState<Record<string, string[]>>(SUGGESTED_BY_SUBJECT);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch suggested questions from the API on mount. Falls back to the
  // hardcoded SUGGESTED_BY_SUBJECT map on error so the UI never breaks.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSuggestionsLoading(true);
      try {
        const resp = await api.getAiTutorSuggestions();
        if (cancelled) return;
        const grouped: Record<string, string[]> = {};
        for (const q of resp.questions) {
          (grouped[q.subject] ??= []).push(q.question);
        }
        // Merge with the fallback so every subject still has suggestions
        // even if the API returned nothing for it.
        setSuggestedBySubject((prev) => {
          const merged: Record<string, string[]> = { ...prev };
          for (const [subj, list] of Object.entries(grouped)) {
            merged[subj] = list.length > 0 ? list : prev[subj] ?? [];
          }
          return merged;
        });
      } catch {
        // keep existing SUGGESTED_BY_SUBJECT fallback
      } finally {
        if (!cancelled) setSuggestionsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Auto-scroll the thread to the newest message whenever it grows.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [thread, isTyping]);

  // Clean up any pending AI response timer if the component unmounts.
  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    const userMsg: ChatMsg = { id: nextId(), role: 'user', content: trimmed, ts: now() };
    setThread((prev) => [...prev, userMsg]);
    setDraft('');
    setIsTyping(true);
    typingTimer.current = setTimeout(() => {
      const aiContent = findAnswer(activeSubject.id, trimmed);
      const aiMsg: ChatMsg = { id: nextId(), role: 'ai', content: aiContent, ts: now() };
      setThread((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const suggested = suggestedBySubject[activeSubject.id] ?? SUGGESTED_BY_SUBJECT.math;

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="AI Tutor"
        subtitle="24/7 doubt-solving AI tutor — powered by Concordia Intelligence"
        actions={
          <Badge variant="outline" className="bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20">
            <Sparkles className="h-3 w-3 mr-1" /> Beta
          </Badge>
        }
      />

      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        {/* Subject sidebar */}
        <Card className="p-3 h-fit lg:sticky lg:top-4">
          <div className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Subjects
          </div>
          <div className="space-y-1">
            {SUBJECTS.map((s) => {
              const isActive = s.id === activeSubject.id;
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSubject(s)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition ${
                    isActive
                      ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300 font-medium'
                      : 'text-foreground/70 hover:bg-muted'
                  }`}
                >
                  <span className={`h-7 w-7 rounded-md bg-gradient-to-br ${s.tint} grid place-items-center shrink-0`}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </span>
                  <span className="truncate">{s.name}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 px-2 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span>124 questions this month</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>Avg response 1.2s</span>
            </div>
          </div>
        </Card>

        {/* Chat thread */}
        <Card className="p-0 overflow-hidden flex flex-col min-h-[560px]">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 grid place-items-center shadow-sm">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm flex items-center gap-2">
                Concordia Intelligence
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                Tutoring · {activeSubject.name}
              </div>
            </div>
            <Button size="sm" variant="ghost" className="text-muted-foreground">
              <Mic className="h-4 w-4 mr-1.5" /> Voice
            </Button>
          </div>

          {/* Thread */}
          <ScrollArea className="flex-1 px-4 py-4 max-h-[440px]">
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {thread.map((m) => (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback
                        className={
                          m.role === 'user'
                            ? 'bg-primary text-primary-foreground text-[11px]'
                            : 'bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white text-[11px]'
                        }
                      >
                        {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-muted/60 rounded-tl-sm border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5'
                      }`}
                    >
                      {m.content}
                      <div className={`text-[10px] mt-2 ${m.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {m.ts}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-3"
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white text-[11px]">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-muted/60 border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-2 w-2 rounded-full bg-violet-500"
                        animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Suggested + input */}
          <div className="border-t border-border p-3 space-y-3 bg-card">
            <div className="flex flex-wrap gap-2">
              {suggestionsLoading ? (
                <>
                  <Skeleton className="h-7 w-40 rounded-full" />
                  <Skeleton className="h-7 w-32 rounded-full" />
                  <Skeleton className="h-7 w-36 rounded-full" />
                </>
              ) : (
                suggested.map((s) => (
                  <button
                    key={s}
                    onClick={() => setDraft(s)}
                    className="text-xs px-2.5 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/5 text-violet-700 dark:text-violet-300 hover:bg-violet-500/10 transition"
                  >
                    <Lightbulb className="h-3 w-3 inline mr-1" />
                    {s}
                  </button>
                ))
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Ask Concordia Tutor about ${activeSubject.name.toLowerCase()}…`}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send(draft);
                  }
                }}
              />
              <Button
                size="icon"
                className="bg-gradient-to-br from-violet-500 to-fuchsia-600 hover:opacity-90 text-white shrink-0"
                onClick={() => send(draft)}
                disabled={!draft.trim() || isTyping}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/70 text-center">
              Concordia AI Tutor can make mistakes. Verify important concepts with your teacher.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
