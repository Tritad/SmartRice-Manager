// src/pages/AddTransactionPage.jsx
import { useState } from 'react';
import { api } from '../utils/api';

const CATEGORIES = {
  expense: ['ค่าเมล็ดพันธุ์', 'ค่าปุ๋ย/ยา', 'ค่าแรงงาน', 'ค่าเครื่องจักร/เช่า', 'ค่าน้ำมัน', 'ค่าเช่าที่นา', 'ค่าไฟ/น้ำ', 'อื่นๆ'],
  income: ['รายรับจากการขาย', 'เงินอุดหนุน', 'ขายพืชร่วม', 'อื่นๆ'],
};
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

function normalizeDate(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parts = value.split('/');
  if (parts.length === 3 && parts[2].length === 4) {
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    return `${parts[2]}-${month}-${day}`;
  }
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return getLocalDateString(d);
  return value;
}

export default function AddTransactionPage({ user, setPage, season, setSeason }) {
  const createItem = (type) => ({
    category: CATEGORIES[type][0],
    quantity: '',
    price: '',
    note: '',
  });

  const [form, setForm] = useState({
    date: getLocalDateString(),
    type: 'expense',
    description: '',
    season: season || '',
  });
  const [items, setItems] = useState([createItem('expense')]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleTypeChange = (type) => {
    set('type', type);
    setItems(prev => prev.map(it => ({ ...it, category: CATEGORIES[type][0] })));
  };

  const updateItem = (idx, patch) => {
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addItem = () => setItems(prev => [...prev, createItem(form.type)]);
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const calcAmount = (item) => {
    const qty = parseFloat(item.quantity);
    const price = parseFloat(item.price);
    if (!qty || !price) return 0;
    return qty * price;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.season || form.season.trim().length === 0) {
      setError('กรุณาเลือกฤดูกาลก่อนบันทึก');
      return;
    }
    if (items.length === 0) {
      setError('กรุณาเพิ่มรายการอย่างน้อย 1 รายการ');
      return;
    }
    const hasInvalid = items.some(it => !it.category || parseFloat(it.quantity) <= 0 || parseFloat(it.price) <= 0);
    if (hasInvalid) {
      setError('กรุณากรอกจำนวนและราคาให้ถูกต้อง');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const normalizedDate = normalizeDate(form.date);
      const payloads = items.map(it => {
        const lineNote = (it.note || '').trim();
        const lineSummary = `จำนวน ${it.quantity} x ราคา ${it.price}`;
        const descParts = [];
        if (form.description) descParts.push(form.description);
        if (lineNote) descParts.push(lineNote);
        descParts.push(lineSummary);

        return {
        ...form,
        date: normalizedDate,
        userId: user.uid,
        userEmail: user.email,
        category: it.category,
        amount: calcAmount(it),
        description: descParts.join(' | '),
        };
      });
      await Promise.all(payloads.map(p => api.addTransaction(p)));
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setForm(prev => ({ ...prev, description: '' }));
        setItems([createItem(form.type)]);
      }, 3000);
    } catch (e) {
      setError('บันทึกไม่สำเร็จ: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = items.reduce((s, it) => s + calcAmount(it), 0);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => setPage('dashboard')} style={backBtn}>← กลับ</button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a3a1a' }}>บันทึกรายการ</h2>
      </div>

      <div style={card}>
        {/* Season */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a3a1a', marginBottom: 8 }}>เลือกฤดูกาล</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SEASON_PRESETS.map(s => (
              <button
                key={s}
                onClick={() => {
                  set('season', s);
                  setSeason(s);
                }}
                type="button"
                style={{
                  padding: '7px 14px',
                  borderRadius: 999,
                  border: '1.5px solid',
                  borderColor: form.season === s ? '#2D7A4F' : '#ddd',
                  background: form.season === s ? '#2D7A4F' : '#fff',
                  color: form.season === s ? '#fff' : '#555',
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
              value={form.season}
              onChange={e => {
                set('season', e.target.value);
                setSeason(e.target.value);
              }}
              style={input}
              required
            />
          </div>
        </div>

        {/* Type Toggle */}
        <div style={toggleRow}>
          {['expense', 'income'].map(t => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              style={{
                ...toggleBtn,
                background: form.type === t ? (t === 'income' ? '#2D7A4F' : '#c0392b') : 'transparent',
                color: form.type === t ? '#fff' : '#666',
              }}
            >
              {t === 'expense' ? '📤 รายจ่าย' : '💰 รายรับ'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Date */}
          <FormGroup label="วันที่">
            <input
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              style={input}
              required
            />
          </FormGroup>

          {/* Items */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#444' }}>รายการย่อย</div>
              <button type="button" onClick={addItem} style={smallBtn}>+ เพิ่มรายการ</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((it, idx) => (
                <div key={idx} style={itemCard}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.6fr 0.7fr 0.7fr 32px', gap: 8, alignItems: 'center' }}>
                    <select
                      value={it.category}
                      onChange={e => updateItem(idx, { category: e.target.value })}
                      style={inputSmall}
                    >
                      {CATEGORIES[form.type].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input
                      type="number"
                      placeholder="จำนวน"
                      value={it.quantity}
                      onChange={e => updateItem(idx, { quantity: e.target.value })}
                      style={inputSmall}
                      min="0"
                      step="0.01"
                      required
                    />
                    <input
                      type="number"
                      placeholder="ราคา"
                      value={it.price}
                      onChange={e => updateItem(idx, { price: e.target.value })}
                      style={inputSmall}
                      min="0"
                      step="0.01"
                      required
                    />
                    <div style={{ fontSize: 13, color: '#333', fontWeight: 600, textAlign: 'right' }}>
                      {fmt(calcAmount(it))} ฿
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                      style={iconBtn}
                      title="ลบรายการ"
                    >
                      🗑️
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="รายละเอียดรายการย่อย (ไม่บังคับ)"
                    value={it.note}
                    onChange={e => updateItem(idx, { note: e.target.value })}
                    style={{ ...inputSmall, marginTop: 8 }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, fontSize: 14, fontWeight: 700, color: '#1a3a1a' }}>
              รวมทั้งหมด: {fmt(totalAmount)} ฿
            </div>
          </div>

          {/* Description */}
          <FormGroup label="รายละเอียด (ไม่บังคับ)">
            <input
              type="text"
              placeholder="หมายเหตุเพิ่มเติม"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              style={input}
            />
          </FormGroup>

          {error && <p style={{ color: '#c0392b', fontSize: 13, margin: '4px 0 12px' }}>{error}</p>}

          <button type="submit" style={submitBtn} disabled={loading}>
            {loading ? '⏳ กำลังบันทึก...' : '💾 บันทึกรายการ'}
          </button>
        </form>
      </div>

      {success && (
        <>
          <style>{toastStyles}</style>
          <div style={toastOverlay}>
            <div style={toast}>
              ✅ บันทึกข้อมูลเรียบร้อย
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FormGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const card = {
  background: '#fff',
  borderRadius: 16,
  padding: '28px 24px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
};

const backBtn = {
  background: 'none',
  border: '1.5px solid #ddd',
  borderRadius: 8,
  padding: '6px 14px',
  cursor: 'pointer',
  fontSize: 14,
  color: '#555',
  fontFamily: 'inherit',
};

const toggleRow = {
  display: 'flex',
  background: '#f5f5f5',
  borderRadius: 10,
  padding: 4,
  marginBottom: 24,
  gap: 4,
};

const toggleBtn = {
  flex: 1,
  padding: '10px',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 15,
  fontWeight: 600,
  fontFamily: 'inherit',
  transition: 'all 0.2s',
};

const input = {
  width: '100%',
  padding: '11px 14px',
  border: '1.5px solid #e0e0e0',
  borderRadius: 10,
  fontSize: 15,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
};

const inputSmall = {
  width: '100%',
  padding: '9px 10px',
  border: '1.5px solid #e0e0e0',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
};

const itemCard = {
  border: '1px solid #eef1ee',
  borderRadius: 10,
  padding: 10,
  background: '#fbfdfb',
};

const smallBtn = {
  background: '#2D7A4F',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const iconBtn = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 16,
  opacity: 0.7,
};

const submitBtn = {
  width: '100%',
  padding: '14px',
  background: '#2D7A4F',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  fontSize: 16,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  marginTop: 8,
};

const toast = {
  background: 'rgba(255, 255, 255, 0.88)',
  color: '#1a3a1a',
  padding: '20px 26px',
  borderRadius: 14,
  border: '1.5px solid rgba(45, 122, 79, 0.35)',
  boxShadow: '0 14px 35px rgba(0,0,0,0.18)',
  fontSize: 18,
  fontWeight: 800,
  textAlign: 'center',
  minWidth: 260,
  animation: 'toastPop 0.25s ease, toastFade 0.4s ease 2.6s forwards',
};

const toastOverlay = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(45, 122, 79, 0.08)',
  zIndex: 999,
  animation: 'backdropFade 0.25s ease, backdropOut 0.4s ease 2.6s forwards',
};

const toastStyles = `
@keyframes toastPop {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes toastFade {
  to { opacity: 0; transform: scale(0.98); }
}
@keyframes backdropFade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes backdropOut {
  to { opacity: 0; }
}
`;
};
