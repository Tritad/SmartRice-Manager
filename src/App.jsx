// src/App.jsx
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './utils/firebase';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AddTransactionPage from './pages/AddTransactionPage';
import ReportPage from './pages/ReportPage';
import Navbar from './components/Navbar';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('dashboard');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f1f0f' }}>
      <div style={{ textAlign: 'center', color: '#7fc97f' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌾</div>
        <p style={{ fontFamily: 'sans-serif', color: '#aaa' }}>กำลังโหลด...</p>
      </div>
    </div>
  );

  if (!user) return <LoginPage />;

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f0', fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif" }}>
      <Navbar user={user} page={page} setPage={setPage} />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        {page === 'dashboard' && <DashboardPage user={user} setPage={setPage} />}
        {page === 'add' && <AddTransactionPage user={user} setPage={setPage} />}
        {page === 'report' && <ReportPage user={user} />}
      </main>
    </div>
  );
}
