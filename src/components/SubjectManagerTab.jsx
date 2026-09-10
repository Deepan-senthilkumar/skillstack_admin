import { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Edit2, Trash2, ArrowLeft, Check,
  Search, Filter, Sparkles, CheckCircle2, AlertCircle, Layers,
  Clock, Calendar
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import PaginationControls from './PaginationControls';

const slugify = (text) => {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

export default function SubjectManagerTab({ user }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    duration: '8 Weeks',
    schedule_type: '3 days class + 3 days lab per week',
    level: 'Beginner to Advanced',
    icon: 'code',
    is_active: true,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const res = await api.getSubjects();
      const safe = Array.isArray(res) ? res : (res?.results || []);
      setSubjects(safe);
    } catch (e) {
      console.error('Failed to load subjects', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      duration: '8 Weeks',
      schedule_type: '3 days class + 3 days lab per week',
      level: 'Beginner to Advanced',
      icon: 'code',
      is_active: true,
    });
    setFieldErrors({});
    setViewMode('form');
  };

  const handleOpenEdit = (sub) => {
    setEditingSubject(sub);
    setFormData({
      name: sub.name,
      slug: sub.slug,
      description: sub.description || '',
      duration: sub.duration || '8 Weeks',
      schedule_type: sub.schedule_type || '3 days class + 3 days lab per week',
      level: sub.level || 'Beginner to Advanced',
      icon: sub.icon || 'code',
      is_active: sub.is_active !== undefined ? sub.is_active : true,
    });
    setFieldErrors({});
    setViewMode('form');
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name || !formData.name.trim()) {
      errs.name = 'Subject / Course track name is required.';
    }
    if (!formData.duration || !formData.duration.trim()) {
      errs.duration = 'Estimated course duration is required.';
    }
    if (!formData.schedule_type || !formData.schedule_type.trim()) {
      errs.schedule_type = 'Weekly schedule structure is required.';
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
      const slug = formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const payload = { ...formData, slug };
      if (editingSubject) {
        const updated = await api.updateSubject(editingSubject.id, payload);
        setSubjects(prev => prev.map(s => s.id === editingSubject.id ? { ...s, ...(updated || payload) } : s));
        toast.success(`Subject "${formData.name}" updated successfully!`);
      } else {
        const created = await api.createSubject(payload);
        if (created && created.id) {
          setSubjects(prev => [created, ...prev]);
        }
        toast.success(`Subject "${formData.name}" created successfully!`);
      }
      setViewMode('list');
      await loadSubjects();
    } catch (err) {
      toast.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    const ok = await confirm({
      title: 'Delete Subject Track?',
      message: `Are you sure you want to permanently delete "${name}"? This will remove all associated modules, topics, and exercises.`,
      confirmText: 'Delete Subject',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!ok) return;

    // Instant UI update
    const prevSubjects = [...subjects];
    setSubjects(prev => prev.filter(s => s.id !== id));
    toast.success(`Subject "${name}" deleted.`);

    // Background delete
    api.deleteSubject(id).catch(e => {
      setSubjects(prevSubjects);
      toast.error('Failed to delete subject on server: ' + (e?.message || e || 'Error'));
    });
  };

  const filteredSubjects = subjects.filter(s => {
    const q = (searchQuery || '').toLowerCase();
    return (s.name || '').toLowerCase().includes(q) || (s.slug || '').toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q);
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredSubjects.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedSubjects = filteredSubjects.slice(startIndex, startIndex + pageSize);

  // DEDICATED IN-PAGE SUBJECT FORM VIEW
  if (viewMode === 'form') {
    return (
      <div className="tab-pane-container animate-fade-in">
        <div className="tab-pane-header">
          <div className="flex items-center gap-3">
            <button className="btn-outline-sm" onClick={() => setViewMode('list')}>
              <ArrowLeft size={16} /> Back to Subjects
            </button>
            <div>
              <h2>{editingSubject ? `Edit Subject: ${editingSubject.name}` : 'Create New Master Subject'}</h2>
              <p className="text-muted">
                Define master curriculum subject tracks with schedules and skill levels.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-layout-2col mt-4">
              {/* Left Column: Form Details Card */}
              <div className="form-card-main">
                <div className="form-group">
                  <label>Subject / Course Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Advanced MS Excel, Python Programming, Tally Prime"
                    value={formData.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setFormData({
                        ...formData,
                        name: newName,
                        slug: slugify(newName)
                      });
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
                    <label>URL Slug / Unique Key (Auto-Generated)</label>
                    <input
                      type="text"
                      readOnly
                      placeholder="auto-generated-slug"
                      value={formData.slug}
                      className="form-input font-mono text-sm bg-slate-50 dark:bg-slate-800/60 text-muted cursor-not-allowed select-all"
                    />
                  </div>

                  <div className="form-group">
                    <label>Skill Level</label>
                    <select
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                      className="form-select font-semibold"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Beginner to Advanced">Beginner to Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Estimated Duration *</label>
                    <input
                      type="text"
                      placeholder="e.g. 4 Weeks or 45 Days"
                      value={formData.duration}
                      onChange={(e) => {
                        setFormData({ ...formData, duration: e.target.value });
                        if (fieldErrors.duration) setFieldErrors({ ...fieldErrors, duration: '' });
                      }}
                      className={`form-input ${fieldErrors.duration ? 'input-error' : ''}`}
                    />
                    {fieldErrors.duration && (
                      <span className="field-error-msg"><AlertCircle size={13} /> {fieldErrors.duration}</span>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['4 Weeks', '6 Weeks', '8 Weeks', '12 Weeks', '45 Days'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          className="quick-select-chip"
                          onClick={() => {
                            setFormData({ ...formData, duration: d });
                            if (fieldErrors.duration) setFieldErrors({ ...fieldErrors, duration: '' });
                          }}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Weekly Schedule Structure *</label>
                    <input
                      type="text"
                      placeholder="e.g. Mon to Fri Daily Practical Labs"
                      value={formData.schedule_type}
                      onChange={(e) => {
                        setFormData({ ...formData, schedule_type: e.target.value });
                        if (fieldErrors.schedule_type) setFieldErrors({ ...fieldErrors, schedule_type: '' });
                      }}
                      className={`form-input ${fieldErrors.schedule_type ? 'input-error' : ''}`}
                    />
                    {fieldErrors.schedule_type && (
                      <span className="field-error-msg"><AlertCircle size={13} /> {fieldErrors.schedule_type}</span>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['3 days class + 3 days lab per week', 'Mon to Fri Daily Classes', 'Weekend Intensive Bootcamp'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="quick-select-chip"
                          onClick={() => {
                            setFormData({ ...formData, schedule_type: s });
                            if (fieldErrors.schedule_type) setFieldErrors({ ...fieldErrors, schedule_type: '' });
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Course Syllabus Overview & Study Objectives</label>
                  <textarea
                    rows={5}
                    placeholder="Detail the modules, real-world projects, and skills students will master..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-textarea"
                  />
                </div>
              </div>

              {/* Right Column: Live Card Preview */}
              <div className="preview-sticky-box">
                <div className="preview-header-label">
                  <Sparkles size={14} />
                  <span>Live Subject Card Preview</span>
                </div>

                <div className="live-preview-card">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="badge-pill purple">{formData.slug || 'slug-key'}</span>
                    <span className="badge-pill info">{formData.level}</span>
                  </div>

                  <h3>
                    {formData.name || 'Subject Track Title'}
                  </h3>

                  <p className="text-xs text-muted mb-3 line-clamp-3 leading-relaxed">
                    {formData.description || 'Subject description will appear live here...'}
                  </p>

                  <div className="preview-specs-box">
                    <div className="preview-spec-row">
                      <div className="preview-spec-label"><Clock size={13} /> Estimated Duration</div>
                      <div className="preview-spec-value text-purple-900">{formData.duration || 'TBD'}</div>
                    </div>
                    <div className="preview-spec-row">
                      <div className="preview-spec-label"><Calendar size={13} /> Weekly Schedule</div>
                      <div className="preview-spec-value text-emerald-700">{formData.schedule_type || 'TBD'}</div>
                    </div>
                  </div>
                </div>

                <div className="preview-action-buttons">
                  <button type="submit" className="btn-save-primary" disabled={saving}>
                    <Check size={16} />
                    <span>{saving ? 'Saving Subject…' : (editingSubject ? 'Update Subject' : 'Save Subject')}</span>
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

  return (
    <div className="tab-pane-container">
      {/* Header */}
      <div className="tab-pane-header">
        <div>
          <h2>Master Subjects Catalog</h2>
          <p className="text-muted">
            Manage all teaching subjects (Excel, MS Word, Tally, Python, C, Web Development, etc.) dynamically.
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Add New Subject
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="filter-bar-unified">
        <div className="filter-search-box">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Search subjects by name, slug, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <span className="text-xs font-semibold text-muted whitespace-nowrap">
          {filteredSubjects.length} of {subjects.length} Subjects Active
        </span>
      </div>

      {/* Subjects Table */}
      <div className="dashboard-section-card mt-4">
        {loading ? (
          <div className="loading-state">Loading subjects catalog…</div>
        ) : filteredSubjects.length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-icon-bubble">
              <BookOpen size={32} />
            </div>
            <h3>No Subjects Found</h3>
            <p>No master subjects match your search. Create a new curriculum track to get started.</p>
            <button className="btn-save-primary mt-2" onClick={handleOpenCreate}>
              <Plus size={16} /> Add New Subject
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Subject Track</th>
                  <th>Level</th>
                  <th>Duration</th>
                  <th>Weekly Schedule</th>
                  <th>Modules & Topics</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSubjects.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <div>
                        <div className="font-bold text-sm text-gray-900">{sub.name}</div>
                        <span className="text-xs font-mono text-muted">{sub.slug}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge-pill info">{sub.level || 'Beginner'}</span>
                    </td>
                    <td className="font-semibold text-primary text-sm">{sub.duration}</td>
                    <td className="text-xs text-muted">{sub.schedule_type}</td>
                    <td>
                      <span className="badge-pill purple font-semibold">
                        {sub.topic_count || (sub.modules?.reduce((acc, m) => acc + (m.topics?.length || 0), 0)) || 0} Topics
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button className="icon-btn" onClick={() => handleOpenEdit(sub)} title="Edit Subject">
                          <Edit2 size={13} />
                        </button>
                        <button className="icon-btn danger" onClick={() => handleDelete(sub.id, sub.name)} title="Delete Subject">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationControls
              currentPage={safeCurrentPage}
              totalItems={filteredSubjects.length}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              itemName="subjects"
            />
          </div>
        )}
      </div>
    </div>
  );
}
