import { useState, useEffect } from 'react';
import {
  Layers, Plus, Edit2, Trash2, ArrowLeft, Check,
  Search, Filter, Sparkles, BookOpen, FileText,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import PaginationControls from './PaginationControls';

export default function SyllabusManagerTab({ user, onNavigate }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [subjects, setSubjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
      const [subsRes, modsRes, topicsRes] = await Promise.all([
        api.getSubjects().catch(() => []),
        api.getModules().catch(() => []),
        api.getTopics().catch(() => []),
      ]);

      const safeSubs = Array.isArray(subsRes) ? subsRes : (subsRes?.results || []);
      const safeMods = Array.isArray(modsRes) ? modsRes : (modsRes?.results || []);
      const safeTopics = Array.isArray(topicsRes) ? topicsRes : (topicsRes?.results || []);

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
    } catch (e) {
      console.error('Failed to load syllabus data', e);
      toast.error('Failed to load syllabus data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
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
    setEditingModule(mod);
    const subId = typeof mod.subject === 'object' ? mod.subject?.id : mod.subject;
    setFormData({
      subject: String(subId || subjects[0]?.id || ''),
      name: mod.name,
      level: mod.level || 'beginner',
      order: mod.order || 1,
    });
    setFieldErrors({});
    setViewMode('form');
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.subject) {
      errs.subject = 'Please select a parent master subject.';
    }
    if (!formData.name || !formData.name.trim()) {
      errs.name = 'Chapter / Module title is required.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please complete all mandatory fields.');
      return;
    }

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
    // Sort by subject first, then by sequence order
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
                <label>Chapter / Module Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 1: Introduction, Variables & Data Types"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                  }}
                  className={`form-input text-base font-semibold ${fieldErrors.name ? 'input-error' : ''}`}
                />
                {fieldErrors.name && (
                  <span className="field-error-msg"><AlertCircle size={13} /> {fieldErrors.name}</span>
                )}
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Difficulty / Unit Level</label>
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
                  <label>Sequence Order Number</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                    className="form-input font-bold text-primary"
                  />
                  <span className="text-xs text-muted mt-1 block">Controls display sequence in syllabus</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Chapter Card Preview */}
            <div className="preview-sticky-box">
              <div className="preview-header-label">
                <Sparkles size={14} />
                <span>Live Chapter Card Preview</span>
              </div>

              <div className="live-preview-card">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="badge-pill info">
                    {formData.level?.toUpperCase()} UNIT
                  </span>
                  <span className="badge-pill purple text-[11px]">CHAPTER #{formData.order || 1}</span>
                </div>

                <h3>
                  {formData.name || 'Chapter Title Preview'}
                </h3>

                <div className="preview-specs-box">
                  <div className="preview-spec-row">
                    <span className="preview-spec-label">Target Subject:</span>
                    <span className="preview-spec-value">{subjects.find(s => String(s.id) === String(formData.subject))?.name || 'Not selected'}</span>
                  </div>
                  <div className="preview-spec-row">
                    <span className="preview-spec-label">Sequence:</span>
                    <span className="preview-spec-value">Unit #{formData.order || 1}</span>
                  </div>
                </div>
              </div>

              <div className="preview-action-buttons">
                <button type="submit" className="btn-save-primary" disabled={saving}>
                  <Check size={16} />
                  <span>{saving ? 'Saving Chapter…' : (editingModule ? 'Update Chapter' : 'Save Chapter')}</span>
                </button>
                <button type="button" className="btn-cancel-outline" onClick={() => setViewMode('list')}>
                  Cancel & Return
                </button>
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
      <div className="tab-pane-header">
        <div>
          <h2>Syllabus & Modules Management</h2>
          <p className="text-muted">
            Manage curriculum chapter milestones, difficulty levels, and sequence ordering across all teaching tracks.
          </p>
        </div>

        <button className="btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Add New Chapter
        </button>
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
                <option key={s.id} value={s.id}>{s.name} ({subCount})</option>
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
      <div className="dashboard-section-card mt-4">
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
                  <th style={{ width: '80px' }}>Seq #</th>
                  <th>Chapter / Module Title</th>
                  <th>Parent Subject</th>
                  <th>Level</th>
                  <th>Topics Count</th>
                  <th style={{ width: '120px' }}>Actions</th>
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

                  return (
                    <tr key={mod.id}>
                      <td>
                        <span className="badge-pill purple font-bold">
                          #{mod.order || 1}
                        </span>
                      </td>
                      <td>
                        <div>
                          <div className="font-bold text-sm text-gray-900">{mod.name}</div>
                          <span className="text-xs text-muted">Chapter ID: {mod.id}</span>
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
                        <span className="badge-pill info font-semibold">
                          {modTopics.length} {modTopics.length === 1 ? 'Topic' : 'Topics'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            className="btn-outline-sm text-xs py-1 px-2 flex items-center gap-1 font-semibold"
                            onClick={() => onNavigate && onNavigate('topics')}
                            title="Add Topic to this Chapter"
                          >
                            <Plus size={12} /> Topic
                          </button>
                          <button
                            className="icon-btn"
                            onClick={() => handleOpenEdit(mod)}
                            title="Edit Chapter"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="icon-btn danger"
                            onClick={() => handleDelete(mod.id, mod.name)}
                            title="Delete Chapter"
                          >
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
