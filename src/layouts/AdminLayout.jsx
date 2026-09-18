import { useState, useEffect } from 'react';
import {
  Shield, LayoutDashboard, Layers, CheckSquare, Calendar,
  Code2, BarChart3, BookOpen, Users, LogOut,
  Menu, X, Sparkles, ExternalLink, FileText, HelpCircle, Award, AlertTriangle
} from 'lucide-react';

export default function AdminLayout({
  user,
  activePage,
  onNavigate,
  onLogout,
  onRefresh,
  backendOnline,
  children
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [demoToast, setDemoToast] = useState(null);

  useEffect(() => {
    const handleDemoRestriction = (e) => {
      const msg = e.detail?.message || '🔒 Demo Mode (Read-Only): Adding, editing, and deleting are disabled in demo mode.';
      setDemoToast(msg);
      const timer = setTimeout(() => setDemoToast(null), 5000);
      return () => clearTimeout(timer);
    };
    window.addEventListener('admin:demo-restriction', handleDemoRestriction);
    return () => window.removeEventListener('admin:demo-restriction', handleDemoRestriction);
  }, []);

  const navigationSections = [
    {
      title: 'Command Center',
      items: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, badge: 'Live' },
      ]
    },
    {
      title: 'Academics & Curriculum',
      items: [
        { id: 'subjects', label: 'Master Subjects', icon: BookOpen },
        { id: 'syllabus', label: 'Syllabus & Modules', icon: Layers },
        { id: 'topics', label: 'Topics & Notes', icon: FileText },
        { id: 'quiz_bank', label: 'Topic Question Bank', icon: HelpCircle, badge: '20+ MCQs' },
        { id: 'problems', label: 'Practice Labs & Tasks', icon: Code2 },
        { id: 'batches', label: 'Batches & Enrollment', icon: Users },
        { id: 'progress', label: 'Topic Progress Tracker', icon: CheckSquare },
      ]
    },
    {
      title: 'Daily Operations',
      items: [
        { id: 'daily_task', label: 'Daily Session & Attendance', icon: Calendar },
        { id: 'submissions', label: 'Code Submissions & Grading', icon: Sparkles },
      ]
    },
    {
      title: 'Analytics & Administration',
      items: [
        { id: 'quiz_analytics', label: 'Test & Quiz Analytics', icon: Award },
        { id: 'reports', label: 'Reports & Performance', icon: BarChart3 },
        { id: 'users', label: 'User Directory', icon: Shield },
      ]
    }
  ];

  const handleNavClick = (id) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const getPageTitle = (pageId) => {
    switch (pageId) {
      case 'dashboard': return 'Executive Operations Dashboard';
      case 'subjects': return 'Master Subjects Catalog';
      case 'syllabus': return 'Syllabus & Module Hierarchy Manager';
      case 'courses': return 'Course & Curriculum Management';
      case 'topics': return 'Topics & Study Notes Management';
      case 'quiz_bank': return 'Topic Question Bank (20+ MCQs)';
      case 'problems': return 'Practice Labs & Assignment Tasks';
      case 'batches': return 'Batch Management & Student Rosters';
      case 'progress': return 'Curriculum Completion & Topic Progress';
      case 'daily_task': return 'Daily Session Logs & Student Attendance';
      case 'submissions': return 'Student Code Submissions & Automated Grading';
      case 'quiz_analytics': return 'Test & Quiz Attempt Analytics';
      case 'reports': return 'Multi-Dimensional Analytics & Performance Reports';
      case 'users': return 'User Directory & Access Control';
      default: return 'Admin Studio';
    }
  };

  return (
    <div className={`admin-app-root ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      {/* Top Navbar */}
      <header className="admin-header">
        <div className="header-left">
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle Sidebar"
            aria-label="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="brand-badge-group">
            <div className="brand-logo-icon">
              <Shield size={22} className="text-white" />
            </div>
            <div className="brand-text-block">
              <div className="flex items-center gap-1.5">
                <span className="brand-name">SkillStack</span>
                <span className="brand-tag">PRO</span>
              </div>
              <span className="brand-sub">Tutor Studio</span>
            </div>
          </div>

        </div>

        {/* Header Right Actions */}
        <div className="header-right">
          {/* User Profile Pill */}
          <div className="user-profile-widget">
            <div className="user-avatar-circle" style={user?.is_demo ? { background: '#7B1C6E', color: '#FFFFFF' } : {}}>
              {(user?.first_name || user?.username || 'A')[0].toUpperCase()}
            </div>
            <div className="user-meta-block">
              <span className="user-name-label">{user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}</span>
              <span
                className="user-role-badge"
                style={user?.is_demo ? { background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' } : {}}
              >
                {user?.is_demo ? 'DEMO ADMIN (READ-ONLY)' : user?.is_admin ? 'SUPER ADMIN' : 'STAFF TRAINER'}
              </span>
            </div>
          </div>

          <button
            className="logout-action-btn"
            onClick={onLogout}
            title="Sign Out"
          >
            <LogOut size={16} />
            <span className="hide-mobile">Logout</span>
          </button>
        </div>
      </header>

      {/* Demo Mode Notice Banner */}
      {user?.is_demo && (
        <div style={{
          background: 'linear-gradient(90deg, #7B1C6E 0%, #4A0E4E 100%)',
          color: '#FFFFFF',
          padding: '8px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          borderBottom: '1.5px solid #FDC029',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          zIndex: 99,
          position: 'sticky',
          top: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{
              background: '#FDC029',
              color: '#4A0E4E',
              fontWeight: 900,
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '4px',
              letterSpacing: '0.5px'
            }}>
              DEMO ADMIN MODE
            </span>
            <span>
              <strong>Read-Only Preview:</strong> You can view all records, tests, and student analytics. Modifying actions (<strong>Add, Edit, Update, Delete</strong>) are disabled to protect live data.
            </span>
          </div>
          <span style={{ fontSize: '11px', opacity: 0.9, whiteSpace: 'nowrap', fontWeight: 600 }}>
            🔒 View-Only Mode
          </span>
        </div>
      )}

      {/* Floating Demo Restriction Toast */}
      {demoToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          maxWidth: '440px',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '14px 18px',
          borderRadius: '16px',
          border: '1.5px solid #EF4444',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          animation: 'slideIn 0.25s ease-out'
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#F87171',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertTriangle size={18} />
          </div>
          <div style={{ flex: 1, fontSize: '12.5px', lineHeight: 1.5 }}>
            <strong style={{ display: 'block', color: '#FCA5A5', marginBottom: '2px' }}>Action Disabled in Demo Mode</strong>
            {demoToast}
          </div>
          <button
            onClick={() => setDemoToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '2px'
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="admin-body-container">
        {/* Navigation Sidebar */}
        <aside className={`admin-sidebar-nav ${sidebarOpen ? 'open' : 'closed'} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-inner-scroller">
            {navigationSections.map((section, idx) => (
              <div key={idx} className="nav-section-group">
                <div className="nav-section-header">
                  <span>{section.title}</span>
                </div>
                <div className="nav-items-list">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;
                    return (
                      <button
                        key={item.id}
                        className={`nav-link-item ${isActive ? 'active' : ''}`}
                        onClick={() => handleNavClick(item.id)}
                      >
                        <div className="nav-link-left">
                          <Icon size={19} className="nav-item-icon" />
                          <span className="nav-item-label">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="nav-item-badge">{item.badge}</span>
                        )}
                        {isActive && <div className="active-indicator-bar" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Footer System Info */}
          <div className="sidebar-bottom-panel">
            <div className="trainer-quick-card">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles size={16} className="text-warning" />
                <span className="text-xs font-bold text-white">SkillStack Tutor OS</span>
              </div>
              <p className="text-[11px] text-gray-300">
                Active Version v2.4 • Dynamic Attendance Engine Enabled
              </p>
            </div>
          </div>
        </aside>

        {/* Main Workspace Stage */}
        <main className="admin-main-stage">
          <div className="stage-content-wrapper">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
