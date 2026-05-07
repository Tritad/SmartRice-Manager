// src/pages/DashboardPage.jsx
import { useEffect, useState } from 'react';
import { api } from '../utils/api';

const MONTH_TH = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function fmt(n) {
  return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 0 });
}

export default function DashboardPage({ user, setPage }) {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [sum, txs] = await Promise.all([
          api.getSummary(user.uid, year),
          api.getTransactions(user.uid),
        ]);
        setSummary(sum);
        setTransactions(txs.slice(0, 8)); // แสดง 8 รายการล่าสุด
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.uid, year]);

  if (loading) return <LoadingSpinner />;

  const profit = summary ? summary.netProfit : 0;

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a3a1a', margin: 0 }}>
          สวัสดี, {user.displayName || user.email?.split('@')[0]} 👋
        </h2>
        <p style={{ color: '#666', marginTop: 4, fontSize: 14 }}>ปี {parseInt(year) + 543} · ภาพรวมการเงินนาข้าว</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <SummaryCard label="รายรับทั้งหมด" value={summary?.totalIncome || 0} color="#2D7A4F" icon="💰" />
        <SummaryCard label="รายจ่ายทั้งหมด" value={summary?.totalExpense || 0} color="#c0392b" icon="📤" />
        <SummaryCard
          label="กำไรสุทธิ"
          value={profit}
          color={profit >= 0 ? '#1565c0' : '#c0392b'}
          icon={profit >= 0 ? '📈' : '📉'}
        />
      </div>

      {/* Monthly Bar Chart (CSS only) */}
      {summary?.monthly && (
        <div style={card}>
          <h3 style={cardTitle}>รายรับ-รายจ่ายรายเดือน {parseInt(year) + 543}</h3>
          <MonthlyChart monthly={summary.monthly} />
        </div>
      )}

      {/* Category Breakdown */}
      {summary?.byCategory && Object.keys(summary.byCategory).length > 0 && (
        <div style={{ ...card, marginTop: 16 }}>
          <h3 style={cardTitle}>สรุปตามหมวดหมู่</h3>
          {Object.entries(summary.byCategory).map(([cat, val]) => (
            <CategoryRow key={cat} category={cat} income={val.income} expense={val.expense} />
          ))}
        </div>
      )}

      {/* Recent Transactions */}
      <div style={{ ...card, marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ ...cardTitle, marginBottom: 0 }}>รายการล่าสุด</h3>
          <button onClick={() => setPage('add')} style={addBtn}>+ เพิ่มรายการ</button>
        </div>

        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa' }}>
            <div style={{ fontSize: 40 }}>📋</div>
            <p>ยังไม่มีรายการ กดปุ่มด้านบนเพื่อเพิ่มรายการแรก</p>
          </div>
        ) : (
          transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, icon }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{fmt(value)} ฿</div>
    </div>
  );
}

function MonthlyChart({ monthly }) {
  const maxVal = Math.max(...monthly.map(m => Math.max(m.income, m.expense)), 1);
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, minWidth: 500, height: 120, padding: '0 4px' }}>
        {monthly.map((m, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 90 }}>
              <div style={{ flex: 1, background: '#2D7A4F', borderRadius: '3px 3px 0 0', height: `${(m.income / maxVal) * 90}px`, transition: 'height 0.6s', minHeight: m.income > 0 ? 2 : 0 }} />
              <div style={{ flex: 1, background: '#e74c3c', borderRadius: '3px 3px 0 0', height: `${(m.expense / maxVal) * 90}px`, transition: 'height 0.6s', minHeight: m.expense > 0 ? 2 : 0 }} />
            </div>
            <span style={{ fontSize: 11, color: '#888' }}>{MONTH_TH[parseInt(m.month)]}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: '#666' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#2D7A4F', borderRadius: 2, marginRight: 4 }} />รายรับ</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#e74c3c', borderRadius: 2, marginRight: 4 }} />รายจ่าย</span>
      </div>
    </div>
  );
}

function CategoryRow({ category, income, expense }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: 14 }}>
      <span style={{ color: '#333', fontWeight: 500 }}>{category}</span>
      <div style={{ display: 'flex', gap: 16 }}>
        {income > 0 && <span style={{ color: '#2D7A4F' }}>+{fmt(income)}</span>}
        {expense > 0 && <span style={{ color: '#c0392b' }}>-{fmt(expense)}</span>}
      </div>
    </div>
  );
}

function TransactionRow({ tx }) {
  const isIncome = tx.type === 'income';
  const d = tx.date ? tx.date.toString().slice(0, 10) : '';
  const parts = d.split('-');
  const dateStr = parts.length === 3 ? `${parseInt(parts[2])} ${MONTH_TH[parseInt(parts[1])]} ${parseInt(parts[0]) + 543}` : d;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#222' }}>{tx.category}</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{dateStr}{tx.description ? ` · ${tx.description}` : ''}</div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: isIncome ? '#2D7A4F' : '#c0392b' }}>
        {isIncome ? '+' : '-'}{fmt(tx.amount)} ฿
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
      <div style={{ fontSize: 36 }}>🌾</div>
      <p style={{ marginTop: 12 }}>กำลังโหลดข้อมูล...</p>
    </div>
  );
}

const card = {
  background: '#fff',
  borderRadius: 14,
  padding: '20px 22px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
};

const cardTitle = {
  fontSize: 16,
  fontWeight: 700,
  color: '#1a3a1a',
  marginTop: 0,
  marginBottom: 16,
};

const addBtn = {
  background: '#2D7A4F',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 16px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
