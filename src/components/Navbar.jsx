// src/components/Navbar.jsx
import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../utils/firebase';

export default function Navbar({ user, page, setPage }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navItems = [
    { id: 'dashboard', label: '🏠 หน้าหลัก' },
    { id: 'add', label: '➕ บันทึก' },
    { id: 'report', label: '📊 รายงาน' },
  ];
  const userInitial = (user.displayName || user.email || '?').slice(0, 1).toUpperCase();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleNavClick = (id) => {
    setPage(id);
    setNavOpen(false);
  };

  return (
    <nav style={navStyle}>
      <div style={inner}>
        {/* Logo */}
        <div style={logo}>
          <span style={{ fontSize: 26 }}>🌾</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: 0.2 }}>บัญชีนาข้าว</span>
        </div>

        {/* Nav items */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 8 }}>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
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
        )}

        {/* User & logout */}
        <div style={userArea} onMouseLeave={() => setMenuOpen(false)}>
          {isMobile && (
            <button
              onClick={() => setNavOpen(prev => !prev)}
              style={hamburgerBtn}
              aria-label="เปิดเมนู"
            >
              <span style={{ ...hamburgerLine, width: navOpen ? 18 : 20 }} />
              <span style={{ ...hamburgerLine, width: 20, opacity: navOpen ? 0.6 : 1 }} />
              <span style={{ ...hamburgerLine, width: navOpen ? 14 : 18 }} />
            </button>
          )}
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            style={avatarBtn}
            title="บัญชีผู้ใช้"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="" style={avatarImg} />
            ) : (
              <span style={avatarFallback}>{userInitial}</span>
            )}
          </button>

          {menuOpen && (
            <div style={menuBox}>
              <div style={menuEmail}>{user.email || '-'}</div>
              <button
                onClick={() => signOut(auth)}
                style={logoutBtn}
              >
                ออก
              </button>
            </div>
          )}
        </div>
      </div>
      {isMobile && navOpen && (
        <div style={mobileMenuWrap}>
          <div style={mobileMenuInner}>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  ...mobileNavBtn,
                  background: page === item.id ? 'rgba(45,122,79,0.15)' : '#fff',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
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
  height: 68,
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
  borderRadius: 12,
  padding: '12px 22px',
  cursor: 'pointer',
  fontSize: 17,
  fontWeight: 700,
  fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
  transition: 'background 0.2s',
};

const userArea = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const hamburgerBtn = {
  width: 44,
  height: 44,
  borderRadius: 12,
  border: '1.5px solid rgba(255,255,255,0.35)',
  background: 'rgba(255,255,255,0.12)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: 4,
  cursor: 'pointer',
};

const hamburgerLine = {
  height: 2,
  background: '#fff',
  borderRadius: 99,
  transition: 'width 0.2s, opacity 0.2s',
};

const avatarBtn = {
  width: 44,
  height: 44,
  borderRadius: '50%',
  border: '2px solid rgba(255,255,255,0.5)',
  background: 'rgba(255,255,255,0.12)',
  padding: 0,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const avatarImg = {
  width: 40,
  height: 40,
  borderRadius: '50%',
};

const avatarFallback = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.25)',
  color: '#fff',
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const menuBox = {
  position: 'absolute',
  right: 0,
  top: 52,
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
  padding: 12,
  minWidth: 220,
  zIndex: 200,
};

const menuEmail = {
  fontSize: 12,
  fontWeight: 700,
  color: '#2b2b2b',
  marginBottom: 10,
  wordBreak: 'break-all',
};

const logoutBtn = {
  width: '100%',
  background: '#2D7A4F',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '8px 14px',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 700,
  fontFamily: 'inherit',
};

const mobileMenuWrap = {
  background: '#2D7A4F',
  borderTop: '1px solid rgba(255,255,255,0.15)',
  padding: '10px 16px 14px',
};

const mobileMenuInner = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 8,
  maxWidth: 900,
  margin: '0 auto',
};

const mobileNavBtn = {
  border: '1px solid rgba(45,122,79,0.2)',
  borderRadius: 12,
  padding: '10px 12px',
  fontSize: 14,
  fontWeight: 700,
  color: '#1a3a1a',
  cursor: 'pointer',
  fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
  textAlign: 'center',
};
