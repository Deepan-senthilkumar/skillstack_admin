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
  const [quizBankTopicId, setQuizBankTopicId] = useState(null);
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

  const navigateTo = (pageId, meta = {}) => {
    if (pageId === 'quiz_bank' && meta.topicId) {
      setQuizBankTopicId(meta.topicId);
    } else if (pageId !== 'quiz_bank') {
      setQuizBankTopicId(null);
    }
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

    // Check backend health with waking indicator
    let wakingTimer = setTimeout(() => {
      setIsServerWaking(true);
    }, 2500);

    const checkBackend = () => {
      api.checkHealth().then(h => {
        clearTimeout(wakingTimer);
        setIsServerWaking(false);
        if (h.status === 'ok') {
          setBackendOnline(true);
        } else {
          setBackendOnline(false);
          setTimeout(checkBackend, 15000);
        }
      }).catch(() => {
        clearTimeout(wakingTimer);
        setIsServerWaking(false);
        setBackendOnline(false);
        setTimeout(checkBackend, 15000);
      });
    };
    checkBackend();

    window.addEventListener('admin:logout', handleLogout);
    return () => {
      clearTimeout(wakingTimer);
      window.removeEventListener('admin:logout', handleLogout);
    };
  }, []);

  const [isServerWaking, setIsServerWaking] = useState(false);

  const loadBootstrap = async () => {
    // Individual tabs manage their own data loading cleanly; no redundant blocker queries
    return Promise.resolve();
  };

  const handleLoginSuccess = async (loggedUser) => {
    setUser(loggedUser);
  };

  const handleLogout = () => {
    api.clearTokens();
    setUser(null);
    setSubjects([]);
    setCurriculum([]);
  };

  const handleRefresh = async () => {
    // Triggers current active tab refresh
    window.dispatchEvent(new CustomEvent('admin:refresh-tab'));
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
    <>
      {isServerWaking && (
        <div style={{
          position: 'fixed',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          background: 'linear-gradient(135deg, #7B1C6E 0%, #A82596 100%)',
          color: '#FFFFFF',
          padding: '8px 18px',
          borderRadius: '999px',
          boxShadow: '0 8px 24px rgba(123, 28, 110, 0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12.5px',
          fontWeight: 600,
          pointerEvents: 'none'
        }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#FDC029', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
          ⚡ Server is waking up from standby (Render free tier)... Please wait a moment.
        </div>
      )}
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
        <TopicQuizManagerTab user={user} defaultTopicId={quizBankTopicId} key={quizBankTopicId || 'all'} />
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
    </>
  );
}
