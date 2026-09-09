import { useState, useEffect } from 'react';
import {
  Code2, CheckCircle2, XCircle, AlertTriangle, Clock,
  Eye, Filter, Search, RefreshCw, X, Award, Trash2, Send
} from 'lucide-react';
import { api } from '../api';

export default function SubmissionInspectorTab({ user }) {
  const [submissions, setSubmissions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Inspection Modal
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [staffFeedback, setStaffFeedback] = useState('');
  const [reviewScore, setReviewScore] = useState(10);
  const [reviewStatus, setReviewStatus] = useState('PASSED');
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    loadFilters();
    loadSubmissions();
  }, [selectedBatch, selectedCourse, selectedStatus]);

  const loadFilters = async () => {
    try {
      const [bRes, cRes] = await Promise.all([
        api.getBatches(),
        api.getSubjects(),
      ]);
      setBatches(Array.isArray(bRes) ? bRes : (bRes.results || []));
      setCourses(Array.isArray(cRes) ? cRes : (cRes.results || []));
    } catch (e) {
      console.error('Failed to load filters', e);
    }
  };

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedBatch) params.batch = selectedBatch;
      if (selectedCourse) params.course = selectedCourse;
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.getSubmissions(params);
      const safe = Array.isArray(res) ? res : (res.results || []);
      setSubmissions(safe);
    } catch (e) {
      console.error('Failed to load submissions', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInspect = (sub) => {
    setSelectedSubmission(sub);
    setStaffFeedback(sub.staff_feedback || '');
    setReviewScore(sub.score !== null ? sub.score : (sub.is_passed ? 10 : 0));
    setReviewStatus(sub.status || (sub.is_passed ? 'PASSED' : 'FAILED'));
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    setSavingReview(true);
    try {
      await api.reviewSubmission(
        selectedSubmission.id,
        reviewStatus,
        reviewScore,
        staffFeedback
      );
      setSelectedSubmission(null);
      await loadSubmissions();
    } catch (err) {
      alert(err.message || 'Failed to submit feedback.');
    } finally {
      setSavingReview(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this submission record?')) return;
    try {
      await api.deleteSubmission(id);
      await loadSubmissions();
    } catch (e) {
      alert(e.message || 'Failed to delete submission');
    }
  };

  const filteredList = submissions.filter(s => {
    const q = searchQuery.toLowerCase();
    return s.student_name?.toLowerCase().includes(q) ||
           s.student_username?.toLowerCase().includes(q) ||
           s.problem_title?.toLowerCase().includes(q) ||
           s.batch_name?.toLowerCase().includes(q);
  });

  return (
    <div className="tab-pane-container">
      {/* Header */}
      <div className="tab-pane-header">
        <div>
          <h2>Code Submission & Validation Inspector</h2>
          <p className="text-muted">
            Live stream of student code runs. View actual output vs expected output diffs, compiler errors, runtime execution times, and attempt history.
          </p>
        </div>
        <button className="btn-outline" onClick={loadSubmissions}>
          <RefreshCw size={15} /> Refresh Stream
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filter-card">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by student, username, program, or batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="filter-select"
          >
            <option value="">All Batches</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="filter-select"
          >
            <option value="">All Courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">All Results</option>
            <option value="PASSED">Passed / Correct</option>
            <option value="FAILED">Incorrect Output</option>
            <option value="COMPILE_ERROR">Compilation Error</option>
            <option value="RUNTIME_ERROR">Runtime Error</option>
            <option value="TIMEOUT">Timeout</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="dashboard-section-card mt-4">
        {loading ? (
          <div className="loading-state">Loading code submissions…</div>
        ) : filteredList.length === 0 ? (
          <div className="empty-card">
            <Code2 size={40} className="empty-icon text-muted" />
            <h3>No Submissions Found</h3>
            <p className="text-muted">No student submissions match the active filter criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Batch & Course</th>
                  <th>Practice Program</th>
                  <th>Lang</th>
                  <th>Validation Result</th>
                  <th>Exec Time</th>
                  <th>Attempt</th>
                  <th>Submitted At</th>
                  <th style={{ width: '130px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar-sm">{sub.student_name?.[0] || 'S'}</div>
                        <div>
                          <div className="font-semibold">{sub.student_name}</div>
                          <div className="text-xs text-muted">@{sub.student_username}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-sm">{sub.batch_name || 'General Batch'}</div>
                      <div className="text-xs text-muted">{sub.course_name}</div>
                    </td>
                    <td>
                      <div className="font-semibold">{sub.problem_title}</div>
                      <div className="text-xs text-muted">{sub.topic_title}</div>
                    </td>
                    <td><span className="lang-tag">{sub.language}</span></td>
                    <td>
                      <span className={`badge-pill ${
                        sub.is_passed ? 'success' :
                        sub.status === 'COMPILE_ERROR' ? 'danger' :
                        sub.status === 'RUNTIME_ERROR' ? 'danger' : 'warning'
                      }`}>
                        {sub.is_passed ? (
                          <><CheckCircle2 size={12} /> Correct</>
                        ) : sub.status === 'COMPILE_ERROR' ? (
                          <><XCircle size={12} /> Compile Error</>
                        ) : sub.status === 'RUNTIME_ERROR' ? (
                          <><AlertTriangle size={12} /> Runtime Error</>
                        ) : (
                          <><XCircle size={12} /> Incorrect Output</>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-mono">
                        {sub.execution_time_ms ? `${sub.execution_time_ms} ms` : '—'}
                      </span>
                    </td>
                    <td>
                      <span className="badge-pill secondary text-xs font-mono font-bold">
                        #{sub.attempt_number || 1}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-muted">
                        {new Date(sub.submitted_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn-outline-sm"
                          onClick={() => handleOpenInspect(sub)}
                        >
                          <Eye size={13} /> Inspect
                        </button>
                        <button
                          className="icon-btn danger"
                          onClick={() => handleDelete(sub.id)}
                          title="Delete submission"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Inspection Modal with Actual vs Expected Output comparison */}
      {selectedSubmission && (
        <div className="modal-backdrop">
          <div className="modal-dialog max-w-4xl">
            <div className="modal-header">
              <div>
                <h3 className="flex items-center gap-2">
                  <Code2 size={20} className="text-primary" />
                  Submission Inspection #{selectedSubmission.id}
                </h3>
                <p className="text-xs text-muted mt-1">
                  Student: <strong>{selectedSubmission.student_name}</strong> • Problem: <strong>{selectedSubmission.problem_title}</strong> • Attempt #{selectedSubmission.attempt_number}
                </p>
              </div>
              <button className="icon-btn" onClick={() => setSelectedSubmission(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body space-y-4">
              {/* Telemetry Header */}
              <div className="grid grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border">
                <div>
                  <span className="text-xs text-muted block">Validation Status</span>
                  <span className={`badge-pill mt-1 ${selectedSubmission.is_passed ? 'success' : 'danger'}`}>
                    {selectedSubmission.is_passed ? 'PASSED / MATCH' : selectedSubmission.status}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted block">Language</span>
                  <span className="font-semibold text-sm mt-1 block uppercase">{selectedSubmission.language}</span>
                </div>
                <div>
                  <span className="text-xs text-muted block">Execution Time</span>
                  <span className="font-mono text-sm mt-1 block">{selectedSubmission.execution_time_ms} ms</span>
                </div>
                <div>
                  <span className="text-xs text-muted block">Score / Points</span>
                  <span className="font-semibold text-sm mt-1 block">{selectedSubmission.score || 0} pts</span>
                </div>
              </div>

              {/* Submitted Code Block */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase text-muted">Submitted Source Code</label>
                  <span className="text-xs font-mono text-muted">{selectedSubmission.submitted_code?.split('\n').length} lines</span>
                </div>
                <div className="code-viewer-box">
                  <pre><code>{selectedSubmission.submitted_code}</code></pre>
                </div>
              </div>

              {/* Output Comparison Grid (Actual vs Expected) */}
              <div className="grid grid-cols-2 gap-3">
                {/* Actual Output */}
                <div>
                  <label className="text-xs font-semibold uppercase text-muted block mb-1">
                    Captured Actual Output (Console / stdout)
                  </label>
                  <div className={`output-console-box ${selectedSubmission.is_passed ? 'border-emerald-500' : 'border-amber-500'}`}>
                    <pre>{selectedSubmission.actual_output || '(Empty Output)'}</pre>
                  </div>
                </div>

                {/* Expected Output */}
                <div>
                  <label className="text-xs font-semibold uppercase text-muted block mb-1">
                    Admin Expected Output (Answer Key)
                  </label>
                  <div className="output-console-box border-primary">
                    <pre>{selectedSubmission.expected_output || '(No Answer Key Configured)'}</pre>
                  </div>
                </div>
              </div>

              {/* Full Error Detail if Compilation or Runtime Failed */}
              {selectedSubmission.error_detail && (
                <div>
                  <label className="text-xs font-semibold uppercase text-danger block mb-1 flex items-center gap-1">
                    <AlertTriangle size={13} /> Compiler / Runtime Error Trace
                  </label>
                  <div className="output-console-box error-box">
                    <pre>{selectedSubmission.error_detail}</pre>
                  </div>
                </div>
              )}

              {/* Review / Feedback Section */}
              <form onSubmit={handleSaveReview} className="border-t pt-4 mt-4">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                  <Award size={15} className="text-primary" /> Trainer Review & Feedback
                </h4>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="form-group">
                    <label>Manual Status Override</label>
                    <select
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value)}
                    >
                      <option value="PASSED">Approve / Passed</option>
                      <option value="FAILED">Mark Failed</option>
                      <option value="REVISION_REQUESTED">Request Revision</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Assigned Score</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={reviewScore}
                      onChange={(e) => setReviewScore(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Staff Remarks to Student</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Excellent formatting! Try using a helper function next time."
                    value={staffFeedback}
                    onChange={(e) => setStaffFeedback(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 mt-3">
                  <button type="button" className="btn-secondary" onClick={() => setSelectedSubmission(null)}>
                    Close
                  </button>
                  <button type="submit" className="btn-primary" disabled={savingReview}>
                    <Send size={14} /> {savingReview ? 'Saving…' : 'Save Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
