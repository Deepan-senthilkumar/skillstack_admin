import { useState, useEffect } from 'react';
import {
  CheckCircle2, Circle, Layers, Check, User, AlertCircle, RefreshCw
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

  // Sync active detail view with top fixed command bar
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('admin:set-header', {
      detail: {
        section: 'Students & Operations',
        breadcrumb: currentBatch ? `Batch Progress / ${currentBatch.name}` : 'Topic Progress',
        title: currentBatch ? `${currentBatch.name} — Progress Tracker` : 'Curriculum Progress Tracker'
      }
    }));
    return () => {
      window.dispatchEvent(new CustomEvent('admin:set-header', { detail: null }));
    };
  }, [currentBatch]);

  return (
    <div className="tab-pane-container animate-fade-in" style={{ padding: '24px' }}>
      {/* Top Batch Selection & Progress Metrics Bar */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '20px 24px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        {/* Left: Active Batch Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '320px', flex: '1 1 360px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: '#F5F3FF',
            color: '#7C3AED',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Layers size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
              Select Active Batch
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => loadBatchProgress(selectedBatchId)}
                title="Refresh Progress Data"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <RefreshCw size={15} className={loadingProgress ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Progress Meter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          background: '#F8FAFC',
          padding: '12px 20px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          minWidth: '280px',
          flex: '0 1 auto'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                Batch Syllabus Completion
              </span>
              <strong style={{ fontSize: '15px', color: '#7C3AED', fontWeight: 800 }}>
                {percent}%
              </strong>
            </div>
            {/* Progress Track */}
            <div style={{ width: '180px', height: '8px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                width: `${percent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #7C3AED 0%, #10B981 100%)',
                borderRadius: '999px',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', borderLeft: '1px solid #E2E8F0', paddingLeft: '16px' }}>
            <span style={{ color: '#059669', fontWeight: 700 }}>
              {completedCount} <span style={{ color: '#64748B', fontWeight: 500 }}>Completed</span>
            </span>
            <span style={{ color: '#D97706', fontWeight: 700 }}>
              {Math.max(0, totalCount - completedCount)} <span style={{ color: '#64748B', fontWeight: 500 }}>Remaining</span>
            </span>
          </div>
        </div>
      </div>

      {/* Topics Checklist Table */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E2E8F0',
          background: '#FAFAFA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
              Curriculum Topics &amp; Practice Labs
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748B' }}>
              Mark topics and coding sandboxes as covered for this batch cohort.
            </p>
          </div>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#64748B',
            background: '#F1F5F9',
            padding: '3px 10px',
            borderRadius: '999px'
          }}>
            {totalCount} Total Items
          </span>
        </div>

        {loadingProgress ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>
            <RefreshCw size={24} className="animate-spin text-primary" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: '13px' }}>Loading topic progress for active batch...</div>
          </div>
        ) : topicProgress.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8' }}>
            <AlertCircle size={36} style={{ margin: '0 auto 10px', color: '#CBD5E1' }} />
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#475569' }}>No topics found under this course curriculum.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '12px 18px', width: '70px', fontWeight: 700 }}>Order</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Topic / Lab Name</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Completion Status</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Completed Date</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Marked By</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right', width: '160px', fontWeight: 700 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {topicProgress.map((item, index) => {
                  const isDone = item.is_completed;
                  return (
                    <tr
                      key={item.id || item.topic}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        background: isDone ? 'rgba(236, 253, 245, 0.35)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ padding: '12px 18px', fontFamily: 'monospace', fontWeight: 700, color: '#64748B' }}>
                        #{item.topic_order || index + 1}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13.5px' }}>
                          {item.topic_title}
                        </div>
                        {item.remarks && (
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px', fontStyle: 'italic' }}>
                            Remarks: {item.remarks}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        {isDone ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            background: '#ECFDF5',
                            color: '#059669',
                            fontWeight: 700,
                            fontSize: '11.5px',
                            border: '1px solid #A7F3D0'
                          }}>
                            <CheckCircle2 size={13} /> Completed
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            background: '#F1F5F9',
                            color: '#64748B',
                            fontWeight: 600,
                            fontSize: '11.5px',
                            border: '1px solid #E2E8F0'
                          }}>
                            <Circle size={12} /> Pending
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 18px', color: '#475569', fontSize: '12.5px' }}>
                        {item.completed_at ? (
                          new Date(item.completed_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })
                        ) : (
                          <span style={{ color: '#94A3B8' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        {item.marked_by_name ? (
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <User size={13} color="#7C3AED" /> {item.marked_by_name}
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleToggle(item)}
                          disabled={togglingId === item.topic}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: togglingId === item.topic ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s ease',
                            border: isDone ? '1px solid #CBD5E1' : '1px solid #10B981',
                            background: isDone ? '#FFFFFF' : '#ECFDF5',
                            color: isDone ? '#475569' : '#059669',
                            opacity: togglingId === item.topic ? 0.6 : 1
                          }}
                        >
                          {isDone ? (
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
