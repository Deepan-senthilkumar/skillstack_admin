import React, { useState, useEffect } from 'react';
import {
  Users, CheckCircle2, Clock, AlertCircle, Shield, Unlock, Lock,
  Calendar, Check, FileCode, MessageSquare, Award, RefreshCw, Send,
  Plus, Edit, Trash2, X, Sparkles, FolderPlus, BookPlus, UserPlus,
  Trophy, Download, Eye, CheckSquare, BookOpen
} from 'lucide-react';
import { api } from '../api';

export default function StaffDashboard({ curriculum: rawCurriculum, onRefreshCurriculum, subjects: initialSubjects, onSubjectsUpdated }) {
  const curriculum = Array.isArray(rawCurriculum) ? rawCurriculum : (rawCurriculum?.results || []);
  const [activeTab, setActiveTab] = useState('subjects'); // 'subjects' | 'faculty' | 'access' | 'submissions' | 'leaderboard' | 'students'
  const [analytics, setAnalytics] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [subjectsList, setSubjectsList] = useState(initialSubjects || []);
  const [loading, setLoading] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);

  // Subject Modal State
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subName, setSubName] = useState('');
  const [subSlug, setSubSlug] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subShortDesc, setSubShortDesc] = useState('');
  const [subLevel, setSubLevel] = useState('Beginner to Advanced');
  const [subDuration, setSubDuration] = useState('8 Weeks');
  const [subInstructor, setSubInstructor] = useState('Prof. Deepan');

  // Faculty Modal State
  const [facultyModalOpen, setFacultyModalOpen] = useState(false);
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffFullName, setNewStaffFullName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('Staff@12345');
  const [newStaffAssignedSubject, setNewStaffAssignedSubject] = useState('');

  // Review form state
  const [reviewStatus, setReviewStatus] = useState('PASSED');
  const [reviewScore, setReviewScore] = useState(10);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Access & Deadline Modal
  const [editingAccessProblem, setEditingAccessProblem] = useState(null);
  const [deadlineInput, setDeadlineInput] = useState('');
  const [isUnlockedInput, setIsUnlockedInput] = useState(true);
  const [allowLateInput, setAllowLateInput] = useState(false);
  const [savingAccess, setSavingAccess] = useState(false);

  // CRUD Modals State
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [moduleName, setModuleName] = useState('');
  const [moduleLevel, setModuleLevel] = useState('beginner');
  const [moduleOrder, setModuleOrder] = useState(1);

  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicModuleId, setTopicModuleId] = useState('');
  const [topicTitle, setTopicTitle] = useState('');
  const [topicSlug, setTopicSlug] = useState('');
  const [topicExplainText, setTopicExplainText] = useState('');
  const [topicOrder, setTopicOrder] = useState(1);

  const [problemModalOpen, setProblemModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [problemTopicId, setProblemTopicId] = useState('');
  const [problemTitle, setProblemTitle] = useState('');
  const [problemDesc, setProblemDesc] = useState('');
  const [problemHint, setProblemHint] = useState('');
  const [problemTestCriteria, setProblemTestCriteria] = useState('');
  const [problemKeywords, setProblemKeywords] = useState('');
  const [problemStarter, setProblemStarter] = useState('');
  const [problemPoints, setProblemPoints] = useState(10);
  const [problemOrder, setProblemOrder] = useState(1);

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('Student@12345');
  const [newStudentBatch, setNewStudentBatch] = useState('Django Batch 2026');

  const [savingCrud, setSavingCrud] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ana, subs, studs, fac, subsData] = await Promise.all([
        api.getStaffAnalytics(),
        api.getStaffSubmissions(),
        api.getStudents(),
        api.getStaffFaculty().catch(() => []),
        api.getSubjects().catch(() => []),
      ]);
      setAnalytics(ana);
      setSubmissions(subs);
      setStudents(studs);
      setFaculty(fac);
      setSubjectsList(subsData);
    } catch (err) {
      console.error('Failed loading staff dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute automated marks leaderboard & student performance
  const studentPerformance = students.map(std => {
    const studentSubs = submissions.filter(s => s.student_username === std.username);
    const totalPoints = studentSubs.reduce((sum, s) => sum + (s.score || 0), 0);
    const passedCount = studentSubs.filter(s => s.status === 'PASSED').length;
    return {
      ...std,
      totalPoints,
      passedCount,
      totalSubmissions: studentSubs.length,
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints);

  const handleExportMarksCSV = () => {
    const headers = ['Student Username', 'Email', 'Batch', 'Total Points', 'Challenges Passed', 'Total Submissions'];
    const rows = studentPerformance.map(sp => [
      sp.username,
      sp.email,
      `"${sp.batch_name || 'Default Batch'}"`,
      sp.totalPoints,
      sp.passedCount,
      sp.totalSubmissions
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `django_kalari_marks_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick preset deadline calculators
  const setPresetDeadline = (hours) => {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60 * 1000);
    setDeadlineInput(local.toISOString().slice(0, 16));
  };

  const handleOpenAccessModal = (problem) => {
    setEditingAccessProblem(problem);
    setIsUnlockedInput(problem.access_control?.is_unlocked ?? true);
    setAllowLateInput(problem.access_control?.allow_late_submission ?? false);
    if (problem.access_control?.deadline) {
      const d = new Date(problem.access_control.deadline);
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - offset * 60 * 1000);
      setDeadlineInput(local.toISOString().slice(0, 16));
    } else {
      setPresetDeadline(24);
    }
  };

  const handleSaveProblemAccess = async () => {
    if (!editingAccessProblem) return;
    setSavingAccess(true);
    try {
      const isoDeadline = deadlineInput ? new Date(deadlineInput).toISOString() : null;
      await api.updateProblemAccess(
        editingAccessProblem.id,
        isUnlockedInput,
        isoDeadline,
        allowLateInput
      );
      setEditingAccessProblem(null);
      await loadData();
      if (onRefreshCurriculum) onRefreshCurriculum();
    } catch (err) {
      alert('Error saving access rules: ' + err.message);
    } finally {
      setSavingAccess(false);
    }
  };

  const handleBulkUnlock = async (moduleId) => {
    const hours = prompt('Set deadline duration in hours for this entire module (e.g., 24, 48, or leave blank for no deadline):', '24');
    let isoDeadline = null;
    if (hours && !isNaN(hours)) {
      const d = new Date();
      d.setHours(d.getHours() + parseFloat(hours));
      isoDeadline = d.toISOString();
    }

    try {
      await api.bulkUnlockModule(moduleId, true, isoDeadline);
      await loadData();
      if (onRefreshCurriculum) onRefreshCurriculum();
      alert(`Module unlocked successfully with ${hours ? hours + ' hours' : 'unlimited'} deadline!`);
    } catch (err) {
      alert('Failed to bulk unlock: ' + err.message);
    }
  };

  // Module CRUD handlers
  const openCreateModule = () => {
    setEditingModule(null);
    setModuleName('');
    setModuleLevel('beginner');
    setModuleOrder(curriculum.length + 1);
    setModuleModalOpen(true);
  };

  const openEditModule = (mod) => {
    setEditingModule(mod);
    setModuleName(mod.name);
    setModuleLevel(mod.level);
    setModuleOrder(mod.order);
    setModuleModalOpen(true);
  };

  const handleSaveModule = async (e) => {
    e.preventDefault();
    setSavingCrud(true);
    try {
      if (editingModule) {
        await api.updateModule(editingModule.id, {
          name: moduleName,
          level: moduleLevel,
          order: parseInt(moduleOrder, 10),
        });
      } else {
        await api.createModule({
          name: moduleName,
          level: moduleLevel,
          order: parseInt(moduleOrder, 10),
        });
      }
      setModuleModalOpen(false);
      if (onRefreshCurriculum) onRefreshCurriculum();
      await loadData();
    } catch (err) {
      alert('Error saving module: ' + err.message);
    } finally {
      setSavingCrud(false);
    }
  };

  const handleDeleteModule = async (mod) => {
    if (!confirm(`Are you sure you want to delete module "${mod.name}" and all its topics?`)) return;
    try {
      await api.deleteModule(mod.id);
      if (onRefreshCurriculum) onRefreshCurriculum();
      await loadData();
    } catch (err) {
      alert('Error deleting module: ' + err.message);
    }
  };

  // Topic CRUD handlers
  const openCreateTopic = (defaultModuleId = '') => {
    setEditingTopic(null);
    setTopicModuleId(defaultModuleId || (curriculum[0]?.id || ''));
    setTopicTitle('');
    setTopicSlug('');
    setTopicExplainText('Enter detailed lesson explanation here...');
    setTopicOrder(1);
    setTopicModalOpen(true);
  };

  const openEditTopic = (topic) => {
    setEditingTopic(topic);
    setTopicModuleId(topic.module || '');
    setTopicTitle(topic.title);
    setTopicSlug(topic.topic_id);
    setTopicExplainText((topic.explain || []).join('\n\n'));
    setTopicOrder(topic.order);
    setTopicModalOpen(true);
  };

  const handleSaveTopic = async (e) => {
    e.preventDefault();
    setSavingCrud(true);
    try {
      const explainArray = topicExplainText.split('\n\n').map(p => p.trim()).filter(Boolean);
      const payload = {
        module: parseInt(topicModuleId, 10),
        title: topicTitle,
        topic_id: topicSlug.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
        explain: explainArray,
        order: parseInt(topicOrder, 10),
      };

      if (editingTopic) {
        await api.updateTopic(editingTopic.id, payload);
      } else {
        await api.createTopic(payload);
      }
      setTopicModalOpen(false);
      if (onRefreshCurriculum) onRefreshCurriculum();
      await loadData();
    } catch (err) {
      alert('Error saving topic: ' + err.message);
    } finally {
      setSavingCrud(false);
    }
  };

  const handleDeleteTopic = async (topic) => {
    if (!confirm(`Are you sure you want to delete topic "${topic.title}"?`)) return;
    try {
      await api.deleteTopic(topic.id);
      if (onRefreshCurriculum) onRefreshCurriculum();
      await loadData();
    } catch (err) {
      alert('Error deleting topic: ' + err.message);
    }
  };

  // Problem / Challenge CRUD handlers
  const openCreateProblem = (defaultTopicId = '') => {
    setEditingProblem(null);
    const firstTopic = curriculum[0]?.topics?.[0];
    setProblemTopicId(defaultTopicId || (firstTopic ? firstTopic.id : ''));
    setProblemTitle('');
    setProblemDesc('');
    setProblemHint('');
    setProblemTestCriteria('Must define the required Django view/model/component with clean syntax.');
    setProblemKeywords('');
    setProblemStarter('# Python / Django starter code\n');
    setProblemPoints(10);
    setProblemOrder(1);
    setProblemModalOpen(true);
  };

  const openEditProblem = (prob) => {
    setEditingProblem(prob);
    setProblemTopicId(prob.topic);
    setProblemTitle(prob.title);
    setProblemDesc(prob.description);
    setProblemHint(prob.expected_output_hint || '');
    setProblemTestCriteria(prob.test_criteria || '');
    setProblemKeywords(prob.expected_keywords || '');
    setProblemStarter(prob.starter_code || '');
    setProblemPoints(prob.points || 10);
    setProblemOrder(prob.order || 1);
    setProblemModalOpen(true);
  };

  const handleSaveProblem = async (e) => {
    e.preventDefault();
    setSavingCrud(true);
    try {
      const payload = {
        topic: parseInt(problemTopicId, 10),
        title: problemTitle,
        description: problemDesc,
        expected_output_hint: problemHint,
        test_criteria: problemTestCriteria,
        expected_keywords: problemKeywords,
        starter_code: problemStarter,
        points: parseInt(problemPoints, 10),
        order: parseInt(problemOrder, 10),
      };

      if (editingProblem) {
        await api.updateProblem(editingProblem.id, payload);
      } else {
        await api.createProblem(payload);
      }
      setProblemModalOpen(false);
      if (onRefreshCurriculum) onRefreshCurriculum();
      await loadData();
    } catch (err) {
      alert('Error saving problem: ' + err.message);
    } finally {
      setSavingCrud(false);
    }
  };

  const handleDeleteProblem = async (problem) => {
    if (!confirm(`Are you sure you want to delete challenge "${problem.title}"?`)) return;
    try {
      await api.deleteProblem(problem.id);
      if (onRefreshCurriculum) onRefreshCurriculum();
      await loadData();
    } catch (err) {
      alert('Error deleting challenge: ' + err.message);
    }
  };

  // Student CRUD handlers
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setSavingCrud(true);
    try {
      await api.createStudent({
        username: newStudentUsername,
        email: newStudentEmail,
        password: newStudentPassword,
        batch_name: newStudentBatch,
      });
      setStudentModalOpen(false);
      setNewStudentUsername('');
      setNewStudentEmail('');
      await loadData();
      alert('Student created successfully!');
    } catch (err) {
      alert('Error creating student: ' + err.message);
    } finally {
      setSavingCrud(false);
    }
  };

  const handleDeleteStudent = async (student) => {
    if (!confirm(`Are you sure you want to remove student "${student.username}"?`)) return;
    try {
      await api.deleteStudent(student.id);
      await loadData();
    } catch (err) {
      alert('Error removing student: ' + err.message);
    }
  };

  // Subject CRUD Handlers
  const openCreateSubject = () => {
    setEditingSubject(null);
    setSubName('');
    setSubSlug('');
    setSubDesc('');
    setSubShortDesc('');
    setSubLevel('Beginner to Advanced');
    setSubDuration('8 Weeks');
    setSubInstructor('Prof. Deepan & Staff Team');
    setSubjectModalOpen(true);
  };

  const openEditSubject = (sub) => {
    setEditingSubject(sub);
    setSubName(sub.name);
    setSubSlug(sub.slug);
    setSubDesc(sub.description);
    setSubShortDesc(sub.short_description || '');
    setSubLevel(sub.level || 'Beginner to Advanced');
    setSubDuration(sub.duration || '8 Weeks');
    setSubInstructor(sub.instructor_name || 'Prof. Deepan');
    setSubjectModalOpen(true);
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    setSavingCrud(true);
    try {
      const payload = {
        name: subName,
        slug: subSlug || subName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: subDesc,
        short_description: subShortDesc,
        level: subLevel,
        duration: subDuration,
        instructor_name: subInstructor,
      };
      if (editingSubject) {
        await api.updateSubject(editingSubject.id, payload);
      } else {
        await api.createSubject(payload);
      }
      setSubjectModalOpen(false);
      await loadData();
      if (onSubjectsUpdated) onSubjectsUpdated();
      if (onRefreshCurriculum) onRefreshCurriculum();
    } catch (err) {
      alert('Error saving subject: ' + err.message);
    } finally {
      setSavingCrud(false);
    }
  };

  const handleDeleteSubject = async (sub) => {
    if (!confirm(`Are you sure you want to delete subject "${sub.name}"?`)) return;
    try {
      await api.deleteSubject(sub.id);
      await loadData();
      if (onSubjectsUpdated) onSubjectsUpdated();
      if (onRefreshCurriculum) onRefreshCurriculum();
    } catch (err) {
      alert('Error deleting subject: ' + err.message);
    }
  };

  // Faculty Handlers (Admin creates staff accounts)
  const openCreateFaculty = () => {
    setNewStaffUsername('');
    setNewStaffFullName('');
    setNewStaffEmail('');
    setNewStaffPassword('Staff@12345');
    setNewStaffAssignedSubject(subjectsList[0]?.id || '');
    setFacultyModalOpen(true);
  };

  const handleSaveFaculty = async (e) => {
    e.preventDefault();
    setSavingCrud(true);
    try {
      await api.createStaffFaculty({
        username: newStaffUsername,
        first_name: newStaffFullName,  // backend uses first_name field
        email: newStaffEmail,
        password: newStaffPassword,
        assigned_subject_id: newStaffAssignedSubject || null,
      });
      setFacultyModalOpen(false);
      await loadData();
      alert('Staff faculty account created successfully! The instructor can now sign in.');
    } catch (err) {
      alert('Error creating staff member: ' + err.message);
    } finally {
      setSavingCrud(false);
    }
  };

  const handleDeleteFaculty = async (fac) => {
    if (!confirm(`Are you sure you want to remove staff member "${fac.username}"?`)) return;
    try {
      await api.deleteStaffFaculty(fac.id);
      await loadData();
    } catch (err) {
      alert('Error removing staff member: ' + err.message);
    }
  };

  // Grading handler
  const handleSelectSubmission = (sub) => {
    setSelectedSub(sub);
    setReviewStatus(sub.status === 'SUBMITTED' ? 'PASSED' : sub.status);
    setReviewScore(sub.score ?? sub.max_points ?? 10);
    setReviewFeedback(sub.staff_feedback || '');
  };

  const handleSubmitReview = async () => {
    if (!selectedSub) return;
    setSubmittingReview(true);
    try {
      const updated = await api.reviewSubmission(
        selectedSub.id,
        reviewStatus,
        parseInt(reviewScore, 10),
        reviewFeedback
      );
      setSubmissions(submissions.map(s => s.id === updated.id ? updated : s));
      setSelectedSub(null);
      await loadData();
      if (onRefreshCurriculum) onRefreshCurriculum();
    } catch (err) {
      alert('Failed to submit review: ' + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  // ── Pagination helper ──────────────────────────────────────────
  const usePagination = (data, pageSize) => {
    const [page, setPage] = React.useState(1);
    const total = data.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePages = Math.min(page, totalPages);
    const start = (safePages - 1) * pageSize;
    const slice = data.slice(start, start + pageSize);
    return { slice, page: safePages, totalPages, total, start, setPage };
  };

  const Pagination = ({ page, totalPages, total, start, pageSize, setPage, label = 'rows' }) => {
    if (total === 0) return null;
    const end = Math.min(start + pageSize, total);
    const pages = [];
    const range = 2;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - range && i <= page + range)) pages.push(i);
      else if (pages[pages.length - 1] !== '...') pages.push('...');
    }
    return (
      <div className="pagination-bar">
        <span className="pagination-info">Showing {start + 1}–{end} of {total} {label}</span>
        <div className="pagination-controls">
          <button className="pg-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Prev</button>
          {pages.map((p, i) =>
            p === '...'
              ? <span key={`e${i}`} className="pg-ellipsis">…</span>
              : <button key={p} className={`pg-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          )}
          <button className="pg-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next ›</button>
        </div>
      </div>
    );
  };

  // ── Per-table page sizes ────────────────────────────────────────
  const [submissionsPageSize, setSubmissionsPageSize] = React.useState(10);
  const [studentsPageSize, setStudentsPageSize]       = React.useState(10);
  const [leaderboardPageSize, setLeaderboardPageSize] = React.useState(10);

  const submissionsPag  = usePagination(submissions, submissionsPageSize);
  const studentsPag     = usePagination(students, studentsPageSize);
  const leaderboardPag  = usePagination(studentPerformance, leaderboardPageSize);

  // Nav items config
  const navItems = [
    { id: 'subjects',     icon: '📚', label: 'Subject Tracks',     badge: subjectsList.length },
    { id: 'faculty',      icon: '👨‍🏫', label: 'Faculty Team',       badge: faculty.length },
    { id: 'access',       icon: '🔐', label: 'Syllabus & Access',   badge: null },
    { id: 'submissions',  icon: '⚡', label: 'Submissions',         badge: analytics?.pending_review || null },
    { id: 'leaderboard',  icon: '🏆', label: 'Leaderboard',         badge: null },
    { id: 'students',     icon: '👥', label: 'Student Roster',      badge: students.length },
  ];

  const pageHeadings = {
    subjects:    { title: 'Curriculum Subjects & Specialized Tracks', sub: 'Manage all academic tracks, syllabuses, and subject details.' },
    faculty:     { title: 'Academy Faculty Team', sub: 'Domain instructors who mentor batches and review student submissions.' },
    access:      { title: 'Syllabus & Challenge Controls', sub: 'Manage module access, deadlines, and challenge CRUD.' },
    submissions: { title: 'Auto-Graded Submissions', sub: 'Inspect, grade, and override student code submissions.' },
    leaderboard: { title: 'Marks Observer & Leaderboard', sub: 'Automated student performance rankings and grade exports.' },
    students:    { title: 'Student Roster', sub: 'View and manage all enrolled students.' },
  };

  return (
    <div className="dash-layout">

      {/* ── SIDEBAR ──────────────────────────────────────────── */}
      <aside className="dash-sidebar">
        <div className="sidebar-brand">
          <img src="/skillstack.png" alt="Logo" className="sidebar-logo" />
          <div>
            <div className="sidebar-brand-name">SkillStack</div>
            <div className="sidebar-brand-sub">Admin Command Center</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge > 0 && (
                <span className={`nav-badge ${item.id === 'submissions' ? 'badge-warn' : ''}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar stats */}
        <div className="sidebar-stats">
          <div className="sb-stat"><span className="sb-val" style={{color:'var(--blue-primary)'}}>{analytics?.total_students || students.length || 0}</span><span className="sb-key">Students</span></div>
          <div className="sb-stat"><span className="sb-val">{analytics?.total_problems || 48}</span><span className="sb-key">Challenges</span></div>
          <div className="sb-stat"><span className="sb-val" style={{color:'var(--amber)'}}>{analytics?.pending_review || 0}</span><span className="sb-key">Pending</span></div>
          <div className="sb-stat"><span className="sb-val" style={{color:'var(--emerald)'}}>{analytics?.passed_count || 0}</span><span className="sb-key">Passed</span></div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <main className="dash-content">

        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-breadcrumb">Admin Studio · {navItems.find(n => n.id === activeTab)?.label}</div>
            <h1 className="page-title">{pageHeadings[activeTab]?.title}</h1>
            <p className="page-sub">{pageHeadings[activeTab]?.sub}</p>
          </div>
          <div className="page-header-actions">
            {activeTab === 'access' && (
              <>
                <button className="btn-primary" onClick={openCreateModule} style={{fontSize:'13px',padding:'8px 16px'}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg> Add Module</button>
                <button className="btn-primary" onClick={() => openCreateTopic()} style={{fontSize:'13px',padding:'8px 16px',background:'var(--amber)',color:'#000'}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> Add Topic</button>
              </>
            )}
            {activeTab === 'subjects' && (
              <button className="btn-primary" onClick={openCreateSubject} style={{fontSize:'13px',padding:'8px 16px'}}>+ Add Subject</button>
            )}
            {activeTab === 'faculty' && (
              <button className="btn-primary" onClick={openCreateFaculty} style={{fontSize:'13px',padding:'8px 16px'}}>+ Add Staff Account</button>
            )}
            {activeTab === 'students' && (
              <button className="btn-primary" onClick={() => setStudentModalOpen(true)} style={{fontSize:'13px',padding:'8px 16px'}}>+ Enroll Student</button>
            )}
            {activeTab === 'leaderboard' && (
              <button className="btn-primary" onClick={handleExportMarksCSV} style={{fontSize:'13px',padding:'8px 16px'}}>⬇ Export CSV</button>
            )}
            <button className="btn-secondary" onClick={loadData} disabled={loading} style={{fontSize:'13px',padding:'8px 14px'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={loading ? 'spin' : ''}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* ── TAB: SUBJECT TRACKS ──────────────────────────── */}
        {activeTab === 'subjects' && (
          <div className="subjects-grid">
            {subjectsList.length === 0 ? (
              <div className="empty-state">No subjects yet. Click "Add Subject" to create one.</div>
            ) : subjectsList.map(sub => (
              <div key={sub.id} className="subject-card">
                <div className="subject-card-top">
                  <span className="subject-level-badge">{sub.level || 'All Levels'}</span>
                  <span className="subject-duration">{sub.duration || '8 Weeks'}</span>
                </div>
                <h3 className="subject-card-title">{sub.name}</h3>
                <p className="subject-card-desc">{sub.short_description || sub.description?.slice(0, 120) + '…'}</p>
                <div className="subject-instructor">👤 {sub.instructor_name || 'Prof. Deepan & Staff Team'}</div>
                <div className="subject-card-footer">
                  <button className="btn-secondary" onClick={() => openEditSubject(sub)} style={{fontSize:'12px',padding:'5px 10px'}}>✏ Edit</button>
                  <button className="btn-danger" onClick={() => handleDeleteSubject(sub)} style={{fontSize:'12px',padding:'5px 9px'}} title="Delete"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: FACULTY TEAM ────────────────────────────── */}
        {activeTab === 'faculty' && (
          <div className="faculty-grid">
            {faculty.length === 0 ? (
              <div className="empty-state">No faculty added yet.</div>
            ) : faculty.map(fac => (
              <div key={fac.id} className="faculty-card">
                <div className="faculty-avatar">{(fac.full_name || fac.username).slice(0,2).toUpperCase()}</div>
                <div className="faculty-info">
                  <div className="faculty-name-row">
                    <span className="faculty-name">{fac.full_name || fac.username}</span>
                    <span className={`badge-role ${fac.is_admin_role || fac.is_superuser ? 'role-staff' : 'role-student'}`} style={{fontSize:'10px'}}>
                      {fac.is_admin_role || fac.is_superuser ? 'Super Admin' : 'Staff'}
                    </span>
                  </div>
                  <div className="faculty-meta">@{fac.username} · {fac.email}</div>
                  <div className="faculty-track">📚 {fac.assigned_subject_name || 'All Tracks'}</div>
                </div>
                <div className="faculty-footer">
                  <span style={{fontSize:'11px',color:'var(--text-tertiary)'}}>Joined {new Date(fac.date_joined).toLocaleDateString()}</span>
                  {!fac.is_superuser && (
                    <button onClick={() => handleDeleteFaculty(fac)} className="btn-danger" style={{fontSize:'11px',padding:'4px 9px'}}>Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: SYLLABUS & ACCESS CONTROLS ─────────────── */}
        {activeTab === 'access' && (
          <div className="access-modules">
            {curriculum.length === 0 ? (
              <div className="empty-state">No modules yet. Click "Add Module" to create one.</div>
            ) : curriculum.map(module => (
              <div key={module.id} className="module-block">
                <div className="module-header">
                  <div className="module-header-left">
                    <span className={`module-level-tag level-${module.level}`}>[{module.level}]</span>
                    <strong className="module-name">{module.name}</strong>
                    <span className="module-topic-count">{module.topics?.length || 0} topics</span>
                  </div>
                  <div className="module-header-actions">
                    <button className="btn-secondary" style={{fontSize:'12px',padding:'5px 11px'}} onClick={() => handleBulkUnlock(module.id)}>⚡ Unlock All</button>
                    <button className="btn-secondary" style={{fontSize:'12px',padding:'5px 10px'}} onClick={() => openCreateTopic(module.id)} title="Add Topic">+ Topic</button>
                    <button className="btn-secondary" style={{fontSize:'12px',padding:'5px 8px'}} onClick={() => openEditModule(module)} title="Edit"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button className="btn-danger" style={{padding:'5px 8px'}} onClick={() => handleDeleteModule(module)} title="Delete"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg></button>
                  </div>
                </div>

                <div className="module-topics">
                  {(module.topics || []).map(topic => (
                    <div key={topic.id} className="topic-block">
                      <div className="topic-header">
                        <div className="topic-header-left">
                          <span className="topic-order">#{topic.order}</span>
                          <strong className="topic-title">{topic.title}</strong>
                          <code className="topic-slug">{topic.topic_id}</code>
                        </div>
                        <div className="topic-actions">
                          <button className="btn-secondary" style={{fontSize:'11px',padding:'4px 8px'}} onClick={() => openCreateProblem(topic.id)}>+ Challenge</button>
                          <button className="btn-secondary" style={{fontSize:'11px',padding:'4px 7px'}} onClick={() => openEditTopic(topic)}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                          <button className="btn-danger" style={{fontSize:'11px',padding:'4px 7px'}} onClick={() => handleDeleteTopic(topic)}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg></button>
                        </div>
                      </div>

                      <div className="table-scroll-wrapper">
                        <table className="staff-table">
                          <thead>
                            <tr>
                              <th style={{minWidth:'220px'}}>Challenge / Task</th>
                              <th style={{minWidth:'90px'}}>Access</th>
                              <th style={{minWidth:'160px'}}>Deadline</th>
                              <th style={{minWidth:'160px',textAlign:'right'}}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(!topic.problems || topic.problems.length === 0) ? (
                              <tr><td colSpan="4" style={{textAlign:'center',color:'var(--text-tertiary)',padding:'14px'}}>No challenges yet — click "+ Challenge"</td></tr>
                            ) : topic.problems.map(problem => {
                              const access = problem.access_control || {};
                              return (
                                <tr key={problem.id}>
                                  <td>
                                    <strong style={{fontSize:'13px',display:'block'}}>{problem.title}</strong>
                                    <span style={{fontSize:'11.5px',color:'var(--text-secondary)'}}>{problem.description?.slice(0,65)}…</span>
                                  </td>
                                  <td>
                                    {access.is_unlocked
                                      ? <span className="lab-status-badge status-active">Open</span>
                                      : <span className="lab-status-badge status-locked">Locked</span>}
                                  </td>
                                  <td>
                                    {access.deadline
                                      ? <span style={{fontFamily:'IBM Plex Mono',fontSize:'12px',color:access.is_expired?'var(--coral)':'var(--amber)'}}>{new Date(access.deadline).toLocaleString([],{dateStyle:'short',timeStyle:'short'})}{access.is_expired&&<span style={{display:'block',fontSize:'10px',color:'var(--coral)'}}>Expired</span>}</span>
                                      : <span style={{color:'var(--text-tertiary)',fontSize:'12px'}}>No deadline</span>}
                                  </td>
                                  <td style={{textAlign:'right'}}>
                                    <div style={{display:'inline-flex',gap:'5px'}}>
                                      <button className="btn-secondary" style={{fontSize:'11px',padding:'4px 8px'}} onClick={() => handleOpenAccessModal(problem)}>⏱ Timeline</button>
                                      <button className="btn-secondary" style={{fontSize:'11px',padding:'4px 7px'}} onClick={() => openEditProblem(problem)} title="Edit"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                                      <button className="btn-danger" style={{fontSize:'11px',padding:'4px 7px'}} onClick={() => handleDeleteProblem(problem)} title="Delete"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg></button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: SUBMISSIONS ─────────────────────────────── */}
        {activeTab === 'submissions' && (
          <div className="table-card">
            <div className="table-card-header">
              <div>
                <h2 className="table-card-title">Auto-Graded Submissions Queue</h2>
                <p className="table-card-sub">Review code submissions, inspect outputs, and override grades.</p>
              </div>
              <div className="table-size-picker">
                <label>Rows:</label>
                <select value={submissionsPageSize} onChange={e => { setSubmissionsPageSize(+e.target.value); submissionsPag.setPage(1); }}>
                  <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
                </select>
              </div>
            </div>
            {submissions.length === 0 ? (
              <div className="empty-state">No student submissions yet.</div>
            ) : (
              <>
                <div className="table-scroll-wrapper">
                  <table className="staff-table">
                    <thead>
                      <tr>
                        <th style={{minWidth:'130px'}}>Student</th>
                        <th style={{minWidth:'180px'}}>Challenge</th>
                        <th style={{minWidth:'140px'}}>Topic / Module</th>
                        <th style={{minWidth:'140px'}}>Submitted At</th>
                        <th style={{minWidth:'120px'}}>Status</th>
                        <th style={{minWidth:'80px'}}>Score</th>
                        <th style={{minWidth:'120px',textAlign:'right'}}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissionsPag.slice.map(sub => (
                        <tr key={sub.id}>
                          <td>
                            <strong>{sub.student_username}</strong>
                            <span style={{display:'block',fontSize:'11px',color:'var(--text-tertiary)'}}>{sub.student_batch || 'Default Batch'}</span>
                          </td>
                          <td>{sub.problem_title}</td>
                          <td style={{color:'var(--text-secondary)',fontSize:'12.5px'}}>{sub.topic_title}</td>
                          <td style={{fontFamily:'IBM Plex Mono',fontSize:'12px'}}>
                            {new Date(sub.submitted_at).toLocaleString([],{dateStyle:'short',timeStyle:'short'})}
                            {sub.is_late && <span style={{color:'var(--coral)',display:'block',fontSize:'10.5px'}}>Late</span>}
                          </td>
                          <td>
                            {sub.status === 'PASSED' && <span className="lab-status-badge status-passed">Passed</span>}
                            {sub.status === 'SUBMITTED' && <span className="lab-status-badge status-submitted">Pending</span>}
                            {sub.status === 'REVISION_REQUESTED' && <span className="lab-status-badge status-revision">Revision</span>}
                            {sub.status === 'REJECTED' && <span className="lab-status-badge status-expired">Rejected</span>}
                          </td>
                          <td style={{fontFamily:'IBM Plex Mono',fontWeight:700}}>{sub.score !== null ? `${sub.score}/${sub.max_points}` : '—'}</td>
                          <td style={{textAlign:'right'}}>
                            <button className="btn-primary" style={{padding:'5px 11px',fontSize:'12px'}} onClick={() => handleSelectSubmission(sub)}>Grade</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination {...submissionsPag} pageSize={submissionsPageSize} label="submissions" />
              </>
            )}
          </div>
        )}

        {/* ── TAB: LEADERBOARD ─────────────────────────────── */}
        {activeTab === 'leaderboard' && (
          <div className="table-card">
            <div className="table-card-header">
              <div>
                <h2 className="table-card-title">🏆 Student Marks & Rankings</h2>
                <p className="table-card-sub">All marks computed automatically from code structure & output verification.</p>
              </div>
              <div className="table-size-picker">
                <label>Rows:</label>
                <select value={leaderboardPageSize} onChange={e => { setLeaderboardPageSize(+e.target.value); leaderboardPag.setPage(1); }}>
                  <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
                </select>
              </div>
            </div>
            {studentPerformance.length === 0 ? (
              <div className="empty-state">No students enrolled yet.</div>
            ) : (
              <>
                <div className="table-scroll-wrapper">
                  <table className="staff-table">
                    <thead>
                      <tr>
                        <th style={{minWidth:'60px'}}>Rank</th>
                        <th style={{minWidth:'150px'}}>Student</th>
                        <th style={{minWidth:'150px'}}>Batch / Classroom</th>
                        <th style={{minWidth:'140px'}}>Challenges Passed</th>
                        <th style={{minWidth:'140px'}}>Total Submissions</th>
                        <th style={{minWidth:'140px'}}>Auto-Graded Marks</th>
                        <th style={{minWidth:'110px',textAlign:'right'}}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardPag.slice.map((sp, localIdx) => {
                        const idx = leaderboardPag.start + localIdx;
                        return (
                          <tr key={sp.id}>
                            <td>
                              <span className={`rank-badge ${idx === 0 ? 'rank-gold' : idx === 1 ? 'rank-silver' : idx === 2 ? 'rank-bronze' : 'rank-normal'}`}>#{idx + 1}</span>
                            </td>
                            <td>
                              <strong>{sp.username}</strong>
                              <span style={{display:'block',fontSize:'11px',color:'var(--text-tertiary)'}}>{sp.email}</span>
                            </td>
                            <td>{sp.batch_name || 'Default Batch'}</td>
                            <td><span style={{color:sp.passedCount>0?'#16A34A':'var(--text-tertiary)',fontWeight:700}}>{sp.passedCount} Labs</span></td>
                            <td style={{fontFamily:'IBM Plex Mono'}}>{sp.totalSubmissions}</td>
                            <td>
                              <span className="marks-chip">{sp.totalPoints} Marks</span>
                            </td>
                            <td style={{textAlign:'right'}}>
                              <button className="btn-secondary" style={{fontSize:'11px',padding:'4px 9px'}} onClick={() => setActiveTab('submissions')}>👁 History</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination {...leaderboardPag} pageSize={leaderboardPageSize} label="students" />
              </>
            )}
          </div>
        )}

        {/* ── TAB: STUDENTS ────────────────────────────────── */}
        {activeTab === 'students' && (
          <div className="table-card">
            <div className="table-card-header">
              <div>
                <h2 className="table-card-title">Enrolled Student Roster</h2>
                <p className="table-card-sub">Manage student accounts, batches, and enrollment.</p>
              </div>
              <div className="table-size-picker">
                <label>Rows:</label>
                <select value={studentsPageSize} onChange={e => { setStudentsPageSize(+e.target.value); studentsPag.setPage(1); }}>
                  <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
                </select>
              </div>
            </div>
            {students.length === 0 ? (
              <div className="empty-state">No students enrolled yet.</div>
            ) : (
              <>
                <div className="table-scroll-wrapper">
                  <table className="staff-table">
                    <thead>
                      <tr>
                        <th style={{minWidth:'130px'}}>Username</th>
                        <th style={{minWidth:'180px'}}>Email</th>
                        <th style={{minWidth:'150px'}}>Batch</th>
                        <th style={{minWidth:'100px'}}>Role</th>
                        <th style={{minWidth:'120px'}}>Joined Date</th>
                        <th style={{minWidth:'90px',textAlign:'right'}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsPag.slice.map(std => (
                        <tr key={std.id}>
                          <td><strong>{std.username}</strong></td>
                          <td style={{fontSize:'13px'}}>{std.email || '—'}</td>
                          <td>{std.batch_name}</td>
                          <td><span className="badge-role role-student">{std.role}</span></td>
                          <td style={{fontFamily:'IBM Plex Mono',fontSize:'12px'}}>{new Date(std.date_joined).toLocaleDateString()}</td>
                          <td style={{textAlign:'right'}}>
                            <button className="btn-danger" style={{padding:'4px 8px',fontSize:'11px'}} onClick={() => handleDeleteStudent(std)} title="Remove"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination {...studentsPag} pageSize={studentsPageSize} label="students" />
              </>
            )}
          </div>
        )}

      </main>

      {/* ═══════════ MODALS (unchanged content) ═══════════════ */}

      {/* MODAL 1: Module Create/Edit */}
      {moduleModalOpen && (
        <div className="modal-overlay" onClick={() => setModuleModalOpen(false)}>
          <div className="modal-content" style={{maxWidth:'520px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingModule ? 'Edit Module' : 'Create New Module'}</h3>
              <button className="btn-secondary" onClick={() => setModuleModalOpen(false)}>X</button>
            </div>
            <form onSubmit={handleSaveModule}>
              <div className="modal-body">
                <div>
                  <label>Module Name</label>
                  <input type="text" required value={moduleName} onChange={e => setModuleName(e.target.value)} placeholder="e.g. Django Async & Channels" />
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                  <div>
                    <label>Level Tier</label>
                    <select value={moduleLevel} onChange={e => setModuleLevel(e.target.value)}>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label>Order Position</label>
                    <input type="number" min="1" required value={moduleOrder} onChange={e => setModuleOrder(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModuleModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={savingCrud}>{savingCrud ? 'Saving…' : 'Save Module'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Topic Create/Edit */}
      {topicModalOpen && (
        <div className="modal-overlay" onClick={() => setTopicModalOpen(false)}>
          <div className="modal-content" style={{maxWidth:'640px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTopic ? 'Edit Topic' : 'Add New Topic'}</h3>
              <button className="btn-secondary" onClick={() => setTopicModalOpen(false)}>X</button>
            </div>
            <form onSubmit={handleSaveTopic}>
              <div className="modal-body">
                <div>
                  <label>Parent Module</label>
                  <select value={topicModuleId} onChange={e => setTopicModuleId(e.target.value)} required>
                    {curriculum.map(m => <option key={m.id} value={m.id}>[{m.level.toUpperCase()}] {m.name}</option>)}
                  </select>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'14px'}}>
                  <div>
                    <label>Topic Title</label>
                    <input type="text" required value={topicTitle} onChange={e => setTopicTitle(e.target.value)} placeholder="e.g. Django Middleware Deep Dive" />
                  </div>
                  <div>
                    <label>Slug ID</label>
                    <input type="text" required value={topicSlug} onChange={e => setTopicSlug(e.target.value)} placeholder="e.g. middleware" style={{fontFamily:'IBM Plex Mono'}} />
                  </div>
                </div>
                <div>
                  <label>Explanation Paragraphs (separate with double Enter):</label>
                  <textarea rows={6} value={topicExplainText} onChange={e => setTopicExplainText(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setTopicModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={savingCrud}>{savingCrud ? 'Saving…' : 'Save Topic'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Challenge Create/Edit */}
      {problemModalOpen && (
        <div className="modal-overlay" onClick={() => setProblemModalOpen(false)}>
          <div className="modal-content" style={{maxWidth:'640px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProblem ? 'Edit Practice Challenge' : 'Create Practice Challenge'}</h3>
              <button className="btn-secondary" onClick={() => setProblemModalOpen(false)}>X</button>
            </div>
            <form onSubmit={handleSaveProblem}>
              <div className="modal-body">
                <div>
                  <label>Select Topic</label>
                  <select value={problemTopicId} onChange={e => setProblemTopicId(e.target.value)} required>
                    {curriculum.flatMap(m => (m.topics || []).map(t => <option key={t.id} value={t.id}>{m.name} → {t.title}</option>))}
                  </select>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'14px'}}>
                  <div>
                    <label>Challenge Title</label>
                    <input type="text" required value={problemTitle} onChange={e => setProblemTitle(e.target.value)} placeholder="e.g. Build an Author Query Filter" />
                  </div>
                  <div>
                    <label>Marks / Points</label>
                    <input type="number" min="1" required value={problemPoints} onChange={e => setProblemPoints(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label>Task Instructions & Requirements</label>
                  <textarea rows={4} required value={problemDesc} onChange={e => setProblemDesc(e.target.value)} placeholder="Describe what the student must implement..." />
                </div>
                <div>
                  <label>Hint / Expected Output (Optional)</label>
                  <input type="text" value={problemHint} onChange={e => setProblemHint(e.target.value)} placeholder="e.g. Check python manage.py migrate output" />
                </div>
                <div>
                  <label style={{color:'var(--blue-primary)',fontWeight:700}}>Automated Evaluation Test Criteria</label>
                  <input type="text" value={problemTestCriteria} onChange={e => setProblemTestCriteria(e.target.value)} placeholder="e.g. Must define a view function or DRF serializer..." />
                </div>
                <div>
                  <label style={{color:'var(--blue-primary)',fontWeight:700}}>Required Django Code Keywords (comma-separated)</label>
                  <input type="text" value={problemKeywords} onChange={e => setProblemKeywords(e.target.value)} placeholder="e.g. def, HttpResponse, models.Model" style={{fontFamily:'IBM Plex Mono',fontSize:'12.5px'}} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setProblemModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={savingCrud}>{savingCrud ? 'Saving…' : 'Save Challenge'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Student Enrollment */}
      {studentModalOpen && (
        <div className="modal-overlay" onClick={() => setStudentModalOpen(false)}>
          <div className="modal-content" style={{maxWidth:'480px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Enroll New Student</h3>
              <button className="btn-secondary" onClick={() => setStudentModalOpen(false)}>X</button>
            </div>
            <form onSubmit={handleCreateStudent}>
              <div className="modal-body">
                <div><label>Student Username</label><input type="text" required value={newStudentUsername} onChange={e => setNewStudentUsername(e.target.value)} placeholder="e.g. karthik_dev" /></div>
                <div><label>Email Address</label><input type="email" required value={newStudentEmail} onChange={e => setNewStudentEmail(e.target.value)} placeholder="karthik@example.com" /></div>
                <div><label>Temporary Password</label><input type="text" required value={newStudentPassword} onChange={e => setNewStudentPassword(e.target.value)} style={{fontFamily:'IBM Plex Mono'}} /></div>
                <div><label>Assigned Batch</label><input type="text" value={newStudentBatch} onChange={e => setNewStudentBatch(e.target.value)} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setStudentModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={savingCrud}>{savingCrud ? 'Enrolling…' : 'Enroll Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Configure Access & Timeline */}
      {editingAccessProblem && (
        <div className="modal-overlay" onClick={() => setEditingAccessProblem(null)}>
          <div className="modal-content" style={{maxWidth:'540px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Configure Access & Timeline</h3>
              <button className="btn-secondary" onClick={() => setEditingAccessProblem(null)}>X</button>
            </div>
            <div className="modal-body">
              <div style={{marginBottom:'18px'}}>
                <strong style={{fontSize:'15px'}}>{editingAccessProblem.title}</strong>
                <p style={{fontSize:'13px',color:'var(--text-secondary)',marginTop:'4px'}}>{editingAccessProblem.description}</p>
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:'var(--gray-100)',borderRadius:'var(--radius)',marginBottom:'18px'}}>
                <div>
                  <div style={{fontWeight:600,fontSize:'13.5px'}}>Unlock for Students</div>
                  <div style={{fontSize:'12px',color:'var(--text-secondary)'}}>Students can see & attempt this when unlocked.</div>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={isUnlockedInput} onChange={e => setIsUnlockedInput(e.target.checked)} />
                  <span className="slider" />
                </label>
              </div>
              <div style={{marginBottom:'18px'}}>
                <label style={{fontSize:'13px',fontWeight:600,display:'block',marginBottom:'8px'}}>Submission Deadline:</label>
                <input type="datetime-local" value={deadlineInput} onChange={e => setDeadlineInput(e.target.value)} style={{width:'100%',padding:'10px 14px',border:'1px solid var(--border-medium)',borderRadius:'var(--radius-sm)',fontFamily:'IBM Plex Mono',marginBottom:'10px'}} />
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  {[['+ 2h',2],['+ 12h',12],['+ 24h',24],['+ 3d',72]].map(([l,h]) => (
                    <button key={h} type="button" className="btn-secondary" style={{fontSize:'11px',padding:'4px 8px'}} onClick={() => setPresetDeadline(h)}>{l}</button>
                  ))}
                  <button type="button" className="btn-secondary" style={{fontSize:'11px',padding:'4px 8px'}} onClick={() => setDeadlineInput('')}>No Expiry</button>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',color:'var(--text-secondary)'}}>
                <input type="checkbox" id="allowLate" checked={allowLateInput} onChange={e => setAllowLateInput(e.target.checked)} />
                <label htmlFor="allowLate">Allow late submissions after deadline (flagged as late)</label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setEditingAccessProblem(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveProblemAccess} disabled={savingAccess}>{savingAccess ? 'Saving…' : 'Save Access Rules'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Submission Inspection & Grade Override */}
      {selectedSub && (
        <div className="modal-overlay" onClick={() => setSelectedSub(null)}>
          <div className="modal-content" style={{maxWidth:'880px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="badge-role role-student" style={{marginRight:'8px'}}>{selectedSub.student_username}</span>
                <strong style={{fontSize:'16px',color:'var(--text-primary)'}}>⚡ Marks Observer: {selectedSub.problem_title}</strong>
              </div>
              <button className="btn-secondary" onClick={() => setSelectedSub(null)}>X</button>
            </div>
            <div className="modal-body">
              <div style={{display:'flex',justifyContent:'space-between',background:'var(--gray-100)',padding:'12px 16px',borderRadius:'var(--radius)',marginBottom:'16px',fontSize:'13px',border:'1px solid var(--border-subtle)'}}>
                <div><strong>Topic:</strong> {selectedSub.topic_title}</div>
                <div><strong>Submitted:</strong> {new Date(selectedSub.submitted_at).toLocaleString()}</div>
                <div>{selectedSub.is_late ? <span style={{color:'var(--coral)'}}>⚠ Late</span> : <span style={{color:'#16A34A'}}> On Time</span>}</div>
              </div>
              <div style={{background:selectedSub.status==='PASSED'?'rgba(22,163,74,0.08)':'rgba(217,119,6,0.08)',border:`1.5px solid ${selectedSub.status==='PASSED'?'rgba(22,163,74,0.3)':'rgba(217,119,6,0.3)'}`,padding:'14px 18px',borderRadius:'var(--radius)',marginBottom:'16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <strong style={{fontSize:'13.5px',color:'var(--text-primary)'}}>Eval Result: {selectedSub.status}</strong>
                  <div style={{fontSize:'12px',color:'var(--text-secondary)'}}>Auto-evaluated from code structure & output criteria</div>
                </div>
                <div style={{fontFamily:'IBM Plex Mono',fontWeight:800,fontSize:'16px',color:selectedSub.status==='PASSED'?'#16A34A':'#D97706'}}>{selectedSub.score??selectedSub.max_points} / {selectedSub.max_points} Marks</div>
              </div>
              <div style={{marginBottom:'16px'}}>
                <label style={{fontSize:'13px',fontWeight:700,color:'var(--text-primary)',display:'block',marginBottom:'6px'}}>Student Submitted Solution:</label>
                <div style={{background:'var(--gray-900)',borderRadius:'var(--radius)',padding:'16px',overflow:'auto',maxHeight:'260px'}}>
                  <pre style={{fontFamily:'IBM Plex Mono',fontSize:'12.5px',color:'#e2e8f0',margin:0,whiteSpace:'pre-wrap'}}><code>{selectedSub.submitted_code}</code></pre>
                </div>
              </div>
              {selectedSub.notes && (
                <div style={{marginBottom:'18px',background:'var(--gray-100)',border:'1px solid var(--border-subtle)',padding:'12px 14px',borderRadius:'var(--radius-sm)',fontSize:'13px'}}>
                  <strong style={{color:'var(--text-primary)'}}>Student Output / Notes:</strong>
                  <div style={{marginTop:'4px',color:'var(--text-secondary)',fontFamily:'IBM Plex Mono',fontSize:'12px'}}>{selectedSub.notes}</div>
                </div>
              )}
              <div style={{borderTop:'1px solid var(--border-subtle)',paddingTop:'16px'}}>
                <h4 style={{fontSize:'14px',color:'var(--text-primary)',marginBottom:'12px'}}>Instructor Override:</h4>
                <div style={{display:'flex',gap:'16px',marginBottom:'14px'}}>
                  <div style={{flex:1}}>
                    <label style={{fontSize:'12.5px',color:'var(--text-secondary)',display:'block',marginBottom:'4px'}}>Status Override:</label>
                    <select value={reviewStatus} onChange={e => setReviewStatus(e.target.value)} style={{width:'100%',padding:'9px 12px',border:'1px solid var(--border-medium)',borderRadius:'var(--radius-sm)'}}>
                      <option value="PASSED">Passed / Approved</option>
                      <option value="REVISION_REQUESTED">Revision Needed</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                  <div style={{width:'130px'}}>
                    <label style={{fontSize:'12.5px',color:'var(--text-secondary)',display:'block',marginBottom:'4px'}}>Score (/{selectedSub.max_points}):</label>
                    <input type="number" min="0" max={selectedSub.max_points} value={reviewScore} onChange={e => setReviewScore(e.target.value)} style={{width:'100%',padding:'9px 12px',border:'1px solid var(--border-medium)',borderRadius:'var(--radius-sm)'}} />
                  </div>
                </div>
                <div>
                  <label style={{fontSize:'12.5px',color:'var(--text-secondary)',display:'block',marginBottom:'4px'}}>Instructor Feedback:</label>
                  <textarea rows={3} value={reviewFeedback} onChange={e => setReviewFeedback(e.target.value)} placeholder="Auto-evaluated cleanly. Add custom mentor notes..." style={{width:'100%',padding:'10px 12px',border:'1px solid var(--border-medium)',borderRadius:'var(--radius-sm)',fontSize:'13px'}} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedSub(null)}>Close</button>
              <button className="btn-primary" onClick={handleSubmitReview} disabled={submittingReview}>{submittingReview ? 'Updating…' : 'Save Feedback / Override'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT SUBJECT */}
      {subjectModalOpen && (
        <div className="modal-overlay" onClick={() => setSubjectModalOpen(false)}>
          <div className="modal-content" style={{maxWidth:'540px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSubject ? 'Edit Subject Track' : 'Add New Subject Track'}</h3>
              <button className="btn-secondary" onClick={() => setSubjectModalOpen(false)}>X</button>
            </div>
            <form onSubmit={handleSaveSubject}>
              <div className="modal-body">
                <div>
                  <label>Subject Name *</label>
                  <input type="text" required placeholder="e.g. Next.js & React Full Stack" value={subName} onChange={e => { setSubName(e.target.value); if (!editingSubject) setSubSlug(e.target.value.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')); }} />
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                  <div><label>URL Slug *</label><input type="text" required placeholder="e.g. nextjs-fullstack" value={subSlug} onChange={e => setSubSlug(e.target.value)} /></div>
                  <div>
                    <label>Level *</label>
                    <select value={subLevel} onChange={e => setSubLevel(e.target.value)}>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Beginner to Advanced">Beginner to Advanced</option>
                    </select>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                  <div><label>Duration</label><input type="text" placeholder="e.g. 8 Weeks" value={subDuration} onChange={e => setSubDuration(e.target.value)} /></div>
                  <div><label>Lead Instructor</label><input type="text" placeholder="e.g. Prof. Deepan" value={subInstructor} onChange={e => setSubInstructor(e.target.value)} /></div>
                </div>
                <div><label>Short Summary</label><input type="text" placeholder="Brief 1-line punchline…" value={subShortDesc} onChange={e => setSubShortDesc(e.target.value)} /></div>
                <div><label>Full Description</label><textarea rows={3} placeholder="Describe what students will master…" value={subDesc} onChange={e => setSubDesc(e.target.value)} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setSubjectModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={savingCrud}>{savingCrud ? 'Saving…' : editingSubject ? 'Update Subject' : 'Create Subject Track'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE FACULTY ACCOUNT */}
      {facultyModalOpen && (
        <div className="modal-overlay" onClick={() => setFacultyModalOpen(false)}>
          <div className="modal-content" style={{maxWidth:'480px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Provision Staff / Instructor Account</h3>
              <button className="btn-secondary" onClick={() => setFacultyModalOpen(false)}>X</button>
            </div>
            <form onSubmit={handleSaveFaculty}>
              <div className="modal-body">
                <div><label>Staff Full Name *</label><input type="text" required placeholder="e.g. Dr. K. Vignesh" value={newStaffFullName} onChange={e => setNewStaffFullName(e.target.value)} /></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                  <div><label>Staff Username *</label><input type="text" required placeholder="instructor_vignesh" value={newStaffUsername} onChange={e => setNewStaffUsername(e.target.value)} /></div>
                  <div><label>Official Email *</label><input type="email" required placeholder="vignesh@skillstack.org" value={newStaffEmail} onChange={e => setNewStaffEmail(e.target.value)} /></div>
                </div>
                <div>
                  <label>Assign Subject Track</label>
                  <select value={newStaffAssignedSubject} onChange={e => setNewStaffAssignedSubject(e.target.value)}>
                    <option value="">All Tracks / Lead Mentor</option>
                    {subjectsList.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                  </select>
                </div>
                <div><label>Initial Password *</label><input type="password" required value={newStaffPassword} onChange={e => setNewStaffPassword(e.target.value)} /></div>
                <div style={{padding:'10px 12px',borderRadius:'var(--radius-sm)',background:'var(--blue-soft)',border:'1px solid var(--blue-border)',fontSize:'12px',color:'var(--text-secondary)'}}>
                  ℹ️ The instructor can sign in from the Staff Portal using these credentials.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setFacultyModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={savingCrud}>{savingCrud ? 'Creating…' : 'Provision Staff Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

