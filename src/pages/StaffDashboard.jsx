import { useState } from 'react';
import {
  LayoutDashboard, Layers, CheckSquare, Calendar,
  Code2, BarChart3, BookOpen, Users, LogOut
} from 'lucide-react';
import OverviewTab from '../components/OverviewTab';
import BatchManagerTab from '../components/BatchManagerTab';
import TopicProgressTab from '../components/TopicProgressTab';
import DailyTaskTrackerTab from '../components/DailyTaskTrackerTab';
import SubmissionInspectorTab from '../components/SubmissionInspectorTab';
import ReportsAnalyticsTab from '../components/ReportsAnalyticsTab';
import CourseManagerTab from '../components/CourseManagerTab';
import UserManagerTab from '../components/UserManagerTab';

export default function StaffDashboard({ user, onRefreshCurriculum }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBatchIdForProgress, setSelectedBatchIdForProgress] = useState(null);

  const handleSelectBatchForProgress = (batchId) => {
    setSelectedBatchIdForProgress(batchId);
    setActiveTab('progress');
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'batches', label: 'Batches', icon: Layers },
    { id: 'progress', label: 'Topic Progress', icon: CheckSquare },
    { id: 'daily_task', label: 'Daily Session Log', icon: Calendar },
    { id: 'submissions', label: 'Code Submissions', icon: Code2 },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'courses', label: 'Courses & Topics', icon: BookOpen },
    { id: 'users', label: 'User Directory', icon: Users, adminOnly: false },
  ];

  return (
    <div className="staff-dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="staff-sidebar">
        <div className="sidebar-section-title">Navigation</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer-card">
          <div className="flex items-center gap-2">
            <div className="avatar-xs bg-primary text-white font-bold">
              {(user.first_name || user.username || 'A')[0].toUpperCase()}
            </div>
            <div className="truncate text-xs">
              <div className="font-semibold truncate">{user.display_name}</div>
              <div className="text-muted capitalize">{user.role?.toLowerCase() || 'Admin'}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Tab Content */}
      <main className="staff-main-content">
        {activeTab === 'overview' && (
          <OverviewTab user={user} onNavigate={setActiveTab} />
        )}
        {activeTab === 'batches' && (
          <BatchManagerTab user={user} onSelectBatchForProgress={handleSelectBatchForProgress} />
        )}
        {activeTab === 'progress' && (
          <TopicProgressTab user={user} defaultBatchId={selectedBatchIdForProgress} />
        )}
        {activeTab === 'daily_task' && (
          <DailyTaskTrackerTab user={user} />
        )}
        {activeTab === 'submissions' && (
          <SubmissionInspectorTab user={user} />
        )}
        {activeTab === 'reports' && (
          <ReportsAnalyticsTab user={user} />
        )}
        {activeTab === 'courses' && (
          <CourseManagerTab user={user} />
        )}
        {activeTab === 'users' && (
          <UserManagerTab user={user} />
        )}
      </main>
    </div>
  );
}
