import { useState, useEffect } from 'react';
import {
  Code2, Plus, Edit2, Trash2, ArrowLeft, Check,
  Search, Filter, Sparkles, BookOpen, Layers, AlertCircle, FileText,
  Lock, Unlock, Eye, X
} from 'lucide-react';
import { api, isDemoUser, notifyDemoRestriction } from '../api';
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
  const [viewingProblem, setViewingProblem] = useState(null);
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
    test_criteria: [],
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
    if (isDemoUser(user)) {
      notifyDemoRestriction('Creating practice labs');
      return;
    }
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
      test_criteria: [],
    });
    setFieldErrors({});
    setViewMode('form');
  };

  const handleOpenEdit = (p) => {
    if (isDemoUser(user)) {
      notifyDemoRestriction('Editing practice labs');
      return;
    }
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
      test_criteria: Array.isArray(p.test_criteria) ? p.test_criteria : [],
    });
    setFieldErrors({});
    setViewMode('form');
  };

  const autoGenerateTestCases = () => {
    const titleLower = (formData.title || '').toLowerCase();
    const expectedLower = (formData.expected_output || '').toLowerCase();
    let generated = [];

    if (titleLower.includes('even') || titleLower.includes('odd') || expectedLower.includes('even') || expectedLower.includes('odd')) {
      generated = [
        { id: 1, name: 'Sample Case 1', input: '8\n', expected_output: '8 is Even', is_hidden: false },
        { id: 2, name: 'Sample Case 2', input: '7\n', expected_output: '7 is Odd', is_hidden: false },
        { id: 3, name: 'Hidden Case 3 (Zero)', input: '0\n', expected_output: '0 is Even', is_hidden: true },
        { id: 4, name: 'Hidden Case 4 (Large Odd)', input: '101\n', expected_output: '101 is Odd', is_hidden: true },
        { id: 5, name: 'Hidden Case 5 (Negative Even)', input: '-4\n', expected_output: '-4 is Even', is_hidden: true },
      ];
    } else if (titleLower.includes('positive') || titleLower.includes('negative')) {
      generated = [
        { id: 1, name: 'Sample Case 1', input: '15\n', expected_output: '15 is Positive', is_hidden: false },
        { id: 2, name: 'Sample Case 2', input: '-9\n', expected_output: '-9 is Negative', is_hidden: false },
        { id: 3, name: 'Hidden Case 3 (Zero)', input: '0\n', expected_output: 'Zero', is_hidden: true },
        { id: 4, name: 'Hidden Case 4 (Large Positive)', input: '420\n', expected_output: '420 is Positive', is_hidden: true },
        { id: 5, name: 'Hidden Case 5 (Negative)', input: '-99\n', expected_output: '-99 is Negative', is_hidden: true },
      ];
    } else {
      const matchDigits = (formData.expected_output || '').match(/-?\d+/);
      const baseNum = matchDigits ? matchDigits[0] : '10';
      generated = [
        { id: 1, name: 'Sample Case 1', input: `${baseNum}\n`, expected_output: formData.expected_output || 'Output 1', is_hidden: false },
        { id: 2, name: 'Sample Case 2', input: '5\n', expected_output: formData.expected_output || 'Output 2', is_hidden: false },
        { id: 3, name: 'Hidden Case 3', input: '20\n', expected_output: formData.expected_output || 'Output 3', is_hidden: true },
        { id: 4, name: 'Hidden Case 4', input: '1\n', expected_output: formData.expected_output || 'Output 4', is_hidden: true },
        { id: 5, name: 'Hidden Case 5', input: '100\n', expected_output: formData.expected_output || 'Output 5', is_hidden: true },
      ];
    }

    setFormData(prev => ({ ...prev, test_criteria: generated }));
    toast.success('Generated 5 test cases (2 Sample Visible + 3 Hidden Edge-Cases)!');
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
    if (isDemoUser(user)) {
      notifyDemoRestriction('Saving practice labs');
      return;
    }
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
        test_criteria: formData.test_criteria || [],
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
    if (isDemoUser(user)) {
      notifyDemoRestriction('Toggling student lab access');
      return;
    }
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
    if (isDemoUser(user)) {
      notifyDemoRestriction('Bulk locking/unlocking practice tasks');
      return;
    }
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
    if (isDemoUser(user)) {
      notifyDemoRestriction('Deleting practice tasks');
      return;
    }
    const ok = await confirm({
      title: 'Delete Practice Lab Task?',
      message: `Are you sure you want to delete practice task "${title}"?`,
      confirmText: 'Delete Task',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!ok) return;

    // Instant UI update
    const prevProblems = [...problems];
    setProblems(prev => prev.filter(p => p.id !== id));
    toast.success(`Practice task "${title}" deleted.`);

    // Background delete
    api.deleteProblem(id).catch(e => {
      setProblems(prevProblems);
      toast.error('Failed to delete problem on server: ' + (e?.message || e || 'Error'));
    });
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

                  {/* Multi-Testcase Manager (Visible + Hidden) */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div>
                        <label className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider">
                          <Layers size={14} className="text-primary" /> Automated Multi-Test Cases ({formData.test_criteria?.length || 0})
                        </label>
                        <span className="text-[11px] text-muted">
                          Supports 2 visible sample cases + 3 hidden edge cases for comprehensive code evaluation.
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={autoGenerateTestCases}
                          className="btn-outline-sm"
                        >
                          <Sparkles size={13} /> Auto-Generate 5 Cases
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newId = (formData.test_criteria?.length || 0) + 1;
                            setFormData(prev => ({
                              ...prev,
                              test_criteria: [
                                ...(prev.test_criteria || []),
                                {
                                  id: newId,
                                  name: `Test Case ${newId}`,
                                  input: '10\n',
                                  expected_output: '10 is Even',
                                  is_hidden: newId > 2
                                }
                              ]
                            }));
                          }}
                          className="btn-outline-sm"
                        >
                          <Plus size={13} /> Add Case
                        </button>
                      </div>
                    </div>

                    {/* Test Cases List */}
                    {formData.test_criteria && formData.test_criteria.length > 0 ? (
                      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                        {formData.test_criteria.map((tc, idx) => (
                          <div
                            key={tc.id || idx}
                            className={`p-3 rounded-lg border text-xs ${tc.is_hidden ? 'bg-amber-50/40 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                  #{idx + 1} {tc.name}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tc.is_hidden ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'}`}>
                                  {tc.is_hidden ? '🔒 Hidden Case' : 'Visible Sample'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-1 cursor-pointer text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(tc.is_hidden)}
                                    onChange={(e) => {
                                      const updated = [...formData.test_criteria];
                                      updated[idx] = { ...updated[idx], is_hidden: e.target.checked };
                                      setFormData({ ...formData, test_criteria: updated });
                                    }}
                                  />
                                  Hidden
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = formData.test_criteria.filter((_, i) => i !== idx);
                                    setFormData({ ...formData, test_criteria: updated });
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[10px] font-bold text-muted block mb-0.5">Stdin Input:</span>
                                <input
                                  type="text"
                                  value={tc.input || ''}
                                  onChange={(e) => {
                                    const updated = [...formData.test_criteria];
                                    updated[idx] = { ...updated[idx], input: e.target.value };
                                    setFormData({ ...formData, test_criteria: updated });
                                  }}
                                  placeholder="e.g. 8\n"
                                  className="form-input text-xs py-1 px-2 font-mono bg-slate-50 dark:bg-slate-900 w-full"
                                />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-muted block mb-0.5">Expected Output:</span>
                                <input
                                  type="text"
                                  value={tc.expected_output || ''}
                                  onChange={(e) => {
                                    const updated = [...formData.test_criteria];
                                    updated[idx] = { ...updated[idx], expected_output: e.target.value };
                                    setFormData({ ...formData, test_criteria: updated });
                                  }}
                                  placeholder="e.g. 8 is Even"
                                  className="form-input text-xs py-1 px-2 font-mono bg-slate-50 dark:bg-slate-900 w-full"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center border border-dashed rounded-lg border-slate-300 dark:border-slate-700 text-muted text-xs">
                        No automated test criteria configured yet. Click "Auto-Generate 5 Cases" to create 2 visible sample and 3 hidden edge cases automatically.
                      </div>
                    )}
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
                          <button className="icon-btn" onClick={() => setViewingProblem(prob)} title="View Task Details">
                            <Eye size={13} />
                          </button>
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

      {/* View Practice Task Details Modal */}
      {viewingProblem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            border: '1.5px solid #E2E8F0'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F8FAFC'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={16} color="#7B1C6E" />
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>Practice Task Details</span>
              </div>
              <button
                onClick={() => setViewingProblem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  background: '#F3E8FF',
                  color: '#6B21A8'
                }}>
                  {viewingProblem.language ? viewingProblem.language.toUpperCase() : 'PYTHON'}
                </span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>&bull;</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#DCFCE7', padding: '2px 8px', borderRadius: '10px' }}>
                  {viewingProblem.points || 10} Points
                </span>
              </div>

              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '12px' }}>
                {viewingProblem.title}
              </h2>

              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #E2E8F0' }}>
                <strong style={{ fontSize: '12px', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Problem Description & Instructions:
                </strong>
                <div style={{ fontSize: '13px', color: '#1E293B', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {viewingProblem.description}
                </div>
              </div>

              {viewingProblem.expected_output && (
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ fontSize: '11.5px', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    🎯 Target Expected Output:
                  </strong>
                  <pre style={{
                    background: '#0F172A',
                    color: '#34D399',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    margin: 0,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {viewingProblem.expected_output}
                  </pre>
                </div>
              )}

              {/* Test cases list if available */}
              {viewingProblem.test_criteria && viewingProblem.test_criteria.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ fontSize: '11.5px', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Automated Test Cases ({viewingProblem.test_criteria.length}):
                  </strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {viewingProblem.test_criteria.map((tc, idx) => (
                      <div key={idx} style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: tc.is_hidden ? '#FFFBEB' : '#F8FAFC',
                        border: `1px solid ${tc.is_hidden ? '#FDE68A' : '#E2E8F0'}`,
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: '#0F172A' }}>#{idx + 1} {tc.name}</span>
                          <span style={{ fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '8px', background: tc.is_hidden ? '#FEF3C7' : '#E0E7FF', color: tc.is_hidden ? '#92400E' : '#3730A3' }}>
                            {tc.is_hidden ? '🔒 Hidden Case' : 'Visible Sample'}
                          </span>
                        </div>
                        <code style={{ fontSize: '11px', color: '#475569' }}>
                          Expect: {tc.expected_output}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', textAlign: 'right', background: '#F8FAFC' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setViewingProblem(null)}
                style={{ padding: '8px 20px', borderRadius: '10px' }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
