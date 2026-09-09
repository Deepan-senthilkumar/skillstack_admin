import { useState, useEffect } from 'react';
import {
  Code2, Plus, Edit2, Trash2, ArrowLeft, Check,
  Search, Filter, Sparkles, BookOpen, Layers, AlertCircle, FileText,
  Lock, Unlock
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import PaginationControls from './PaginationControls';
import RichContentRenderer from './RichContentRenderer';

export default function PracticeTaskManagerTab({ user }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [problems, setProblems] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [togglingId, setTogglingId] = useState(null);

  const [editingProblem, setEditingProblem] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    title: '',
    description: '',
    language: 'python',
    expected_output: '',
    expected_output_hint: '',
    starter_code: '',
    points: 10,
    order: 1,
    is_unlocked: true,
  });


  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [probsRes, subsRes, topicsRes] = await Promise.all([
        api.getProblems().catch(() => []),
        api.getSubjects().catch(() => []),
        api.getTopics().catch(() => []),
      ]);

      const safeProbs = Array.isArray(probsRes) ? probsRes : (probsRes?.results || []);
      const safeSubs = Array.isArray(subsRes) ? subsRes : (subsRes?.results || []);
      const safeTopics = Array.isArray(topicsRes) ? topicsRes : (topicsRes?.results || []);

      setProblems(safeProbs);
      setSubjects(safeSubs);
      setTopics(safeTopics);
    } catch (e) {
      console.error('Failed to load practice task manager data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    const defaultSub = subjects[0]?.id || '';
    const linkedTopics = topics.filter(t => !defaultSub || String(t.subject_id) === String(defaultSub));
    setEditingProblem(null);
    setFormData({
      subject: defaultSub,
      topic: linkedTopics[0]?.id || topics[0]?.id || '',
      title: '',
      description: '',
      language: 'python',
      expected_output: '',
      expected_output_hint: '',
      starter_code: '',
      points: 10,
      order: problems.length + 1,
      is_unlocked: true,
    });
    setFieldErrors({});
    setViewMode('form');
  };

  const handleOpenEdit = (p) => {
    setEditingProblem(p);
    const topObj = topics.find(t => t.id === p.topic || t.id === p.topic?.id);
    const currentUnlocked = p.access_control ? p.access_control.is_unlocked !== false : true;
    setFormData({
      subject: topObj?.subject_id || '',
      topic: p.topic || p.topic?.id || '',
      title: p.title,
      description: p.description,
      language: p.language || 'python',
      expected_output: p.expected_output || '',
      expected_output_hint: p.expected_output_hint || '',
      starter_code: p.starter_code || '',
      points: p.points || 10,
      order: p.order || 1,
      is_unlocked: currentUnlocked,
    });
    setFieldErrors({});
    setViewMode('form');
  };

  const handleSubjectChangeInForm = (subId) => {
    const linkedTopics = topics.filter(t => !subId || String(t.subject_id) === String(subId));
    setFormData(prev => ({
      ...prev,
      subject: subId,
      topic: linkedTopics[0]?.id || ''
    }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.topic) {
      errs.topic = 'Please select a target curriculum topic.';
    }
    if (!formData.title || !formData.title.trim()) {
      errs.title = 'Task / Program title is required.';
    }
    if (!formData.description || !formData.description.trim()) {
      errs.description = 'Task requirements and instructions are required.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill in all mandatory fields highlighted in red.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        topic: formData.topic,
        title: formData.title,
        description: formData.description,
        language: formData.language,
        expected_output: formData.expected_output,
        expected_output_hint: formData.expected_output_hint,
        starter_code: formData.starter_code,
        points: formData.points,
        order: formData.order,
        is_unlocked: formData.is_unlocked,
      };

      if (editingProblem) {
        await api.updateProblem(editingProblem.id, payload);
        await api.updateProblemAccess(editingProblem.id, {
          is_unlocked: formData.is_unlocked,
          allow_late_submission: true,
        }).catch(() => {});
        toast.success(`Lab task "${formData.title}" updated successfully!`);
      } else {
        const created = await api.createProblem(payload);
        if (created?.id) {
          await api.updateProblemAccess(created.id, {
            is_unlocked: formData.is_unlocked,
            allow_late_submission: true,
          }).catch(() => {});
        }
        toast.success(`Lab task "${formData.title}" created successfully!`);
      }
      setViewMode('list');
      await loadAllData();
    } catch (err) {
      toast.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAccess = async (prob) => {
    const currentUnlocked = prob.access_control ? prob.access_control.is_unlocked !== false : true;
    const nextStatus = !currentUnlocked;
    setTogglingId(prob.id);

    try {
      await api.updateProblemAccess(prob.id, {
        is_unlocked: nextStatus,
        allow_late_submission: true,
      });

      // Update in-memory state immediately for instant feedback
      setProblems(prev => prev.map(p => {
        if (p.id === prob.id) {
          return {
            ...p,
            access_control: {
              ...(p.access_control || {}),
              is_unlocked: nextStatus,
            }
          };
        }
        return p;
      }));

      toast.success(
        nextStatus
          ? `Lab "${prob.title}" is now UNLOCKED (Students can solve it).`
          : `Lab "${prob.title}" is now LOCKED for students.`
      );
    } catch (err) {
      toast.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleBulkToggleAccess = async (shouldUnlock) => {
    const actionName = shouldUnlock ? 'Unlock' : 'Lock';
    const ok = await confirm({
      title: `${actionName} All Practice Labs?`,
      message: `Are you sure you want to ${actionName.toLowerCase()} all practice labs for students across all subjects?`,
      confirmText: `${actionName} All`,
      cancelText: 'Cancel',
      type: shouldUnlock ? 'info' : 'warning',
    });
    if (!ok) return;

    try {
      const res = await api.bulkUpdateProblemAccess(shouldUnlock);
      toast.success(res.detail || `All practice labs ${actionName.toLowerCase()}ed successfully!`);
      await loadAllData();
    } catch (e) {
      toast.error(e);
    }
  };


  const handleDelete = async (id, title) => {
    const ok = await confirm({
      title: 'Delete Practice Lab Task?',
      message: `Are you sure you want to delete practice task "${title}"?`,
      confirmText: 'Delete Task',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await api.deleteProblem(id);
      toast.success(`Practice task "${title}" deleted successfully.`);
      await loadAllData();
    } catch (e) {
      toast.error(e);
    }
  };

  const filteredProblems = problems.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === 'ALL' || p.language === categoryFilter;
    const topObj = topics.find(t => t.id === p.topic || t.id === p.topic?.id);
    const probSubId = topObj?.subject_id;
    const matchesSubject = subjectFilter === 'ALL' || String(probSubId) === String(subjectFilter);
    return matchesSearch && matchesCategory && matchesSubject;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, subjectFilter, categoryFilter]);

  const totalPages = Math.ceil(filteredProblems.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedProblems = filteredProblems.slice(startIndex, startIndex + pageSize);

  const availableTopicsForForm = topics.filter(t => {
    if (!formData.subject) return true;
    return String(t.subject_id) === String(formData.subject);
  });

  // DEDICATED IN-PAGE PRACTICE TASK FORM VIEW
  if (viewMode === 'form') {
    const isOfficeTask = ['excel', 'word', 'tally', 'general'].includes(formData.language);

    return (
      <div className="tab-pane-container animate-fade-in">
        <div className="tab-pane-header">
          <div className="flex items-center gap-3">
            <button className="btn-outline-sm" onClick={() => setViewMode('list')}>
              <ArrowLeft size={16} /> Back to Practice Labs
            </button>
            <div>
              <h2>{editingProblem ? `Edit Lab Task: ${editingProblem.title}` : 'Create New Practice Lab Task'}</h2>
              <p className="text-muted">
                Configure practical exercises, challenge instructions, and evaluation answer keys across all subjects.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-layout-2col">
            <div className="form-card-main space-y-5">
              {/* Task Definition Card */}
              <div className="dashboard-section-card">
                <div className="section-card-header">
                  <div>
                    <h3>1. Task Classification & Target Topic</h3>
                    <p className="text-muted">Select linked topic and exercise subject category</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Parent Subject Track *</label>
                      <select
                        value={formData.subject}
                        onChange={(e) => handleSubjectChangeInForm(e.target.value)}
                        className="form-select font-semibold"
                      >
                        <option value="">-- Filter by Subject (All) --</option>
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Target Topic *</label>
                      <select
                        value={formData.topic}
                        onChange={(e) => {
                          setFormData({ ...formData, topic: e.target.value });
                          if (fieldErrors.topic) setFieldErrors({ ...fieldErrors, topic: '' });
                        }}
                        className={`form-select font-semibold ${fieldErrors.topic ? 'input-error' : ''}`}
                      >
                        <option value="">Select Curriculum Topic</option>
                        {availableTopicsForForm.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.title} {t.module_name ? `(${t.module_name})` : ''}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.topic && (
                        <span className="field-error-msg"><AlertCircle size={13} /> {fieldErrors.topic}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Exercise Type & Execution Runtime *</label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="form-select font-semibold"
                    >
                      <optgroup label="Programming & Web">
                        <option value="python">🐍 Python 3 (CPython)</option>
                        <option value="c">⚡ C Programming (GCC)</option>
                        <option value="javascript">🌐 JavaScript (Node.js)</option>
                        <option value="sql">🗄️ SQL & Database Query</option>
                      </optgroup>
                      <optgroup label="Office & Accounting">
                        <option value="excel">📊 MS Excel / Formula & Spreadsheet Task</option>
                        <option value="word">📄 MS Word & Document Formatting Task</option>
                        <option value="tally">💰 Tally Prime & Accounting Entry Task</option>
                      </optgroup>
                      <optgroup label="General">
                        <option value="general">📋 General Practical Task / Lab Assignment</option>
                      </optgroup>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{isOfficeTask ? 'Lab Task / Assignment Title *' : 'Program Title *'}</label>
                    <input
                      type="text"
                      placeholder={
                        formData.language === 'excel' ? 'e.g. Lab 1: VLOOKUP Payroll Calculation' :
                        formData.language === 'word' ? 'e.g. Lab 1: Mail Merge Certificate Template' :
                        formData.language === 'tally' ? 'e.g. Lab 1: Purchase Voucher & GST Ledger Entry' :
                        'e.g. Program 1: Fibonacci Generator'
                      }
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: '' });
                      }}
                      className={`form-input font-semibold ${fieldErrors.title ? 'input-error' : ''}`}
                    />
                    {fieldErrors.title && (
                      <span className="field-error-msg"><AlertCircle size={13} /> {fieldErrors.title}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>
                      {isOfficeTask
                        ? 'Task Instructions, Requirements & Given Dataset *'
                        : 'Problem Statement & Input/Output Instructions *'}
                    </label>
                    <textarea
                      rows={4}
                      placeholder={
                        formData.language === 'excel' ? 'Explain the spreadsheet scenario, cell ranges (e.g. A2:D20), formula rules, and required calculated columns...' :
                        formData.language === 'word' ? 'Specify document margins, typography hierarchy, merge fields (e.g. <<Student_Name>>), or table structure...' :
                        formData.language === 'tally' ? 'List company details, purchase/sales transactions, GST rates (18%), and required ledger accounts...' :
                        'Clearly state the programming problem, input expectations, and required output formatting...'
                      }
                      value={formData.description}
                      onChange={(e) => {
                        setFormData({ ...formData, description: e.target.value });
                        if (fieldErrors.description) setFieldErrors({ ...fieldErrors, description: '' });
                      }}
                      className={`form-textarea ${fieldErrors.description ? 'input-error' : ''}`}
                    />
                    {fieldErrors.description && (
                      <span className="field-error-msg"><AlertCircle size={13} /> {fieldErrors.description}</span>
                    )}
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Score Points Awarded</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.points}
                        onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 10 })}
                        className="form-input font-bold text-primary"
                      />
                    </div>

                    <div className="form-group">
                      <label>Sequence Order</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Validation Answer Key & Template Card */}
              <div className="dashboard-section-card">
                <div className="section-card-header">
                  <div>
                    <h3>2. Validation Answer Key & Starter Template</h3>
                    <p className="text-muted">Target solution verification for automated evaluation</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="form-group bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-300 dark:border-emerald-800">
                    <label className="text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-1.5 mb-1">
                      <Sparkles size={15} />
                      {isOfficeTask
                        ? 'Admin Expected Result / Evaluation Key *'
                        : 'Admin Expected Output (Stdout Answer Key) *'}
                    </label>
                    <span className="text-xs text-muted block mb-2">
                      {isOfficeTask
                        ? 'Enter the target formula output, key calculated values, or completion token that validates student submission.'
                        : 'Enter the exact string expected on stdout. Automated grader matches student console output against this target.'}
                    </span>
                    <textarea
                      rows={4}
                      className="form-textarea font-mono text-xs bg-white dark:bg-slate-900 border-emerald-400"
                      placeholder={
                        formData.language === 'excel' ? 'e.g. LOOKUP_RESULT: Designation=Senior Data Analyst | CTC=₹85,000 | Status=VERIFIED' :
                        formData.language === 'word' ? 'e.g. MAIL_MERGE_STATUS: Fields=<<Student_Name>>,<<Course>> | Records_Merged=30 | Status=PASSED' :
                        formData.language === 'tally' ? 'e.g. VOUCHER_POSTED: Voucher_No=PV-101 | Total_GST=₹18,000 | Net_Payable=₹1,18,000' :
                        'e.g.\n=== Student Profile ===\nName: Alex\nScore: 95\nGrade: A+'
                      }
                      value={formData.expected_output}
                      onChange={(e) => setFormData({ ...formData, expected_output: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      {isOfficeTask
                        ? 'Starter Template / Sample Formula / Initial Hints'
                        : 'Starter Code Boilerplate'}
                    </label>
                    <textarea
                      rows={5}
                      className="form-textarea font-mono text-xs"
                      placeholder={
                        formData.language === 'excel' ? '=VLOOKUP(E2, A2:D20, 3, FALSE)' :
                        formData.language === 'word' ? '<<Student_Name>> has successfully completed <<Course>> on <<Date>>.' :
                        '# Write initial template or code for student editor'
                      }
                      value={formData.starter_code}
                      onChange={(e) => setFormData({ ...formData, starter_code: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Lab Preview */}
            <div className="preview-sticky-box">
              <div className="dashboard-section-card">
                <div className="section-card-header">
                  <div>
                    <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary">
                      <Sparkles size={14} /> LIVE LAB TASK PREVIEW
                    </h3>
                    <p className="text-muted">Student terminal & editor view</p>
                  </div>
                </div>

                <div className="live-preview-card">
                  <div className="preview-badge-row">
                    <span className="preview-badge purple">{formData.language?.toUpperCase() || 'GENERAL'}</span>
                    <span className="preview-badge green">POINTS: {formData.points || 10}</span>
                  </div>

                  <h3 className="preview-title">
                    {formData.title || 'Task Title Preview'}
                  </h3>

                  {formData.description && (
                    <div style={{
                      margin: '12px 0',
                      padding: '12px 14px',
                      background: '#F8FAFC',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      maxHeight: '260px',
                      overflowY: 'auto'
                    }}>
                      <RichContentRenderer content={formData.description} />
                    </div>
                  )}

                  <div className="preview-specs-box">
                    <div className="preview-spec-row">
                      <span className="preview-spec-label">Target Topic</span>
                      <span className="preview-spec-value">
                        {topics.find(t => String(t.id) === String(formData.topic))?.title || 'Not Linked'}
                      </span>
                    </div>

                    <div className="preview-spec-row">
                      <span className="preview-spec-label">Order Priority</span>
                      <span className="preview-spec-value">#{formData.order || 1}</span>
                    </div>

                    {formData.expected_output && (
                      <div className="preview-spec-row">
                        <span className="preview-spec-label text-emerald-700 dark:text-emerald-300">
                          {isOfficeTask ? 'Expected Evaluation Target' : 'Expected Stdout'}
                        </span>
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono break-all mt-1">
                          {formData.expected_output.replace(/\n/g, ' ↵ ')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Student Access Toggle */}
                  <div style={{
                    marginTop: '16px',
                    padding: '14px',
                    background: formData.is_unlocked ? '#F0FDF4' : '#FFF7ED',
                    border: `1.5px solid ${formData.is_unlocked ? '#BBF7D0' : '#FED7AA'}`,
                    borderRadius: '12px',
                  }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={formData.is_unlocked}
                        onChange={(e) => setFormData({ ...formData, is_unlocked: e.target.checked })}
                        style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', accentColor: '#16A34A' }}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: formData.is_unlocked ? '#15803D' : '#C2410C', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {formData.is_unlocked ? <Unlock size={14} /> : <Lock size={14} />}
                          {formData.is_unlocked ? 'Unlocked for Students (Active)' : 'Locked (Hidden from execution)'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px', lineHeight: '1.4' }}>
                          {formData.is_unlocked
                            ? 'Students can immediately view instructions, write code, run tests, and submit.'
                            : 'Students will see "Locked by Staff" until an instructor unlocks this lab.'}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="preview-action-buttons">
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Saving Lab Task…' : (editingProblem ? 'Update Lab Task' : 'Save Lab Task')}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setViewMode('list')}>
                    Cancel & Return
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="tab-pane-container">
      {/* Header */}
      <div className="tab-pane-header">
        <div>
          <h2>Practice Labs & Tasks Management</h2>
          <p className="text-muted">
            Create and maintain coding challenges, spreadsheet labs, and practical assignments with automated answer key evaluation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-outline-sm"
            style={{
              borderColor: '#10B981',
              color: '#047857',
              background: '#ECFDF5',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '600',
              padding: '7px 12px'
            }}
            onClick={() => handleBulkToggleAccess(true)}
            title="Unlock all practice labs so students can access them immediately"
          >
            <Unlock size={14} /> Unlock All Labs
          </button>
          <button
            className="btn-outline-sm"
            style={{
              borderColor: '#FCA5A5',
              color: '#B91C1C',
              background: '#FEF2F2',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '600',
              padding: '7px 12px'
            }}
            onClick={() => handleBulkToggleAccess(false)}
            title="Lock all practice labs"
          >
            <Lock size={14} /> Lock All Labs
          </button>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Add New Practice Lab
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar-unified">
        <div className="filter-search-box">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Search practice tasks by title, instructions, or expected output..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-dropdown-wrap">
          <Filter size={15} className="text-muted" />
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="filter-select-modern"
          >
            <option value="ALL">All Subjects ({problems.length} Tasks)</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-dropdown-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select-modern"
          >
            <option value="ALL">All Categories</option>
            <option value="excel">📊 MS Excel</option>
            <option value="word">📄 MS Word</option>
            <option value="tally">💰 Tally Prime</option>
            <option value="python">🐍 Python</option>
            <option value="c">⚡ C Language</option>
            <option value="javascript">🌐 JavaScript</option>
            <option value="sql">🗄️ SQL</option>
            <option value="general">📋 General</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="dashboard-section-card mt-4">
        {loading ? (
          <div className="loading-state">Loading practice labs…</div>
        ) : filteredProblems.length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-icon-bubble">
              <Code2 size={32} />
            </div>
            <h3>No Practice Tasks Found</h3>
            <p>No practice challenges or assignments found for this category. Click below to create one.</p>
            <button className="btn-save-primary mt-2" onClick={handleOpenCreate}>
              <Plus size={16} /> Add New Practice Lab
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Category</th>
                  <th>Linked Topic</th>
                  <th style={{ width: '130px' }}>Student Access</th>
                  <th>Expected Output / Answer Key</th>
                  <th>Points</th>
                  <th style={{ width: '110px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProblems.map((prob) => {
                  const topObj = topics.find(t => t.id === prob.topic || t.id === prob.topic?.id);
                  const isUnlocked = prob.access_control ? prob.access_control.is_unlocked !== false : true;
                  const isThisToggling = togglingId === prob.id;

                  return (
                    <tr key={prob.id}>
                      <td>
                        <div className="font-bold text-sm text-gray-900">{prob.title}</div>
                        <span className="text-xs text-muted line-clamp-1 max-w-sm">{prob.description}</span>
                      </td>
                      <td>
                        <span className={`lang-badge uppercase text-[10px] font-bold ${
                          prob.language === 'excel' ? 'bg-emerald-100 text-emerald-800' :
                          prob.language === 'word' ? 'bg-blue-100 text-blue-800' :
                          prob.language === 'tally' ? 'bg-amber-100 text-amber-800' :
                          prob.language === 'python' ? 'bg-yellow-100 text-yellow-800' :
                          prob.language === 'c' ? 'bg-purple-100 text-purple-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {prob.language === 'excel' ? '📊 EXCEL' :
                           prob.language === 'word' ? '📄 WORD' :
                           prob.language === 'tally' ? '💰 TALLY' :
                           prob.language === 'python' ? '🐍 PYTHON' :
                           prob.language === 'c' ? '⚡ C' :
                           prob.language === 'sql' ? '🗄️ SQL' :
                           prob.language}
                        </span>
                      </td>
                      <td>
                        <span className="badge-pill course-pill">{topObj?.title || 'Topic'}</span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleAccess(prob)}
                          disabled={isThisToggling}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: isThisToggling ? 'wait' : 'pointer',
                            border: '1.5px solid',
                            background: isUnlocked ? '#ECFDF5' : '#FEF2F2',
                            borderColor: isUnlocked ? '#A7F3D0' : '#FECACA',
                            color: isUnlocked ? '#065F46' : '#991B1B',
                            opacity: isThisToggling ? 0.6 : 1,
                            transition: 'all 0.15s ease',
                          }}
                          title={isUnlocked ? "Click to lock this lab for students" : "Click to unlock this lab for students"}
                        >
                          {isUnlocked ? <Unlock size={12} /> : <Lock size={12} />}
                          {isUnlocked ? 'Unlocked' : 'Locked'}
                        </button>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-muted truncate max-w-xs block" title={prob.expected_output}>
                          {prob.expected_output || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="points-badge font-bold">{prob.points} pts</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button className="icon-btn" onClick={() => handleOpenEdit(prob)} title="Edit Task">
                            <Edit2 size={13} />
                          </button>
                          <button className="icon-btn danger" onClick={() => handleDelete(prob.id, prob.title)} title="Delete Task">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <PaginationControls
              currentPage={safeCurrentPage}
              totalItems={filteredProblems.length}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              itemName="practice tasks"
            />
          </div>
        )}
      </div>
    </div>
  );
}
