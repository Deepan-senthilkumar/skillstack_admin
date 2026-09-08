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

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 24px 80px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img
            src="/skillstack.png"
            alt="SkillStack Logo"
            style={{
              height: '46px',
              width: 'auto',
              borderRadius: '8px',
              filter: 'drop-shadow(0 2px 8px rgba(99, 102, 241, 0.35))'
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--amber)', fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
              <Shield size={16} /> SkillStack Admin Command Center
            </div>
            <h1 style={{ fontSize: '28px' }}>Course Management & CRUD Studio</h1>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-primary"
            onClick={openCreateModule}
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            <FolderPlus size={15} /> Add Module
          </button>
          <button
            className="btn-primary"
            onClick={() => openCreateTopic()}
            style={{ fontSize: '13px', padding: '8px 16px', background: 'var(--amber)', color: '#000' }}
          >
            <BookPlus size={15} /> Add Topic
          </button>
          <button
            className="btn-secondary"
            onClick={loadData}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin-slow' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="staff-stats-grid">
        <div className="stat-card">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Enrolled Students</div>
          <div className="stat-val" style={{ color: 'var(--blue)' }}>{analytics?.total_students || students.length || 0}</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Syllabus Challenges</div>
          <div className="stat-val">{analytics?.total_problems || 48}</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Unlocked Challenges</div>
          <div className="stat-val" style={{ color: 'var(--accent)' }}>{analytics?.unlocked_problems || 0}</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Pending Review</div>
          <div className="stat-val" style={{ color: 'var(--amber)' }}>{analytics?.pending_review || 0}</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Passed Submissions</div>
          <div className="stat-val" style={{ color: '#5CC194' }}>{analytics?.passed_count || 0}</div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '26px',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('subjects')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'subjects' ? '2.5px solid var(--blue-primary)' : '2.5px solid transparent',
            color: activeTab === 'subjects' ? 'var(--blue-primary)' : 'var(--text-secondary)',
            fontWeight: 800,
            padding: '12px 6px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <BookOpen size={16} /> 📚 Subject Tracks ({subjectsList.length})
        </button>

        <button
          onClick={() => setActiveTab('faculty')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'faculty' ? '2.5px solid var(--blue-primary)' : '2.5px solid transparent',
            color: activeTab === 'faculty' ? 'var(--blue-primary)' : 'var(--text-secondary)',
            fontWeight: 800,
            padding: '12px 6px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Shield size={16} /> 👨‍🏫 Faculty Team ({faculty.length}/10 Staff)
        </button>

        <button
          onClick={() => setActiveTab('access')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'access' ? '2.5px solid var(--blue-primary)' : '2.5px solid transparent',
            color: activeTab === 'access' ? 'var(--blue-primary)' : 'var(--text-secondary)',
            fontWeight: 800,
            padding: '12px 6px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Unlock size={16} /> Syllabus & Challenge Controls
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'submissions' ? '2.5px solid var(--blue-primary)' : '2.5px solid transparent',
            color: activeTab === 'submissions' ? 'var(--blue-primary)' : 'var(--text-secondary)',
            fontWeight: 800,
            padding: '12px 6px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={16} color="var(--blue-vibrant)" /> ⚡ Auto-Graded Submissions
          {analytics?.pending_review > 0 && (
            <span style={{
              background: 'var(--blue-soft)',
              color: 'var(--blue-primary)',
              border: '1px solid var(--blue-border)',
              padding: '1px 7px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 800
            }}>
              {analytics.pending_review} New
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'leaderboard' ? '2.5px solid var(--blue-primary)' : '2.5px solid transparent',
            color: activeTab === 'leaderboard' ? 'var(--blue-primary)' : 'var(--text-secondary)',
            fontWeight: 800,
            padding: '12px 6px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Trophy size={16} color="var(--blue-vibrant)" /> Marks Observer & Leaderboard
        </button>

        <button
          onClick={() => setActiveTab('students')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'students' ? '2.5px solid var(--blue-primary)' : '2.5px solid transparent',
            color: activeTab === 'students' ? 'var(--blue-primary)' : 'var(--text-secondary)',
            fontWeight: 800,
            padding: '12px 6px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Users size={16} /> Student Roster ({students.length})
        </button>
      </div>

      {/* TAB: SUBJECT MANAGEMENT */}
      {activeTab === 'subjects' && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            background: '#FFFFFF',
            padding: '20px 24px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                Curriculum Subjects & Specialized Tracks
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
                Manage all academic tracks. Django is pre-loaded with complete syllabus, architecture models, and practice labs.
              </p>
            </div>

            <button
              className="btn-primary"
              onClick={openCreateSubject}
              style={{ padding: '10px 18px', fontSize: '13px' }}
            >
              <Plus size={15} /> Add New Subject
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px'
          }}>
            {subjectsList.map(sub => (
              <div
                key={sub.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-subtle)',
                  padding: '24px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span className="subject-level-badge">{sub.level || 'All Levels'}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{sub.duration || '8 Weeks'}</span>
                  </div>

                  <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {sub.name}
                  </h3>

                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
                    {sub.short_description || sub.description?.slice(0, 120) + '...'}
                  </p>

                  <div style={{
                    fontSize: '12px',
                    color: 'var(--blue-primary)',
                    background: 'var(--blue-soft)',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600
                  }}>
                    Instructor: {sub.instructor_name || 'Prof. Deepan & Staff Team'}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '14px'
                }}>
                  <button
                    className="btn-secondary"
                    onClick={() => openEditSubject(sub)}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    <Edit size={13} /> Edit Subject
                  </button>

                  <button
                    className="btn-secondary"
                    onClick={() => handleDeleteSubject(sub)}
                    style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--coral)' }}
                    title="Delete Subject"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: FACULTY TEAM (10 STAFF MEMBERS) */}
      {activeTab === 'faculty' && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            background: '#FFFFFF',
            padding: '20px 24px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                Academy Faculty Team (10 Staff Instructors)
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
                Domain instructors manage syllabus tracks, observe student code submissions, and mentor batches.
              </p>
            </div>

            <button
              className="btn-primary"
              onClick={openCreateFaculty}
              style={{ padding: '10px 18px', fontSize: '13px' }}
            >
              <UserPlus size={15} /> Add Staff Account
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '18px'
          }}>
            {faculty.map(fac => (
              <div
                key={fac.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  padding: '20px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'var(--blue-gradient)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '15px',
                    flexShrink: 0,
                    boxShadow: '0 4px 10px var(--blue-glow)'
                  }}>
                    {(fac.full_name || fac.username).slice(0, 2).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>
                        {fac.full_name || fac.username}
                      </h4>
                      <span className={`badge-role ${fac.is_admin_role || fac.is_superuser ? 'role-staff' : 'role-student'}`} style={{ fontSize: '10px' }}>
                        {fac.is_admin_role || fac.is_superuser ? 'Super Admin' : 'Staff Faculty'}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      @{fac.username} &bull; {fac.email}
                    </div>

                    <div style={{
                      marginTop: '10px',
                      fontSize: '12px',
                      color: 'var(--blue-primary)',
                      background: 'var(--blue-soft)',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600
                    }}>
                      Track: {fac.assigned_subject_name || 'All Tracks / Lead Mentor'}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '10px',
                  fontSize: '11.5px',
                  color: 'var(--text-tertiary)'
                }}>
                  <span>Joined: {new Date(fac.date_joined).toLocaleDateString()}</span>
                  {!fac.is_superuser && (
                    <button
                      onClick={() => handleDeleteFaculty(fac)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--coral)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '12px'
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Access & Syllabus CRUD */}
      {activeTab === 'access' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {curriculum.map(module => (
            <div
              key={module.id}
              style={{
                background: 'var(--bg-surface)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-glass)'
              }}
            >
              {/* Module Header Bar */}
              <div style={{
                padding: '18px 24px',
                background: 'var(--bg-surface-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-medium)'
              }}>
                <div>
                  <span style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    fontWeight: 800,
                    color: module.level === 'beginner' ? '#5CC194' : module.level === 'intermediate' ? 'var(--amber)' : 'var(--coral)',
                    marginRight: '10px'
                  }}>
                    [{module.level}]
                  </span>
                  <strong style={{ fontSize: '17px' }}>{module.name}</strong>
                  <span style={{ marginLeft: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    ({module.topics?.length || 0} topics)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '5px 12px' }}
                    onClick={() => handleBulkUnlock(module.id)}
                  >
                    ⚡ Unlock All
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '5px 10px' }}
                    onClick={() => openCreateTopic(module.id)}
                    title="Add Topic to Module"
                  >
                    <Plus size={13} /> Add Topic
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '5px 10px' }}
                    onClick={() => openEditModule(module)}
                    title="Edit Module"
                  >
                    <Edit size={13} />
                  </button>
                  <button
                    className="btn-danger"
                    style={{ padding: '5px 9px' }}
                    onClick={() => handleDeleteModule(module)}
                    title="Delete Module"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Topics and Problems within Module */}
              <div style={{ padding: '16px 20px' }}>
                {(module.topics || []).map(topic => (
                  <div
                    key={topic.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      marginBottom: '16px',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Topic Sub-header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 18px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderBottom: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--amber)', fontFamily: 'IBM Plex Mono' }}>
                          Topic #{topic.order}:
                        </span>
                        <strong style={{ fontSize: '14.5px' }}>{topic.title}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'IBM Plex Mono' }}>
                          ({topic.topic_id})
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '11px', padding: '4px 9px' }}
                          onClick={() => openCreateProblem(topic.id)}
                        >
                          <Plus size={12} /> Add Challenge
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                          onClick={() => openEditTopic(topic)}
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          className="btn-danger"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                          onClick={() => handleDeleteTopic(topic)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Challenges Table */}
                    <table className="staff-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40%' }}>Challenge / Task</th>
                          <th style={{ width: '15%' }}>Access</th>
                          <th style={{ width: '25%' }}>Deadline</th>
                          <th style={{ width: '20%', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!topic.problems || topic.problems.length === 0) ? (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '16px' }}>
                              No challenges for this topic yet. Click "Add Challenge" to create one.
                            </td>
                          </tr>
                        ) : (
                          topic.problems.map(problem => {
                            const access = problem.access_control || {};
                            const isUnlocked = access.is_unlocked;
                            const isExpired = access.is_expired;

                            return (
                              <tr key={problem.id}>
                                <td>
                                  <strong style={{ fontSize: '13.5px', display: 'block' }}>{problem.title}</strong>
                                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    {problem.description?.slice(0, 65)}...
                                  </span>
                                </td>
                                <td>
                                  {isUnlocked ? (
                                    <span className="lab-status-badge status-active">
                                      <Unlock size={11} /> Open
                                    </span>
                                  ) : (
                                    <span className="lab-status-badge status-locked">
                                      <Lock size={11} /> Locked
                                    </span>
                                  )}
                                </td>
                                <td>
                                  {access.deadline ? (
                                    <div>
                                      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '12px', color: isExpired ? 'var(--coral)' : 'var(--amber)' }}>
                                        {new Date(access.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                      </span>
                                      {isExpired && <span style={{ display: 'block', fontSize: '10.5px', color: 'var(--coral)' }}>Expired</span>}
                                    </div>
                                  ) : (
                                    <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>No deadline</span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                                    <button
                                      className="btn-secondary"
                                      style={{ fontSize: '11px', padding: '4px 8px' }}
                                      onClick={() => handleOpenAccessModal(problem)}
                                      title="Set Access & Deadline"
                                    >
                                      Timeline
                                    </button>
                                    <button
                                      className="btn-secondary"
                                      style={{ fontSize: '11px', padding: '4px 7px' }}
                                      onClick={() => openEditProblem(problem)}
                                      title="Edit Challenge"
                                    >
                                      <Edit size={12} />
                                    </button>
                                    <button
                                      className="btn-danger"
                                      style={{ fontSize: '11px', padding: '4px 7px' }}
                                      onClick={() => handleDeleteProblem(problem)}
                                      title="Delete Challenge"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: Submissions Queue */}
      {activeTab === 'submissions' && (
        <div style={{
          background: 'var(--bg-surface)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-glass)'
        }}>
          {submissions.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No student submissions yet.
            </div>
          ) : (
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Challenge</th>
                  <th>Topic / Module</th>
                  <th>Submitted At</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => (
                  <tr key={sub.id}>
                    <td>
                      <strong>{sub.student_username}</strong>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)' }}>{sub.student_batch || 'Default Batch'}</span>
                    </td>
                    <td>{sub.problem_title}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{sub.topic_title}</td>
                    <td style={{ fontFamily: 'IBM Plex Mono', fontSize: '12px' }}>
                      {new Date(sub.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      {sub.is_late && <span style={{ color: 'var(--coral)', display: 'block', fontSize: '10.5px' }}>Late Submission</span>}
                    </td>
                    <td>
                      {sub.status === 'PASSED' && <span className="lab-status-badge status-passed">Passed</span>}
                      {sub.status === 'SUBMITTED' && <span className="lab-status-badge status-submitted">Pending Review</span>}
                      {sub.status === 'REVISION_REQUESTED' && <span className="lab-status-badge status-revision">Revision Needed</span>}
                      {sub.status === 'REJECTED' && <span className="lab-status-badge status-expired">Rejected</span>}
                    </td>
                    <td style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700 }}>
                      {sub.score !== null ? `${sub.score}/${sub.max_points}` : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-primary"
                        style={{ padding: '5px 12px', fontSize: '12px' }}
                        onClick={() => handleSelectSubmission(sub)}
                      >
                        Grade / Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 3: Student Roster */}
      {activeTab === 'students' && (
        <div style={{
          background: 'var(--bg-surface)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-glass)'
        }}>
          <div style={{
            padding: '16px 20px',
            background: 'var(--bg-surface-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-medium)'
          }}>
            <h3 style={{ fontSize: '16px' }}>Enrolled Student Roster</h3>
            <button
              className="btn-primary"
              style={{ fontSize: '12.5px', padding: '6px 14px' }}
              onClick={() => setStudentModalOpen(true)}
            >
              <UserPlus size={14} /> Enroll New Student
            </button>
          </div>

          <table className="staff-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Batch</th>
                <th>Role</th>
                <th>Joined Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(std => (
                <tr key={std.id}>
                  <td>
                    <strong>{std.username}</strong>
                  </td>
                  <td>{std.email || '—'}</td>
                  <td>{std.batch_name}</td>
                  <td>
                    <span className="badge-role role-student">{std.role}</span>
                  </td>
                  <td style={{ fontFamily: 'IBM Plex Mono', fontSize: '12px' }}>
                    {new Date(std.date_joined).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn-danger"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={() => handleDeleteStudent(std)}
                      title="Remove Student"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: Student Marks Observer & Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div style={{
          background: 'var(--bg-surface)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-glass)'
        }}>
          <div style={{
            padding: '20px 24px',
            background: 'var(--bg-surface-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-medium)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--blue-vibrant)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px' }}>
                <Trophy size={15} /> Automated Grade Intelligence & Student Rankings
              </div>
              <h3 style={{ fontSize: '18px', color: 'var(--text-primary)' }}>Student Marks Observer & Leaderboard</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                All marks are computed automatically from code structure & terminal output verification.
              </p>
            </div>

            <button
              className="btn-primary"
              style={{ fontSize: '12.5px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={handleExportMarksCSV}
            >
              <Download size={14} /> Export Marks (CSV)
            </button>
          </div>

          {studentPerformance.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No students enrolled yet.
            </div>
          ) : (
            <table className="staff-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Rank</th>
                  <th>Student</th>
                  <th>Batch / Classroom</th>
                  <th>Challenges Passed</th>
                  <th>Total Submissions</th>
                  <th>Auto-Graded Marks</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {studentPerformance.map((sp, idx) => (
                  <tr key={sp.id}>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        fontWeight: 800,
                        fontSize: '12px',
                        background: idx === 0 ? 'var(--amber-soft)' : idx === 1 ? 'var(--blue-soft)' : 'var(--bg-surface-elevated)',
                        color: idx === 0 ? 'var(--amber)' : idx === 1 ? 'var(--blue-primary)' : 'var(--text-secondary)',
                        border: idx === 0 ? '1px solid var(--amber)' : '1px solid var(--border-subtle)'
                      }}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td>
                      <strong>{sp.username}</strong>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)' }}>{sp.email || 'No email provided'}</span>
                    </td>
                    <td>{sp.batch_name || 'Default Batch'}</td>
                    <td>
                      <span style={{ color: sp.passedCount > 0 ? '#16A34A' : 'var(--text-tertiary)', fontWeight: 700 }}>
                        {sp.passedCount} Labs Passed
                      </span>
                    </td>
                    <td style={{ fontFamily: 'IBM Plex Mono' }}>{sp.totalSubmissions} Total</td>
                    <td>
                      <span style={{
                        fontFamily: 'IBM Plex Mono',
                        fontSize: '13.5px',
                        fontWeight: 800,
                        color: 'var(--blue-primary)',
                        background: 'var(--blue-soft)',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--blue-border)'
                      }}>
                        {sp.totalPoints} Marks
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-secondary"
                        style={{ fontSize: '11px', padding: '5px 10px', color: 'var(--blue-primary)', borderColor: 'var(--blue-border)', background: 'var(--blue-soft)' }}
                        onClick={() => {
                          setActiveTab('submissions');
                        }}
                      >
                        <Eye size={12} /> Observe History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MODAL 1: Module Create/Edit */}
      {moduleModalOpen && (
        <div className="modal-overlay" onClick={() => setModuleModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingModule ? 'Edit Module' : 'Create New Module'}</h3>
              <button className="btn-secondary" onClick={() => setModuleModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveModule}>
              <div className="modal-body">
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Module Name
                  </label>
                  <input
                    type="text"
                    required
                    value={moduleName}
                    onChange={(e) => setModuleName(e.target.value)}
                    placeholder="e.g. Django Async & Channels"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-medium)',
                      color: '#FFF',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Level Tier
                    </label>
                    <select
                      value={moduleLevel}
                      onChange={(e) => setModuleLevel(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-medium)',
                        color: '#FFF',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Order Position
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={moduleOrder}
                      onChange={(e) => setModuleOrder(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-medium)',
                        color: '#FFF',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModuleModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={savingCrud}>
                  {savingCrud ? 'Saving...' : 'Save Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Topic Create/Edit */}
      {topicModalOpen && (
        <div className="modal-overlay" onClick={() => setTopicModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTopic ? 'Edit Topic' : 'Add New Topic'}</h3>
              <button className="btn-secondary" onClick={() => setTopicModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveTopic}>
              <div className="modal-body">
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Parent Module
                  </label>
                  <select
                    value={topicModuleId}
                    onChange={(e) => setTopicModuleId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-medium)',
                      color: '#FFF',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    {curriculum.map(m => (
                      <option key={m.id} value={m.id}>
                        [{m.level.toUpperCase()}] {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Topic Title
                    </label>
                    <input
                      type="text"
                      required
                      value={topicTitle}
                      onChange={(e) => setTopicTitle(e.target.value)}
                      placeholder="e.g. Django Middleware Deep Dive"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-medium)',
                        color: '#FFF',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Slug ID
                    </label>
                    <input
                      type="text"
                      required
                      value={topicSlug}
                      onChange={(e) => setTopicSlug(e.target.value)}
                      placeholder="e.g. middleware"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-medium)',
                        color: '#FFF',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'IBM Plex Mono'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Tamil-English Guide Paragraphs (Separate paragraphs with double enter):
                  </label>
                  <textarea
                    rows={6}
                    value={topicExplainText}
                    onChange={(e) => setTopicExplainText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-medium)',
                      color: '#FFF',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setTopicModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={savingCrud}>
                  {savingCrud ? 'Saving...' : 'Save Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Challenge / Problem Create/Edit */}
      {problemModalOpen && (
        <div className="modal-overlay" onClick={() => setProblemModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProblem ? 'Edit Practice Challenge' : 'Create Practice Challenge'}</h3>
              <button className="btn-secondary" onClick={() => setProblemModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveProblem}>
              <div className="modal-body">
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Select Topic
                  </label>
                  <select
                    value={problemTopicId}
                    onChange={(e) => setProblemTopicId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-medium)',
                      color: '#FFF',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    {curriculum.flatMap(m => (m.topics || []).map(t => (
                      <option key={t.id} value={t.id}>
                        {m.name} &rarr; {t.title}
                      </option>
                    )))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Challenge Title
                    </label>
                    <input
                      type="text"
                      required
                      value={problemTitle}
                      onChange={(e) => setProblemTitle(e.target.value)}
                      placeholder="e.g. Build an Author Query Filter"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-medium)',
                        color: '#FFF',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Marks / Points
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={problemPoints}
                      onChange={(e) => setProblemPoints(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-medium)',
                        color: '#FFF',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Task Instructions & Requirements
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={problemDesc}
                    onChange={(e) => setProblemDesc(e.target.value)}
                    placeholder="Describe what the student must implement or terminal commands to run..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-medium)',
                      color: '#FFF',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Hint / Expected Output (Optional)
                  </label>
                  <input
                    type="text"
                    value={problemHint}
                    onChange={(e) => setProblemHint(e.target.value)}
                    placeholder="e.g. Check python manage.py migrate output"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12.5px', color: 'var(--blue-primary)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    ⚡ Automated Evaluation Test Criteria
                  </label>
                  <input
                    type="text"
                    value={problemTestCriteria}
                    onChange={(e) => setProblemTestCriteria(e.target.value)}
                    placeholder="e.g. Must define a view function or DRF serializer returning valid responses"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12.5px', color: 'var(--blue-primary)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    🔑 Required Django Code Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={problemKeywords}
                    onChange={(e) => setProblemKeywords(e.target.value)}
                    placeholder="e.g. def, HttpResponse, models.Model, Serializer"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'IBM Plex Mono',
                      fontSize: '12.5px'
                    }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setProblemModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={savingCrud}>
                  {savingCrud ? 'Saving...' : 'Save Challenge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Student Enrollment */}
      {studentModalOpen && (
        <div className="modal-overlay" onClick={() => setStudentModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Enroll New Student</h3>
              <button className="btn-secondary" onClick={() => setStudentModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateStudent}>
              <div className="modal-body">
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Student Username
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudentUsername}
                    onChange={(e) => setNewStudentUsername(e.target.value)}
                    placeholder="e.g. karthik_dev"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-medium)',
                      color: '#FFF',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                    placeholder="karthik@example.com"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-medium)',
                      color: '#FFF',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Temporary Password
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudentPassword}
                    onChange={(e) => setNewStudentPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-medium)',
                      color: '#FFF',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'IBM Plex Mono'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Assigned Batch
                  </label>
                  <input
                    type="text"
                    value={newStudentBatch}
                    onChange={(e) => setNewStudentBatch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-medium)',
                      color: '#FFF',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setStudentModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={savingCrud}>
                  {savingCrud ? 'Enrolling...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Configure Access & Timeline */}
      {editingAccessProblem && (
        <div className="modal-overlay" onClick={() => setEditingAccessProblem(null)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Configure Access & Timeline</h3>
              <button className="btn-secondary" onClick={() => setEditingAccessProblem(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '18px' }}>
                <strong style={{ fontSize: '15px' }}>{editingAccessProblem.title}</strong>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {editingAccessProblem.description}
                </p>
              </div>

              {/* Unlock Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '18px'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13.5px' }}>Unlock for Students</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Students can only see and attempt this challenge when unlocked.
                  </div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={isUnlockedInput}
                    onChange={(e) => setIsUnlockedInput(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>

              {/* Deadline Setting */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Submission Deadline (Date & Time):
                </label>
                <input
                  type="datetime-local"
                  value={deadlineInput}
                  onChange={(e) => setDeadlineInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-code)',
                    border: '1px solid var(--border-medium)',
                    color: '#FFF',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'IBM Plex Mono',
                    marginBottom: '10px'
                  }}
                />

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="button" className="btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setPresetDeadline(2)}>+2 Hours</button>
                  <button type="button" className="btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setPresetDeadline(12)}>+12 Hours</button>
                  <button type="button" className="btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setPresetDeadline(24)}>+24 Hours</button>
                  <button type="button" className="btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setPresetDeadline(72)}>+3 Days</button>
                  <button type="button" className="btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setDeadlineInput('')}>No Expiry</button>
                </div>
              </div>

              {/* Allow Late Submissions Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  id="allowLate"
                  checked={allowLateInput}
                  onChange={(e) => setAllowLateInput(e.target.checked)}
                />
                <label htmlFor="allowLate">Allow late submissions after deadline passes (flagged as late)</label>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setEditingAccessProblem(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveProblemAccess} disabled={savingAccess}>
                {savingAccess ? 'Saving...' : 'Save Access Rules'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Automated Marks Observation & Inspection Modal */}
      {selectedSub && (
        <div className="modal-overlay" onClick={() => setSelectedSub(null)}>
          <div className="modal-content" style={{ maxWidth: '880px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="badge-role role-student" style={{ marginRight: '8px' }}>
                  {selectedSub.student_username}
                </span>
                <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
                  ⚡ Automated Marks Observer: {selectedSub.problem_title}
                </strong>
              </div>
              <button className="btn-secondary" onClick={() => setSelectedSub(null)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Submission Meta */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                background: 'var(--bg-surface-elevated)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                fontSize: '13px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div><strong>Topic:</strong> {selectedSub.topic_title}</div>
                <div><strong>Submitted:</strong> {new Date(selectedSub.submitted_at).toLocaleString()}</div>
                <div>{selectedSub.is_late ? <span style={{ color: 'var(--coral)' }}>⚠️ Late</span> : <span style={{ color: '#16A34A' }}>✓ On Time</span>}</div>
              </div>

              {/* Automated Evaluation Summary Banner */}
              <div style={{
                background: selectedSub.status === 'PASSED' ? 'rgba(22, 163, 74, 0.08)' : 'rgba(217, 119, 6, 0.08)',
                border: `1.5px solid ${selectedSub.status === 'PASSED' ? 'rgba(22, 163, 74, 0.3)' : 'rgba(217, 119, 6, 0.3)'}`,
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color={selectedSub.status === 'PASSED' ? '#16A34A' : '#D97706'} />
                  <div>
                    <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                      Automated Evaluation Result: {selectedSub.status}
                    </strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Evaluated automatically based on code structure, syntax & output criteria
                    </div>
                  </div>
                </div>

                <div style={{
                  fontFamily: 'IBM Plex Mono',
                  fontWeight: 800,
                  fontSize: '16px',
                  color: selectedSub.status === 'PASSED' ? '#16A34A' : '#D97706'
                }}>
                  {selectedSub.score ?? selectedSub.max_points} / {selectedSub.max_points} Marks
                </div>
              </div>

              {/* Code Viewer */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Student Submitted Solution:
                </label>
                <div className="code-container" style={{ margin: 0 }}>
                  <pre className="code-pre" style={{ maxHeight: '260px', overflowY: 'auto' }}>
                    <code>{selectedSub.submitted_code}</code>
                  </pre>
                </div>
              </div>

              {/* Notes */}
              {selectedSub.notes && (
                <div style={{ marginBottom: '18px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Student Output / Terminal Notes:</strong>
                  <div style={{ marginTop: '4px', color: 'var(--text-secondary)', fontFamily: 'IBM Plex Mono', fontSize: '12px' }}>
                    {selectedSub.notes}
                  </div>
                </div>
              )}

              {/* Optional Override Section */}
              <div style={{
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '16px',
                marginTop: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <Sparkles size={15} color="var(--blue-vibrant)" />
                  <h4 style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                    Instructor Supervisory Note & Optional Override:
                  </h4>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Status Override:
                    </label>
                    <select
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <option value="PASSED">Passed / Approved</option>
                      <option value="REVISION_REQUESTED">Revision Needed</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  <div style={{ width: '130px' }}>
                    <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Score (/{selectedSub.max_points}):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={selectedSub.max_points}
                      value={reviewScore}
                      onChange={(e) => setReviewScore(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Instructor Feedback & Observations:
                  </label>
                  <textarea
                    rows={3}
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    placeholder="Auto-evaluated cleanly. Add any custom mentor notes for the student..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedSub(null)}>
                Close (Observation Complete)
              </button>
              <button className="btn-primary" onClick={handleSubmitReview} disabled={submittingReview}>
                {submittingReview ? 'Updating...' : 'Save Feedback / Override'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT SUBJECT */}
      {subjectModalOpen && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(6px)', zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '540px', padding: '28px', background: '#FFFFFF' }}>
            <div className="modal-header" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={20} color="var(--blue-primary)" />
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>
                  {editingSubject ? 'Edit Subject Track' : 'Add New Subject Track'}
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSubjectModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSubject}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Next.js & React Full Stack"
                    value={subName}
                    onChange={(e) => {
                      setSubName(e.target.value);
                      if (!editingSubject) {
                        setSubSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. nextjs-fullstack"
                      value={subSlug}
                      onChange={(e) => setSubSlug(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Level *
                    </label>
                    <select
                      value={subLevel}
                      onChange={(e) => setSubLevel(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Beginner to Advanced">Beginner to Advanced</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Duration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 8 Weeks"
                      value={subDuration}
                      onChange={(e) => setSubDuration(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Lead Instructor Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Prof. Deepan"
                      value={subInstructor}
                      onChange={(e) => setSubInstructor(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Short Summary (Course Card)
                  </label>
                  <input
                    type="text"
                    placeholder="Brief 1-line punchline..."
                    value={subShortDesc}
                    onChange={(e) => setSubShortDesc(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Comprehensive Subject Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe what students will master in this track..."
                    value={subDesc}
                    onChange={(e) => setSubDesc(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <button type="button" className="btn-secondary" onClick={() => setSubjectModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={savingCrud}>
                  {savingCrud ? 'Saving...' : editingSubject ? 'Update Subject' : 'Create Subject Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE FACULTY ACCOUNT */}
      {facultyModalOpen && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(6px)', zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '480px', padding: '28px', background: '#FFFFFF' }}>
            <div className="modal-header" style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="var(--blue-primary)" />
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>
                  Provision Staff / Instructor Account
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setFacultyModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFaculty}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Staff Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. K. Vignesh"
                    value={newStaffFullName}
                    onChange={(e) => setNewStaffFullName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Staff Username *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. instructor_vignesh"
                      value={newStaffUsername}
                      onChange={(e) => setNewStaffUsername(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Official Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="vignesh@djangokalari.org"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Assign Subject Track to Handle
                  </label>
                  <select
                    value={newStaffAssignedSubject}
                    onChange={(e) => setNewStaffAssignedSubject(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    <option value="">All Tracks / Lead Mentor</option>
                    {subjectsList.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--blue-soft)',
                border: '1px solid var(--blue-border)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                marginBottom: '18px'
              }}>
                ℹ️ The instructor can use these credentials to sign in directly from the public website via <strong>Staff Portal</strong>.
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <button type="button" className="btn-secondary" onClick={() => setFacultyModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={savingCrud}>
                  {savingCrud ? 'Creating...' : 'Provision Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
