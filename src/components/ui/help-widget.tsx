'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LifeBuoy, X, Search, BookOpen, Video, MessageSquare, Flag, Keyboard, ExternalLink, Phone, Mail } from 'lucide-react';

// Floating Help & Support widget — appears as a small FAB in the bottom-right corner.
// PGC competitor has no in-app help — this is a key user-friendliness differentiator.
// Click to expand a panel with: search, quick links, contact options, keyboard shortcuts.

type HelpArticle = {
  id: string;
  title: string;
  category: 'getting-started' | 'academics' | 'fees' | 'mobile';
};

const ARTICLES: HelpArticle[] = [
  { id: 'h1', title: 'How to add a new student', category: 'getting-started' },
  { id: 'h2', title: 'Setting up class timetable', category: 'academics' },
  { id: 'h3', title: 'Generating fee invoices', category: 'fees' },
  { id: 'h4', title: 'Marking attendance as teacher', category: 'academics' },
  { id: 'h5', title: 'Updating the mobile app', category: 'mobile' },
  { id: 'h6', title: 'Downloading the APK', category: 'mobile' },
  { id: 'h7', title: 'Creating institute announcements', category: 'getting-started' },
  { id: 'h8', title: 'Viewing student results', category: 'academics' },
];

const QUICK_LINKS = [
  { icon: BookOpen, label: 'Documentation', href: 'https://esm-rose.vercel.app/#modules', color: 'text-emerald-600 bg-emerald-500/10' },
  { icon: Video, label: 'Video Tutorials', href: 'https://esm-rose.vercel.app/download', color: 'text-rose-600 bg-rose-500/10' },
  { icon: MessageSquare, label: 'Contact Support', href: 'mailto:support@esm-rose.vercel.app', color: 'text-amber-600 bg-amber-500/10' },
  { icon: Flag, label: 'Report an Issue', href: 'https://github.com/faisukhan01/esm/issues', color: 'text-violet-600 bg-violet-500/10' },
];

const SHORTCUTS = [
  { keys: ['⌘', 'K'], label: 'Command palette' },
  { keys: ['⌘', '/'], label: 'Search help' },
  { keys: ['Esc'], label: 'Close dialogs' },
  { keys: ['?'], label: 'Show shortcuts' },
];

export function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);

  // Keyboard shortcut: ? opens help, Escape closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === '?' && !open) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const filteredArticles = query.trim()
    ? ARTICLES.filter(a =>
        a.title.toLowerCase().includes(query.toLowerCase())
      )
    : ARTICLES;

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        ref={fabRef}
        onClick={() => setOpen(true)}
        aria-label="Help & Support"
        className="fixed bottom-5 right-5 z-40 h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg hover:shadow-xl grid place-items-center text-white transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
      >
        <LifeBuoy className="h-6 w-6" />
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-20" />
      </motion.button>

      {/* Expanded Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-5 right-5 z-50 w-[min(92vw,400px)] max-h-[80vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary to-primary/80">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-white/15 grid place-items-center">
                    <LifeBuoy className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">Help & Support</div>
                    <div className="text-white/70 text-[11px]">Concordia College v1.6.1</div>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close help"
                  className="h-8 w-8 grid place-items-center rounded-md text-white/80 hover:bg-white/10 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Search */}
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search help articles…"
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Body — scrollable */}
              <div className="flex-1 overflow-y-auto scroll-fancy p-3 space-y-4">
                {/* Quick Links */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                    Quick Links
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_LINKS.map((link) => {
                      const Icon = link.icon;
                      return (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-2 p-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-accent transition"
                        >
                          <span className={`h-8 w-8 rounded-md grid place-items-center ${link.color}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="text-xs font-medium text-foreground flex-1 leading-tight">
                            {link.label}
                          </span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                        </a>
                      );
                    })}
                  </div>
                </div>

                {/* Help Articles */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                    Help Articles ({filteredArticles.length})
                  </div>
                  {filteredArticles.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      No articles found
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {filteredArticles.slice(0, 6).map((article) => (
                        <li key={article.id}>
                          <button className="w-full text-left px-2.5 py-2 rounded-md hover:bg-accent text-sm text-foreground transition flex items-center gap-2">
                            <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="flex-1 truncate">{article.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Keyboard Shortcuts (collapsible) */}
                <div>
                  <button
                    onClick={() => setShowShortcuts(s => !s)}
                    className="w-full flex items-center justify-between px-1 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition"
                  >
                    <span className="flex items-center gap-1.5">
                      <Keyboard className="h-3.5 w-3.5" />
                      Keyboard Shortcuts
                    </span>
                    <span className="text-[10px]">{showShortcuts ? '▲' : '▼'}</span>
                  </button>
                  <AnimatePresence>
                    {showShortcuts && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <ul className="pt-1 space-y-1">
                          {SHORTCUTS.map((sc, i) => (
                            <li key={i} className="flex items-center justify-between px-2 py-1.5 text-xs">
                              <span className="text-muted-foreground">{sc.label}</span>
                              <span className="flex items-center gap-1">
                                {sc.keys.map((k, j) => (
                                  <kbd key={j} className="h-5 min-w-[20px] px-1 grid place-items-center rounded border border-border bg-muted text-[10px] font-medium">
                                    {k}
                                  </kbd>
                                ))}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Contact options */}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => window.location.href = 'mailto:support@esm-rose.vercel.app'}
                    >
                      <Mail className="h-3.5 w-3.5 mr-1.5" />
                      Email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => window.location.href = 'tel:+920000000000'}
                    >
                      <Phone className="h-3.5 w-3.5 mr-1.5" />
                      Call
                    </Button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-2.5 border-t border-border bg-muted/30 text-center">
                <span className="text-[10px] text-muted-foreground">
                  Press ? anytime for help · Built with ❤️ for modern education
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default HelpWidget;
