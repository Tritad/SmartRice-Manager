// src/components/Navbar.jsx
import { signOut } from 'firebase/auth';
import { auth } from '../utils/firebase';

export default function Navbar({ user, page, setPage }) {
  const navItems = [
    { id: 'dashboard', label: '🏠 หน้าหลัก' },
    { id: 'add', label: '➕ บันทึก' },
    { id: 'report', label: '📊 รายงาน' },
  ];

  return (
    <nav style={navStyle}>
      <div style={inner}>
        {/* Logo */}
        <div style={logo}>
          <span style={{ fontSize: 22 }}>🌾</span>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>นาข้าวบัญชี</span>
        </div>

        {/* Nav items */}
        <div style={{ display: 'flex', gap: 4 }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                ...navBtn,
                background: page === item.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                fontWeight: page === item.id ? 700 : 400,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* User & logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user.photoURL && (
            <img src={user.photoURL} alt="" style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)' }} />
          )}
          <button
            onClick={() => signOut(auth)}
            style={logoutBtn}
            title="ออกจากระบบ"
          >
            ออก
          </button>
        </div>
      </div>
    </nav>
  );
}

const navStyle = {
  background: '#2D7A4F',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  position: 'sticky',
  top: 0,
  zIndex: 100,
};

const inner = {
  maxWidth: 900,
  margin: '0 auto',
  padding: '0 16px',
  height: 56,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
};

const logo = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: "'Sarabun', sans-serif",
};

const navBtn = {
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '6px 12px',
  cursor: 'pointer',
  fontSize: 13,
  fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
  transition: 'background 0.2s',
};

const logoutBtn = {
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: 7,
  padding: '5px 12px',
  cursor: 'pointer',
  fontSize: 13,
  fontFamily: 'inherit',
};
