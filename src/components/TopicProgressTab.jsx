import { useState, useEffect } from 'react';
import {
  CheckCircle2, Circle, Clock, Layers,
  Calendar, Check, User, AlertCircle, RefreshCw
} from 'lucide-react';
import { api } from '../api';

export default function TopicProgressTab({ user, defaultBatchId }) {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(defaultBatchId || '');
  const [topicProgress, setTopicProgress] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      loadBatchProgress(selectedBatchId);
    }
  }, [selectedBatchId]);

  const loadBatches = async () => {
    setLoadingBatches(true);
    try {
      const res = await api.getBatches();
      const safe = Array.isArray(res) ? res : (res.results || []);
      setBatches(safe);
      if (safe.length > 0 && !selectedBatchId) {
        setSelectedBatchId(defaultBatchId || safe[0].id);
      }
    } catch (e) {
      console.error('Failed to load batches for progress tracker', e);
    } finally {
      setLoadingBatches(false);
    }
  };

  const loadBatchProgress = async (batchId) => {
    setLoadingProgress(true);
    try {
      const res = await api.getBatchTopicProgress(batchId);
      const safe = Array.isArray(res) ? res : (res.results || []);
      setTopicProgress(safe);
    } catch (e) {
      console.error('Failed to load topic progress', e);
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleToggle = async (item) => {
    setTogglingId(item.topic);
    try {
      const newStatus = !item.is_completed;
      await api.toggleBatchTopicProgress(selectedBatchId, item.topic, newStatus);
      await loadBatchProgress(selectedBatchId);
    } catch (e) {
      alert(e.message || 'Failed to update topic status');
    } finally {
      setTogglingId(null);
    }
  };

  const currentBatch = batches.find(b => b.id === parseInt(selectedBatchId));
  const completedCount = topicProgress.filter(t => t.is_completed).length;
  const totalCount = topicProgress.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="tab-pane-container">
      {/* Header */}
      <div className="tab-pane-header">
        <div>
          <h2>Topic Progress Tracker</h2>
          <p className="text-muted">
            Track syllabus completion independently per batch. Marking topics complete is not blocked by or tied to attendance.
          </p>
        </div>
      </div>

      {/* Batch Selector Bar */}
      <div className="filter-card">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="font-semibold text-sm flex items-center gap-2">
            <Layers size={16} className="text-primary" /> Active Batch:
          </label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="filter-select text-base font-medium"
          >
            {batches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.course_name}) — {b.schedule}
              </option>
            ))}
          </select>
          <button
            className="icon-btn"
            onClick={() => loadBatchProgress(selectedBatchId)}
            title="Refresh Progress"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Batch Summary Header Card */}
      {currentBatch && (
        <div className="batch-progress-summary-card">
          <div className="summary-left">
            <span className="badge-pill course-pill">{currentBatch.course_name}</span>
            <h3 className="summary-batch-title">{currentBatch.name}</h3>
            <p className="text-muted text-sm flex items-center gap-2 mt-1">
              <Clock size={14} /> Schedule: {currentBatch.schedule}
            </p>
          </div>

          <div className="summary-stats-box">
            <div className="stat-num-box">
              <span className="stat-big-num text-primary">{percent}%</span>
              <span className="text-xs text-muted">Completed</span>
            </div>
            <div className="stat-details-col">
              <span className="text-sm font-semibold">
                {completedCount} <span className="text-muted font-normal">Topics Done</span>
              </span>
              <span className="text-sm text-amber font-semibold">
                {totalCount - completedCount} <span className="text-muted font-normal">Remaining</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Topics Checklist Table */}
      <div className="dashboard-section-card mt-4">
        <div className="section-card-header">
          <div>
            <h3>Course Curriculum Topics & Labs</h3>
            <p className="text-muted">Click the toggle button to mark a topic or lab complete/pending for this batch.</p>
          </div>
        </div>

        {loadingProgress ? (
          <div className="loading-state">Loading topic progress…</div>
        ) : topicProgress.length === 0 ? (
          <div className="empty-card">
            <AlertCircle size={36} className="empty-icon text-muted" />
            <p>No topics found under this course curriculum.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Order</th>
                  <th>Topic / Lab Name</th>
                  <th>Completion Status</th>
                  <th>Completed Date</th>
                  <th>Marked By</th>
                  <th style={{ width: '150px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {topicProgress.map((item, index) => (
                  <tr key={item.id || item.topic} className={item.is_completed ? 'row-completed' : ''}>
                    <td className="font-mono font-bold text-muted">#{item.topic_order || index + 1}</td>
                    <td>
                      <div className="font-semibold text-base">{item.topic_title}</div>
                      {item.remarks && (
                        <div className="text-xs text-muted mt-1 italic">
                          Remarks: {item.remarks}
                        </div>
                      )}
                    </td>
                    <td>
                      {item.is_completed ? (
                        <span className="badge-pill success">
                          <CheckCircle2 size={13} /> Completed
                        </span>
                      ) : (
                        <span className="badge-pill secondary">
                          <Circle size={13} /> Pending
                        </span>
                      )}
                    </td>
                    <td>
                      {item.completed_at ? (
                        <span className="text-sm font-medium">
                          {new Date(item.completed_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </span>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>
                    <td>
                      {item.marked_by_name ? (
                        <span className="text-xs font-semibold flex items-center gap-1">
                          <User size={12} className="text-primary" /> {item.marked_by_name}
                        </span>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <button
                        className={`btn-toggle-completion ${item.is_completed ? 'completed' : 'pending'}`}
                        onClick={() => handleToggle(item)}
                        disabled={togglingId === item.topic}
                      >
                        {item.is_completed ? (
                          <>
                            <Check size={14} /> Mark Pending
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={14} /> Mark Done
                          </>
                        )}
                      </button>
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
