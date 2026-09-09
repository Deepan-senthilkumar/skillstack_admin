import { useState, useEffect, useRef } from 'react';
import {
  FileText, Plus, Edit2, Trash2, ArrowLeft, Check,
  Search, Filter, Sparkles, BookOpen, Layers, AlertCircle,
  FolderPlus, ArrowUpRight, Image, Upload, X, Eye
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

export default function TopicManagerTab({ user, onNavigate }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editingTopic, setEditingTopic] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    module: '',
    topic_id: '',
    title: '',
    notes_content: '',
    order: 1,
  });

  // Image upload state
  const [topicImages, setTopicImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageCaption, setImageCaption] = useState('');
  const imageInputRef = useRef(null);

  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [quickChapterOpen, setQuickChapterOpen] = useState(false);
  const [quickChapterData, setQuickChapterData] = useState({ name: '', level: 'beginner' });
  const [creatingQuickChapter, setCreatingQuickChapter] = useState(false);

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
      console.error('Failed to load topic manager data', e);
      toast.error('Failed to load topics directory.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    const defaultSub = selectedSubjectFilter !== 'ALL'
      ? selectedSubjectFilter
      : (subjects[0]?.id ? String(subjects[0].id) : '');
    const availableMods = modules.filter(m => String(m.subject) === String(defaultSub));

    setEditingTopic(null);
    setFormData({
      subject: defaultSub,
      module: availableMods[0]?.id ? String(availableMods[0].id) : '',
      topic_id: '',
      title: '',
      notes_content: '',
      order: topics.length + 1,
    });
    setFieldErrors({});
    setQuickChapterOpen(false);
    setTopicImages([]);
    setImageCaption('');
    setViewMode('form');
  };

  const handleOpenEdit = (t) => {
    setEditingTopic(t);
    const modObj = modules.find(m => m.id === t.module || m.id === t.module?.id);
    const subId = modObj?.subject || modObj?.subject?.id || t.subject_id || (subjects[0]?.id ? String(subjects[0].id) : '');

    setFormData({
      subject: String(subId),
      module: String(t.module || t.module?.id || ''),
      topic_id: t.topic_id,
      title: t.title,
      notes_content: t.notes_content || '',
      order: t.order || 1,
    });
    setFieldErrors({});
    setQuickChapterOpen(false);
    // Load existing images for this topic
    setTopicImages(t.images || []);
    setImageCaption('');
    setViewMode('form');
  };

  const handleSubjectChange = (subId) => {
    const availableMods = modules.filter(m => String(m.subject) === String(subId));
    setFormData(prev => ({
      ...prev,
      subject: subId,
      module: availableMods[0]?.id ? String(availableMods[0].id) : ''
    }));
    if (fieldErrors.subject) setFieldErrors(prev => ({ ...prev, subject: '' }));
  };

  const handleCreateQuickChapter = async (e) => {
    if (e) e.preventDefault();
    if (!formData.subject) {
      toast.error('Please select a parent subject first.');
      return;
    }
    if (!quickChapterData.name || !quickChapterData.name.trim()) {
      toast.error('Please enter a chapter name.');
      return;
    }

    setCreatingQuickChapter(true);
    try {
      const parentSubId = parseInt(formData.subject);
      const curMods = modules.filter(m => String(m.subject) === String(parentSubId));
      const created = await api.createModule({
        subject: parentSubId,
        name: quickChapterData.name.trim(),
        level: quickChapterData.level || 'beginner',
        order: curMods.length + 1,
      });

      const parentSub = subjects.find(s => s.id === parentSubId);
      const newMod = {
        ...created,
        subject: parentSubId,
        subject_name: parentSub?.name || 'Subject'
      };

      setModules(prev => [...prev, newMod]);
      setFormData(prev => ({ ...prev, module: String(created.id) }));
      if (fieldErrors.module) setFieldErrors(prev => ({ ...prev, module: '' }));
      setQuickChapterOpen(false);
      setQuickChapterData({ name: '', level: 'beginner' });
      toast.success(`Chapter "${created.name}" created and selected!`);
    } catch (err) {
      toast.error(err);
    } finally {
      setCreatingQuickChapter(false);
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.subject) {
      errs.subject = 'Please select a parent Subject track.';
    }
    if (!formData.module) {
      errs.module = 'Please select or create a Chapter / Module for this topic.';
    }
    if (!formData.title || !formData.title.trim()) {
      errs.title = 'Topic title is required.';
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
      const topicSlug = formData.topic_id.trim() || slugify(formData.title);
      const payload = {
        module: parseInt(formData.module),
        topic_id: topicSlug,
        title: formData.title.trim(),
        notes_content: formData.notes_content || '',
        order: parseInt(formData.order) || 1
      };

      if (editingTopic) {
        await api.updateTopic(editingTopic.id, payload);
        toast.success(`Topic "${formData.title}" updated successfully!`);
      } else {
        const created = await api.createTopic(payload);
        if (created && created.id) {
          setTopics(prev => [...prev, created]);
        }
        toast.success(`Topic "${formData.title}" created successfully!`);
      }
      setViewMode('list');
      await loadAllData();
    } catch (err) {
      toast.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    const ok = await confirm({
      title: 'Delete Topic & Notes?',
      message: `Are you sure you want to delete topic "${title}" and all its attached practice problems?`,
      confirmText: 'Delete Topic',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await api.deleteTopic(id);
      setTopics(prev => prev.filter(t => t.id !== id));
      toast.success(`Topic "${title}" deleted successfully.`);
      await loadAllData();
    } catch (e) {
      toast.error(e);
    }
  };

  const availableModulesForForm = modules.filter(m =>
    !formData.subject || String(m.subject) === String(formData.subject)
  );

  const filteredTopics = topics.filter(t => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = (t.title || '').toLowerCase().includes(q) || (t.topic_id || '').toLowerCase().includes(q);
    const modObj = modules.find(m => m.id === t.module || m.id === t.module?.id);
    const subId = modObj?.subject || modObj?.subject?.id || t.subject_id;
    const matchesSubject = selectedSubjectFilter === 'ALL' || String(subId) === String(selectedSubjectFilter);
    return matchesSearch && matchesSubject;
  });

  const totalPages = Math.ceil(filteredTopics.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedTopics = filteredTopics.slice(startIndex, startIndex + pageSize);

  // ----------------------------------------------------
  // DEDICATED IN-PAGE TOPIC FORM VIEW
  // ----------------------------------------------------
  if (viewMode === 'form') {
    const selectedSubObj = subjects.find(s => String(s.id) === String(formData.subject));
    const selectedModObj = modules.find(m => String(m.id) === String(formData.module));

    return (
      <div className="tab-pane-container animate-fade-in">
        <div className="tab-pane-header">
          <div className="flex items-center gap-3">
            <button className="btn-outline-sm" onClick={() => setViewMode('list')}>
              <ArrowLeft size={16} /> Back to Topics Table
            </button>
            <div>
              <h2>{editingTopic ? `Edit Topic: ${editingTopic.title}` : 'Create New Curriculum Topic'}</h2>
              <p className="text-muted">
                Add study material, theory explanations, and interactive documentation for student learning.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-layout-2col mt-4">
            {/* Left Column: Form Details in Card */}
            <div className="form-card-main">
              <div className="form-row-2">
                <div className="form-group">
                  <label>Parent Subject Track *</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className={`form-select font-semibold ${fieldErrors.subject ? 'input-error' : ''}`}
                  >
                    <option value="">-- Select Subject --</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {fieldErrors.subject && (
                    <span className="field-error-msg"><AlertCircle size={13} /> {fieldErrors.subject}</span>
                  )}
                </div>

                <div className="form-group">
                  <div className="flex items-center justify-between mb-1">
                    <label className="mb-0">Module / Chapter *</label>
                    {formData.subject && (
                      <button
                        type="button"
                        onClick={() => setQuickChapterOpen(!quickChapterOpen)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          borderRadius: '999px',
                          border: quickChapterOpen ? '1.5px solid #7B1C6E' : '1.5px solid rgba(123,28,110,0.35)',
                          background: quickChapterOpen ? '#7B1C6E' : 'rgba(123,28,110,0.06)',
                          color: quickChapterOpen ? '#FFFFFF' : '#7B1C6E',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          letterSpacing: '0.01em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Plus size={11} /> {quickChapterOpen ? 'Close' : 'Quick Add Chapter'}
                      </button>
                    )}
                  </div>

                  {quickChapterOpen && (
                    <div className="p-3 mb-2 rounded-xl bg-purple-50 border border-purple-200 animate-fade-in">
                      <div className="text-xs font-bold text-primary mb-2 flex items-center gap-1">
                        <FolderPlus size={14} /> Quick Create Chapter in {selectedSubObj?.name || 'Selected Subject'}
                      </div>
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Chapter 1: Introduction & Basics"
                          value={quickChapterData.name}
                          onChange={(e) => setQuickChapterData({ ...quickChapterData, name: e.target.value })}
                          className="form-input text-xs"
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <select
                            value={quickChapterData.level}
                            onChange={(e) => setQuickChapterData({ ...quickChapterData, level: e.target.value })}
                            className="form-select text-xs py-1.5"
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                          <button
                            type="button"
                            className="btn-save-primary text-xs py-1 px-3 whitespace-nowrap"
                            onClick={handleCreateQuickChapter}
                            disabled={creatingQuickChapter}
                          >
                            {creatingQuickChapter ? 'Creating...' : 'Create & Select'}
                          </button>
                          <button
                            type="button"
                            className="btn-cancel-outline text-xs py-1 px-2"
                            onClick={() => setQuickChapterOpen(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {availableModulesForForm.length === 0 && formData.subject && !quickChapterOpen ? (
                    <div className="p-2.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs flex flex-col gap-1.5">
                      <span>No chapters in this subject yet.</span>
                      <button
                        type="button"
                        className="btn-save-primary text-xs py-1 px-2.5 w-fit"
                        onClick={() => setQuickChapterOpen(true)}
                      >
                        <Plus size={13} /> + Create Chapter Now
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formData.module}
                      onChange={(e) => {
                        setFormData({ ...formData, module: e.target.value });
                        if (fieldErrors.module) setFieldErrors({ ...fieldErrors, module: '' });
                      }}
                      className={`form-select font-semibold ${fieldErrors.module ? 'input-error' : ''}`}
                    >
                      <option value="">-- Select Module / Chapter --</option>
                      {availableModulesForForm.map(m => (
                        <option key={m.id} value={m.id}>
                          Chapter #{m.order || 1}: {m.name} ({m.level ? m.level.charAt(0).toUpperCase() + m.level.slice(1) : 'Beginner'})
                        </option>
                      ))}
                    </select>
                  )}
                  {fieldErrors.module && (
                    <span className="field-error-msg"><AlertCircle size={13} /> {fieldErrors.module}</span>
                  )}
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Topic Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. VLOOKUP & Dynamic Formulas or Pointers in C"
                    value={formData.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setFormData({
                        ...formData,
                        title: newTitle,
                        topic_id: slugify(newTitle)
                      });
                      if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: '' });
                    }}
                    className={`form-input text-base font-semibold ${fieldErrors.title ? 'input-error' : ''}`}
                  />
                  {fieldErrors.title && (
                    <span className="field-error-msg"><AlertCircle size={13} /> {fieldErrors.title}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Topic Slug / Key (Auto-Generated)</label>
                  <input
                    type="text"
                    readOnly
                    placeholder="auto-generated-topic-slug"
                    value={formData.topic_id}
                    className="form-input font-mono text-sm bg-slate-50 text-muted cursor-not-allowed select-all"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Sequence Order</label>
                <input
                  type="number"
                  min="1"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                  className="form-input max-w-xs font-semibold"
                />
              </div>

              <div className="form-group mt-3">
                <label>Study Notes Content (Markdown Supported)</label>
                <textarea
                  rows={12}
                  placeholder="# Topic Overview&#10;&#10;Key concepts, step-by-step instructions, and syntax guidelines for students..."
                  value={formData.notes_content}
                  onChange={(e) => setFormData({ ...formData, notes_content: e.target.value })}
                  className="form-textarea font-mono text-xs leading-relaxed"
                />
              </div>

              {/* ====== IMAGE UPLOAD SECTION ====== */}
              {editingTopic && (
                <div className="form-group mt-4" style={{ border: '1.5px dashed #CBD5E1', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Image size={16} color="#7B1C6E" />
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>Topic Images</span>
                    <span style={{ fontSize: '12px', color: '#64748B', marginLeft: '4px' }}>— shown to students in the guide section</span>
                  </div>

                  {/* Existing images */}
                  {topicImages.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                      {topicImages.map(img => (
                        <div key={img.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #E2E8F0', background: '#F8FAFC' }}>
                          <img
                            src={img.image_url}
                            alt={img.caption || 'Topic image'}
                            style={{ width: '160px', height: '120px', objectFit: 'cover', display: 'block' }}
                          />
                          {img.caption && (
                            <div style={{ padding: '4px 8px', fontSize: '11px', color: '#475569', borderTop: '1px solid #E2E8F0' }}>
                              {img.caption}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm('Delete this image?')) return;
                              try {
                                await api.deleteTopicImage(img.id);
                                setTopicImages(prev => prev.filter(i => i.id !== img.id));
                                toast.success('Image deleted.');
                              } catch (e) {
                                toast.error('Failed to delete image.');
                              }
                            }}
                            style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <X size={12} color="white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload new image */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Caption (optional) — e.g. Django Request-Response Flow"
                      value={imageCaption}
                      onChange={(e) => setImageCaption(e.target.value)}
                      className="form-input text-sm"
                    />
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingImage(true);
                          try {
                            const fd = new FormData();
                            fd.append('image', file);
                            fd.append('caption', imageCaption);
                            fd.append('order', topicImages.length + 1);
                            const newImg = await api.uploadTopicImage(editingTopic.id, fd);
                            setTopicImages(prev => [...prev, newImg]);
                            setImageCaption('');
                            toast.success('Image uploaded successfully!');
                          } catch (err) {
                            toast.error('Upload failed: ' + (err.message || 'Unknown error'));
                          } finally {
                            setUploadingImage(false);
                            if (imageInputRef.current) imageInputRef.current.value = '';
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn-outline-sm"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploadingImage}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                      >
                        <Upload size={14} />
                        {uploadingImage ? 'Uploading...' : 'Upload Image'}
                      </button>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>JPG, PNG, GIF, WebP — max 5MB</span>
                    </div>
                  </div>
                </div>
              )}
              {!editingTopic && (
                <div style={{ marginTop: '12px', padding: '12px 16px', background: '#F0F9FF', borderRadius: '10px', fontSize: '12.5px', color: '#0369A1', border: '1px solid #BAE6FD' }}>
                  <Image size={13} style={{ display: 'inline', marginRight: '6px' }} />
                  💡 Save this topic first, then re-open it to upload images.
                </div>
              )}
            </div>

            {/* Right Column: Live Topic Card Preview */}
            <div className="preview-sticky-box">
              <div className="preview-header-label">
                <Sparkles size={14} />
                <span>Live Topic Card Preview</span>
              </div>

              <div className="live-preview-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="topic-icon-wrap">
                    <FileText size={15} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 leading-snug">
                      {formData.title || 'Topic Title Preview'}
                    </h4>
                    <span className="badge-pill purple font-mono text-xs mt-1">#{formData.topic_id || 'topic-id'}</span>
                  </div>
                </div>

                <div className="preview-specs-box">
                  <div className="preview-spec-row">
                    <div className="preview-spec-label"><BookOpen size={13} /> Parent Subject</div>
                    <div className="preview-spec-value text-purple-900">{selectedSubObj?.name || 'Subject'}</div>
                  </div>
                  <div className="preview-spec-row">
                    <div className="preview-spec-label"><Layers size={13} /> Module / Chapter</div>
                    <div className="preview-spec-value">{selectedModObj?.name || 'Module'}</div>
                  </div>
                  <div className="preview-spec-row">
                    <div className="preview-spec-label"><FileText size={13} /> Notes Content Length</div>
                    <div className="preview-spec-value text-emerald-700">{formData.notes_content?.length || 0} characters</div>
                  </div>
                </div>
              </div>

              <div className="preview-action-buttons">
                <button type="submit" className="btn-save-primary" disabled={saving}>
                  <Check size={16} />
                  <span>{saving ? 'Saving Topic…' : (editingTopic ? 'Update Topic' : 'Save Topic')}</span>
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
  // MAIN TOPICS TABLE VIEW
  // ----------------------------------------------------
  return (
    <div className="tab-pane-container">
      {/* Header */}
      <div className="tab-pane-header">
        <div>
          <h2>Topics & Study Notes Management</h2>
          <p className="text-muted">
            Create and organize lecture topics, chapter guides, and rich study notes across all subject curriculums.
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Add New Topic
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar-unified">
        <div className="filter-search-box">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Search topics by title, slug, or content..."
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
            <option value="ALL">All Subjects ({topics.length} Topics)</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Topics Table */}
      <div className="dashboard-section-card mt-4">
        {loading ? (
          <div className="loading-state">Loading topics directory…</div>
        ) : filteredTopics.length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-icon-bubble">
              <FileText size={32} />
            </div>
            <h3>No Topics Found</h3>
            <p>No study topics found for the selected filter. Create a new lecture topic to build the syllabus.</p>
            <button className="btn-save-primary mt-2" onClick={handleOpenCreate}>
              <Plus size={16} /> Add New Topic
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Topic Title & Identifier</th>
                  <th>Parent Subject</th>
                  <th>Module / Chapter</th>
                  <th>Order</th>
                  <th>Notes Length</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTopics.map((t) => {
                  const modObj = modules.find(m => m.id === t.module || m.id === t.module?.id);
                  const subObj = subjects.find(s => s.id === modObj?.subject || s.id === modObj?.subject?.id || s.id === t.subject_id);

                  return (
                    <tr key={t.id}>
                      <td>
                        <div>
                          <div className="font-bold text-sm text-gray-900">{t.title}</div>
                          <span className="text-xs font-mono text-muted">{t.topic_id}</span>
                        </div>
                      </td>
                      <td>
                        <span className="font-semibold text-sm text-gray-800">
                          {subObj?.name || t.subject_name || 'Unassigned'}
                        </span>
                      </td>
                      <td>
                        <span className="badge-pill purple text-xs">
                          {modObj?.name || t.module_name || 'Chapter Unit'}
                        </span>
                      </td>
                      <td>
                        <span className="font-semibold text-sm text-primary">
                          #{t.order || 1}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-muted">
                          {t.notes_content ? `${t.notes_content.length} chars` : 'No notes'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            className="icon-btn"
                            onClick={() => handleOpenEdit(t)}
                            title="Edit Topic"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="icon-btn danger"
                            onClick={() => handleDelete(t.id, t.title)}
                            title="Delete Topic"
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
              totalItems={filteredTopics.length}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              itemName="topics"
            />
          </div>
        )}
      </div>
    </div>
  );
}
