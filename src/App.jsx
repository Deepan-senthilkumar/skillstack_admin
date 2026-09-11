import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { api } from './api';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import SubjectManagerTab from './components/SubjectManagerTab';
import SyllabusManagerTab from './components/SyllabusManagerTab';
import TopicManagerTab from './components/TopicManagerTab';
import TopicQuizManagerTab from './components/TopicQuizManagerTab';
import PracticeTaskManagerTab from './components/PracticeTaskManagerTab';
import BatchManagerTab from './components/BatchManagerTab';
import TopicProgressTab from './components/TopicProgressTab';
import DailyTaskTrackerTab from './components/DailyTaskTrackerTab';
import SubmissionInspectorTab from './components/SubmissionInspectorTab';
import QuizAnalyticsTab from './components/QuizAnalyticsTab';
import ReportsAnalyticsTab from './components/ReportsAnalyticsTab';
import UserManagerTab from './components/UserManagerTab';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedBatchIdForProgress, setSelectedBatchIdForProgress] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [curriculum, setCurriculum] = useState([]);
  const [backendOnline, setBackendOnline] = useState(null);

  // Sync active page with URL hash
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const validPages = [
      'dashboard', 'subjects', 'syllabus', 'courses', 'topics', 'quiz_bank',
      'problems', 'batches', 'progress', 'daily_task', 'submissions', 'quiz_analytics', 'reports', 'users'
    ];
    if (hash && validPages.includes(hash)) {
      setActivePage(hash);
    }

    const handleHashChange = () => {
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash && validPages.includes(currentHash)) {
        setActivePage(currentHash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (pageId) => {
    setActivePage(pageId);
    window.location.hash = pageId;
  };

  const handleSelectBatchForProgress = (batchId) => {
    setSelectedBatchIdForProgress(batchId);
    navigateTo('progress');
  };

  // Restore session on load
  useEffect(() => {
    const saved = api.getUser();
    if (saved && api.getToken()) {
      api.getMe()
        .then(me => {
          const isAuthorized = me && (
            me.role === 'ADMIN' ||
            me.role === 'STAFF' ||
            me.is_admin ||
            me.is_admin_role ||
            me.is_staff ||
            me.is_superuser
          );
          if (isAuthorized) {
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
    const checkBackend = () => {
      api.checkHealth().then(h => {
        if (h.status === 'ok') {
          setBackendOnline(true);
        } else {
          setBackendOnline(false);
          setTimeout(checkBackend, 15000);
        }
      });
    };
    checkBackend();

    window.addEventListener('admin:logout', handleLogout);
    return () => window.removeEventListener('admin:logout', handleLogout);
  }, []);

  const loadBootstrap = async () => {
    try {
      const [subs, curr] = await Promise.all([
        api.getSubjects().catch(() => []),
        api.getCurriculum('c-programming').catch(() => []),
      ]);
      const safeSubs = Array.isArray(subs) ? subs : (subs?.results || []);
      const safeCurr = Array.isArray(curr) ? curr : (curr?.results || []);
      setSubjects(safeSubs);
      setCurriculum(safeCurr);
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
    setCurriculum([]);
  };

  const handleRefresh = async () => {
    await loadBootstrap();
  };

  if (loading) {
    return (
      <div className="admin-splash">
        <div className="splash-inner">
          <div className="splash-logo"><Shield size={36} /></div>
          <p className="font-semibold text-lg">Initializing SkillStack Admin...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AdminLoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <AdminLayout
      user={user}
      activePage={activePage}
      onNavigate={navigateTo}
      onLogout={handleLogout}
      onRefresh={handleRefresh}
      backendOnline={backendOnline}
    >
      {activePage === 'dashboard' && (
        <DashboardPage user={user} onNavigate={navigateTo} />
      )}
      {(activePage === 'subjects' || activePage === 'courses') && (
        <SubjectManagerTab user={user} />
      )}
      {activePage === 'syllabus' && (
        <SyllabusManagerTab user={user} onNavigate={navigateTo} />
      )}
      {activePage === 'topics' && (
        <TopicManagerTab user={user} onNavigate={navigateTo} />
      )}
      {activePage === 'quiz_bank' && (
        <TopicQuizManagerTab user={user} />
      )}
      {activePage === 'problems' && (
        <PracticeTaskManagerTab user={user} />
      )}
      {activePage === 'batches' && (
        <BatchManagerTab user={user} onSelectBatchForProgress={handleSelectBatchForProgress} />
      )}
      {activePage === 'progress' && (
        <TopicProgressTab user={user} defaultBatchId={selectedBatchIdForProgress} />
      )}
      {activePage === 'daily_task' && (
        <DailyTaskTrackerTab user={user} />
      )}
      {activePage === 'submissions' && (
        <SubmissionInspectorTab user={user} />
      )}
      {activePage === 'quiz_analytics' && (
        <QuizAnalyticsTab user={user} />
      )}
      {activePage === 'reports' && (
        <ReportsAnalyticsTab user={user} />
      )}
      {activePage === 'users' && (
        <UserManagerTab user={user} />
      )}
    </AdminLayout>
  );
}
