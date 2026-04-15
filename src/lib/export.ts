/**
 * Export utilities — CSV and print/PDF
 * No npm packages required. Pure browser APIs.
 */

// ─── CSV Export ───────────────────────────────────────────────────────────────

type CsvRow = Record<string, string | number | boolean | null | undefined>;

/**
 * Convert an array of objects to a CSV string and trigger a browser download.
 * @param data     Array of plain objects (keys become column headers)
 * @param filename Desired filename without extension (e.g. "compliance-2026-04")
 */
export function exportToCSV(data: CsvRow[], filename: string): void {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h] ?? '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
    }).join(',')
  );

  const csv = [headers.join(','), ...rows].join('\r\n');
  const BOM = '\uFEFF'; // UTF-8 BOM so Excel opens Uzbek/Russian text correctly
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Compliance CSV ───────────────────────────────────────────────────────────

export function exportComplianceToCSV(
  items: { title: string; type: string; dueDate: string; status: string }[],
  clinicName = ''
): void {
  const rows: CsvRow[] = items.map((item) => ({
    'Nomi': item.title,
    'Turi': item.type,
    'Muddat': item.dueDate,
    'Holat': item.status,
  }));
  const date = new Date().toISOString().split('T')[0];
  exportToCSV(rows, `muddatlar-${clinicName ? clinicName + '-' : ''}${date}`);
}

// ─── Documents CSV ────────────────────────────────────────────────────────────

export function exportDocumentsToCSV(
  docs: { title: string; type: string; status: string; createdAt: string }[]
): void {
  const rows: CsvRow[] = docs.map((d) => ({
    'Sarlavha': d.title,
    'Turi': d.type,
    'Holat': d.status,
    'Yaratilgan': d.createdAt,
  }));
  const date = new Date().toISOString().split('T')[0];
  exportToCSV(rows, `hujjatlar-${date}`);
}

// ─── ERP CSV ─────────────────────────────────────────────────────────────────

export function exportERPToCSV(
  records: { patientId: string; visitDate: string; diagnosis: string; assignedDoctorId: string }[]
): void {
  const rows: CsvRow[] = records.map((r) => ({
    'Bemor ID': r.patientId,
    'Tashrif sanasi': r.visitDate,
    'Tashxis': r.diagnosis,
    'Shifokor': r.assignedDoctorId,
  }));
  const date = new Date().toISOString().split('T')[0];
  exportToCSV(rows, `vizitlar-${date}`);
}

// ─── PDF / Print ──────────────────────────────────────────────────────────────

/**
 * Print a document using browser's native print dialog.
 * Renders a clean, formatted print layout in a new window.
 */
export function printDocument(content: {
  title: string;
  body: string;
  clinicName?: string;
  date?: string;
  status?: string;
}): void {
  const html = `
    <!DOCTYPE html>
    <html lang="uz">
    <head>
      <meta charset="UTF-8" />
      <title>${content.title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; font-size: 14px; color: #111; padding: 40px 60px; line-height: 1.7; }
        .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #111; padding-bottom: 16px; }
        .header h1 { font-size: 20px; text-transform: uppercase; letter-spacing: 0.05em; }
        .header .meta { font-size: 12px; color: #555; margin-top: 8px; }
        .body { white-space: pre-wrap; margin-top: 24px; }
        .footer { margin-top: 48px; border-top: 1px solid #ccc; padding-top: 16px; font-size: 11px; color: #777; display: flex; justify-content: space-between; }
        .status-badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: bold;
          background: ${content.status === 'approved' ? '#d1fae5' : content.status === 'rejected' ? '#fee2e2' : '#f1f5f9'};
          color: ${content.status === 'approved' ? '#065f46' : content.status === 'rejected' ? '#991b1b' : '#475569'};
        }
        @media print { body { padding: 20px 30px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${content.title}</h1>
        <div class="meta">
          ${content.clinicName ? `<span>${content.clinicName}</span> &nbsp;|&nbsp; ` : ''}
          <span>${content.date ?? new Date().toLocaleDateString('uz-UZ')}</span>
          ${content.status ? `&nbsp;|&nbsp; <span class="status-badge">${content.status}</span>` : ''}
        </div>
      </div>
      <div class="body">${content.body.replace(/\n/g, '<br/>')}</div>
      <div class="footer">
        <span>Smart Medical Association Platform</span>
        <span>Bosilgan: ${new Date().toLocaleString('uz-UZ')}</span>
      </div>
    </body>
    </html>
  `;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}

// ─── Inspection Print Report ──────────────────────────────────────────────────

export interface InspectionPrintItem {
  label: string;
  status: 'pass' | 'fail' | 'warning';
  riskLevel: 'high' | 'medium' | 'low';
}

export function printInspectionReport(data: {
  checklistType: string;
  clinicName?: string;
  date: string;
  overallRisk: 'high' | 'medium' | 'low';
  score?: number;
  items: InspectionPrintItem[];
  recommendations: string[];
}): void {
  const riskColor = { high: '#dc2626', medium: '#d97706', low: '#16a34a' };
  const statusLabel = { pass: "O'tdi ✅", fail: 'Muvaffaqiyatsiz ❌', warning: 'Ogohlantirish ⚠️' };
  const statusBg = { pass: '#dcfce7', fail: '#fee2e2', warning: '#fef3c7' };
  const riskLabel = { high: 'Yuqori xavf', medium: "O'rta xavf", low: 'Past xavf' };

  const rows = data.items.map((item) => `
    <tr style="border-bottom:1px solid #e2e8f0">
      <td style="padding:8px 12px;font-size:13px">${item.label}</td>
      <td style="padding:8px 12px;text-align:center">
        <span style="background:${statusBg[item.status]};padding:2px 8px;border-radius:99px;font-size:12px;font-weight:600">
          ${statusLabel[item.status]}
        </span>
      </td>
      <td style="padding:8px 12px;text-align:center;font-size:12px;color:${riskColor[item.riskLevel]};font-weight:600">
        ${riskLabel[item.riskLevel]}
      </td>
    </tr>`).join('');

  const recs = data.recommendations.length
    ? data.recommendations.map((r) => `<li style="margin-bottom:6px;color:#475569">${r}</li>`).join('')
    : '<li style="color:#94a3b8">Tavsiyalar yo\'q</li>';

  const passCount = data.items.filter((i) => i.status === 'pass').length;
  const failCount = data.items.filter((i) => i.status === 'fail').length;
  const warnCount = data.items.filter((i) => i.status === 'warning').length;

  const html = `<!DOCTYPE html>
<html lang="uz"><head><meta charset="UTF-8"/><title>Tekshiruv Hisoboti</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',sans-serif;font-size:14px;color:#111;padding:32px 48px;background:#fff}
  .header{text-align:center;margin-bottom:28px;padding-bottom:16px;border-bottom:3px solid #0f172a}
  .header h1{font-size:22px;text-transform:uppercase;letter-spacing:.04em}
  .header .sub{font-size:13px;color:#64748b;margin-top:6px}
  .risk-badge{display:inline-block;padding:6px 18px;border-radius:6px;font-weight:700;font-size:16px;
    background:${riskColor[data.overallRisk]}20;color:${riskColor[data.overallRisk]};margin:16px auto}
  .summary{display:flex;gap:24px;margin:20px 0;justify-content:center}
  .summary-item{text-align:center;padding:12px 20px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0}
  .summary-item .num{font-size:24px;font-weight:700}
  table{width:100%;border-collapse:collapse;margin:20px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
  th{background:#0f172a;color:white;padding:10px 12px;font-size:12px;text-align:left;text-transform:uppercase;letter-spacing:.04em}
  tr:nth-child(even){background:#f8fafc}
  .recs{margin-top:20px;padding:16px;background:#f1f5f9;border-radius:8px;border-left:4px solid #0f172a}
  .recs h3{font-size:13px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px;color:#0f172a}
  ul{padding-left:18px}
  .footer{margin-top:32px;border-top:1px solid #e2e8f0;padding-top:12px;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between}
  @media print{body{padding:16px 24px}}
</style></head><body>
  <div class="header">
    <h1>Tekshiruv Hisoboti — ${data.checklistType}</h1>
    <div class="sub">
      ${data.clinicName ? `${data.clinicName} &nbsp;|&nbsp; ` : ''}Sana: ${data.date}
    </div>
    <div class="risk-badge">${riskLabel[data.overallRisk]}</div>
  </div>
  <div class="summary">
    <div class="summary-item"><div class="num" style="color:#16a34a">${passCount}</div><div style="font-size:11px;color:#64748b;margin-top:2px">O'tdi</div></div>
    <div class="summary-item"><div class="num" style="color:#d97706">${warnCount}</div><div style="font-size:11px;color:#64748b;margin-top:2px">Ogohlantirish</div></div>
    <div class="summary-item"><div class="num" style="color:#dc2626">${failCount}</div><div style="font-size:11px;color:#64748b;margin-top:2px">Muvaffaqiyatsiz</div></div>
    <div class="summary-item"><div class="num">${data.items.length}</div><div style="font-size:11px;color:#64748b;margin-top:2px">Jami</div></div>
  </div>
  <table>
    <thead><tr><th>Mezon</th><th style="text-align:center;width:160px">Holat</th><th style="text-align:center;width:140px">Xavf darajasi</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="recs">
    <h3>Tavsiyalar</h3>
    <ul>${recs}</ul>
  </div>
  <div class="footer">
    <span>Smart Medical Association Platform</span>
    <span>Bosilgan: ${new Date().toLocaleString('uz-UZ')}</span>
  </div>
</body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}

// ─── Password Strength ────────────────────────────────────────────────────────

export type PasswordStrength = { score: 0 | 1 | 2 | 3 | 4; label: string; color: string };

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  const labels = ["Juda zaif", "Zaif", "O'rtacha", "Kuchli", "Juda kuchli"];
  const colors = ["#dc2626", "#f97316", "#eab308", "#22c55e", "#16a34a"];
  return { score: clamped, label: labels[clamped], color: colors[clamped] };
}

// ─── QR Code ──────────────────────────────────────────────────────────────────

/**
 * Returns a QR code image URL for the given data string.
 * Uses the free QR server API — no npm package needed.
 */
export function getQRCodeUrl(data: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&format=png&qzone=1`;
}
