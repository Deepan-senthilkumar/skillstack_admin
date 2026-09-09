import { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Edit2, Trash2, Code2,
  FileText, Layers, CheckCircle2, ChevronRight, X, AlertCircle, Sparkles,
  ArrowLeft, Check, LayoutGrid, Clock, Calendar, ShieldCheck, Terminal
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

const slugify = (text) => {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

export default function CourseManagerTab({ user }) {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'course_form'

  // Course Form State
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseFormData, setCourseFormData] = useState({
    name: '',
    slug: '',
    description: '',
    duration: '8 Weeks',
    schedule_type: '3 days class + 3 days lab per week',
    level: 'Beginner to Advanced',
    icon: 'code',
  });

  // Topic Modal
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicFormData, setTopicFormData] = useState({
    module: '',
    topic_id: '',
    title: '',
    notes_content: '',
    order: 1,
  });

  // Problem / Practice Program Modal
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [problemFormData, setProblemFormData] = useState({
    topic: '',
    title: '',
    description: '',
    language: 'python',
    expected_output: '',
    expected_output_hint: '',
    points: 10,
    order: 1,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await api.getSubjects();
      const safe = Array.isArray(res) ? res : (res.results || []);
      setCourses(safe);
      if (safe.length > 0) {
        if (!selectedCourse || !safe.find(c => c.id === selectedCourse.id)) {
          setSelectedCourse(safe[0]);
        } else {
          setSelectedCourse(safe.find(c => c.id === selectedCourse.id));
        }
      }
    } catch (e) {
      console.error('Failed to load courses', e);
    } finally {
      setLoading(false);
    }
  };

  // Course Actions (In-Page View)
  const handleOpenCreateCourse = () => {
    setEditingCourse(null);
    setCourseFormData({
      name: '',
      slug: '',
      description: '',
      duration: '8 Weeks',
      schedule_type: '3 days class + 3 days lab per week',
      level: 'Beginner to Advanced',
      icon: 'code',
    });
    setErrorMsg('');
    setViewMode('course_form');
  };

  const handleOpenEditCourse = (c) => {
    setEditingCourse(c);
    setCourseFormData({
      name: c.name,
      slug: c.slug,
      description: c.description,
      duration: c.duration,
      schedule_type: c.schedule_type,
      level: c.level,
      icon: c.icon || 'code',
    });
    setErrorMsg('');
    setViewMode('course_form');
  };

  const validateCourseForm = () => {
    const errs = {};
    if (!courseFormData.name || !courseFormData.name.trim()) {
      errs.name = 'Course track name is required.';
    }
    if (!courseFormData.duration || !courseFormData.duration.trim()) {
      errs.duration = 'Course duration is required (e.g. 8 Weeks).';
    }
    if (!courseFormData.schedule_type || !courseFormData.schedule_type.trim()) {
      errs.schedule_type = 'Class and lab schedule is required.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!validateCourseForm()) {
      toast.error('Please fill in all mandatory fields highlighted in red.');
      return;
    }
    setSaving(true);
    try {
      const slug = courseFormData.slug.trim() || courseFormData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const payload = { ...courseFormData, slug };
      let savedCourse;
      if (editingCourse) {
        savedCourse = await api.updateSubject(editingCourse.id, payload);
        toast.success(`Course "${courseFormData.name}" updated successfully!`);
      } else {
        savedCourse = await api.createSubject(payload);
        toast.success(`Course "${courseFormData.name}" created successfully!`);
      }
      setViewMode('list');
      await loadCourses();
      if (savedCourse) setSelectedCourse(savedCourse);
    } catch (err) {
      toast.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (id, name) => {
    if (!window.confirm(`Delete course "${name}" and all its topics/practice programs?`)) return;
    try {
      await api.deleteSubject(id);
      toast.success(`Course "${name}" deleted successfully.`);
      await loadCourses();
    } catch (e) {
      toast.error(e);
    }
  };

  // Topic Actions
  const handleOpenCreateTopic = (moduleItem) => {
    setEditingTopic(null);
    setTopicFormData({
      module: moduleItem.id,
      topic_id: `topic-${Date.now().toString().slice(-4)}`,
      title: '',
      notes_content: '',
      order: (moduleItem.topics?.length || 0) + 1,
    });
    setFieldErrors({});
    setViewMode('topic_form');
  };

  const handleOpenEditTopic = (t) => {
    setEditingTopic(t);
    setTopicFormData({
      module: t.module,
      topic_id: t.topic_id,
      title: t.title,
      notes_content: t.notes_content || '',
      order: t.order || 1,
    });
    setFieldErrors({});
    setViewMode('topic_form');
  };

  const validateTopicForm = () => {
    const errs = {};
    if (!topicFormData.title || !topicFormData.title.trim()) {
      errs.title = 'Topic title is required.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveTopic = async (e) => {
    e.preventDefault();
    if (!validateTopicForm()) {
      toast.error('Please fill in mandatory fields highlighted in red.');
      return;
    }
    setSaving(true);
    try {
      if (editingTopic) {
        await api.updateTopic(editingTopic.id, topicFormData);
        toast.success(`Topic "${topicFormData.title}" updated successfully!`);
      } else {
        await api.createTopic(topicFormData);
        toast.success(`Topic "${topicFormData.title}" created successfully!`);
      }
      setViewMode('list');
      await loadCourses();
    } catch (err) {
      toast.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTopic = async (id) => {
    if (!window.confirm('Delete this topic?')) return;
    try {
      await api.deleteTopic(id);
      toast.success('Topic deleted successfully.');
      await loadCourses();
    } catch (e) {
      toast.error(e);
    }
  };

  // Problem / Practice Program Actions
  const handleOpenCreateProblem = (topicId) => {
    setEditingProblem(null);
    setProblemFormData({
      topic: topicId,
      title: '',
      description: '',
      language: selectedCourse?.slug?.includes('c-') ? 'c' : selectedCourse?.slug?.includes('js') ? 'javascript' : 'python',
      expected_output: '',
      expected_output_hint: '',
      starter_code: '',
      points: 10,
      order: 1,
    });
    setFieldErrors({});
    setViewMode('problem_form');
  };

  const handleOpenEditProblem = (p) => {
    setEditingProblem(p);
    setProblemFormData({
      topic: p.topic,
      title: p.title,
      description: p.description,
      language: p.language || 'python',
      expected_output: p.expected_output || '',
      expected_output_hint: p.expected_output_hint || '',
      starter_code: p.starter_code || '',
      points: p.points || 10,
      order: p.order || 1,
    });
    setFieldErrors({});
    setViewMode('problem_form');
  };

  const validateProblemForm = () => {
    const errs = {};
    if (!problemFormData.title || !problemFormData.title.trim()) {
      errs.title = 'Program / task title is required.';
    }
    if (!problemFormData.description || !problemFormData.description.trim()) {
      errs.description = 'Task instructions and details are required.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProblem = async (e) => {
    e.preventDefault();
    if (!validateProblemForm()) {
      toast.error('Please fill in mandatory fields highlighted in red.');
      return;
    }
    setSaving(true);
    try {
      if (editingProblem) {
        await api.updateProblem(editingProblem.id, problemFormData);
        toast.success(`Lab task "${problemFormData.title}" updated successfully!`);
      } else {
        await api.createProblem(problemFormData);
        toast.success(`Lab task "${problemFormData.title}" created successfully!`);
      }
      setViewMode('list');
      await loadCourses();
    } catch (err) {
      toast.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProblem = async (id) => {
    if (!window.confirm('Delete this practice program?')) return;
    try {
      await api.deleteProblem(id);
      toast.success('Lab task deleted successfully.');
      await loadCourses();
    } catch (e) {
      toast.error(e);
    }
  };

  // IN-PAGE DEDICATED COURSE CREATION / EDIT VIEW
  if (viewMode === 'course_form') {
    return (
      <div className="tab-pane-container animate-fade-in">
        {/* Header with Back Button */}
        <div className="tab-pane-header">
          <div className="flex items-center gap-3">
            <button
              className="btn-outline-sm"
              onClick={() => setViewMode('list')}
            >
              <ArrowLeft size={16} /> Back to Catalog
            </button>
            <div>
              <h2>{editingCourse ? `Edit Course: ${editingCourse.name}` : 'Create New Course & Syllabus'}</h2>
              <p className="text-muted">
                {editingCourse ? 'Update curriculum specs, duration, schedule, and course overview.' : 'Add a new programming language or framework track to the SkillStack catalog.'}
              </p>
            </div>
          </div>
        </div>

        <div className="course-form-page-container">
          <form onSubmit={handleSaveCourse}>
            {errorMsg && (
              <div className="alert-box danger mb-4 flex items-center gap-2 p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="template-presets-box">
              <span className="preset-header-title">
                <Sparkles size={14} /> Quick Subject & Course Presets (Click to autofill)
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  {
                    label: '📊 Advanced MS Excel',
                    name: 'Advanced MS Excel & Data Analytics',
                    slug: 'advanced-ms-excel',
                    duration: '4 Weeks',
                    schedule_type: 'Mon to Fri Daily Practical Labs',
                    level: 'Beginner to Advanced',
                    icon: 'excel',
                    description: 'Master spreadsheet formulas (VLOOKUP, XLOOKUP, INDEX-MATCH), Pivot Tables, Conditional Formatting, Data Visualization, and Dashboards.'
                  },
                  {
                    label: '📄 MS Word & Office',
                    name: 'MS Word & Professional Office Documentation',
                    slug: 'ms-word-office',
                    duration: '3 Weeks',
                    schedule_type: '3 days class + 2 days lab per week',
                    level: 'Beginner to Intermediate',
                    icon: 'word',
                    description: 'Official document formatting, mail merge, tables, typography styles, cover letters, invoices, and executive reports.'
                  },
                  {
                    label: '💰 Tally Prime & GST',
                    name: 'Tally Prime & GST Accounting',
                    slug: 'tally-prime-accounting',
                    duration: '6 Weeks',
                    schedule_type: 'Mon, Wed, Fri - 10:00 AM to 12:00 PM',
                    level: 'Beginner to Advanced',
                    icon: 'tally',
                    description: 'Computerized accounting, voucher entry, inventory management, GST computation, balance sheets, and audit reports.'
                  },
                  {
                    label: '🐍 Python Programming',
                    name: 'Python Programming & Data Structures',
                    slug: 'python-programming',
                    duration: '8 Weeks',
                    schedule_type: '3 days class + 3 days lab per week',
                    level: 'Beginner to Intermediate',
                    icon: 'python',
                    description: 'Complete Python from fundamentals to OOP, data structures, and script automation.'
                  },
                  {
                    label: '⚡ C Programming',
                    name: 'C Programming & Memory Architecture',
                    slug: 'c-programming',
                    duration: '6 Weeks',
                    schedule_type: '3 days class + 3 days lab per week',
                    level: 'Beginner',
                    icon: 'c',
                    description: 'Master core programming fundamentals, memory management, pointers, and problem solving in C.'
                  },
                  {
                    label: '🌐 Django Full Stack',
                    name: 'Django Web Framework & REST APIs',
                    slug: 'django-fullstack',
                    duration: '10 Weeks',
                    schedule_type: '4 days class + 2 days lab per week',
                    level: 'Intermediate to Advanced',
                    icon: 'django',
                    description: 'End-to-end backend engineering, REST APIs, authentication, and PostgreSQL.'
                  },
                  {
                    label: '🎨 Graphic Design',
                    name: 'Graphic Design (Photoshop & Illustrator)',
                    slug: 'graphic-design',
                    duration: '6 Weeks',
                    schedule_type: 'Mon to Fri Daily Practical Labs',
                    level: 'Beginner to Advanced',
                    icon: 'palette',
                    description: 'Professional visual design, photo manipulation, vector branding, typography, and advertising graphics.'
                  }
                ].map(preset => (
                  <button
                    key={preset.slug}
                    type="button"
                    className="template-preset-pill"
                    onClick={() => setCourseFormData({
                      name: preset.name,
                      slug: preset.slug,
                      duration: preset.duration,
                      schedule_type: preset.schedule_type,
                      level: preset.level,
                      icon: preset.icon,
                      description: preset.description
                    })}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-layout-2col">
              {/* Left Column: Form Fields in clean elevated card */}
              <div className="form-card-main">
                <div className="form-group">
                  <label>Course / Subject Track Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Advanced MS Excel, Python Programming, Tally Prime, Django"
                    value={courseFormData.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setCourseFormData({
                        ...courseFormData,
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
                    <label>URL Slug / Identifier (Auto-Generated)</label>
                    <input
                      type="text"
                      readOnly
                      placeholder="auto-generated-slug"
                      value={courseFormData.slug}
                      className="form-input font-mono text-sm bg-slate-50 dark:bg-slate-800/60 text-muted cursor-not-allowed select-all"
                    />
                  </div>

                  <div className="form-group">
                    <label>Skill Level</label>
                    <select
                      value={courseFormData.level}
                      onChange={(e) => setCourseFormData({ ...courseFormData, level: e.target.value })}
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
                    <label>Course Duration *</label>
                    <input
                      type="text"
                      placeholder="e.g. 8 Weeks or 45 Days"
                      value={courseFormData.duration}
                      onChange={(e) => {
                        setCourseFormData({ ...courseFormData, duration: e.target.value });
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
                            setCourseFormData({ ...courseFormData, duration: d });
                            if (fieldErrors.duration) setFieldErrors({ ...fieldErrors, duration: '' });
                          }}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Weekly Class & Lab Schedule *</label>
                    <input
                      type="text"
                      placeholder="e.g. 3 days class + 3 days lab per week"
                      value={courseFormData.schedule_type}
                      onChange={(e) => {
                        setCourseFormData({ ...courseFormData, schedule_type: e.target.value });
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
                            setCourseFormData({ ...courseFormData, schedule_type: s });
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
                  <label>Course Detailed Overview & Syllabus Description</label>
                  <textarea
                    rows={5}
                    placeholder="Provide a comprehensive summary of what students will master in this course..."
                    value={courseFormData.description}
                    onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                    className="form-textarea"
                  />
                </div>
              </div>

              {/* Right Column: Live Course Card Preview */}
              <div className="preview-sticky-box">
                <div className="preview-header-label">
                  <Sparkles size={14} />
                  <span>Live Student Card Preview</span>
                </div>

                <div className="live-preview-card">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="badge-pill purple">{courseFormData.slug || 'course-slug'}</span>
                    <span className="badge-pill info">{courseFormData.level}</span>
                  </div>
                  <h3>
                    {courseFormData.name || 'Course Title Preview'}
                  </h3>
                  <p className="text-xs text-muted mb-3 line-clamp-3 leading-relaxed">
                    {courseFormData.description || 'Course description will appear here as you type in the editor...'}
                  </p>
                  <div className="preview-specs-box">
                    <div className="preview-spec-row">
                      <div className="preview-spec-label"><Clock size={13} /> Estimated Duration</div>
                      <div className="preview-spec-value text-purple-900">{courseFormData.duration || 'TBD'}</div>
                    </div>
                    <div className="preview-spec-row">
                      <div className="preview-spec-label"><Calendar size={13} /> Weekly Schedule</div>
                      <div className="preview-spec-value text-emerald-700">{courseFormData.schedule_type || 'TBD'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="form-action-footer">
              <button
                type="button"
                className="btn-cancel-outline"
                onClick={() => setViewMode('list')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-save-primary"
                disabled={saving}
              >
                <Check size={16} />
                <span>{saving ? 'Saving Course...' : (editingCourse ? 'Save Changes' : 'Publish New Course')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // DEDICATED IN-PAGE TOPIC CREATION / EDIT VIEW
  if (viewMode === 'topic_form') {
    return (
      <div className="tab-pane-container animate-fade-in">
        <div className="tab-pane-header">
          <div className="flex items-center gap-3">
            <button className="btn-outline-sm" onClick={() => setViewMode('list')}>
              <ArrowLeft size={16} /> Back to Curriculum
            </button>
            <div>
              <h2>{editingTopic ? `Edit Topic: ${topicFormData.title || 'Untitled'}` : 'Create New Topic'}</h2>
              <p className="text-muted">
                Add study content, structured guides, and technical explanations for students enrolled in {selectedCourse?.name}.
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="alert-box danger mb-4">
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSaveTopic}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <div className="dashboard-section-card">
                <div className="section-card-header">
                  <div>
                    <h3>Topic Information</h3>
                    <p className="text-muted">Headline and study notes content</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="form-group">
                    <label>Topic Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Pointers, Dynamic Memory & Structs in C"
                      value={topicFormData.title}
                      onChange={(e) => {
                        setTopicFormData({ ...topicFormData, title: e.target.value });
                        if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: '' });
                      }}
                      className={`form-input text-base font-semibold ${fieldErrors.title ? 'input-error' : ''}`}
                    />
                    {fieldErrors.title && (
                      <span className="field-error-msg"><AlertCircle size={13} /> {fieldErrors.title}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Topic Identifier / Slug Code</label>
                    <input
                      type="text"
                      placeholder="e.g. pointers-memory"
                      value={topicFormData.topic_id}
                      onChange={(e) => setTopicFormData({ ...topicFormData, topic_id: e.target.value })}
                      className="form-input font-mono text-sm"
                    />
                    <span className="form-hint">Unique identifier used for curriculum tracking</span>
                  </div>

                  <div className="form-group">
                    <label>Topic Study Notes & Theory Content (Markdown Supported)</label>
                    <textarea
                      rows={10}
                      placeholder="# Topic Outline&#10;&#10;Explain core concepts, syntax, and step-by-step logic for students...&#10;&#10;```c&#10;int *ptr = &val;&#10;```"
                      value={topicFormData.notes_content}
                      onChange={(e) => setTopicFormData({ ...topicFormData, notes_content: e.target.value })}
                      className="form-textarea font-mono text-xs leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Topic Preview */}
            <div className="space-y-5">
              <div className="dashboard-section-card sticky top-24">
                <div className="section-card-header">
                  <div>
                    <h3>Topic Card Preview</h3>
                    <p className="text-muted">How this topic appears in curriculum</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border-subtle bg-slate-50 dark:bg-slate-800/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="topic-icon-wrap">
                      <FileText size={15} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900 dark:text-white">
                        {topicFormData.title || 'Topic Title Preview'}
                      </div>
                      <span className="topic-id-tag font-mono text-xs">#{topicFormData.topic_id || 'topic-code'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border-subtle">
                    <span className="text-xs text-muted block mb-1 font-semibold">Course:</span>
                    <span className="badge-pill course-pill">{selectedCourse?.name || 'Course'}</span>
                  </div>

                  <div className="pt-2 border-t border-border-subtle">
                    <span className="text-xs text-muted block mb-1 font-semibold">Notes Length:</span>
                    <span className="text-xs font-mono">{topicFormData.notes_content?.length || 0} characters</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={saving}>
                    {saving ? 'Saving Topic…' : (editingTopic ? 'Update Topic' : 'Save Topic')}
                  </button>
                  <button type="button" className="btn-secondary w-full justify-center" onClick={() => setViewMode('list')}>
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

  // DEDICATED IN-PAGE PROBLEM / PRACTICE LAB CREATION VIEW
  if (viewMode === 'problem_form') {
    return (
      <div className="tab-pane-container animate-fade-in">
        <div className="tab-pane-header">
          <div className="flex items-center gap-3">
            <button className="btn-outline-sm" onClick={() => setViewMode('list')}>
              <ArrowLeft size={16} /> Back to Curriculum
            </button>
            <div>
              <h2>{editingProblem ? `Edit Practice Lab: ${problemFormData.title || 'Untitled'}` : 'New Practice Lab & Answer Key'}</h2>
              <p className="text-muted">
                Configure programming challenges, test constraints, and admin answer key for automated terminal evaluation.
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="alert-box danger mb-4">
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSaveProblem}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              {/* Problem Definition Card */}
              <div className="dashboard-section-card">
                <div className="section-card-header">
                  <div>
                    <h3>1. Problem Specification</h3>
                    <p className="text-muted">Title, language runtime, and challenge instructions</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>{['excel', 'word', 'tally', 'general'].includes(problemFormData.language) ? 'Lab Task / Assignment Title *' : 'Program Title *'}</label>
                      <input
                        type="text"
                        placeholder={
                          problemFormData.language === 'excel' ? 'e.g. Lab 1: VLOOKUP Payroll Calculation' :
                          problemFormData.language === 'word' ? 'e.g. Lab 1: Mail Merge Certificate Template' :
                          problemFormData.language === 'tally' ? 'e.g. Lab 1: Purchase Voucher & GST Ledger Entry' :
                          'e.g. Program 1: Fibonacci Generator'
                        }
                        value={problemFormData.title}
                        onChange={(e) => {
                          setProblemFormData({ ...problemFormData, title: e.target.value });
                          if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: '' });
                        }}
                        className={`form-input font-semibold ${fieldErrors.title ? 'input-error' : ''}`}
                      />
                      {fieldErrors.title && (
                        <span className="field-error-msg"><AlertCircle size={13} /> {fieldErrors.title}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Subject / Exercise Category *</label>
                      <select
                        value={problemFormData.language}
                        onChange={(e) => setProblemFormData({ ...problemFormData, language: e.target.value })}
                        className="form-select font-semibold"
                      >
                        <optgroup label="Spreadsheets & Office">
                          <option value="excel">📊 MS Excel / Formula & Spreadsheet Task</option>
                          <option value="word">📄 MS Word & Document Formatting Task</option>
                          <option value="tally">💰 Tally Prime & Accounting Entry Task</option>
                        </optgroup>
                        <optgroup label="Programming & Web">
                          <option value="python">🐍 Python 3 (CPython)</option>
                          <option value="c">⚡ C Programming (GCC)</option>
                          <option value="javascript">🌐 JavaScript (Node.js)</option>
                          <option value="sql">🗄️ SQL & Database Query</option>
                        </optgroup>
                        <optgroup label="General">
                          <option value="general">📋 General Practical Task / Lab Assignment</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      {['excel', 'word', 'tally', 'general'].includes(problemFormData.language)
                        ? 'Task Instructions, Requirements & Given Dataset *'
                        : 'Problem Statement & Input/Output Instructions *'}
                    </label>
                    <textarea
                      rows={4}
                      placeholder={
                        problemFormData.language === 'excel' ? 'Explain the spreadsheet scenario, cell ranges (e.g. A2:D20), formula rules, and required calculated columns...' :
                        problemFormData.language === 'word' ? 'Specify document margins, typography hierarchy, merge fields (e.g. <<Student_Name>>), or table structure...' :
                        problemFormData.language === 'tally' ? 'Specify company details, ledger heads, GST tax slabs, and transaction particulars...' :
                        'Explain what inputs the program should accept and what output format it must produce...'
                      }
                      value={problemFormData.description}
                      onChange={(e) => {
                        setProblemFormData({ ...problemFormData, description: e.target.value });
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
                        value={problemFormData.points}
                        onChange={(e) => setProblemFormData({ ...problemFormData, points: parseInt(e.target.value) || 10 })}
                        className="form-input font-bold text-primary"
                      />
                    </div>

                    <div className="form-group">
                      <label>Display Sequence Order</label>
                      <input
                        type="number"
                        min="1"
                        value={problemFormData.order}
                        onChange={(e) => setProblemFormData({ ...problemFormData, order: parseInt(e.target.value) || 1 })}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Expected Output Key & Boilerplate Card */}
              <div className="dashboard-section-card">
                <div className="section-card-header">
                  <div>
                    <h3>2. Validation Answer Key & Template</h3>
                    <p className="text-muted">Target solution verification for student evaluation</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="form-group bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-300 dark:border-emerald-800">
                    <label className="text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-1.5 mb-1">
                      <Sparkles size={15} />
                      {['excel', 'word', 'tally', 'general'].includes(problemFormData.language)
                        ? 'Admin Expected Result / Evaluation Key *'
                        : 'Admin Expected Output (Stdout Answer Key) *'}
                    </label>
                    <span className="text-xs text-muted block mb-2">
                      {['excel', 'word', 'tally', 'general'].includes(problemFormData.language)
                        ? 'Enter the target formula output, key calculated values, or completion token that validates student submission.'
                        : 'Enter the exact string expected on stdout. Automated grader matches student console output against this target.'}
                    </span>
                    <textarea
                      rows={4}
                      className="form-textarea font-mono text-xs bg-white dark:bg-slate-900 border-emerald-400"
                      placeholder={
                        problemFormData.language === 'excel' ? 'e.g. LOOKUP_RESULT: Designation=Senior Data Analyst | CTC=₹85,000 | Status=VERIFIED' :
                        problemFormData.language === 'word' ? 'e.g. MAIL_MERGE_STATUS: Fields=<<Student_Name>>,<<Course>> | Records_Merged=30 | Status=PASSED' :
                        problemFormData.language === 'tally' ? 'e.g. VOUCHER_POSTED: Voucher_No=PV-101 | Total_GST=₹18,000 | Net_Payable=₹1,18,000' :
                        'e.g.\n=== Student Profile ===\nName: Alex\nScore: 95\nGrade: A+'
                      }
                      value={problemFormData.expected_output}
                      onChange={(e) => setProblemFormData({ ...problemFormData, expected_output: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      {['excel', 'word', 'tally', 'general'].includes(problemFormData.language)
                        ? 'Starter Template / Sample Formula / Initial Hints'
                        : 'Starter Code Boilerplate'}
                    </label>
                    <textarea
                      rows={5}
                      className="form-textarea font-mono text-xs"
                      placeholder={
                        problemFormData.language === 'excel' ? '=VLOOKUP(E2, A2:D20, 3, FALSE)' :
                        problemFormData.language === 'word' ? '<<Student_Name>> has successfully completed <<Course>> on <<Date>>.' :
                        '# Write initial template or code for student editor'
                      }
                      value={problemFormData.starter_code}
                      onChange={(e) => setProblemFormData({ ...problemFormData, starter_code: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Lab Preview */}
            <div className="space-y-5">
              <div className="dashboard-section-card sticky top-24">
                <div className="section-card-header">
                  <div>
                    <h3>Practice Lab Preview</h3>
                    <p className="text-muted">Student terminal view</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border-subtle bg-slate-50 dark:bg-slate-800/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {problemFormData.title || 'Program Title Preview'}
                    </span>
                    <span className="lang-badge uppercase font-mono font-bold text-xs">{problemFormData.language}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-muted">Points:</span>
                    <span className="points-badge font-bold">{problemFormData.points} pts</span>
                  </div>

                  {problemFormData.expected_output && (
                    <div className="expected-output-box mt-2">
                      <span className="output-tag text-[11px] font-bold text-emerald-800 dark:text-emerald-300">Expected Stdout:</span>
                      <code className="output-code-line text-xs font-mono block mt-1">
                        {problemFormData.expected_output.replace(/\n/g, ' ↵ ')}
                      </code>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={saving}>
                    {saving ? 'Saving Lab…' : (editingProblem ? 'Update Practice Lab' : 'Save Practice Lab')}
                  </button>
                  <button type="button" className="btn-secondary w-full justify-center" onClick={() => setViewMode('list')}>
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
      {/* Top action header */}
      <div className="tab-pane-header">
        <div>
          <h2>Course & Topic Curriculum Management</h2>
          <p className="text-muted">
            Configure courses (e.g. C Programming, Python, Django), module hierarchies, topic notes, and practice programs with Admin expected output answer keys.
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreateCourse}>
          <Plus size={16} /> Add New Course
        </button>
      </div>

      {/* Main Course Management 2-Column Layout */}
      <div className="course-curriculum-grid">
        {/* Left Column: Course List Sidebar */}
        <div className="course-sidebar-card">
          <div className="sidebar-card-header">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Courses ({courses.length})</h3>
          </div>

          {loading ? (
            <div className="loading-state py-8">Loading courses…</div>
          ) : courses.length === 0 ? (
            <div className="empty-card py-8">
              <p className="text-xs text-muted">No courses yet. Click "+ Add New Course" to get started.</p>
            </div>
          ) : (
            <div className="course-items-stack">
              {courses.map((c) => {
                const isSelected = selectedCourse?.id === c.id;
                return (
                  <div
                    key={c.id}
                    className={`course-list-item-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedCourse(c)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 leading-tight">{c.name}</h4>
                        <span className="course-slug-sub">{c.slug}</span>
                      </div>
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="item-action-icon edit"
                          onClick={() => handleOpenEditCourse(c)}
                          title="Edit Course"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          className="item-action-icon danger"
                          onClick={() => handleDeleteCourse(c.id, c.name)}
                          title="Delete Course"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="course-card-meta-row">
                      <span className="meta-chip duration">{c.duration}</span>
                      <span className="meta-chip topics">{c.topic_count || 0} Topics</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Course Modules & Topics View */}
        <div className="course-content-card">
          {selectedCourse ? (
            <div>
              {/* Course Info Header */}
              <div className="course-detail-hero">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="badge-pill purple">{selectedCourse.slug}</span>
                      <span className="badge-pill info">{selectedCourse.level || 'Beginner to Advanced'}</span>
                    </div>
                    <h3 className="course-hero-title">{selectedCourse.name}</h3>
                    <p className="course-hero-desc">{selectedCourse.description || 'Comprehensive programming curriculum with automated coding labs.'}</p>
                    <div className="course-specs-bar">
                      <div className="spec-item">
                        <span className="spec-label">Duration:</span>
                        <strong className="spec-val text-primary">{selectedCourse.duration}</strong>
                      </div>
                      <div className="spec-divider" />
                      <div className="spec-item">
                        <span className="spec-label">Schedule Type:</span>
                        <strong className="spec-val text-emerald">{selectedCourse.schedule_type}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="btn-outline-sm" onClick={() => handleOpenEditCourse(selectedCourse)}>
                      <Edit2 size={13} /> Edit
                    </button>
                  </div>
                </div>
              </div>

              {/* Modules & Topics Tree */}
              <div className="modules-stack-container">
                {selectedCourse.modules?.length === 0 ? (
                  <div className="empty-card py-12">
                    <Layers size={36} className="empty-icon text-muted" />
                    <p className="text-muted font-medium">No modules configured for this course yet.</p>
                  </div>
                ) : (
                  selectedCourse.modules?.map((mod) => (
                    <div key={mod.id} className="modern-module-card">
                      <div className="modern-module-header">
                        <div className="flex items-center gap-2.5">
                          <div className="module-icon-bubble">
                            <Layers size={16} />
                          </div>
                          <div>
                            <h4 className="module-title-text">{mod.name}</h4>
                            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">{mod.level || 'Beginner'} Level</span>
                          </div>
                        </div>
                        <button
                          className="btn-outline-sm add-topic-btn"
                          onClick={() => handleOpenCreateTopic(mod)}
                        >
                          <Plus size={13} /> Add Topic
                        </button>
                      </div>

                      {/* Topics List */}
                      <div className="topics-list-container">
                        {mod.topics?.length === 0 ? (
                          <div className="text-xs text-muted italic p-4 text-center">No topics in this module yet. Click "+ Add Topic" above to start.</div>
                        ) : (
                          mod.topics?.map((top) => (
                            <div key={top.id} className="modern-topic-card">
                              <div className="topic-card-top-bar">
                                <div className="flex items-center gap-2.5">
                                  <div className="topic-icon-wrap">
                                    <FileText size={15} />
                                  </div>
                                  <div>
                                    <span className="font-bold text-sm text-gray-900">{top.title}</span>
                                    <span className="topic-id-tag">#{top.topic_id}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    className="btn-add-lab-chip"
                                    onClick={() => handleOpenCreateProblem(top.id)}
                                  >
                                    <Code2 size={13} /> Add Practice Lab
                                  </button>
                                  <button className="item-action-icon edit" onClick={() => handleOpenEditTopic(top)} title="Edit Topic">
                                    <Edit2 size={12} />
                                  </button>
                                  <button className="item-action-icon danger" onClick={() => handleDeleteTopic(top.id)} title="Delete Topic">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              {/* Practice Programs List with Expected Outputs */}
                              {top.problems?.length > 0 && (
                                <div className="modern-problems-panel">
                                  <div className="problems-panel-label">
                                    <Code2 size={13} className="text-primary" />
                                    <span>Practice Programs & Answer Key Validation</span>
                                    <span className="badge-count">{top.problems.length}</span>
                                  </div>
                                  <div className="problems-items-list">
                                    {top.problems.map((prob) => (
                                      <div key={prob.id} className="modern-problem-row">
                                        <div className="problem-info-area">
                                          <div className="problem-title-line">
                                            <span className="font-bold text-xs text-gray-900">{prob.title}</span>
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
                                            <span className="points-badge">{prob.points} pts</span>
                                          </div>
                                          {prob.expected_output && (
                                            <div className="expected-output-box">
                                              <span className="output-tag">
                                                {['excel', 'word', 'tally', 'general'].includes(prob.language) ? 'Expected Result / Formula:' : 'Expected Stdout:'}
                                              </span>
                                              <code className="output-code-line">
                                                {prob.expected_output.replace(/\n/g, ' ↵ ')}
                                              </code>
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                          <button className="item-action-icon edit" onClick={() => handleOpenEditProblem(prob)} title="Edit Lab">
                                            <Edit2 size={12} />
                                          </button>
                                          <button className="item-action-icon danger" onClick={() => handleDeleteProblem(prob.id)} title="Delete Lab">
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="empty-card py-16">
              <BookOpen size={44} className="empty-icon text-muted" />
              <h3 className="font-bold text-lg text-gray-700 mt-2">Select a Course to View Curriculum</h3>
              <p className="text-sm text-muted">Click any course on the left to manage modules, topics, and coding exercises.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
