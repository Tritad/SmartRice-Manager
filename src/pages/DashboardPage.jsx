// src/pages/DashboardPage.jsx
import { useEffect, useState } from 'react';
import { api } from '../utils/api';

const MONTH_TH = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const SEASON_PRESETS = ['ฤดูกาลที่ 1', 'ฤดูกาลที่ 2', 'ฤดูกาลที่ 3'];

function fmt(n) {
  return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 0 });
}

function getLocalDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function DashboardPage({ user, setPage, season, setSeason }) {
  const [summary, setSummary] = useState(null);
  const [transactionsAll, setTransactionsAll] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year] = useState(new Date().getFullYear().toString());
  const [billDate, setBillDate] = useState(getLocalDateString());
  const [showAllBills, setShowAllBills] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [sum, txs] = await Promise.all([
          api.getSummary(user.uid, year, undefined, season),
          api.getTransactions(user.uid, season),
        ]);
        setSummary(sum);
        setTransactionsAll(txs);
        setRecentTransactions(txs.slice(0, 8)); // แสดง 8 รายการล่าสุด
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.uid, year, season]);

  if (loading) return <LoadingSpinner />;

  const profit = summary ? summary.netProfit : 0;
  const billTransactions = showAllBills
    ? transactionsAll
    : transactionsAll.filter(t => (t.date ? t.date.toString().slice(0, 10) : '') === billDate);
  const billIncome = billTransactions.filter(t => t.type === 'income')
    .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  const billExpense = billTransactions.filter(t => t.type === 'expense')
    .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a3a1a', margin: 0 }}>
          สวัสดี, {user.displayName || user.email?.split('@')[0]} 👋
        </h2>
        <p style={{ color: '#666', marginTop: 4, fontSize: 14 }}>ปี {parseInt(year) + 543} · ฤดูกาลที่เลือก: {season || '-'}</p>
      </div>

      {/* Season Selector */}
      <div style={{ ...card, marginBottom: 20, padding: '16px 18px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a3a1a', marginBottom: 10 }}>เลือกฤดูกาล</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SEASON_PRESETS.map(s => (
            <button
              key={s}
              onClick={() => setSeason(s)}
              style={{
                padding: '7px 14px',
                borderRadius: 999,
                border: '1.5px solid',
                borderColor: season === s ? '#2D7A4F' : '#ddd',
                background: season === s ? '#2D7A4F' : '#fff',
                color: season === s ? '#fff' : '#555',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'inherit',
              }}
            >
              {s.replace('ฤดูกาลที่ ', 'ฤดูกาล ')}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
          <span style={{ fontSize: 12, color: '#777' }}>กำหนดเอง</span>
          <input
            type="text"
            placeholder="เช่น นาปี 2569, รุ่นที่ 2"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 10px',
              border: '1.5px solid #e0e0e0',
              borderRadius: 10,
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <SummaryCard label="ต้นทุนรวม" value={summary?.totalExpense || 0} color="#c0392b" icon="📤" />
        <SummaryCard label="รายรับรวม" value={summary?.totalIncome || 0} color="#2D7A4F" icon="💰" />
        <SummaryCard
          label="กำไรสุทธิ"
          value={profit}
          color={profit >= 0 ? '#1565c0' : '#c0392b'}
          icon={profit >= 0 ? '📈' : '📉'}
        />
      </div>

      {/* Bills By Date */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h3 style={{ ...cardTitle, marginBottom: 0 }}>บิลรายรับ-รายจ่ายตามวันที่</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {!showAllBills && (
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                style={{
                  padding: '7px 10px',
                  border: '1.5px solid #e0e0e0',
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: 'inherit',
                }}
              />
            )}
            <button
              onClick={() => setShowAllBills(prev => !prev)}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: '1.5px solid #2D7A4F',
                background: showAllBills ? '#2D7A4F' : '#fff',
                color: showAllBills ? '#fff' : '#2D7A4F',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'inherit',
              }}
            >
              {showAllBills ? 'ดูตามวันที่' : 'ดูทั้งหมดของฤดูกาล'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={pill('#c0392b')}>ต้นทุน: {fmt(billExpense)} ฿</span>
          <span style={pill('#2D7A4F')}>รายรับ: {fmt(billIncome)} ฿</span>
          <span style={pill(billIncome - billExpense >= 0 ? '#1565c0' : '#c0392b')}>
            คงเหลือ: {fmt(billIncome - billExpense)} ฿
          </span>
        </div>

        {billTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#aaa' }}>
            <div style={{ fontSize: 36 }}>🧾</div>
            <p>ไม่มีบิลในช่วงที่เลือก</p>
          </div>
        ) : (
          billTransactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)
        )}
      </div>

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

        {recentTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa' }}>
            <div style={{ fontSize: 40 }}>📋</div>
            <p>ยังไม่มีรายการ กดปุ่มด้านบนเพื่อเพิ่มรายการแรก</p>
          </div>
        ) : (
          recentTransactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)
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

const pill = (color) => ({
  background: color,
  color: '#fff',
  padding: '6px 12px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
});
