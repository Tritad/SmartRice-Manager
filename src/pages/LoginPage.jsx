// src/pages/LoginPage.jsx
import { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../utils/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setError('เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      const msgs = {
        'auth/user-not-found': 'ไม่พบบัญชีนี้',
        'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง',
        'auth/email-already-in-use': 'อีเมลนี้ถูกใช้แล้ว',
        'auth/weak-password': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
      };
      setError(msgs[err.code] || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const s = styles;
  return (
    <div style={s.bg}>
      <div style={s.card}>
        <div style={s.logo}>🌾</div>
        <h1 style={s.title}>ระบบบัญชีนาข้าว</h1>
        <p style={s.sub}>บันทึกรายรับ-รายจ่าย เพื่อการทำนาที่มีกำไร</p>

        <button onClick={handleGoogle} style={s.googleBtn} disabled={loading}>
          <GoogleIcon />
          เข้าสู่ระบบด้วย Google
        </button>

        <div style={s.divider}><span>หรือ</span></div>

        <form onSubmit={handleEmail}>
          <input
            type="email"
            placeholder="อีเมล"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={s.input}
            required
          />
          <input
            type="password"
            placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={s.input}
            required
          />
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" style={s.submitBtn} disabled={loading}>
            {loading ? 'กำลังดำเนินการ...' : isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p style={s.switchText}>
          {isRegister ? 'มีบัญชีแล้ว? ' : 'ยังไม่มีบัญชี? '}
          <button onClick={() => { setIsRegister(!isRegister); setError(''); }} style={s.linkBtn}>
            {isRegister ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 8 }}>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

const styles = {
  bg: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f2d0f 0%, #1a4a1a 50%, #0f2d0f 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  logo: { fontSize: 52, textAlign: 'center', marginBottom: 8 },
  title: { textAlign: 'center', fontSize: 24, fontWeight: 700, color: '#1a4a1a', margin: '0 0 6px' },
  sub: { textAlign: 'center', color: '#666', fontSize: 14, marginBottom: 28 },
  googleBtn: {
    width: '100%',
    padding: '12px 20px',
    border: '1.5px solid #ddd',
    borderRadius: 10,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 15,
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    transition: 'border-color 0.2s',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0',
    color: '#aaa',
    fontSize: 13,
    gap: 12,
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '1.5px solid #e0e0e0',
    borderRadius: 10,
    fontSize: 15,
    fontFamily: 'inherit',
    marginBottom: 12,
    outline: 'none',
    boxSizing: 'border-box',
  },
  error: { color: '#d32f2f', fontSize: 13, margin: '-4px 0 10px', textAlign: 'center' },
  submitBtn: {
    width: '100%',
    padding: '13px',
    background: '#2D7A4F',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  switchText: { textAlign: 'center', marginTop: 16, fontSize: 14, color: '#666' },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#2D7A4F',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    fontFamily: 'inherit',
    padding: 0,
  },
};
