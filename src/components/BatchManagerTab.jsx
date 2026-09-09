import { useState, useEffect } from 'react';
import {
  Layers, Plus, Edit2, Trash2, Users, Clock,
  Calendar, CheckCircle, AlertCircle, X, Search, Filter,
  ArrowLeft, Check, Sparkles, BookOpen, Shield
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

export default function BatchManagerTab({ user, onSelectBatchForProgress }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [editingBatch, setEditingBatch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    course: '',
    schedule: 'Mon, Wed, Fri - 10:00 AM to 12:00 PM',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'ACTIVE',
    max_students: 30,
    staff: [],
    students: [],
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [selectedDays, setSelectedDays] = useState(['Mon', 'Wed', 'Fri']);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');

  function format12Hour(time24) {
    if (!time24) return '';
    const [hoursStr, minsStr] = time24.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = minsStr || '00';
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const paddedHours = hours < 10 ? `0${hours}` : `${hours}`;
    return `${paddedHours}:${minutes} ${ampm}`;
  }

  const updateScheduleFromPicker = (newDays, newStart, newEnd) => {
    const daysStr = newDays.length > 0 ? newDays.join(', ') : 'Daily';
    const startStr = format12Hour(newStart);
    const endStr = format12Hour(newEnd);
    const fullSchedule = `${daysStr} - ${startStr} to ${endStr}`;
    setFormData(prev => ({ ...prev, schedule: fullSchedule }));
    if (fieldErrors.schedule) setFieldErrors(prev => ({ ...prev, schedule: '' }));
  };

  const toggleDay = (day) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day];
    setSelectedDays(newDays);
    updateScheduleFromPicker(newDays, startTime, endTime);
  };

  const handleStartTimeChange = (val) => {
    setStartTime(val);
    updateScheduleFromPicker(selectedDays, val, endTime);
  };

  const handleEndTimeChange = (val) => {
    setEndTime(val);
    updateScheduleFromPicker(selectedDays, startTime, val);
  };

  const applyPresetDays = (daysArray) => {
    setSelectedDays(daysArray);
    updateScheduleFromPicker(daysArray, startTime, endTime);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [batchesRes, coursesRes, usersRes] = await Promise.all([
        api.getBatches(),
        api.getSubjects(),
        api.getUsers(),
      ]);

      const safeBatches = Array.isArray(batchesRes) ? batchesRes : (batchesRes.results || []);
      const safeCourses = Array.isArray(coursesRes) ? coursesRes : (coursesRes.results || []);
      const safeUsers = Array.isArray(usersRes) ? usersRes : (usersRes.results || []);

      setBatches(safeBatches);
      setCourses(safeCourses);
      setStaffList(safeUsers.filter(u => u.role === 'STAFF' || u.role === 'ADMIN' || u.is_admin_role));
      setStudentsList(safeUsers.filter(u => u.role === 'STUDENT'));
    } catch (e) {
      console.error('Failed to load batches data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingBatch(null);
    setFormData({
      name: '',
      course: courses[0]?.id || '',
      schedule: 'Mon, Wed, Fri - 10:00 AM to 12:00 PM',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      status: 'ACTIVE',
      max_students: 30,
      staff: user && (user.role === 'STAFF' || user.is_admin_role) ? [user.id] : [],
      students: [],
    });
    setFieldErrors({});
    setErrorMsg('');
    setViewMode('form');
  };

  const handleOpenEdit = (b) => {
    setEditingBatch(b);
    setFormData({
      name: b.name,
      course: b.course,
      schedule: b.schedule,
      start_date: b.start_date || '',
      end_date: b.end_date || '',
      status: b.status,
      max_students: b.max_students || 30,
      staff: b.staff || [],
      students: b.students || [],
    });
    setFieldErrors({});
    setErrorMsg('');
    setViewMode('form');
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name || !formData.name.trim()) {
      errs.name = 'Batch Name / Identifier is required (e.g. Python - Morning 10AM)';
    }
    if (!formData.course) {
      errs.course = 'Please select a linked Course track.';
    }
    if (!formData.schedule || !formData.schedule.trim()) {
      errs.schedule = 'Class schedule and timings are required.';
    }
    if (!formData.start_date) {
      errs.start_date = 'Start date is required.';
    }
    if (formData.max_students && (formData.max_students < 1 || formData.max_students > 500)) {
      errs.max_students = 'Capacity must be between 1 and 500 students.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill in all required fields highlighted in red.');
      return;
    }

    setSaving(true);
    try {
      if (editingBatch) {
        await api.updateBatch(editingBatch.id, formData);
        toast.success(`Batch "${formData.name}" updated successfully!`);
      } else {
        await api.createBatch(formData);
        toast.success(`Batch "${formData.name}" created successfully!`);
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
      title: 'Delete Student Batch?',
      message: `Are you sure you want to delete or close batch "${name}"?`,
      confirmText: 'Delete Batch',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await api.deleteBatch(id);
      toast.success(`Batch "${name}" deleted successfully.`);
      await loadAllData();
    } catch (err) {
      toast.error(err);
    }
  };

  const filteredBatches = batches.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (b.course_name && b.course_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (b.schedule && b.schedule.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedCourseObj = courses.find(c => c.id === parseInt(formData.course) || c.id === formData.course);

  // DEDICATED IN-PAGE BATCH CREATION / EDIT VIEW
  if (viewMode === 'form') {
    return (
      <div className="tab-pane-container animate-fade-in">
        {/* Top Header with Back Action */}
        <div className="tab-pane-header">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn-outline-sm"
              onClick={() => setViewMode('list')}
            >
              <ArrowLeft size={16} /> Back to Batches
            </button>
            <div>
              <h2>{editingBatch ? `Edit Batch: ${editingBatch.name}` : 'Create New Batch Cohort'}</h2>
              <p className="text-muted">
                {editingBatch ? 'Update batch schedule, assigned trainers, and student enrollment roster.' : 'Configure a new cohort instance with distinct class timing and linked curriculum.'}
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="alert-box danger mb-4 flex items-center gap-2 p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="form-layout-2col">
            {/* Left Column: Form Fields Card */}
            <div className="form-card-main">
              <div className="form-group">
                <label>
                  <span>Batch Name / Cohort Identifier *</span>
                  <span className="text-[11px] text-muted normal-case">e.g. Python - Morning Batch A</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Advanced MS Excel - Weekend Fast-track (10:00 AM)"
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
                <span className="form-hint">Allows multiple parallel batches for the same subject with distinct timing & rosters.</span>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Linked Course Track *</label>
                  <select
                    value={formData.course}
                    onChange={(e) => {
                      setFormData({ ...formData, course: e.target.value });
                      if (fieldErrors.course) setFieldErrors({ ...fieldErrors, course: '' });
                    }}
                    className={`form-select font-semibold ${fieldErrors.course ? 'input-error' : ''}`}
                  >
                    <option value="">Select Course</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {fieldErrors.course && (
                    <span className="field-error-msg"><AlertCircle size={13} /> {fieldErrors.course}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Batch Cohort Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-select font-semibold"
                  >
                    <option value="ACTIVE">🟢 Active / Ongoing</option>
                    <option value="UPCOMING">🔵 Upcoming</option>
                    <option value="COMPLETED">⚪ Completed</option>
                    <option value="PAUSED">🟠 Paused</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <div className="flex items-center justify-between mb-1">
                  <label className="mb-0">Class Schedule & Timings *</label>
                  <span className="text-[11px] text-muted">Use pickers below or type custom text</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Mon, Wed, Fri - 10:00 AM to 12:00 PM"
                  value={formData.schedule}
                  onChange={(e) => {
                    setFormData({ ...formData, schedule: e.target.value });
                    if (fieldErrors.schedule) setFieldErrors({ ...fieldErrors, schedule: '' });
                  }}
                  className={`form-input font-semibold text-base ${fieldErrors.schedule ? 'input-error' : ''}`}
                />
                {fieldErrors.schedule && (
                  <span className="field-error-msg"><AlertCircle size={13} /> {fieldErrors.schedule}</span>
                )}

                {/* Interactive Dynamic Time & Days Builder */}
                <div className="schedule-builder-card">
                  <div>
                    <div className="builder-section-title">
                      <span>1. Select Class Days</span>
                      <span className="text-xs text-muted normal-case font-normal">Click to toggle</span>
                    </div>
                    <div className="days-pill-group">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <button
                          key={day}
                          type="button"
                          className={`day-toggle-pill ${selectedDays.includes(day) ? 'active' : ''}`}
                          onClick={() => toggleDay(day)}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <button type="button" className="quick-select-chip" onClick={() => applyPresetDays(['Mon', 'Wed', 'Fri'])}>
                        Mon, Wed, Fri
                      </button>
                      <button type="button" className="quick-select-chip" onClick={() => applyPresetDays(['Tue', 'Thu', 'Sat'])}>
                        Tue, Thu, Sat
                      </button>
                      <button type="button" className="quick-select-chip" onClick={() => applyPresetDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])}>
                        Mon to Fri Daily
                      </button>
                      <button type="button" className="quick-select-chip" onClick={() => applyPresetDays(['Sat', 'Sun'])}>
                        Weekend (Sat-Sun)
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-purple-100">
                    <div className="builder-section-title">
                      <span>2. Select Dynamic Time Slot</span>
                      {startTime && endTime && (
                        <span className="time-duration-chip">
                          <Clock size={12} /> {format12Hour(startTime)} - {format12Hour(endTime)}
                        </span>
                      )}
                    </div>
                    <div className="time-picker-row">
                      <div className="time-input-box">
                        <label>Start Time</label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => handleStartTimeChange(e.target.value)}
                          className="time-picker-input"
                        />
                      </div>

                      <span className="time-to-separator font-bold">to</span>

                      <div className="time-input-box">
                        <label>End Time</label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => handleEndTimeChange(e.target.value)}
                          className="time-picker-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => {
                      setFormData({ ...formData, start_date: e.target.value });
                      if (fieldErrors.start_date) setFieldErrors({ ...fieldErrors, start_date: '' });
                    }}
                    className={`form-input ${fieldErrors.start_date ? 'input-error' : ''}`}
                  />
                  {fieldErrors.start_date && (
                    <span className="field-error-msg"><AlertCircle size={13} /> {fieldErrors.start_date}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Expected End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Max Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={formData.max_students}
                    onChange={(e) => {
                      setFormData({ ...formData, max_students: parseInt(e.target.value) || 30 });
                      if (fieldErrors.max_students) setFieldErrors({ ...fieldErrors, max_students: '' });
                    }}
                    className={`form-input font-bold ${fieldErrors.max_students ? 'input-error' : ''}`}
                  />
                  {fieldErrors.max_students && (
                    <span className="field-error-msg"><AlertCircle size={13} /> {fieldErrors.max_students}</span>
                  )}
                </div>
              </div>

              {/* Staff Trainers Assignment */}
              <div className="form-group mt-2">
                <label className="font-bold">Assigned Staff Trainers ({formData.staff.length} selected)</label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1">
                  {staffList.length === 0 ? (
                    <span className="text-xs text-muted">No staff accounts available.</span>
                  ) : (
                    staffList.map(s => {
                      const isSelected = formData.staff.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center gap-2 p-2 px-3 rounded-lg border cursor-pointer transition-all text-xs ${
                            isSelected
                              ? 'bg-purple-50 border-purple-300 text-purple-900 font-semibold shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const newStaff = e.target.checked
                                ? [...formData.staff, s.id]
                                : formData.staff.filter(id => id !== s.id);
                              setFormData({ ...formData, staff: newStaff });
                            }}
                          />
                          <span>{s.first_name || s.username} ({s.role})</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Students Enrollment Roster */}
              <div className="form-group mt-2">
                <label className="font-bold">Enrolled Students ({formData.students.length} selected)</label>
                <div className="max-h-56 overflow-y-auto flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1">
                  {studentsList.length === 0 ? (
                    <span className="text-xs text-muted">No registered student accounts found.</span>
                  ) : (
                    studentsList.map(st => {
                      const isSelected = formData.students.includes(st.id);
                      return (
                        <label
                          key={st.id}
                          className={`flex items-center gap-2 p-2 px-3 rounded-lg border cursor-pointer transition-all text-xs ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const newStudents = e.target.checked
                                ? [...formData.students, st.id]
                                : formData.students.filter(id => id !== st.id);
                              setFormData({ ...formData, students: newStudents });
                            }}
                          />
                          <span>{st.first_name || st.username} ({st.mobile_number || 'ID: ' + st.id})</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Live Batch Card Preview */}
            <div className="preview-sticky-box">
              <div className="preview-header-label">
                <Sparkles size={14} />
                <span>Live Batch Card Preview</span>
              </div>

              <div className="live-preview-card">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="badge-pill purple">{selectedCourseObj?.name || 'Course Track'}</span>
                  <span className="badge-pill emerald">{formData.status}</span>
                </div>

                <h3>
                  {formData.name || 'Batch Cohort Title'}
                </h3>

                <div className="preview-specs-box">
                  <div className="preview-spec-row">
                    <div className="preview-spec-label"><Clock size={13} /> Class Schedule & Timing</div>
                    <div className="preview-spec-value text-purple-900">{formData.schedule || 'Schedule TBD'}</div>
                  </div>
                  <div className="preview-spec-row">
                    <div className="preview-spec-label"><Calendar size={13} /> Starts On</div>
                    <div className="preview-spec-value">{formData.start_date || 'TBD'}</div>
                  </div>
                  <div className="preview-spec-row">
                    <div className="preview-spec-label"><Users size={13} /> Capacity & Enrollment</div>
                    <div className="preview-spec-value text-emerald-700">{formData.students.length} / {formData.max_students} Students</div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 text-xs">
                  <span className="text-muted font-medium">Assigned Trainers:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.staff.length === 0 ? (
                      <span className="text-muted italic">None selected</span>
                    ) : (
                      formData.staff.map(id => {
                        const sObj = staffList.find(s => s.id === id);
                        return (
                          <span key={id} className="badge-pill purple">
                            {sObj?.first_name || sObj?.username || `ID: ${id}`}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="preview-action-buttons">
                <button type="submit" className="btn-save-primary" disabled={saving}>
                  <Check size={16} />
                  <span>{saving ? 'Saving Batch...' : (editingBatch ? 'Save Changes' : 'Create Batch')}</span>
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
      {/* Top action header */}
      <div className="tab-pane-header">
        <div>
          <h2>Batch Management</h2>
          <p className="text-muted">
            Manage cohort instances, distinct time slots, trainer assignments, and student rosters. Multiple batches can run the same course in parallel.
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Create New Batch
        </button>
      </div>

      {/* Unified Filter Bar */}
      <div className="filter-bar-unified">
        <div className="filter-search-box">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Search by batch name, course, or timing..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-dropdown-wrap">
          <Filter size={15} className="text-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select-modern"
          >
            <option value="ALL">All Statuses ({batches.length})</option>
            <option value="ACTIVE">🟢 Active / Ongoing</option>
            <option value="UPCOMING">🔵 Upcoming</option>
            <option value="COMPLETED">⚪ Completed</option>
            <option value="PAUSED">🟠 Paused</option>
          </select>
        </div>
      </div>

      {/* Batches Grid */}
      {loading ? (
        <div className="loading-state">Loading batches…</div>
      ) : filteredBatches.length === 0 ? (
        <div className="empty-state-modern">
          <div className="empty-icon-bubble">
            <Layers size={32} />
          </div>
          <h3>No Batches Found</h3>
          <p>Create your first batch cohort to start assigning trainers and enrolling students.</p>
          <button className="btn-save-primary mt-2" onClick={handleOpenCreate}>
            <Plus size={16} /> Create Batch
          </button>
        </div>
      ) : (
        <div className="batches-cards-grid">
          {filteredBatches.map((b) => {
            const progress = b.progress_stats || { progress_percent: 0, completed_topics: 0, total_topics: 0 };
            return (
              <div key={b.id} className="batch-card">
                <div className="batch-card-header">
                  <div>
                    <span className="badge-pill course-pill">{b.course_name}</span>
                    <h3 className="batch-title mt-1">{b.name}</h3>
                  </div>
                  <span className={`badge-pill ${b.status === 'ACTIVE' ? 'success' : b.status === 'UPCOMING' ? 'info' : 'secondary'}`}>
                    {b.status}
                  </span>
                </div>

                <div className="batch-card-body">
                  <div className="batch-meta-item">
                    <Clock size={15} className="text-primary" />
                    <span>{b.schedule}</span>
                  </div>
                  <div className="batch-meta-item">
                    <Calendar size={15} className="text-muted" />
                    <span>Starts: {b.start_date || 'TBD'}</span>
                  </div>
                  <div className="batch-meta-item">
                    <Users size={15} className="text-emerald" />
                    <span>
                      <strong>{b.student_count || b.students?.length || 0}</strong> / {b.max_students} Students Enrolled
                    </span>
                  </div>

                  <div className="trainer-tag-list">
                    <span className="text-xs text-muted">Trainers: </span>
                    {b.staff_details?.length > 0 ? (
                      b.staff_details.map(s => (
                        <span key={s.id} className="badge-pill trainer-pill">
                          {s.first_name || s.username}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted italic">None assigned</span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-section mt-3">
                    <div className="progress-label-row">
                      <span className="text-xs font-medium">Curriculum Progress</span>
                      <span className="text-xs text-primary font-bold">{progress.progress_percent}%</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${progress.progress_percent}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted mt-1 block">
                      {progress.completed_topics} of {progress.total_topics} topics completed
                    </span>
                  </div>
                </div>

                <div className="batch-card-footer">
                  <button
                    className="btn-outline-sm"
                    onClick={() => onSelectBatchForProgress && onSelectBatchForProgress(b.id)}
                  >
                    Topic Checklist
                  </button>
                  <div className="btn-group-sm flex items-center gap-1.5">
                    <button className="item-action-icon edit" onClick={() => handleOpenEdit(b)} title="Edit Batch">
                      <Edit2 size={13} />
                    </button>
                    <button className="item-action-icon danger" onClick={() => handleDelete(b.id, b.name)} title="Delete Batch">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
