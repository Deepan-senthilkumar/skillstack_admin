import { useState, useEffect } from 'react';
import {
  Shield, LayoutDashboard, Layers, CheckSquare, Calendar,
  Code2, BarChart3, BookOpen, Users, LogOut,
  Menu, X, Sparkles, ExternalLink, FileText, HelpCircle, Award, AlertTriangle,
  MessageSquare, ChevronDown, ChevronRight, TrendingUp, CheckCircle2
} from 'lucide-react';

export const ADMIN_MODULES = [
  {
    id: 'analytics_hub',
    label: 'Command & Analytics',
    icon: LayoutDashboard,
    badge: 'Hub',
    submodules: [
      { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, badge: 'Live', desc: 'Real-time cohort & session matrix' },
      { id: 'quiz_analytics', label: 'Quiz Analytics', icon: BarChart3, desc: 'Attempt statistics & pass rates' },
      { id: 'reports', label: 'Performance Reports', icon: TrendingUp, desc: 'Detailed attendance & completion reports' },
    ]
  },
  {
    id: 'curriculum_engine',
    label: 'Curriculum & Academics',
    icon: BookOpen,
    badge: '5 Tracks',
    submodules: [
      { id: 'subjects', label: 'Master Courses', icon: BookOpen, desc: 'Core subject tracks & tracks catalog' },
      { id: 'syllabus', label: 'Syllabus & Modules', icon: Layers, desc: 'Chapter structure & module hierarchy' },
      { id: 'topics', label: 'Topics & Study Notes', icon: FileText, desc: 'Theory notes, summaries & references' },
      { id: 'problems', label: 'Practice Labs & Code', icon: Code2, desc: 'Coding workbench challenges & test cases' },
      { id: 'quiz_bank', label: 'Question Bank (MCQs)', icon: HelpCircle, badge: '66 MCQs', desc: 'Topic-wise assessment pool' },
    ]
  },
  {
    id: 'classroom_operations',
    label: 'Classroom & Batches',
    icon: Calendar,
    badge: 'Daily',
    submodules: [
      { id: 'daily_task', label: 'Daily Session & Attendance', icon: Calendar, desc: 'Log daily class topics and student presence' },
      { id: 'batches', label: 'Batches & Rosters', icon: Users, desc: 'Morning & evening student cohort rosters' },
      { id: 'progress', label: 'Topic Progress Matrix', icon: CheckSquare, desc: 'Per-topic batch completion status' },
      { id: 'submissions', label: 'Code Submissions & Review', icon: Sparkles, desc: 'Student code auto-evaluation and grading' },
      { id: 'doubts', label: 'Student Doubts & Q&A', icon: MessageSquare, badge: '1-on-1', desc: 'Live doubt clarification desk' },
    ]
  },
  {
    id: 'governance_admin',
    label: 'Governance & Access',
    icon: Shield,
    badge: 'Security',
    submodules: [
      { id: 'certificates', label: 'Enrollments & Certs', icon: Award, desc: 'Student enrollment status and digital certificates' },
      { id: 'users', label: 'User Directory', icon: Shield, desc: 'Staff, student accounts & permission roles' },
    ]
  }
];

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
  const [demoToast, setDemoToast] = useState(null);

  // Track accordion expand/collapse per main module
  const [expandedModules, setExpandedModules] = useState({
    analytics_hub: true,
    curriculum_engine: true,
    classroom_operations: true,
    governance_admin: true
  });

  // Find active parent module
  const activeModule = ADMIN_MODULES.find(mod =>
    mod.submodules.some(sub => sub.id === activePage || (activePage === 'courses' && sub.id === 'subjects'))
  ) || ADMIN_MODULES[0];

  const activeSubmodule = activeModule?.submodules.find(
    sub => sub.id === activePage || (activePage === 'courses' && sub.id === 'subjects')
  );

  // Ensure current active module is automatically expanded
  useEffect(() => {
    if (activeModule) {
      setExpandedModules(prev => ({
        ...prev,
        [activeModule.id]: true
      }));
    }
  }, [activePage, activeModule?.id]);

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

  const toggleModuleAccordion = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const handleSubmoduleClick = (subId) => {
    onNavigate(subId);
    setMobileMenuOpen(false);
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
            <span className="breadcrumb-category">{activeModule.label}</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{activeSubmodule?.label || 'Admin Studio'}</span>
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
            <div className="user-avatar-circle" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)', color: '#FFFFFF' }}>
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
          borderBottom: '1.5px solid #DDD6FE',
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
            <div className="sidebar-module-hierarchy">
              {ADMIN_MODULES.map((module) => {
                const ModuleIcon = module.icon;
                const isExpanded = !!expandedModules[module.id];
                const isModuleActive = activeModule?.id === module.id;

                return (
                  <div key={module.id} className={`main-module-group ${isModuleActive ? 'active-module' : ''}`}>
                    {/* Main Module Accordion Trigger */}
                    <button
                      type="button"
                      className={`main-module-trigger ${isExpanded ? 'expanded' : ''} ${isModuleActive ? 'current-parent' : ''}`}
                      onClick={() => toggleModuleAccordion(module.id)}
                    >
                      <div className="module-trigger-left">
                        <div className={`module-icon-bubble ${isModuleActive ? 'active' : ''}`}>
                          <ModuleIcon size={17} />
                        </div>
                        <div className="module-title-wrap">
                          <span className="module-title-text">{module.label}</span>
                          <span className="module-sub-count">{module.submodules.length} sub-modules</span>
                        </div>
                      </div>

                      <div className="module-trigger-right">
                        {isExpanded ? (
                          <ChevronDown size={15} className="chevron-icon" />
                        ) : (
                          <ChevronRight size={15} className="chevron-icon" />
                        )}
                      </div>
                    </button>

                    {/* Sub-modules List */}
                    {isExpanded && (
                      <div className="submodules-container">
                        <div className="submodules-track">
                          {module.submodules.map((sub) => {
                            const SubIcon = sub.icon;
                            const isActive = activePage === sub.id || (activePage === 'courses' && sub.id === 'subjects');

                            return (
                              <button
                                key={sub.id}
                                className={`submodule-item-btn ${isActive ? 'active' : ''}`}
                                onClick={() => handleSubmoduleClick(sub.id)}
                                title={sub.desc}
                              >
                                <div className="submodule-item-left">
                                  <SubIcon size={16} className="submodule-icon" />
                                  <span className="submodule-label">{sub.label}</span>
                                </div>
                                {sub.badge && (
                                  <span className={`submodule-badge ${isActive ? 'active-badge' : ''}`}>
                                    {sub.badge}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Footer System Info */}
          <div className="sidebar-bottom-panel">
            <div className="trainer-quick-card">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles size={16} className="text-warning" />
                <span className="text-xs font-bold text-white">SkillStack Tutor OS</span>
              </div>
              <p className="text-[11px] text-gray-300">
                Structured Modular Engine • Clean Sub-modules Active
              </p>
            </div>
          </div>
        </aside>

        {/* Main Workspace Stage */}
        <main className="admin-main-stage">
          {/* Top Sub-Module Stage Ribbon */}
          {activeModule && (
            <div className="stage-submodule-ribbon">
              <div className="ribbon-inner-wrapper">
                <div className="ribbon-meta-section">
                  <div className="ribbon-active-pill">
                    <activeModule.icon size={15} className="text-purple-600" />
                    <span className="ribbon-module-name">{activeModule.label}</span>
                  </div>
                  <h2 className="ribbon-submodule-title">{activeSubmodule?.label || 'Overview'}</h2>
                </div>

                <div className="ribbon-submodules-tabs" role="tablist">
                  {activeModule.submodules.map((sub) => {
                    const SubIcon = sub.icon;
                    const isCurrent = activePage === sub.id || (activePage === 'courses' && sub.id === 'subjects');

                    return (
                      <button
                        key={sub.id}
                        type="button"
                        className={`ribbon-tab-btn ${isCurrent ? 'active' : ''}`}
                        onClick={() => onNavigate(sub.id)}
                        title={sub.desc}
                      >
                        <SubIcon size={15} />
                        <span>{sub.label}</span>
                        {sub.badge && (
                          <span className="ribbon-tab-badge">{sub.badge}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="stage-content-wrapper">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
