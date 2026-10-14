import { useState, useEffect } from 'react';
import {
  Layers, Plus, Edit2, Trash2, ArrowLeft, Check,
  Search, Filter, Sparkles, BookOpen, FileText,
  AlertCircle, ChevronDown, ChevronRight, Terminal, HelpCircle,
  ExternalLink, RotateCcw, Award, CheckCircle2
} from 'lucide-react';
import { api, isDemoUser, notifyDemoRestriction } from '../api';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import PaginationControls from './PaginationControls';

export default function SyllabusManagerTab({ user, onNavigate }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [subjects, setSubjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [topics, setTopics] = useState([]);
  const [problems, setProblems] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedModuleIds, setExpandedModuleIds] = useState(new Set());

  const [editingModule, setEditingModule] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    name: '',
    level: 'beginner',
    order: 1,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [subsRes, modsRes, topicsRes, probsRes, quizRes] = await Promise.all([
        api.getSubjects().catch(() => []),
        api.getModules().catch(() => []),
        api.getTopics().catch(() => []),
        api.getProblems().catch(() => []),
        api.getQuizQuestions().catch(() => []),
      ]);

      const safeSubs = Array.isArray(subsRes) ? subsRes : (subsRes?.results || []);
      const safeMods = Array.isArray(modsRes) ? modsRes : (modsRes?.results || []);
      const safeTopics = Array.isArray(topicsRes) ? topicsRes : (topicsRes?.results || []);
      const safeProbs = Array.isArray(probsRes) ? probsRes : (probsRes?.results || []);
      const safeQuizzes = Array.isArray(quizRes) ? quizRes : (quizRes?.results || []);

      // Normalize modules with parent subject info
      const normalizedMods = safeMods.map(m => {
        const subId = typeof m.subject === 'object' ? m.subject?.id : m.subject;
        const parentSub = safeSubs.find(s => s.id === subId);
        return {
          ...m,
          subject: subId,
          subject_name: parentSub?.name || m.subject_name || 'Subject'
        };
      });

      // Normalize topics with parent module and subject info
      const normalizedTopics = safeTopics.map(t => {
        const modId = typeof t.module === 'object' ? t.module?.id : t.module;
        const parentMod = normalizedMods.find(m => m.id === modId);
        const subId = parentMod?.subject || t.subject_id;
        const parentSub = safeSubs.find(s => s.id === subId);
        return {
          ...t,
          module: modId,
          module_name: parentMod?.name || t.module_name || 'Chapter',
          subject_id: subId,
          subject_name: parentSub?.name || t.subject_name || 'Subject'
        };
      });

      setSubjects(safeSubs);
      setModules(normalizedMods);
      setTopics(normalizedTopics);
      setProblems(safeProbs);
      setQuizzes(safeQuizzes);
    } catch (e) {
      console.error('Failed to load syllabus data', e);
      toast.error('Failed to load syllabus data.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandModule = (modId) => {
    setExpandedModuleIds(prev => {
      const next = new Set(prev);
      if (next.has(modId)) {
        next.delete(modId);
      } else {
        next.add(modId);
      }
      return next;
    });
  };

  const handleOpenCreate = () => {
    if (isDemoUser(user)) {
      notifyDemoRestriction('Creating modules/units');
      return;
    }
    const defaultSub = selectedSubjectFilter !== 'ALL' ? selectedSubjectFilter : (subjects[0]?.id ? String(subjects[0].id) : '');
    const currentSubMods = modules.filter(m => String(m.subject) === String(defaultSub));
    setEditingModule(null);
    setFormData({
      subject: defaultSub,
      name: '',
      level: 'beginner',
      order: currentSubMods.length + 1,
    });
    setFieldErrors({});
    setViewMode('form');
  };

  const handleOpenEdit = (mod) => {
    if (isDemoUser(user)) {
      notifyDemoRestriction('Editing modules/units');
      return;
    }
    setEditingModule(mod);
    const subId = typeof mod.subject === 'object' ? mod.subject?.id : mod.subject;
    setFormData({
      subject: String(subId || ''),
      name: mod.name || '',
      level: mod.level || 'beginner',
      order: mod.order || 1,
    });
    setFieldErrors({});
    setViewMode('form');
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.subject) errs.subject = 'Please choose a parent master subject';
    if (!formData.name.trim()) errs.name = 'Chapter/Module title is required';
    if (!formData.order || formData.order < 1) errs.order = 'Sequence number must be 1 or greater';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isDemoUser(user)) {
      notifyDemoRestriction('Saving modules/units');
      return;
    }
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        subject: parseInt(formData.subject),
        name: formData.name.trim(),
        level: formData.level,
        order: parseInt(formData.order) || 1,
      };

      if (editingModule) {
        const updated = await api.updateModule(editingModule.id, payload);
        setModules(prev => prev.map(m => m.id === editingModule.id ? { ...m, ...(updated || payload) } : m));
        toast.success(`Chapter "${formData.name}" updated successfully!`);
      } else {
        const created = await api.createModule(payload);
        if (created && created.id) {
          setModules(prev => [...prev, created]);
        }
        toast.success(`Chapter "${formData.name}" created successfully!`);
      }
      setViewMode('list');
      await loadAllData();
    } catch (err) {
      toast.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (isDemoUser(user)) {
      notifyDemoRestriction('Deleting modules/units');
      return;
    }
    const ok = await confirm({
      title: 'Delete Curriculum Chapter?',
      message: `Are you sure you want to delete chapter "${name}"? This will detach any associated topics.`,
      confirmText: 'Delete Chapter',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!ok) return;

    // Instant UI update
    const prevModules = [...modules];
    setModules(prev => prev.filter(m => m.id !== id));
    toast.success(`Chapter "${name}" deleted.`);

    // Background delete
    api.deleteModule(id).catch(err => {
      setModules(prevModules);
      toast.error('Failed to delete chapter on server: ' + (err?.message || err || 'Error'));
    });
  };

  // Filter modules by subject, level, and search query
  const filteredModules = modules.filter(m => {
    const modSubId = typeof m.subject === 'object' ? m.subject?.id : m.subject;
    const subMatch = selectedSubjectFilter === 'ALL' || String(modSubId) === String(selectedSubjectFilter);
    const levelMatch = levelFilter === 'ALL' || m.level === levelFilter;
    const queryMatch = !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase());
    return subMatch && levelMatch && queryMatch;
  }).sort((a, b) => {
    const aSub = typeof a.subject === 'object' ? a.subject?.id : a.subject;
    const bSub = typeof b.subject === 'object' ? b.subject?.id : b.subject;
    if (aSub !== bSub) return (aSub || 0) - (bSub || 0);
    return (a.order || 0) - (b.order || 0);
  });

  const totalPages = Math.ceil(filteredModules.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedModules = filteredModules.slice(startIndex, startIndex + pageSize);

  // ----------------------------------------------------
  // FORM VIEW
  // ----------------------------------------------------
  if (viewMode === 'form') {
    return (
      <div className="tab-pane-container animate-fade-in">
        <div className="tab-pane-header">
          <div className="flex items-center gap-3">
            <button className="btn-outline-sm" onClick={() => setViewMode('list')}>
              <ArrowLeft size={16} /> Back to Syllabus Table
            </button>
            <div>
              <h2>{editingModule ? `Edit Chapter: ${editingModule.name}` : 'Add New Curriculum Chapter / Module'}</h2>
              <p className="text-muted">
                Define progressive learning milestone units and sequence ordering for student curriculum.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-layout-2col mt-4">
            {/* Left Column: Form Inputs */}
            <div className="form-card-main">
              <div className="form-group">
                <label>Parent Master Subject *</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className={`form-select font-semibold ${fieldErrors.subject ? 'input-error' : ''}`}
                >
                  <option value="">-- Choose Master Subject --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.duration || 'Flexible'})</option>
                  ))}
                </select>
                {fieldErrors.subject && (
                  <span className="field-error-msg"><AlertCircle size={13} /> {fieldErrors.subject}</span>
                )}
              </div>

              <div className="form-group">
                <label>Chapter / Module Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Module 1: C Architecture, Environment & I/O"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`form-input font-semibold ${fieldErrors.name ? 'input-error' : ''}`}
                />
                {fieldErrors.name && (
                  <span className="field-error-msg"><AlertCircle size={13} /> {fieldErrors.name}</span>
                )}
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Skill Difficulty Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="form-select font-semibold"
                  >
                    <option value="beginner">Beginner Foundation</option>
                    <option value="intermediate">Intermediate Core</option>
                    <option value="advanced">Advanced Mastery</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Syllabus Sequence Order *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                    className={`form-input font-semibold ${fieldErrors.order ? 'input-error' : ''}`}
                  />
                  {fieldErrors.order && (
                    <span className="field-error-msg"><AlertCircle size={13} /> {fieldErrors.order}</span>
                  )}
                </div>
              </div>

              <div className="form-actions-footer">
                <button
                  type="button"
                  className="btn-cancel-outline"
                  onClick={() => setViewMode('list')}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>Saving Chapter…</>
                  ) : (
                    <><Check size={16} /> {editingModule ? 'Update Chapter' : 'Create Chapter'}</>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Information Card */}
            <div className="form-card-side">
              <div className="help-box-content">
                <div className="flex items-center gap-2 mb-2 font-bold text-gray-800">
                  <Sparkles size={18} className="text-primary" />
                  <span>Curriculum Architecture</span>
                </div>
                <p className="text-xs text-muted mb-3" style={{ lineHeight: 1.6 }}>
                  Chapters (Modules) represent sequential academic units in a subject. Topics and programming labs are grouped within each chapter.
                </p>
                <div className="tip-pill-list">
                  <div className="tip-pill-item">
                    <strong>Order Sequence:</strong> Determines which unit students unlock first.
                  </div>
                  <div className="tip-pill-item">
                    <strong>Topic Nesting:</strong> Once a chapter is saved, click &quot;+ Topic&quot; on the syllabus table to attach lecture materials.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN SYLLABUS TABLE VIEW
  // ----------------------------------------------------
  return (
    <div className="tab-pane-container">
      {/* Header */}
      <div className="tab-pane-header admin-page-header">
        <div className="header-left-content">
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ margin: 0, textAlign: 'left' }}>Syllabus & Modules Management</h2>
            <p className="text-muted" style={{ margin: '4px 0 0 0', textAlign: 'left' }}>
              Inspect and organize chapter milestones, topics, code labs, and test questions across your curriculum.
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn-secondary" onClick={loadAllData} title="Refresh syllabus from server">
            <RotateCcw size={15} /> Refresh Data
          </button>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Add New Chapter
          </button>
        </div>
      </div>

      {/* Modern Compact Metrics Strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FAF5FF', color: '#7C3AED', border: '1px solid #E9D5FF', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
          <Layers size={14} /> {modules.length} Chapters Active
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
          <FileText size={14} /> {topics.length} Lecture Topics
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
          <Terminal size={14} /> {problems.length} Coding Labs
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
          <HelpCircle size={14} /> {quizzes.length} Knowledge MCQs
        </span>
      </div>

      {/* Filter Bar with Dropdowns */}
      <div className="filter-bar-unified">
        <div className="filter-search-box">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Search chapters by name or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-dropdown-wrap">
          <Filter size={15} className="text-muted" />
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="filter-select-modern"
          >
            <option value="ALL">All Subjects ({modules.length} Chapters)</option>
            {subjects.map(s => {
              const subCount = modules.filter(m => String(m.subject) === String(s.id) || String(m.subject?.id) === String(s.id)).length;
              return (
                <option key={s.id} value={s.id}>{s.name} ({subCount} Chapters)</option>
              );
            })}
          </select>
        </div>

        <div className="filter-dropdown-wrap">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="filter-select-modern"
          >
            <option value="ALL">All Skill Levels</option>
            <option value="beginner">Beginner Foundation</option>
            <option value="intermediate">Intermediate Core</option>
            <option value="advanced">Advanced Mastery</option>
          </select>
        </div>

        <span className="text-xs font-semibold text-muted whitespace-nowrap">
          {filteredModules.length} of {modules.length} Chapters Active
        </span>
      </div>

      {/* Syllabus Chapters Table */}
      <div className="dashboard-section-card">
        {loading ? (
          <div className="loading-state">Loading syllabus chapters directory…</div>
        ) : filteredModules.length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-icon-bubble">
              <Layers size={32} />
            </div>
            <h3>No Chapters Found</h3>
            <p>No curriculum chapters match the selected filters. Click below to add a new chapter.</p>
            <button className="btn-save-primary mt-2" onClick={handleOpenCreate}>
              <Plus size={16} /> Add New Chapter
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '45px', textAlign: 'center' }}></th>
                  <th style={{ width: '75px' }}>Seq #</th>
                  <th>Chapter / Module Title</th>
                  <th>Parent Subject</th>
                  <th>Difficulty</th>
                  <th>Topics & Content</th>
                  <th style={{ width: '150px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedModules.map((mod) => {
                  const modSubId = typeof mod.subject === 'object' ? mod.subject?.id : mod.subject;
                  const subObj = subjects.find(s => s.id === modSubId);
                  const modTopics = topics.filter(t => {
                    const tModId = typeof t.module === 'object' ? t.module?.id : t.module;
                    return String(tModId) === String(mod.id);
                  });
                  const isExpanded = expandedModuleIds.has(mod.id);

                  return (
                    <>
                      <tr key={mod.id} style={{ background: isExpanded ? '#FAF5FF' : undefined }}>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => toggleExpandModule(mod.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: isExpanded ? '#7C3AED' : '#94A3B8',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '4px'
                            }}
                            title={isExpanded ? 'Collapse Topics' : 'Expand Topics'}
                          >
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </button>
                        </td>
                        <td>
                          <span className="badge-pill purple font-bold">
                            #{mod.order || 1}
                          </span>
                        </td>
                        <td>
                          <div>
                            <div className="font-bold text-sm text-gray-900">{mod.name}</div>
                            <span className="text-xs text-muted">ID: {mod.id} • Click arrow to view topics</span>
                          </div>
                        </td>
                        <td>
                          <span className="font-semibold text-sm text-gray-800">
                            {subObj?.name || mod.subject_name || 'Unassigned'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge-pill ${
                            mod.level === 'beginner' ? 'info' : mod.level === 'intermediate' ? 'warning' : 'purple'
                          }`}>
                            {mod.level ? (mod.level.charAt(0).toUpperCase() + mod.level.slice(1)) : 'Beginner'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => toggleExpandModule(mod.id)}
                            className="badge-pill info font-semibold"
                            style={{ cursor: 'pointer', border: '1px solid #BFDBFE' }}
                          >
                            {modTopics.length} {modTopics.length === 1 ? 'Topic' : 'Topics'} ({isExpanded ? 'Hide' : 'Show Details'})
                          </button>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              className="btn-outline-sm"
                              onClick={() => onNavigate && onNavigate('topics')}
                              title="Add or Manage Topics"
                            >
                              <Plus size={12} /> Topic
                            </button>
                            <button
                              className="icon-btn edit"
                              onClick={() => handleOpenEdit(mod)}
                              title="Edit Chapter"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="icon-btn danger"
                              onClick={() => handleDelete(mod.id, mod.name)}
                              title="Delete Chapter"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Topics Subtable Drawer */}
                      {isExpanded && (
                        <tr key={`drawer-${mod.id}`} className="chapter-accordion-row">
                          <td colSpan={7} className="chapter-topics-drawer">
                            <div className="topics-drawer-header">
                              <div className="flex items-center gap-2">
                                <FileText size={16} className="text-primary" />
                                <span className="font-bold text-sm text-gray-900">
                                  Topics in &ldquo;{mod.name}&rdquo; ({modTopics.length})
                                </span>
                              </div>
                              <button
                                className="btn-outline-sm"
                                onClick={() => onNavigate && onNavigate('topics')}
                              >
                                <Plus size={12} /> Add Topic to this Chapter
                              </button>
                            </div>

                            {modTopics.length === 0 ? (
                              <div style={{
                                background: '#FFFFFF',
                                border: '1px dashed #CBD5E1',
                                borderRadius: '10px',
                                padding: '18px',
                                textAlign: 'center',
                                fontSize: '13px',
                                color: '#64748B'
                              }}>
                                No topics created in this chapter yet. Click &quot;Add Topic&quot; to build lesson material.
                              </div>
                            ) : (
                              <table className="drawer-subtable">
                                <thead>
                                  <tr>
                                    <th style={{ width: '60px' }}>Order</th>
                                    <th>Topic Title</th>
                                    <th>Theory & Notes</th>
                                    <th>Practice Lab (Code)</th>
                                    <th>Knowledge MCQs</th>
                                    <th style={{ width: '130px', textAlign: 'right' }}>Quick Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {modTopics.sort((a, b) => (a.order || 0) - (b.order || 0)).map((top) => {
                                    const topProblem = problems.find(p => p.topic === top.id || p.topic?.id === top.id);
                                    const topQuizzes = quizzes.filter(q => q.topic === top.id || q.topic?.id === top.id);

                                    return (
                                      <tr key={top.id}>
                                        <td>
                                          <span className="font-bold text-xs font-mono text-gray-700">
                                            #{top.order || 1}
                                          </span>
                                        </td>
                                        <td>
                                          <div className="font-semibold text-gray-900">{top.title}</div>
                                          <span className="text-[11px] font-mono text-muted">{top.topic_id}</span>
                                        </td>
                                        <td>
                                          <span className="text-xs text-gray-600">
                                            {top.notes_content ? `${top.notes_content.length} chars markdown` : 'No notes'}
                                          </span>
                                        </td>
                                        <td>
                                          {topProblem ? (
                                            <span className="badge-pill success text-xs">
                                              <Terminal size={11} /> {topProblem.title} ({topProblem.points || 100} pts)
                                            </span>
                                          ) : (
                                            <span className="text-xs text-muted">No lab assigned</span>
                                          )}
                                        </td>
                                        <td>
                                          {topQuizzes.length > 0 ? (
                                            <span className="badge-pill warning text-xs">
                                              <Award size={11} /> {topQuizzes.length} Questions
                                            </span>
                                          ) : (
                                            <span className="text-xs text-muted">0 MCQs</span>
                                          )}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                          <div className="flex items-center justify-end gap-1">
                                            <button
                                              className="btn-outline-sm"
                                              onClick={() => onNavigate && onNavigate('topics')}
                                              title="Open Topic in Editor"
                                              style={{ fontSize: '11px', padding: '4px 8px' }}
                                            >
                                              Notes
                                            </button>
                                            <button
                                              className="btn-outline-sm"
                                              onClick={() => onNavigate && onNavigate('quiz_bank', { topicId: top.id })}
                                              title="Open Quiz Bank for this Topic"
                                              style={{ fontSize: '11px', padding: '4px 8px' }}
                                            >
                                              MCQs
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
            <PaginationControls
              currentPage={safeCurrentPage}
              totalItems={filteredModules.length}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              itemName="chapters"
            />
          </div>
        )}
      </div>
    </div>
  );
}
