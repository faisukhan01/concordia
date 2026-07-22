'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModuleHeader } from './students';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Landmark, DollarSign, TrendingUp, FileText, Plus, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const fmtMoney = (n: number) => '$' + n.toLocaleString('en-US');

const voucherInfo: Record<string, { name: string; color: string }> = {
  JV: { name: 'Journal Voucher', color: 'emerald' },
  CRV: { name: 'Cash Receipt', color: 'teal' },
  CPV: { name: 'Cash Payment', color: 'amber' },
  BRV: { name: 'Bank Receipt', color: 'cyan' },
  BPV: { name: 'Bank Payment', color: 'violet' },
  PV: { name: 'Purchase Voucher', color: 'rose' },
  SV: { name: 'Sales Voucher', color: 'orange' },
};

export function FinanceModule() {
  const [txns, setTxns] = useState<any[]>([]);

  useEffect(() => { api.finance().then(setTxns).catch(()=>{}); }, []);

  const totalDebit = txns.reduce((a,t) => a + t.debit, 0);
  const totalCredit = txns.reduce((a,t) => a + t.credit, 0);
  const net = totalCredit - totalDebit;

  const cards = [
    { label: 'Total Debit', value: fmtMoney(totalDebit), icon: ArrowUpRight, color: 'from-rose-500 to-red-600' },
    { label: 'Total Credit', value: fmtMoney(totalCredit), icon: ArrowDownRight, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Net Balance', value: fmtMoney(net), icon: DollarSign, color: 'from-amber-500 to-yellow-600' },
    { label: 'Vouchers', value: txns.length, icon: FileText, color: 'from-violet-500 to-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Finance Management"
        subtitle="Financial clarity, school success — vouchers, COA & financial reports"
        actions={<>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" /> Trial Balance</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"><Plus className="h-4 w-4 mr-1.5" /> New Voucher</Button>
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
              <div className="text-xl sm:text-2xl font-extrabold font-display">{c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Voucher types */}
      <Card className="p-5">
        <h3 className="font-bold text-base mb-4 flex items-center gap-2"><Landmark className="h-4 w-4 text-emerald-600" /> Voucher Types</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(voucherInfo).map(([code, info]) => (
            <div key={code} className={`p-3 rounded-xl bg-${info.color}-500/10 border border-${info.color}-500/20 text-center`}>
              <div className={`text-lg font-extrabold font-display text-${info.color}-600`}>{code}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{info.name}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Financial reports quick access */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {['Trial Balance','Profit & Loss','Balance Sheet','Cash Flow','Statement of Changes in Equity','Expense Report','Day Book','Chart of Accounts'].map(r => (
          <Card key={r} className="p-4 hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer">
            <FileText className="h-5 w-5 text-emerald-600 mb-2" />
            <div className="font-medium text-sm">{r}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">View report →</div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="font-bold text-base mb-4">Recent Transactions</h3>
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Voucher</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead>Debit</TableHead>
                <TableHead>Credit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txns.map(t => (
                <TableRow key={t.id} className="hover:bg-muted/30">
                  <TableCell>
                    <Badge variant="outline" className={`font-mono text-${voucherInfo[t.type].color}-600 bg-${voucherInfo[t.type].color}-500/10 border-${voucherInfo[t.type].color}-500/20`}>{t.id}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{t.date}</TableCell>
                  <TableCell className="text-sm font-medium">{t.account}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{t.description}</TableCell>
                  <TableCell className="text-sm">{t.debit ? <span className="text-rose-600 font-medium">{fmtMoney(t.debit)}</span> : '—'}</TableCell>
                  <TableCell className="text-sm">{t.credit ? <span className="text-emerald-600 font-medium">{fmtMoney(t.credit)}</span> : '—'}</TableCell>
                  <TableCell><Badge variant="outline" className={t.status === 'Posted' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20'}>{t.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
