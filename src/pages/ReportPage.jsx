// src/pages/ReportPage.jsx
import { useEffect, useState } from 'react';
import { api } from '../utils/api';

const MONTH_TH = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const SEASON_PRESETS = ['ฤดูกาลที่ 1', 'ฤดูกาลที่ 2', 'ฤดูกาลที่ 3'];

function fmt(n) {
  return Number(n || 0).toLocaleString('th-TH');
}

function formatDate(d) {
  if (!d) return '';
  const s = d.toString().slice(0, 10).split('-');
  if (s.length !== 3) return d;
  return `${parseInt(s[2])} ${MONTH_TH[parseInt(s[1])]} ${parseInt(s[0]) + 543}`;
}

function getLocalDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizeDate(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parts = value.toString().split('/');
  if (parts.length === 3 && parts[2].length === 4) {
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    return `${parts[2]}-${month}-${day}`;
  }
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return getLocalDateString(d);
  return value.toString();
}

export default function ReportPage({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [seasonFilter, setSeasonFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const txs = await api.getTransactions(user.uid);
      setTransactions(txs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user.uid]);

  const handleDelete = async (id) => {
    if (!confirm('ต้องการลบรายการนี้?')) return;
    setDeleting(id);
    try {
      await api.deleteTransaction(id, user.uid);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      alert('ลบไม่สำเร็จ: ' + e.message);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = transactions.filter((t) => {
    if (filter !== 'all' && t.type !== filter) return false;
    if (seasonFilter && (t.season || '').toString() !== seasonFilter) return false;
    const d = normalizeDate(t.date);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  });
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  const handleDownloadPdf = () => {
    const stamp = new Date();
    const stampStr = stamp.toLocaleString('th-TH');
    const fromLabel = dateFrom ? formatDate(dateFrom) : '-';
    const toLabel = dateTo ? formatDate(dateTo) : '-';
    const seasonLabel = seasonFilter || 'ทั้งหมด';
    const nameFrom = dateFrom || getLocalDateString();
    const nameTo = dateTo || getLocalDateString();
    const fileName = `รายงาน_${seasonLabel.replace(/\s+/g, '')}_${nameFrom}_${nameTo}`;
    const rowsHtml = filtered.map((tx) => {
      const amount = `${tx.type === 'income' ? '+' : '-'}${fmt(tx.amount)}`;
      const desc = `${tx.description || '-'}${tx.season ? ` [${tx.season}]` : ''}`;
      const amountColor = tx.type === 'income' ? '#2D7A4F' : '#c0392b';
      return `
        <tr>
          <td>${formatDate(tx.date)}</td>
          <td>${tx.category || '-'}</td>
          <td>${desc}</td>
          <td style="text-align:right;color:${amountColor};font-weight:700;">${amount}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>รายงานนาข้าว</title>
          <style>
            body { font-family: "Sarabun", "Noto Sans Thai", sans-serif; padding: 24px; color: #222; }
            h1 { margin: 0 0 6px; font-size: 20px; }
            .meta { color: #666; font-size: 12px; margin-bottom: 16px; }
            .summary { display: flex; gap: 12px; margin-bottom: 16px; font-size: 13px; }
            .pill { padding: 6px 12px; border-radius: 999px; color: #fff; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { padding: 8px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
            th { text-align: left; background: #f4f6f4; }
          </style>
        </head>
        <body>
          <h1>รายงานการเงินนาข้าว</h1>
          <div class="meta">พิมพ์เมื่อ: ${stampStr} · ประเภท: ${filter === 'all' ? 'ทั้งหมด' : filter === 'income' ? 'รายรับ' : 'รายจ่าย'} · ฤดูกาล: ${seasonLabel} · ช่วงวันที่: ${fromLabel} - ${toLabel}</div>
          <div class="summary">
            <div class="pill" style="background:#2D7A4F;">รายรับ: ${fmt(totalIncome)} ฿</div>
            <div class="pill" style="background:#c0392b;">รายจ่าย: ${fmt(totalExpense)} ฿</div>
            <div class="pill" style="background:${totalIncome - totalExpense >= 0 ? '#1565c0' : '#c0392b'};">กำไร: ${fmt(totalIncome - totalExpense)} ฿</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:110px;">วันที่</th>
                <th>หมวดหมู่</th>
                <th>รายละเอียด</th>
                <th style="width:110px;text-align:right;">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="4" style="text-align:center;color:#888;">ไม่มีรายการ</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.title = fileName;
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a3a1a', marginBottom: 20 }}>รายงานทั้งหมด</h2>

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={summaryPill('#2D7A4F')}>รายรับ: {fmt(totalIncome)} ฿</div>
        <div style={summaryPill('#c0392b')}>รายจ่าย: {fmt(totalExpense)} ฿</div>
        <div style={summaryPill(totalIncome - totalExpense >= 0 ? '#1565c0' : '#c0392b')}>
          กำไร: {fmt(totalIncome - totalExpense)} ฿
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...card, marginBottom: 16, padding: '16px 18px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a3a1a', marginBottom: 10 }}>ตัวกรองรายงาน</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[['all', 'ทั้งหมด'], ['income', 'รายรับ'], ['expense', 'รายจ่าย']].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 8,
                  border: '1.5px solid',
                  borderColor: filter === v ? '#2D7A4F' : '#ddd',
                  background: filter === v ? '#2D7A4F' : '#fff',
                  color: filter === v ? '#fff' : '#555',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                }}
              >
                {l}
              </button>
            ))}
          </div>
          <button onClick={handleDownloadPdf} style={pdfBtn}>⬇️ ดาวน์โหลด PDF</button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {SEASON_PRESETS.map(s => (
            <button
              key={s}
              onClick={() => setSeasonFilter(s)}
              style={{
                padding: '7px 14px',
                borderRadius: 999,
                border: '1.5px solid',
                borderColor: seasonFilter === s ? '#2D7A4F' : '#ddd',
                background: seasonFilter === s ? '#2D7A4F' : '#fff',
                color: seasonFilter === s ? '#fff' : '#555',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'inherit',
              }}
            >
              {s.replace('ฤดูกาลที่ ', 'ฤดูกาล ')}
            </button>
          ))}
          <button
            onClick={() => setSeasonFilter('')}
            style={{
              padding: '7px 14px',
              borderRadius: 999,
              border: '1.5px solid',
              borderColor: seasonFilter === '' ? '#2D7A4F' : '#ddd',
              background: seasonFilter === '' ? '#2D7A4F' : '#fff',
              color: seasonFilter === '' ? '#fff' : '#555',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            ทุกฤดูกาล
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#666' }}>จากวันที่</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={input} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#666' }}>ถึงวันที่</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={input} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#aaa' }}>กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#aaa' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
            ไม่มีรายการ
          </div>
        ) : (
          <>
            <div style={tableHeader}>
              <span style={{ flex: '0 0 110px' }}>วันที่</span>
              <span style={{ flex: 1 }}>หมวดหมู่</span>
              <span style={{ flex: 1, display: window.innerWidth > 500 ? 'block' : 'none' }}>รายละเอียด</span>
              <span style={{ flex: '0 0 110px', textAlign: 'right' }}>จำนวนเงิน</span>
              <span style={{ flex: '0 0 50px' }}></span>
            </div>

            {filtered.map(tx => (
              <div key={tx.id} style={tableRow}>
                <span style={{ flex: '0 0 110px', fontSize: 12, color: '#888' }}>{formatDate(tx.date)}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{tx.category}</span>
                <span style={{ flex: 1, fontSize: 13, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tx.description || '-'}{tx.season ? ` [${tx.season}]` : ''}
                </span>
                <span style={{ flex: '0 0 110px', textAlign: 'right', fontSize: 15, fontWeight: 600, color: tx.type === 'income' ? '#2D7A4F' : '#c0392b' }}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                </span>
                <button
                  onClick={() => handleDelete(tx.id)}
                  disabled={deleting === tx.id}
                  style={deleteBtn}
                  title="ลบ"
                >
                  {deleting === tx.id ? '⏳' : '🗑️'}
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

const summaryPill = (color) => ({
  background: color,
  color: '#fff',
  padding: '8px 16px',
  borderRadius: 20,
  fontSize: 13,
  fontWeight: 600,
});

const tableHeader = {
  display: 'flex',
  padding: '12px 18px',
  background: '#f8f8f8',
  fontSize: 12,
  fontWeight: 700,
  color: '#888',
  borderBottom: '1px solid #eee',
  gap: 8,
};

const tableRow = {
  display: 'flex',
  padding: '13px 18px',
  borderBottom: '1px solid #f5f5f5',
  alignItems: 'center',
  gap: 8,
};

const deleteBtn = {
  flex: '0 0 30px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 16,
  padding: 2,
  opacity: 0.6,
};

const pdfBtn = {
  background: '#2D7A4F',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 14px',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 700,
  fontFamily: 'inherit',
};

const input = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1.5px solid #e0e0e0',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  background: '#fff',
};

const card = {
  background: '#fff',
  borderRadius: 14,
  padding: '20px 22px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
};
