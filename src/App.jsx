import { useState, useEffect } from 'react';
import { Shield, LogOut, Activity, RefreshCw } from 'lucide-react';
import { api } from './api';
import AdminLoginPage from './pages/AdminLoginPage';
import StaffDashboard from './pages/StaffDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [curriculum, setCurriculum] = useState(null);
  const [backendOnline, setBackendOnline] = useState(null);
  const [selectedSubjectSlug, setSelectedSubjectSlug] = useState('django');

  // Restore session on load
  useEffect(() => {
    const saved = api.getUser();
    if (saved && api.getToken()) {
      // Validate token is still good
      api.getMe()
        .then(me => {
          if (me.role === 'STAFF' || me.is_admin_role) {
            setUser(me);
            loadBootstrap();
          } else {
            api.clearTokens();
          }
        })
        .catch(() => {
          api.clearTokens();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Check backend health
    api.checkHealth().then(h => setBackendOnline(h.status === 'ok'));

    // Listen for forced logout
    window.addEventListener('admin:logout', handleLogout);
    return () => window.removeEventListener('admin:logout', handleLogout);
  }, []);

  const loadBootstrap = async () => {
    try {
      const [subs, curr] = await Promise.all([
        api.getSubjects().catch(() => []),
        api.getCurriculum(selectedSubjectSlug).catch(() => null),
      ]);
      setSubjects(subs.results || subs || []);
      setCurriculum(curr);
    } catch (e) {
      console.error('Bootstrap error', e);
    }
  };

  const handleLoginSuccess = async (loggedUser) => {
    setUser(loggedUser);
    await loadBootstrap();
  };

  const handleLogout = () => {
    api.clearTokens();
    setUser(null);
    setSubjects([]);
    setCurriculum(null);
  };

  const handleRefreshCurriculum = async () => {
    const curr = await api.getCurriculum(selectedSubjectSlug).catch(() => null);
    setCurriculum(curr);
  };

  const handleSubjectsUpdated = async () => {
    const subs = await api.getSubjects().catch(() => []);
    setSubjects(subs.results || subs || []);
  };

  if (loading) {
    return (
      <div className="admin-splash">
        <div className="splash-inner">
          <div className="splash-logo"><Shield size={36} /></div>
          <p>Loading Admin Panel…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AdminLoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="admin-app">
      {/* Admin Top Bar */}
      <header className="admin-topbar">
        <div className="topbar-brand">
          <div className="topbar-logo"><Shield size={20} /></div>
          <div>
            <span className="topbar-title">Django Kalari</span>
            <span className="topbar-badge">Admin Studio</span>
          </div>
        </div>

        <div className="topbar-center">
          <span
            className={`backend-status-dot ${backendOnline ? 'online' : backendOnline === false ? 'offline' : 'checking'}`}
          />
          <span className="backend-status-label">
            {backendOnline ? 'Backend Online' : backendOnline === false ? 'Backend Offline' : 'Checking…'}
          </span>
        </div>

        <div className="topbar-right">
          <div className="topbar-user">
            <div className="topbar-avatar">
              {(user.first_name || user.username || 'A')[0].toUpperCase()}
            </div>
            <div className="topbar-user-info">
              <span className="topbar-user-name">{user.first_name || user.username}</span>
              <span className="topbar-user-role">{user.is_admin_role ? 'Super Admin' : 'Staff'}</span>
            </div>
          </div>

          <button
            className="topbar-btn"
            onClick={handleRefreshCurriculum}
            title="Refresh Curriculum"
          >
            <RefreshCw size={15} />
          </button>

          <button
            className="topbar-logout"
            onClick={handleLogout}
            title="Sign Out"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Subject Selector Strip */}
      {subjects.length > 0 && (
        <div className="admin-subject-strip">
          <span className="strip-label">Active Subject:</span>
          <div className="strip-tabs">
            {subjects.map(s => (
              <button
                key={s.slug}
                className={`strip-tab ${selectedSubjectSlug === s.slug ? 'active' : ''}`}
                onClick={() => {
                  setSelectedSubjectSlug(s.slug);
                  api.getCurriculum(s.slug).then(setCurriculum).catch(() => {});
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      <main className="admin-main">
        <StaffDashboard
          curriculum={curriculum}
          onRefreshCurriculum={handleRefreshCurriculum}
          subjects={subjects}
          onSubjectsUpdated={handleSubjectsUpdated}
          user={user}
        />
      </main>
    </div>
  );
}
