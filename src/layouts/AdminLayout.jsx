import { useState, useEffect } from 'react';
import {
  Shield, LayoutDashboard, Layers, CheckSquare, Calendar,
  Code2, BarChart3, BookOpen, Users, LogOut,
  Menu, X, Sparkles, ExternalLink, FileText, HelpCircle, Award, AlertTriangle,
  MessageSquare, ChevronDown, ChevronRight, TrendingUp, CheckCircle2,
  Bell
} from 'lucide-react';

// Navigation structure matching user's requirements:
// 1. Important standalone items outside (Dashboard, Analytics, Reports, Daily Sessions, Batches, Submissions, Doubts, Users)
// 2. Interlinked content grouped under a single collapsible module (Curriculum & Academics: Subjects, Syllabus, Topics, Labs, MCQs)
// 3. Strict single accordion: opening one module closes any other.

export const ADMIN_NAV_GROUPS = [
  {
    group: 'MAIN',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, isStandalone: true }
    ]
  },
  {
    group: 'ACADEMICS & CURRICULUM',
    items: [
      {
        id: 'curriculum',
        label: 'Curriculum & Tracks',
        icon: BookOpen,
        isCollapsible: true,
        badge: '5 Tracks',
        submodules: [
          { id: 'subjects', label: 'Master Courses', icon: BookOpen, desc: 'Core subject tracks & tracks catalog' },
          { id: 'syllabus', label: 'Syllabus & Modules', icon: Layers, desc: 'Chapter structure & module hierarchy' },
          { id: 'topics', label: 'Topics & Study Notes', icon: FileText, desc: 'Theory notes, summaries & references' },
          { id: 'problems', label: 'Practice Labs & Code', icon: Code2, desc: 'Coding workbench challenges & test cases' },
          { id: 'quiz_bank', label: 'Question Bank (MCQs)', icon: HelpCircle, badge: '880 MCQs', desc: 'Topic-wise assessment pool' },
        ]
      }
    ]
  },
  {
    group: 'STUDENTS & OPERATIONS',
    items: [
      { id: 'certificates', label: 'Student Enrolls & Progress', icon: Award, isStandalone: true },
      { id: 'batches', label: 'Batches & Rosters', icon: Users, isStandalone: true },
      { id: 'submissions', label: 'Code Submissions', icon: Sparkles, isStandalone: true },
      { id: 'doubts', label: 'Student Doubts', icon: MessageSquare, badge: '1-on-1', isStandalone: true },
      { id: 'users', label: 'User Directory', icon: Shield, isStandalone: true },
    ]
  },
  {
    group: 'ANALYTICS & REPORTS',
    items: [
      { id: 'quiz_analytics', label: 'Quiz Analytics', icon: BarChart3, isStandalone: true },
      { id: 'reports', label: 'Performance Reports', icon: TrendingUp, isStandalone: true },
    ]
  }
];

export const ADMIN_NAV_CONFIG = ADMIN_NAV_GROUPS.flatMap(g => g.items);

export const ADMIN_MODULES = [
  {
    id: 'curriculum',
    label: 'Curriculum & Academics',
    icon: BookOpen,
    badge: '5 Tracks',
    submodules: [
      { id: 'subjects', label: 'Master Courses', icon: BookOpen, desc: 'Core subject tracks & tracks catalog' },
      { id: 'syllabus', label: 'Syllabus & Modules', icon: Layers, desc: 'Chapter structure & module hierarchy' },
      { id: 'topics', label: 'Topics & Study Notes', icon: FileText, desc: 'Theory notes, summaries & references' },
      { id: 'problems', label: 'Practice Labs & Code', icon: Code2, desc: 'Coding workbench challenges & test cases' },
      { id: 'quiz_bank', label: 'Question Bank (MCQs)', icon: HelpCircle, badge: '880 MCQs', desc: 'Topic-wise assessment pool' },
    ]
  },
  {
    id: 'operations',
    label: 'Batch Operations & Attendance',
    icon: Users,
    badge: '3 Modules',
    submodules: [
      // { id: 'daily_task', label: 'Daily Sessions', icon: Calendar, desc: 'Class attendance and daily task allocation' },
      { id: 'batches', label: 'Batches & Rosters', icon: Users, desc: 'Cohorts, student enrollment & timetables' },
      { id: 'submissions', label: 'Code Submissions', icon: Sparkles, desc: 'Evaluation of student lab assignments' },
      { id: 'doubts', label: 'Student Doubts', icon: MessageSquare, badge: 'Live', desc: 'Mentor resolutions & questions' },
    ]
  },
  {
    id: 'analytics',
    label: 'Command & Analytics',
    icon: LayoutDashboard,
    badge: '3 Modules',
    submodules: [
      { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, desc: 'Overview and system metrics' },
      { id: 'quiz_analytics', label: 'Quiz Analytics', icon: BarChart3, desc: 'Performance distributions & accuracy' },
      { id: 'reports', label: 'Performance Reports', icon: TrendingUp, desc: 'Batch progress and student tracking' },
    ]
  },
  {
    id: 'governance',
    label: 'Governance & Access',
    icon: Shield,
    badge: '2 Modules',
    submodules: [
      { id: 'users', label: 'User Directory', icon: Shield, desc: 'Super admins, instructors and students' },
      { id: 'certificates', label: 'Certificates & Enrolls', icon: Award, desc: 'Course completions & credentials' },
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
  // Pinned state: true = full sidebar open (260px); false = compact icon rail (76px)
  const [isPinned, setIsPinned] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoToast, setDemoToast] = useState(null);

  // Single open accordion tracker: only 1 collapsible module can be open at a time
  const isCurriculumActive = ['subjects', 'courses', 'syllabus', 'topics', 'problems', 'quiz_bank'].includes(activePage);
  const [openModuleId, setOpenModuleId] = useState(isCurriculumActive ? 'curriculum' : null);

  // When active page changes, ensure parent module accordion opens and closes others
  useEffect(() => {
    if (isCurriculumActive) {
      setOpenModuleId('curriculum');
    }
  }, [activePage, isCurriculumActive]);

  const toggleAccordion = (modId) => {
    setOpenModuleId(prev => (prev === modId ? null : modId));
  };

  const handleItemClick = (pageId) => {
    onNavigate(pageId);
    if (window.innerWidth < 768) {
      setMobileMenuOpen(false);
    }
  };

  // Demo mode restriction listener
  useEffect(() => {
    const handleDemoRestriction = (e) => {
      setDemoToast(e.detail?.message || 'Action disabled in Demo Mode to protect live data.');
      setTimeout(() => setDemoToast(null), 6000);
    };
    window.addEventListener('admin:demo-restricted', handleDemoRestriction);
    return () => window.removeEventListener('admin:demo-restricted', handleDemoRestriction);
  }, []);

  return (
    <div className="fintrack-admin-root">
      {/* Demo Mode Notice Banner */}
      {user?.is_demo && (
        <div className="fintrack-demo-banner">
          <div className="flex items-center gap-2">
            <span className="demo-pill-tag">DEMO ADMIN MODE</span>
            <span>
              <strong>Read-Only Preview:</strong> Modifying actions (Add, Edit, Update, Delete) are disabled to protect live data.
            </span>
          </div>
          <span className="text-xs font-semibold opacity-90">🔒 View-Only Mode</span>
        </div>
      )}

      {/* Floating Demo Toast */}
      {demoToast && (
        <div className="fintrack-demo-toast">
          <div className="toast-icon-wrap">
            <AlertTriangle size={18} />
          </div>
          <div className="toast-body">
            <strong>Action Disabled in Demo Mode</strong>
            <div>{demoToast}</div>
          </div>
          <button onClick={() => setDemoToast(null)} className="toast-close-btn">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Main Container with Normal Attached Layout */}
      <div className="fintrack-app-wrapper">
        {/* Attached Left Docked Sidebar */}
        <aside
          className={`fintrack-sidebar ${isPinned ? 'expanded' : 'collapsed'} ${mobileMenuOpen ? 'mobile-open' : ''}`}
        >
          {/* Top Brand Logo Section */}
          <div className="fintrack-sidebar-header">
            <div
              className="fintrack-brand-btn"
              onClick={() => setIsPinned(prev => !prev)}
              title={isPinned ? "Collapse sidebar" : "Expand sidebar"}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isPinned ? 'flex-start' : 'center',
                width: '100%'
              }}
            >
              <img
                src="/skillstack.png"
                alt="SkillStack Logo"
                className="fintrack-brand-logo-img"
                style={{
                  width: '38px',
                  height: '38px',
                  minWidth: '38px',
                  borderRadius: '10px',
                  objectFit: 'contain',
                  boxShadow: '0 2px 8px rgba(91, 88, 235, 0.25)',
                  background: '#FFFFFF'
                }}
              />
              {isPinned && (
                <div className="fintrack-brand-text animate-fade-in" style={{ marginLeft: '10px' }}>
                  <div className="brand-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>SkillStack</span>
                    <span className="fintrack-pro-pill" style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      background: 'rgba(91, 88, 235, 0.12)',
                      color: 'var(--ft-primary)',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      TUTOR PRO
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Full Navigation Menu (Always visible: Full text when expanded, Compact icon rail when collapsed) */}
          {/* Full Navigation Menu (Categorized Sections with Modern Spacing) */}
          <div className="fintrack-nav-body animate-fade-in">
            <nav className="fintrack-nav-list">
              {ADMIN_NAV_GROUPS.map((grp, gIdx) => (
                <div key={grp.group || gIdx} className="nav-group-section">
                  {isPinned ? (
                    <div className="nav-group-title">{grp.group}</div>
                  ) : (
                    gIdx > 0 && <div className="nav-group-divider" />
                  )}
                  {grp.items.map((item) => {
                    const ItemIcon = item.icon;

                    // 1. Standalone Menu Items
                    if (item.isStandalone) {
                      const isActive = activePage === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`fintrack-nav-item ${isActive ? 'active' : ''}`}
                          onClick={() => handleItemClick(item.id)}
                          title={item.label}
                        >
                          <div className="fintrack-nav-item-left">
                            <span className="nav-icon-wrap">
                              <ItemIcon size={17} className="nav-icon" />
                            </span>
                            {isPinned && <span className="nav-label">{item.label}</span>}
                          </div>
                          {isPinned && item.badge && (
                            <span className={`fintrack-item-badge ${isActive ? 'badge-active' : ''}`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    }

                    // 2. Interlinked Main Module with Sub-modules (Curriculum & Academics)
                    if (item.isCollapsible) {
                      const isOpen = openModuleId === item.id;
                      const isParentActive = isCurriculumActive;

                      return (
                        <div key={item.id} className={`fintrack-module-group ${isParentActive ? 'parent-active' : ''}`}>
                          <button
                            type="button"
                            className={`fintrack-module-trigger ${isOpen ? 'open' : ''} ${isParentActive ? 'active-parent' : ''}`}
                            onClick={() => {
                              if (!isPinned) {
                                setIsPinned(true);
                                setOpenModuleId(item.id);
                              } else {
                                toggleAccordion(item.id);
                              }
                            }}
                            title={item.label}
                          >
                            <div className="module-trigger-left">
                              <span className="nav-icon-wrap">
                                <ItemIcon size={17} className="nav-icon" />
                              </span>
                              {isPinned && <span className="nav-label">{item.label}</span>}
                            </div>
                            {isPinned && (
                              <div className="module-trigger-right">
                                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </div>
                            )}
                          </button>

                          {/* Collapsible Sub-modules List */}
                          {isPinned && isOpen && (
                            <div className="fintrack-submodules-list animate-slide-down">
                              {item.submodules.map((sub) => {
                                const SubIcon = sub.icon;
                                const isSubActive = activePage === sub.id || (activePage === 'courses' && sub.id === 'subjects');

                                return (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    className={`fintrack-submodule-btn ${isSubActive ? 'active' : ''}`}
                                    onClick={() => handleItemClick(sub.id)}
                                    title={sub.desc}
                                  >
                                    <div className="flex items-center gap-2">
                                      <SubIcon size={14} />
                                      <span>{sub.label}</span>
                                    </div>
                                    {sub.badge && (
                                      <span className="submodule-pill-badge">{sub.badge}</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Workspace Stage */}
        <div className="fintrack-main-stage">
          {/* Top Header Bar (Modern SaaS Command Header) */}
          <header className="fintrack-top-header">
            <div className="header-greeting-block">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="fintrack-menu-toggle-btn"
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setMobileMenuOpen(prev => !prev);
                    } else {
                      setIsPinned(prev => !prev);
                    }
                  }}
                  title={isPinned ? "Collapse sidebar" : "Expand sidebar"}
                >
                  <Menu size={18} />
                </button>
                <div className="header-title-box">
                  <div className="header-breadcrumb-trail">
                    <span className="trail-root">SkillStack</span>
                    <span className="trail-sep">/</span>
                    <span className="trail-section">{isCurriculumActive ? 'Curriculum' : 'Admin'}</span>
                    <span className="trail-sep">/</span>
                    <span className="trail-current">
                      {activePage === 'dashboard' ? 'Dashboard Overview' :
                       activePage === 'subjects' || activePage === 'courses' ? 'Master Courses' :
                       activePage === 'syllabus' ? 'Syllabus & Modules' :
                       activePage === 'topics' ? 'Topics & Study Notes' :
                       activePage === 'problems' ? 'Practice Labs & Code' :
                       activePage === 'quiz_bank' ? 'Question Bank (MCQs)' :
                       activePage === 'certificates' ? 'Student Enrolls & Certificates' :
                       activePage === 'batches' ? 'Batches & Rosters' :
                       activePage === 'submissions' ? 'Code Submissions' :
                       activePage === 'doubts' ? 'Student Doubts (1-on-1)' :
                       activePage === 'users' ? 'User Directory' :
                       activePage === 'quiz_analytics' ? 'Quiz Analytics' :
                       activePage === 'reports' ? 'Performance Reports' :
                       activePage}
                    </span>
                  </div>
                  <h1 className="fintrack-header-title">
                    {activePage === 'dashboard' ? `Welcome back, ${user?.first_name || user?.username || 'Admin'}!` :
                     activePage === 'subjects' || activePage === 'courses' ? 'Master Courses Catalog' :
                     activePage === 'syllabus' ? 'Syllabus & Chapter Modules' :
                     activePage === 'topics' ? 'Lecture Topics & Study Notes' :
                     activePage === 'problems' ? 'Practice Labs & Workbench Challenges' :
                     activePage === 'quiz_bank' ? 'Multiple Choice Question Bank' :
                     activePage === 'certificates' ? 'Student Enrollments & Certificates' :
                     activePage === 'batches' ? 'Student Batches & Class Rosters' :
                     activePage === 'submissions' ? 'Practical Lab Code Submissions' :
                     activePage === 'doubts' ? 'Student 1-on-1 Doubts Resolution' :
                     activePage === 'users' ? 'User Accounts & Access Directory' :
                     activePage === 'quiz_analytics' ? 'Quiz Assessment Analytics' :
                     activePage === 'reports' ? 'Academic Performance Reports' :
                     'Management Console'}
                  </h1>
                </div>
              </div>
            </div>

            {/* Right Header Widgets: System Status, Notifications, User Profile, SignOut */}
            <div className="header-actions-block">
              {/* Backend Live Indicator */}
              <div
                className={`backend-status-pill ${backendOnline ? 'online' : backendOnline === false ? 'offline' : 'checking'}`}
                title={backendOnline ? "Live Backend Connected" : "Connecting to Backend API..."}
              >
                <span className="status-dot" />
                <span className="status-text hide-mobile">
                  {backendOnline ? 'API Connected' : backendOnline === false ? 'API Offline' : 'Connecting...'}
                </span>
              </div>

              {/* Notification Circular Button */}
              <button
                type="button"
                className="fintrack-icon-btn"
                onClick={() => onNavigate('doubts')}
                title="Student Doubts & Notifications"
              >
                <Bell size={18} />
                <span className="notification-red-dot" />
              </button>

              {/* User Profile Avatar Widget */}
              <div className="fintrack-user-pill">
                <div className="fintrack-user-avatar">
                  {(user?.first_name || user?.username || 'A')[0].toUpperCase()}
                </div>
                <div className="fintrack-user-info hide-mobile">
                  <span className="user-name">{user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}</span>
                  <span className="user-role">{user?.is_demo ? 'Demo Admin' : user?.is_admin ? 'Super Admin' : 'Staff Trainer'}</span>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                type="button"
                className="fintrack-logout-btn"
                onClick={onLogout}
                title="Sign Out"
              >
                <LogOut size={16} />
                <span className="hide-mobile">Sign Out</span>
              </button>
            </div>
          </header>


          {/* Main Stage Workspace Content */}
          <main className="fintrack-content-viewport">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
