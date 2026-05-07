// src/pages/ReportPage.jsx
import { useEffect, useState } from 'react';
import { api } from '../utils/api';

const MONTH_TH = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

function fmt(n) {
  return Number(n || 0).toLocaleString('th-TH');
}

function formatDate(d) {
  if (!d) return '';
  const s = d.toString().slice(0, 10).split('-');
  if (s.length !== 3) return d;
  return `${parseInt(s[2])} ${MONTH_TH[parseInt(s[1])]} ${parseInt(s[0]) + 543}`;
}

export default function ReportPage({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, income, expense
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

  const filtered = transactions.filter(t => filter === 'all' || t.type === filter);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);

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

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
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
            {/* Header */}
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
