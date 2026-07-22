'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModuleHeader } from './students';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Library, BookOpen, Search, Plus, Download, Barcode, Package, TrendingUp } from 'lucide-react';

const statusStyle: Record<string, string> = {
  Available: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
  Issued: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  Lost: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
};

export function LibraryModule() {
  const [books, setBooks] = useState<any[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => { api.library().then(setBooks).catch(()=>{}); }, []);

  const filtered = books.filter(b =>
    !q || b.title.toLowerCase().includes(q.toLowerCase()) || b.author.toLowerCase().includes(q.toLowerCase()) || b.isbn.includes(q)
  );

  const totalBooks = books.reduce((a,b) => a + b.copies, 0);
  const available = books.reduce((a,b) => a + b.available, 0);
  const issued = totalBooks - available;
  const lost = books.filter(b => b.status === 'Lost').length;

  const cards = [
    { label: 'Total Books', value: totalBooks.toLocaleString(), icon: Library, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Available', value: available.toLocaleString(), icon: BookOpen, color: 'from-teal-500 to-cyan-600' },
    { label: 'Issued', value: issued.toLocaleString(), icon: Package, color: 'from-amber-500 to-yellow-600' },
    { label: 'Lost Books', value: lost, icon: TrendingUp, color: 'from-rose-500 to-red-600' },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Library Management"
        subtitle="Complete record of accomplishment — vendors, barcodes, issue/return & lost books"
        actions={<>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" /> Export</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"><Plus className="h-4 w-4 mr-1.5" /> Add Book</Button>
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

      <Card className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by title, author, ISBN…" className="pl-9" />
        </div>
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Book</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Vendor</TableHead>
                <TableHead className="hidden sm:table-cell">ISBN</TableHead>
                <TableHead>Copies</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 15).map(b => (
                <TableRow key={b.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-7 rounded bg-gradient-to-br from-emerald-600 to-emerald-800 grid place-items-center shrink-0">
                        <BookOpen className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{b.title}</div>
                        <div className="text-[11px] text-muted-foreground">{b.author}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell"><Badge variant="outline" className="font-normal">{b.category}</Badge></TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{b.vendor}</TableCell>
                  <TableCell className="hidden sm:table-cell font-mono text-[11px] text-muted-foreground">{b.isbn}</TableCell>
                  <TableCell>
                    <div className="text-sm"><span className="font-bold text-emerald-600">{b.available}</span> / {b.copies}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className={`font-normal ${statusStyle[b.status]}`}>{b.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" className="gap-1"><Barcode className="h-3.5 w-3.5" /> Issue</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
