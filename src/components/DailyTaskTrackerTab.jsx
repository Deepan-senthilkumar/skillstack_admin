import { useState, useEffect } from 'react';
import {
  Calendar, Plus, Clock, CheckCircle2, AlertCircle,
  Users, Edit2, Trash2, X, RefreshCw, Check, ArrowLeft, Search, Filter, Sparkles
} from 'lucide-react';
import { api } from '../api';

export default function DailyTaskTrackerTab({ user }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [matrixData, setMatrixData] = useState([]);
  const [batches, setBatches] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Entry Modal
  const [showModal, setShowModal] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    batch: '',
    session_type: 'TOPIC',
    session_title: '',
    topic: '',
    total_enrolled: 0,
    students_attended: 0,
    remarks: '',
  });
  const [batchStudents, setBatchStudents] = useState([]);
  const [studentAttendanceList, setStudentAttendanceList] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    loadMatrix(selectedDate);
  }, [selectedDate]);

  const loadBatches = async () => {
    try {
      const [bRes, cRes] = await Promise.all([
        api.getBatches(),
        api.getSubjects(),
      ]);
      const safeBatches = Array.isArray(bRes) ? bRes : (bRes.results || []);
      setBatches(safeBatches);
    } catch (e) {
      console.error('Failed to load batches for daily tracker', e);
    }
  };

  const loadMatrix = async (dateStr) => {
    setLoading(true);
    try {
      const res = await api.getDailyBatchMatrix(dateStr);
      setMatrixData(res.matrix || []);
    } catch (e) {
      console.error('Failed to load daily batch matrix', e);
    } finally {
      setLoading(false);
    }
  };

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'

  const handleOpenLogModal = (batchItem) => {
    setEditingLogId(batchItem?.log_id || null);
    const targetBatch = batches.find(b => b.id === (batchItem?.batch_id || batches[0]?.id));
    const enrolled = targetBatch ? (targetBatch.student_count || targetBatch.students?.length || 0) : 0;

    setFormData({
      date: selectedDate,
      batch: targetBatch?.id || '',
      session_type: batchItem?.session_type && batchItem.session_type !== 'Not Logged' ? batchItem.session_type : 'TOPIC',
      session_title: batchItem?.session_title || '',
      topic: '',
      total_enrolled: enrolled,
      students_attended: batchItem?.students_attended || enrolled,
      remarks: batchItem?.remarks || '',
    });

    if (targetBatch) {
      const students = targetBatch.student_details || [];
      setBatchStudents(students);
      setStudentAttendanceList(students.map(s => ({ student_id: s.id, is_present: true, name: s.first_name || s.username })));
    } else {
      setBatchStudents([]);
      setStudentAttendanceList([]);
    }

    setErrorMsg('');
    setViewMode('form');
  };

  const handleBatchChange = (batchId) => {
    const targetBatch = batches.find(b => b.id === parseInt(batchId));
    const enrolled = targetBatch ? (targetBatch.student_count || targetBatch.students?.length || 0) : 0;
    setFormData(prev => ({
      ...prev,
      batch: batchId,
      total_enrolled: enrolled,
      students_attended: enrolled,
    }));
    if (targetBatch) {
      const students = targetBatch.student_details || [];
      setBatchStudents(students);
      setStudentAttendanceList(students.map(s => ({ student_id: s.id, is_present: true, name: s.first_name || s.username })));
    }
  };

  const handleSaveLog = async (e) => {
    e.preventDefault();
    if (!formData.batch) {
      setErrorMsg('Please select a batch.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const payload = {
        ...formData,
        student_attendance: studentAttendanceList.map(s => ({
          student_id: s.student_id,
          is_present: s.is_present
        }))
      };

      if (editingLogId) {
        await api.updateStaffDailyLog(editingLogId, payload);
      } else {
        await api.createStaffDailyLog(payload);
      }
      setViewMode('list');
      await loadMatrix(selectedDate);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save daily log.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Delete this daily log entry?')) return;
    try {
      await api.deleteStaffDailyLog(logId);
      await loadMatrix(selectedDate);
    } catch (e) {
      alert(e.message || 'Failed to delete log entry.');
    }
  };

  const formattedSelectedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
  });

  const selectedBatchObj = batches.find(b => b.id === parseInt(formData.batch));

  // DEDICATED IN-PAGE DAILY SESSION FORM VIEW
  if (viewMode === 'form') {
    const attendancePct = formData.total_enrolled > 0
      ? Math.round((formData.students_attended / formData.total_enrolled) * 100)
      : 0;

    return (
      <div className="tab-pane-container animate-fade-in">
        {/* Top Header with Back Action */}
        <div className="tab-pane-header">
          <div className="flex items-center gap-3">
            <button
              className="btn-outline-sm"
              onClick={() => setViewMode('list')}
            >
              <ArrowLeft size={16} /> Back to Daily Matrix
            </button>
            <div>
              <h2>{editingLogId ? 'Edit Daily Session Log' : 'Log Daily Class / Lab Session'}</h2>
              <p className="text-muted">
                Record topics taught, lab exercises performed, and student attendance for today's batch.
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="alert-box danger mb-4">
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSaveLog}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Form Details */}
            <div className="lg:col-span-2 space-y-5">
              {/* Batch & Schedule Card */}
              <div className="dashboard-section-card">
                <div className="section-card-header">
                  <div>
                    <h3>1. Batch Cohort & Session Info</h3>
                    <p className="text-muted">Select batch and nature of session conducted</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Date of Session *</label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Target Batch *</label>
                      <select
                        value={formData.batch}
                        onChange={(e) => handleBatchChange(e.target.value)}
                        required
                      >
                        <option value="">Select Batch Cohort</option>
                        {batches.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} — {b.course_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Session Classification *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'TOPIC', label: 'Theory Class', icon: '📖' },
                        { id: 'LAB', label: 'Lab Practice', icon: '💻' },
                        { id: 'DOUBT', label: 'Doubt Review', icon: '💡' },
                        { id: 'ASSESSMENT', label: 'Test / Exam', icon: '📝' }
                      ].map(st => (
                        <button
                          key={st.id}
                          type="button"
                          className={`p-2.5 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
                            formData.session_type === st.id
                              ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                              : 'border-border-subtle bg-white dark:bg-slate-900 text-gray-700 hover:border-gray-300'
                          }`}
                          onClick={() => setFormData({ ...formData, session_type: st.id })}
                        >
                          <span>{st.icon}</span>
                          <span>{st.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Session Topic / Subject Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Variables & Memory Allocation or 'Lab 1 - If-Else Practice'"
                      value={formData.session_title}
                      onChange={(e) => setFormData({ ...formData, session_title: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Student Attendance & Headcount Card */}
              <div className="dashboard-section-card">
                <div className="section-card-header">
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <h3>2. Student Attendance Record</h3>
                      <p className="text-muted">Aggregate numbers and optional per-student checkbox roll call</p>
                    </div>
                    {batchStudents.length > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="btn-outline-sm text-xs py-1"
                          onClick={() => {
                            const updated = studentAttendanceList.map(s => ({ ...s, is_present: true }));
                            setStudentAttendanceList(updated);
                            setFormData(prev => ({ ...prev, students_attended: updated.length }));
                          }}
                        >
                          Mark All Present
                        </button>
                        <button
                          type="button"
                          className="btn-outline-sm text-xs py-1"
                          onClick={() => {
                            const updated = studentAttendanceList.map(s => ({ ...s, is_present: false }));
                            setStudentAttendanceList(updated);
                            setFormData(prev => ({ ...prev, students_attended: 0 }));
                          }}
                        >
                          Mark All Absent
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="form-row-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-border-subtle">
                    <div className="form-group">
                      <label>Total Enrolled in Batch</label>
                      <input
                        type="number"
                        readOnly
                        className="bg-gray-100 dark:bg-slate-700 font-bold"
                        value={formData.total_enrolled}
                      />
                    </div>

                    <div className="form-group">
                      <label>Students Attended Today *</label>
                      <input
                        type="number"
                        min="0"
                        max={formData.total_enrolled || 100}
                        required
                        className="font-bold text-primary"
                        value={formData.students_attended}
                        onChange={(e) => setFormData({ ...formData, students_attended: parseInt(e.target.value) || 0 })}
                      />
                      <span className="form-hint">Staff-verified aggregate head count</span>
                    </div>
                  </div>

                  {batchStudents.length > 0 ? (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                        Per-Student Roster ({studentAttendanceList.filter(s => s.is_present).length} of {studentAttendanceList.length} Present)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                        {studentAttendanceList.map((st, idx) => (
                          <div
                            key={st.student_id}
                            className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                              st.is_present
                                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                                : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800 opacity-80'
                            }`}
                            onClick={() => {
                              const updated = [...studentAttendanceList];
                              updated[idx].is_present = !updated[idx].is_present;
                              setStudentAttendanceList(updated);
                              const presCount = updated.filter(u => u.is_present).length;
                              setFormData(prev => ({ ...prev, students_attended: presCount }));
                            }}
                          >
                            <span className="font-semibold text-xs text-gray-900 dark:text-white">{st.name}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              st.is_present ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                            }`}>
                              {st.is_present ? 'Present' : 'Absent'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 text-xs text-muted italic bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                      No individual student profiles enrolled in this batch yet. Aggregate numbers above will be saved.
                    </div>
                  )}

                  <div className="form-group">
                    <label>Session Remarks & Lab Notes</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Completed sample problems 1 & 2. Two students need extra assistance in pointers tomorrow."
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Summary & Actions */}
            <div className="space-y-5">
              <div className="dashboard-section-card sticky top-24">
                <div className="section-card-header">
                  <div>
                    <h3>Session Summary</h3>
                    <p className="text-muted">Live overview before recording</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border-subtle bg-slate-50 dark:bg-slate-800/50 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Batch:</span>
                    <span className="font-bold text-primary">{selectedBatchObj?.name || '—'}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Course:</span>
                    <span className="badge-pill course-pill">{selectedBatchObj?.course_name || '—'}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Session Type:</span>
                    <span className="badge-pill info font-bold">
                      {formData.session_type === 'LAB' ? 'Lab Practice' : formData.session_type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Date:</span>
                    <span className="font-semibold">{formData.date}</span>
                  </div>

                  <div className="pt-2 border-t border-border-subtle">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted font-semibold">Attendance Rate:</span>
                      <strong className="text-emerald">{attendancePct}% ({formData.students_attended}/{formData.total_enrolled})</strong>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, attendancePct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={saving}>
                    {saving ? 'Saving Session Log…' : (editingLogId ? 'Update Session Entry' : 'Save Session Log')}
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
      {/* Header */}
      <div className="tab-pane-header">
        <div>
          <h2>Staff Daily Task & Attendance Tracker</h2>
          <p className="text-muted">
            Daily-entry table filled by Staff and reviewed by Admin. View all batches running on any given date with session types and attendance numbers.
          </p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenLogModal(null)}>
          <Plus size={16} /> New Session Entry
        </button>
      </div>

      {/* Date Picker Bar */}
      <div className="filter-card">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="font-semibold text-sm flex items-center gap-2">
            <Calendar size={16} className="text-primary" /> Select Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="filter-date-input"
          />
          <button
            className="btn-outline-sm"
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          >
            Today
          </button>
          <span className="text-sm font-semibold text-primary ml-auto">
            {formattedSelectedDate}
          </span>
          <button className="icon-btn" onClick={() => loadMatrix(selectedDate)} title="Refresh">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Multi-Batch Status Grid for the Day */}
      <div className="dashboard-section-card mt-4">
        <div className="section-card-header">
          <div>
            <h3>All Batches Status Matrix for {formattedSelectedDate}</h3>
            <p className="text-muted">
              Distinguishes between duplicate course names running in parallel. Staff enter aggregate student count + remarks.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading day's batch records…</div>
        ) : matrixData.length === 0 ? (
          <div className="empty-card">
            <AlertCircle size={36} className="empty-icon text-muted" />
            <p>No active batches configured in the system.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Batch Identifier</th>
                  <th>Course Name</th>
                  <th>Session Type / Topic Covered</th>
                  <th>Schedule</th>
                  <th>Enrolled</th>
                  <th>Attended Count</th>
                  <th>Staff Trainer</th>
                  <th>Remarks</th>
                  <th style={{ width: '120px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {matrixData.map((row) => (
                  <tr key={row.batch_id} className={row.has_entry ? 'row-logged' : ''}>
                    <td>
                      <span className="font-semibold text-primary">{row.batch_name}</span>
                    </td>
                    <td>
                      <span className="badge-pill course-pill">{row.course_name}</span>
                    </td>
                    <td>
                      {row.has_entry ? (
                        <div>
                          <span className="badge-pill info">
                            {row.session_type === 'LAB' ? 'Lab Practice' : row.session_type}
                          </span>
                          {row.session_title && (
                            <div className="text-xs text-muted mt-1 font-medium">{row.session_title}</div>
                          )}
                        </div>
                      ) : (
                        <span className="badge-pill warning">Not Logged Yet</span>
                      )}
                    </td>
                    <td className="text-muted text-sm">
                      <Clock size={13} className="inline mr-1" />
                      {row.schedule}
                    </td>
                    <td className="font-bold">{row.total_enrolled}</td>
                    <td>
                      {row.has_entry ? (
                        <div className="attendance-metric">
                          <strong className="text-emerald">{row.students_attended}</strong> / {row.total_enrolled}
                          <span className="text-xs text-muted ml-1">
                            ({Math.round((row.students_attended / (row.total_enrolled || 1)) * 100)}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted italic text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <span className="text-xs font-semibold">
                        {row.staff_logged || row.staff_names?.join(', ') || 'Staff'}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-muted max-w-xs block truncate" title={row.remarks}>
                        {row.remarks || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn-outline-sm"
                          onClick={() => handleOpenLogModal(row)}
                        >
                          {row.has_entry ? 'Edit Log' : 'Fill Log'}
                        </button>
                        {row.log_id && (
                          <button
                            className="icon-btn danger"
                            onClick={() => handleDeleteLog(row.log_id)}
                            title="Delete Log"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
