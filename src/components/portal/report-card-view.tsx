'use client';

// Shared Report Card components + PDF/print helpers used by both
// the Student Portal ("My Report Card") and the Branch Manager Portal
// ("Report Cards"). The PDF path uses the same jsPDF + html2canvas-in-iframe
// approach as the fee challan so we avoid the oklch/lab color parsing error.

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';

export type ReportSubject = {
  subject: string;
  exam?: string;
  totalMarks: number;
  obtainedMarks: number;
  grade: string;
  date?: string;
};

export type ReportCardData = {
  student?: {
    id?: string;
    name?: string;
    class?: string;
    section?: string;
    rollNo?: string;
  };
  term?: string;
  examName?: string;
  subjects?: ReportSubject[];
  totalMarks?: number;
  obtainedMarks?: number;
  percentage?: number;
  grade?: string;
  remarks?: string;
};

// Tailwind badge classes — emerald for A+/A, primary (navy) for B, amber for C,
// muted for D, rose for F. No indigo / blue / green accents.
export function gradeBadgeClass(grade: string | undefined): string {
  const g = String(grade || '').toUpperCase();
  if (g === 'A+') return 'text-emerald-700 bg-emerald-500/10 border-emerald-500/30';
  if (g === 'A') return 'text-emerald-700 bg-emerald-500/15 border-emerald-500/30';
  if (g === 'B') return 'text-primary bg-primary/10 border-primary/30';
  if (g === 'C') return 'text-amber-700 bg-amber-500/10 border-amber-500/30';
  if (g === 'D') return 'text-muted-foreground bg-muted border-border';
  if (g === 'F') return 'text-rose-700 bg-rose-500/10 border-rose-500/30';
  return 'text-muted-foreground bg-muted border-border';
}

// The on-screen report card document — used by both portals. Renders the
// institute banner, student info grid, subjects table, summary KPIs,
// remarks block, and Concordia College footer.
export function ReportCardDocument({ report, instituteName }: { report: ReportCardData; instituteName?: string }) {
  const stu = report.student || {};
  const subjects = Array.isArray(report.subjects) ? report.subjects : [];
  const inst = (instituteName || '').trim();

  return (
    <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
      {/* Navy institute banner */}
      <div className="bg-primary text-primary-foreground px-6 py-5">
        {inst && <div className="text-2xl font-extrabold tracking-tight leading-tight">{inst}</div>}
        <div className="text-xs font-semibold uppercase tracking-[0.3em] opacity-90 mt-1">Report Card</div>
      </div>

      {/* Student info grid */}
      <div className="px-6 py-4 border-b border-border grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Student</div><div className="font-semibold">{stu.name || '—'}</div></div>
        <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Class</div><div className="font-semibold">{stu.class || '—'}</div></div>
        <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Section</div><div className="font-semibold">{stu.section || '—'}</div></div>
        <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Roll No.</div><div className="font-semibold">{stu.rollNo || '—'}</div></div>
        <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Term</div><div className="font-semibold">{report.term || '—'}</div></div>
        <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Exam</div><div className="font-semibold">{report.examName || '—'}</div></div>
      </div>

      {/* Subjects table */}
      <div className="px-6 py-4">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Subject</TableHead>
              <TableHead className="hidden sm:table-cell">Exam</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Obtained</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">No subject results.</TableCell>
              </TableRow>
            ) : subjects.map((s, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{s.subject || '—'}</TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{s.exam || '—'}</TableCell>
                <TableCell className="text-right font-mono text-sm">{s.totalMarks}</TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold">{s.obtainedMarks}</TableCell>
                <TableCell><Badge variant="outline" className={gradeBadgeClass(s.grade)}>{s.grade}</Badge></TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{s.date || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary KPIs */}
      <div className="px-6 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 border border-border rounded-lg shadow-sm">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Marks</div>
          <div className="text-xl font-extrabold mt-1">{report.totalMarks ?? 0}</div>
        </Card>
        <Card className="p-4 border border-border rounded-lg shadow-sm">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Obtained</div>
          <div className="text-xl font-extrabold mt-1 text-primary">{report.obtainedMarks ?? 0}</div>
        </Card>
        <Card className="p-4 border border-border rounded-lg shadow-sm">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Percentage</div>
          <div className="text-2xl font-extrabold mt-1">{report.percentage ?? 0}%</div>
        </Card>
        <Card className="p-4 border border-border rounded-lg shadow-sm">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Overall Grade</div>
          <div className="mt-1">
            <Badge variant="outline" className={`text-base font-extrabold px-3 py-1 ${gradeBadgeClass(report.grade)}`}>{report.grade || '—'}</Badge>
          </div>
        </Card>
      </div>

      {/* Remarks */}
      {report.remarks && (
        <div className="px-6 pb-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Remarks</div>
            <div className="text-sm">{report.remarks}</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 border-t border-border text-center text-[11px] text-muted-foreground font-semibold">
        Powered by <span className="text-primary font-extrabold">Concordia College</span>
      </div>
    </div>
  );
}

// Inline-CSS grade color (hex only — for the PDF/print HTML where Tailwind
// classes / oklch are not available to html2canvas).
function gradeHexStyle(g: string | undefined): string {
  const x = String(g || '').toUpperCase();
  if (x === 'A+' || x === 'A') return 'color:#047857;background:#d1fae5;border-color:#6ee7b7;';
  if (x === 'B') return 'color:#F26522;background:#FFF7ED;border-color:#FDBA74;';
  if (x === 'C') return 'color:#b45309;background:#fef3c7;border-color:#fcd34d;';
  if (x === 'D') return 'color:#6b7280;background:#f3f4f6;border-color:#d1d5db;';
  if (x === 'F') return 'color:#991b1b;background:#fee2e2;border-color:#fca5a5;';
  return 'color:#6b7280;background:#f3f4f6;border-color:#d1d5db;';
}

function esc(v: any): string {
  return String(v ?? '—').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

// Build a fully self-contained HTML document for the report card. Uses only
// hex colors (no oklch/lab) so html2canvas can render it without errors.
export function buildReportCardHTML(report: ReportCardData, instituteName?: string): string {
  const stu = report.student || {};
  const subjects = Array.isArray(report.subjects) ? report.subjects : [];
  const inst = (instituteName || '').trim();
  const today = new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });

  const subjectRows = subjects.length > 0
    ? subjects.map((s) => `
      <tr>
        <td>${esc(s.subject)}</td>
        <td>${esc(s.exam || '—')}</td>
        <td style="text-align:right">${s.totalMarks}</td>
        <td style="text-align:right;font-weight:700">${s.obtainedMarks}</td>
        <td><span class="badge" style="${gradeHexStyle(s.grade)}">${esc(s.grade)}</span></td>
        <td>${esc(s.date || '—')}</td>
      </tr>`).join('')
    : `<tr><td colspan="6" style="text-align:center;color:#6b7280;padding:24px">No subject results.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<title>Report Card ${esc(stu.name || '')}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 24px; background: #ffffff; color: #1f2937; }
  .rc { max-width: 760px; margin: 0 auto; background: #fff; border: 2px solid #F26522; border-radius: 14px; box-shadow: 0 12px 40px rgba(0,0,0,0.06); overflow: hidden; }
  .banner { background: linear-gradient(135deg, #F26522 0%, #FF8C42 100%); color: #fff; padding: 22px 28px; }
  .inst { font-size: 26px; font-weight: 900; letter-spacing: 0.5px; margin: 0; line-height: 1.1; }
  .ttl { font-size: 12px; color: #c3d4e8; margin-top: 6px; letter-spacing: 3px; font-weight: 700; }
  .info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px 24px; padding: 18px 28px; border-bottom: 2px dashed #b6c5d8; }
  .lbl { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
  .val { font-size: 14px; font-weight: 700; color: #111827; }
  table { width: calc(100% - 56px); margin: 18px 28px; border-collapse: collapse; }
  th, td { padding: 10px 12px; text-align: left; font-size: 13px; border-bottom: 1px solid #e5e7eb; }
  th { background: #f3f4f6; color: #1a1a1a; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
  tr:nth-child(even) td { background: #fafbfc; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; border: 1px solid; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 0 28px 18px; }
  .sum-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; background: #fff; }
  .sum-lbl { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
  .sum-val { font-size: 20px; font-weight: 800; color: #D4541E; margin-top: 4px; }
  .remarks { margin: 0 28px 18px; padding: 14px 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; }
  .rem-lbl { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .rem-txt { font-size: 13px; color: #111827; }
  .gen { font-size: 10px; color: #9ca3af; text-align: right; padding: 6px 28px 0; }
  .footer { text-align: center; padding: 12px 28px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; font-weight: 600; }
  .footer-brand { color: #F26522; font-weight: 800; }
  @media print {
    body { padding: 0; background: #fff; }
    .rc { box-shadow: none; border: 2px solid #F26522; }
  }
</style></head>
<body>
  <div class="rc">
    <div class="banner">
      <div class="inst">${inst ? esc(inst) : 'School Report Card'}</div>
      <div class="ttl">REPORT CARD</div>
    </div>
    <div class="info">
      <div><div class="lbl">Student</div><div class="val">${esc(stu.name || '—')}</div></div>
      <div><div class="lbl">Class</div><div class="val">${esc(stu.class || '—')}</div></div>
      <div><div class="lbl">Section</div><div class="val">${esc(stu.section || '—')}</div></div>
      <div><div class="lbl">Roll No.</div><div class="val">${esc(stu.rollNo || '—')}</div></div>
      <div><div class="lbl">Term</div><div class="val">${esc(report.term || '—')}</div></div>
      <div><div class="lbl">Exam</div><div class="val">${esc(report.examName || '—')}</div></div>
    </div>
    <table>
      <thead><tr>
        <th>Subject</th>
        <th>Exam</th>
        <th style="text-align:right">Total</th>
        <th style="text-align:right">Obtained</th>
        <th>Grade</th>
        <th>Date</th>
      </tr></thead>
      <tbody>${subjectRows}</tbody>
    </table>
    <div class="summary">
      <div class="sum-card"><div class="sum-lbl">Total Marks</div><div class="sum-val">${report.totalMarks ?? 0}</div></div>
      <div class="sum-card"><div class="sum-lbl">Obtained</div><div class="sum-val" style="color:#F26522">${report.obtainedMarks ?? 0}</div></div>
      <div class="sum-card"><div class="sum-lbl">Percentage</div><div class="sum-val">${report.percentage ?? 0}%</div></div>
      <div class="sum-card"><div class="sum-lbl">Overall Grade</div><div class="sum-val"><span class="badge" style="${gradeHexStyle(report.grade)}">${esc(report.grade)}</span></div></div>
    </div>
    ${report.remarks ? `<div class="remarks"><div class="rem-lbl">Remarks</div><div class="rem-txt">${esc(report.remarks)}</div></div>` : ''}
    <div class="gen">Generated on ${today}</div>
    <div class="footer">Powered by <span class="footer-brand">Concordia College</span></div>
  </div>
</body></html>`;
}

// Generate an actual PDF file using jsPDF + html2canvas (no print dialog, ever).
// The HTML is rendered inside an isolated iframe so html2canvas only sees the
// report card's own hex-color CSS (no oklch/lab from the parent page).
export async function downloadReportCardPDF(report: ReportCardData, instituteName?: string): Promise<{ via: 'pdf' | 'error' }> {
  const html = buildReportCardHTML(report, instituteName);
  const safeName = String(report.student?.name || 'student').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 40) || 'student';

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
    try { document.body.removeChild(iframe); } catch {}
    return { via: 'error' };
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for the iframe content to render
  await new Promise(resolve => setTimeout(resolve, 200));

  const el = iframeDoc.querySelector('.rc') as HTMLElement | null;
  const renderEl: HTMLElement = el || iframeDoc.body;

  try {
    const { default: jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    const canvas = await html2canvas(renderEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 800,
      // @ts-expect-error — html2canvas accepts a `window` option but its types don't expose it
      window: iframe.contentWindow,
    });

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10; // 10mm margin
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= pageHeight - margin * 2) {
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

    pdf.save(`ReportCard-${safeName}.pdf`);
    return { via: 'pdf' };
  } catch (err) {
    console.error('Report card PDF generation failed:', err);
    return { via: 'error' };
  } finally {
    try { document.body.removeChild(iframe); } catch {}
  }
}

// Print-friendly path: write the report card HTML to a hidden iframe and call
// `print()` on the iframe's window. This opens the browser print dialog with
// only the report card content (no sidebar, no nav, no app chrome).
export function printReportCardHTML(report: ReportCardData, instituteName?: string) {
  const html = buildReportCardHTML(report, instituteName);
  let iframe = document.getElementById('esm-rc-frame') as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'esm-rc-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('title', 'Concordia College report card print frame');
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

// Reusable action row for the Download PDF + Print buttons. Both portals share
// the exact same UX, so the parent only needs to pass a `report` and an
// optional `instituteName`.
export function ReportCardActions({
  report,
  instituteName,
  busy,
  disabled,
}: {
  report: ReportCardData | null;
  instituteName?: string;
  busy?: boolean;
  disabled?: boolean;
}) {
  const onDownload = async () => {
    if (!report) return;
    try {
      const result = await downloadReportCardPDF(report, instituteName);
      if (result.via === 'pdf') {
        toast({ title: 'Report card downloaded', description: `ReportCard-${String(report.student?.name || 'student').slice(0, 24)}.pdf saved to your downloads.` });
      } else {
        toast({ title: 'Download failed', description: 'Could not generate the PDF. Please try again.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Download failed', description: 'Could not generate the PDF. Please try again.', variant: 'destructive' });
    }
  };

  const onPrint = () => {
    if (!report) return;
    printReportCardHTML(report, instituteName);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button onClick={onDownload} disabled={disabled || busy || !report} className="bg-primary hover:bg-primary/90 text-white">
        {busy ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Preparing…</> : <><Download className="h-4 w-4 mr-1.5" /> Download PDF</>}
      </Button>
      <Button onClick={onPrint} disabled={disabled || !report} variant="outline">
        <Printer className="h-4 w-4 mr-1.5" /> Print
      </Button>
    </div>
  );
}
