import { useState, useEffect } from 'react';
import {
  BarChart3, Search, Filter, RefreshCw, Eye, Award,
  ShieldAlert, CheckCircle2, XCircle, Clock, AlertTriangle,
  RotateCcw, User, BookOpen, Layers, X, Sparkles, ArrowLeft
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import PaginationControls from './PaginationControls';

export default function QuizAnalyticsTab({ user }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [kpis, setKpis] = useState({
    total_attempts: 0,
    passed_attempts: 0,
    failed_attempts: 0,
    pass_rate_pct: 0,
    avg_score_pct: 0,
    security_infractions_sum: 0,
  });

  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  const [selectedTopicFilter, setSelectedTopicFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalResults, setTotalResults] = useState(0);

  // Inspector state
  const [inspectingAttempt, setInspectingAttempt] = useState(null);
  const [resettingCooldown, setResettingCooldown] = useState(false);

  // Sync active detail view with top fixed command bar
  useEffect(() => {
    if (inspectingAttempt) {
      window.dispatchEvent(new CustomEvent('admin:set-header', {
        detail: {
          section: 'Analytics',
          breadcrumb: `Quiz Audit / #${inspectingAttempt.id}`,
          title: `Quiz Audit: ${inspectingAttempt.student_name || inspectingAttempt.student_username || 'Student'}`
        }
      }));
    } else {
      window.dispatchEvent(new CustomEvent('admin:set-header', { detail: null }));
    }
    return () => {
      window.dispatchEvent(new CustomEvent('admin:set-header', { detail: null }));
    };
  }, [inspectingAttempt]);

  useEffect(() => {
    loadFilterMeta();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [selectedTopicFilter, selectedStatusFilter, searchQuery, currentPage, pageSize]);

  const loadFilterMeta = async () => {
    try {
      const [subsRes, topicsRes] = await Promise.all([
        api.getSubjects().catch(() => []),
        api.getTopics().catch(() => []),
      ]);
      setSubjects(Array.isArray(subsRes) ? subsRes : (subsRes?.results || []));
      setTopics(Array.isArray(topicsRes) ? topicsRes : (topicsRes?.results || []));
    } catch (e) {
      console.error('Failed to load filter metadata', e);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
      };
      if (selectedTopicFilter !== 'ALL') params.topic_id = selectedTopicFilter;
      if (selectedStatusFilter !== 'ALL') params.status = selectedStatusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.getQuizAnalytics(params);
      if (res && res.results) {
        setKpis(res.results.kpis || kpis);
        setAttempts(res.results.attempts || []);
        setTotalResults(res.count || 0);
      } else if (res && res.attempts) {
        setKpis(res.kpis || kpis);
        setAttempts(res.attempts || []);
        setTotalResults(res.total || res.attempts.length || 0);
      } else {
        setAttempts([]);
      }
    } catch (e) {
      console.error('Failed to load quiz analytics', e);
      toast.error('Failed to load test attempt analytics.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetCooldown = async (studentId, topicId, studentName) => {
    const isConfirmed = await confirm({
      title: 'Reset Cooldown Timer',
      message: `Reset the 10-minute cooldown for ${studentName}? This will allow the student to immediately re-attempt the quiz.`,
      confirmText: 'Reset Cooldown',
      confirmVariant: 'primary',
    });
    if (!isConfirmed) return;

    setResettingCooldown(true);
    try {
      await api.resetQuizCooldown(studentId, topicId);
      toast.success(`Cooldown timer reset for ${studentName}!`);
    } catch (e) {
      toast.error(e.message || 'Failed to reset cooldown.');
    } finally {
      setResettingCooldown(false);
    }
  };

  const totalPages = Math.ceil(totalResults / pageSize) || 1;

  const formatSeconds = (sec) => {
    if (!sec) return '< 1 min';
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s}s`;
  };

  // ----------------------------------------------------
  // DEDICATED INBUILT ATTEMPT AUDIT PAGE
  // ----------------------------------------------------
  if (inspectingAttempt) {
    return (
      <div className="tab-pane-container animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn-outline-sm"
              onClick={() => setInspectingAttempt(null)}
            >
              <ArrowLeft size={16} /> Back to Quiz Analytics
            </button>
            <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
              Attempt #{inspectingAttempt.id} • Student: <strong style={{ color: '#1E293B' }}>{inspectingAttempt.student_name || inspectingAttempt.student_username}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!inspectingAttempt.is_passed && (
              <button
                type="button"
                onClick={() => {
                  handleResetCooldown(
                    inspectingAttempt.student,
                    inspectingAttempt.topic,
                    inspectingAttempt.student_name || inspectingAttempt.student_username
                  );
                }}
                disabled={resettingCooldown}
                className="btn-outline-sm text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                <RotateCcw size={14} /> Clear 10-Min Cooldown
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Summary Cards */}
        <div className="dashboard-section-card mb-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div className="flex items-center gap-3">
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: inspectingAttempt.is_passed ? '#DCFCE7' : '#FEE2E2',
                color: inspectingAttempt.is_passed ? '#15803D' : '#B91C1C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Award size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    {inspectingAttempt.topic_title}
                  </h3>
                  <span className={`badge-pill ${inspectingAttempt.is_passed ? 'success' : 'danger'}`}>
                    {inspectingAttempt.is_passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '4px' }}>
                  Submitted on {new Date(inspectingAttempt.created_at).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, display: 'block' }}>SCORE</span>
                <strong style={{ fontSize: '18px', color: '#0F172A' }}>{inspectingAttempt.score} / {inspectingAttempt.total_questions}</strong>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, display: 'block' }}>PERCENTAGE</span>
                <strong style={{ fontSize: '18px', color: inspectingAttempt.is_passed ? '#10B981' : '#EF4444' }}>
                  {inspectingAttempt.percentage}%
                </strong>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, display: 'block' }}>VIOLATIONS</span>
                <strong style={{ fontSize: '18px', color: inspectingAttempt.security_violations > 0 ? '#DC2626' : '#10B981' }}>
                  {inspectingAttempt.security_violations || 0}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Infractions Banner if any */}
        {inspectingAttempt.security_violations > 0 && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 mb-4">
            <div className="flex items-center gap-2 font-bold mb-1">
              <ShieldAlert size={18} />
              <span>Security Infractions Detected: {inspectingAttempt.security_violations} violation(s)</span>
            </div>
            <p className="text-xs text-rose-700">
              {inspectingAttempt.violation_details || 'Multiple tab switches, minimize, or window exits recorded.'}
            </p>
          </div>
        )}

        {/* Questions snapshot list */}
        <div className="dashboard-section-card">
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', marginBottom: '16px' }}>
            Questions Presented in this Attempt ({inspectingAttempt.questions_data?.length || 0})
          </h4>

          {inspectingAttempt.questions_data && inspectingAttempt.questions_data.length > 0 ? (
            <div className="space-y-4">
              {inspectingAttempt.questions_data.map((q, qIdx) => {
                const isCorrect = q.is_correct;
                const studentAns = q.user_choice || inspectingAttempt.selected_answers?.[String(q.id)] || 'None';

                return (
                  <div
                    key={q.id || qIdx}
                    className={`p-4 rounded-xl border ${isCorrect ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'} space-y-3`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold text-slate-800 text-sm">
                        <span className="font-bold text-slate-500 mr-2">Q{qIdx + 1}.</span>
                        {q.question_text}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {isCorrect ? '✓ Correct (+1)' : '✗ Incorrect (0)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                      {[
                        { key: 'A', text: q.option_a },
                        { key: 'B', text: q.option_b },
                        { key: 'C', text: q.option_c },
                        { key: 'D', text: q.option_d },
                      ].map(({ key, text }) => {
                        const isCorrectKey = q.correct_option === key;
                        const isStudentKey = studentAns === key;
                        let borderStyle = 'border-slate-200 bg-white text-slate-700';
                        if (isCorrectKey) {
                          borderStyle = 'border-emerald-500 bg-emerald-50 font-bold text-emerald-900 ring-1 ring-emerald-400';
                        } else if (isStudentKey && !isCorrectKey) {
                          borderStyle = 'border-rose-500 bg-rose-50 font-bold text-rose-900 ring-1 ring-rose-400';
                        }

                        return (
                          <div key={key} className={`p-2.5 rounded-lg border ${borderStyle} flex items-center justify-between`}>
                            <div className="flex items-center gap-2">
                              <strong>{key}:</strong>
                              <span>{text}</span>
                            </div>
                            {isCorrectKey && <span className="text-[10px] uppercase font-bold text-emerald-700">Correct Key</span>}
                            {isStudentKey && !isCorrectKey && <span className="text-[10px] uppercase font-bold text-rose-700">Student Selected</span>}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                      <div>
                        Student Chose: <strong className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>Option {studentAns}</strong>
                        <span className="mx-2">&bull;</span>
                        Correct Key: <strong className="text-emerald-700">Option {q.correct_option}</strong>
                      </div>
                    </div>

                    {q.explanation && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 italic">
                        💡 <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl">
              No individual question snapshot available for this attempt.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container space-y-5">
      {/* Header */}
      <div className="tab-pane-header admin-page-header">
        <div className="header-left-content">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 flex-shrink-0" style={{ background: '#FAF5FF', border: '1px solid #E9D5FF' }}>
            <BarChart3 size={24} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h1 className="text-xl font-bold text-slate-800" style={{ margin: 0, textAlign: 'left' }}>Test &amp; Quiz Analytics</h1>
            <p className="text-xs text-slate-500" style={{ margin: '4px 0 0 0', textAlign: 'left' }}>
              Detailed tracking of student attempts, randomized 5-question scores, security infractions, and answer inspection.
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button
            onClick={loadAnalytics}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase text-slate-500">Total Attempts</span>
            <BookOpen size={16} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{kpis.total_attempts}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">All topics combined</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase text-slate-500">Pass Rate (&ge;50%)</span>
            <Award size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{kpis.pass_rate_pct}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{kpis.passed_attempts} Passed / {kpis.failed_attempts} Failed</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase text-slate-500">Average Score</span>
            <Sparkles size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600">{kpis.avg_score_pct}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across all randomized attempts</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase text-slate-500">Security Infractions</span>
            <ShieldAlert size={16} className="text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{kpis.security_infractions_sum}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tab switch &amp; exit triggers logged</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Topic Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Filter by Topic</label>
            <select
              value={selectedTopicFilter}
              onChange={(e) => {
                setSelectedTopicFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">All Topics</option>
              {topics.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Result / Status</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">All Results</option>
              <option value="PASSED">Passed (&ge; 50%)</option>
              <option value="FAILED_SCORE">Failed - Score Under 50%</option>
              <option value="FAILED_SECURITY">Terminated - Security Violation</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Search Student / Mobile</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search student name, phone..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Attempts Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
          <p className="text-xs">Loading attempt records...</p>
        </div>
      ) : attempts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Award size={36} className="mx-auto text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No Test Attempts Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            When students take randomized topic assessments, their scores, answers, and violation logs will appear here.
          </p>
        </div>
      ) : (
        <div className="dashboard-section-card mt-4">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                  <th>Student</th>
                  <th>Topic</th>
                  <th style={{ textAlign: 'center' }}>Score / Total</th>
                  <th style={{ textAlign: 'center' }}>Percentage</th>
                  <th style={{ textAlign: 'center' }}>Result Status</th>
                  <th style={{ textAlign: 'center' }}>Security Violations</th>
                  <th style={{ textAlign: 'center' }}>Time Taken</th>
                  <th>Date &amp; Time</th>
                  <th style={{ width: '90px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((att, idx) => (
                  <tr key={att.id}>
                    <td style={{ textAlign: 'center' }} className="font-mono text-muted text-xs">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td>
                      <div className="font-bold text-gray-900 dark:text-white text-sm">{att.student_name || att.student_username}</div>
                      <div className="text-xs text-muted">@{att.student_username}</div>
                    </td>
                    <td>
                      <div className="font-semibold text-gray-800 dark:text-gray-200 text-xs">{att.topic_title}</div>
                    </td>
                    <td style={{ textAlign: 'center' }} className="font-bold text-gray-900 dark:text-white text-xs">
                      {att.score} / {att.total_questions}
                    </td>
                    <td style={{ textAlign: 'center' }} className="font-bold text-xs">
                      <span className={att.percentage >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {att.percentage}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {att.status === 'PASSED' ? (
                        <span className="badge-pill success">
                          <CheckCircle2 size={12} /> Passed
                        </span>
                      ) : att.status === 'FAILED_SECURITY' ? (
                        <span className="badge-pill danger" title={att.violation_details}>
                          <ShieldAlert size={12} /> Security Terminated
                        </span>
                      ) : (
                        <span className="badge-pill warning">
                          <XCircle size={12} /> Failed (&lt;50%)
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {att.security_violations > 0 ? (
                        <span className="badge-pill danger">
                          <AlertTriangle size={11} /> {att.security_violations} Infraction{att.security_violations > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-muted font-mono text-xs">0</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }} className="text-muted font-mono text-xs">
                      {formatSeconds(att.time_taken_seconds)}
                    </td>
                    <td className="text-muted text-xs">
                      {new Date(att.created_at).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectingAttempt(att)}
                          className="icon-btn view"
                          title="Inspect Student Answers"
                        >
                          <Eye size={14} />
                        </button>
                        {!att.is_passed && (
                          <button
                            onClick={() => handleResetCooldown(att.student, att.topic, att.student_name || att.student_username)}
                            className="icon-btn reset"
                            title="Reset 10-Min Cooldown Timer"
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-slate-200">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalResults={totalResults}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      )}
    </div>
  );
}
