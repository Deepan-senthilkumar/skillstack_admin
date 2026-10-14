import { useState, useEffect } from 'react';
import {
  Shield, LayoutDashboard, Layers, CheckSquare, Calendar,
  Code2, BarChart3, BookOpen, Users, LogOut,
  Menu, X, Sparkles, ExternalLink, FileText, HelpCircle, Award, AlertTriangle,
  MessageSquare
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
      title: 'Curriculum & Academics',
      items: [
        { id: 'subjects', label: 'Master Courses', icon: BookOpen },
        { id: 'syllabus', label: 'Syllabus & Modules', icon: Layers },
        { id: 'topics', label: 'Topics & Study Notes', icon: FileText },
        { id: 'problems', label: 'Practice Labs & Code', icon: Code2 },
        { id: 'quiz_bank', label: 'Question Bank (MCQs)', icon: HelpCircle, badge: '66 MCQs' },
      ]
    },
    {
      title: 'Batches & Operations',
      items: [
        { id: 'doubts', label: 'Student Doubts & Q&A', icon: MessageSquare, badge: '1-on-1' },
        { id: 'certificates', label: 'Enrollments & Certs', icon: Award },
        { id: 'batches', label: 'Batches & Rosters', icon: Users },
        { id: 'progress', label: 'Topic Progress Matrix', icon: CheckSquare },
        { id: 'daily_task', label: 'Daily Session & Attendance', icon: Calendar },
        { id: 'submissions', label: 'Code Submissions & Review', icon: Sparkles },
      ]
    },
    {
      title: 'Analytics & Admin',
      items: [
        { id: 'quiz_analytics', label: 'Quiz Attempt Analytics', icon: Award },
        { id: 'reports', label: 'Reports & Performance', icon: BarChart3 },
        { id: 'users', label: 'User Directory', icon: Shield },
      ]
    }
  ];

  const handleNavClick = (id) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const getPageCategory = (pageId) => {
    if (pageId === 'dashboard') return 'Command Center';
    if (['subjects', 'syllabus', 'courses', 'topics', 'problems', 'quiz_bank'].includes(pageId)) return 'Curriculum Studio';
    if (['doubts', 'batches', 'progress', 'daily_task', 'submissions'].includes(pageId)) return 'Classroom & Operations';
    return 'Analytics & Admin';
  };

  const getPageTitle = (pageId) => {
    switch (pageId) {
      case 'dashboard': return 'Executive Operations Dashboard';
      case 'doubts': return 'Student Doubts & 1-on-1 Clarification Desk';
      case 'subjects': return 'Master Courses Catalog';
      case 'syllabus': return 'Syllabus & Modules Manager';
      case 'courses': return 'Course & Curriculum Management';
      case 'topics': return 'Topics & Study Notes';
      case 'quiz_bank': return 'Topic Question Bank (MCQs)';
      case 'problems': return 'Practice Labs & Assignment Tasks';
      case 'certificates': return 'Student Enrollments & Certificates';
      case 'batches': return 'Batch Management & Rosters';
      case 'progress': return 'Curriculum Completion Progress';
      case 'daily_task': return 'Daily Session & Attendance';
      case 'submissions': return 'Student Code Submissions & Grading';
      case 'quiz_analytics': return 'Test & Quiz Attempt Analytics';
      case 'reports': return 'Analytics & Performance Reports';
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

          <div className="header-breadcrumbs">
            <span className="breadcrumb-category">{getPageCategory(activePage)}</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{getPageTitle(activePage)}</span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="header-right">
          <div className="header-live-chip">
            <span className="live-pulse-dot" />
            <span>Active Curriculum: C Programming</span>
          </div>

          {/* User Profile Pill */}
          <div className="user-profile-widget">
            <div className="user-avatar-circle" style={user?.is_demo ? { background: '#7C3AED', color: '#FFFFFF' } : {}}>
              {(user?.first_name || user?.username || 'A')[0].toUpperCase()}
            </div>
            <div className="user-meta-block">
              <span className="user-name-label">{user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}</span>
              <span
                className="user-role-badge"
                style={user?.is_demo ? { background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' } : {}}
              >
                {user?.is_demo ? 'DEMO ADMIN' : user?.is_admin ? 'SUPER ADMIN' : 'STAFF TRAINER'}
              </span>
            </div>
          </div>

          <button
            className="logout-action-btn"
            onClick={onLogout}
            title="Sign Out"
          >
            <LogOut size={16} />
            <span className="hide-mobile">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Demo Mode Notice Banner */}
      {user?.is_demo && (
        <div style={{
          background: 'linear-gradient(90deg, #7C3AED 0%, #312E81 100%)',
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
              color: '#312E81',
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
