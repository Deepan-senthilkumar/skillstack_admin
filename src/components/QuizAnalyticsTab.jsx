import { useState, useEffect } from 'react';
import {
  BarChart3, Search, Filter, RefreshCw, Eye, Award,
  ShieldAlert, CheckCircle2, XCircle, Clock, AlertTriangle,
  RotateCcw, User, BookOpen, Layers, X, Sparkles
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

  // Inspector modal state
  const [inspectingAttempt, setInspectingAttempt] = useState(null);
  const [resettingCooldown, setResettingCooldown] = useState(false);

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

  return (
    <div className="admin-page-container space-y-5">
      {/* Header */}
      <div className="admin-page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
            <BarChart3 size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Test &amp; Quiz Analytics</h1>
            <p className="text-xs text-slate-500">
              Detailed tracking of student attempts, randomized 5-question scores, security infractions, and answer inspection.
            </p>
          </div>
        </div>

        <button
          onClick={loadAnalytics}
          className="btn-secondary flex items-center gap-2 text-xs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
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
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="p-3.5 w-12 text-center">#</th>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Topic</th>
                  <th className="p-3.5 text-center">Score / Total</th>
                  <th className="p-3.5 text-center">Percentage</th>
                  <th className="p-3.5 text-center">Result Status</th>
                  <th className="p-3.5 text-center">Security Violations</th>
                  <th className="p-3.5 text-center">Time Taken</th>
                  <th className="p-3.5">Date &amp; Time</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((att, idx) => (
                  <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 text-center font-mono text-slate-400">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800">{att.student_name || att.student_username}</div>
                      <div className="text-[11px] text-slate-400">{att.student_username}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{att.topic_title}</div>
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-800">
                      {att.score} / {att.total_questions}
                    </td>
                    <td className="p-3.5 text-center font-black">
                      <span className={att.percentage >= 50 ? 'text-emerald-600' : 'text-rose-600'}>
                        {att.percentage}%
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      {att.status === 'PASSED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                          <CheckCircle2 size={12} /> Passed
                        </span>
                      ) : att.status === 'FAILED_SECURITY' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]" title={att.violation_details}>
                          <ShieldAlert size={12} /> Security Terminated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                          <XCircle size={12} /> Failed (&lt;50%)
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {att.security_violations > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[11px]">
                          <AlertTriangle size={11} /> {att.security_violations} Infraction{att.security_violations > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">0</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center text-slate-600 font-mono text-[11px]">
                      {formatSeconds(att.time_taken_seconds)}
                    </td>
                    <td className="p-3.5 text-slate-500 text-[11px]">
                      {new Date(att.created_at).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectingAttempt(att)}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-indigo-600"
                          title="Inspect Student Answers"
                        >
                          <Eye size={14} />
                        </button>
                        {!att.is_passed && (
                          <button
                            onClick={() => handleResetCooldown(att.student, att.topic, att.student_name || att.student_username)}
                            className="p-1.5 rounded hover:bg-amber-50 text-slate-400 hover:text-amber-600"
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

      {/* Inspect Attempt Modal */}
      {inspectingAttempt && (
        <div className="modal-overlay" onClick={() => setInspectingAttempt(null)}>
          <div className="modal-content max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Test Attempt Audit: {inspectingAttempt.student_name || inspectingAttempt.student_username}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Topic: <strong>{inspectingAttempt.topic_title}</strong> &bull; Score: <strong>{inspectingAttempt.score}/{inspectingAttempt.total_questions} ({inspectingAttempt.percentage}%)</strong>
                </p>
              </div>

              <button
                onClick={() => setInspectingAttempt(null)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body py-4 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Infractions Banner if any */}
              {inspectingAttempt.security_violations > 0 && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
                  <div className="flex items-center gap-2 font-bold mb-0.5">
                    <ShieldAlert size={15} />
                    <span>Security Infractions Detected: {inspectingAttempt.security_violations}</span>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    {inspectingAttempt.violation_details || 'Multiple tab switches, minimize, or window exits recorded.'}
                  </p>
                </div>
              )}

              {/* Questions snapshot list */}
              {inspectingAttempt.questions_data && inspectingAttempt.questions_data.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-700">Questions Presented in this Attempt:</h4>
                  {inspectingAttempt.questions_data.map((q, qIdx) => {
                    const isCorrect = q.is_correct;
                    const studentAns = q.user_choice || inspectingAttempt.selected_answers?.[String(q.id)] || 'None';

                    return (
                      <div
                        key={q.id || qIdx}
                        className={`p-3.5 rounded-xl border ${isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'} space-y-2`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-slate-800">
                            <span className="font-bold text-slate-500 mr-1.5">Q{qIdx + 1}.</span>
                            {q.question_text}
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold flex-shrink-0 ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {isCorrect ? 'Correct (+1)' : 'Incorrect (0)'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11.5px] pt-1">
                          <div className={`p-2 rounded border ${q.correct_option === 'A' ? 'border-emerald-400 bg-emerald-50 font-bold text-emerald-900' : studentAns === 'A' ? 'border-rose-400 bg-rose-50 font-bold text-rose-900' : 'border-slate-200 bg-white text-slate-600'}`}>
                            <strong>A:</strong> {q.option_a}
                          </div>
                          <div className={`p-2 rounded border ${q.correct_option === 'B' ? 'border-emerald-400 bg-emerald-50 font-bold text-emerald-900' : studentAns === 'B' ? 'border-rose-400 bg-rose-50 font-bold text-rose-900' : 'border-slate-200 bg-white text-slate-600'}`}>
                            <strong>B:</strong> {q.option_b}
                          </div>
                          <div className={`p-2 rounded border ${q.correct_option === 'C' ? 'border-emerald-400 bg-emerald-50 font-bold text-emerald-900' : studentAns === 'C' ? 'border-rose-400 bg-rose-50 font-bold text-rose-900' : 'border-slate-200 bg-white text-slate-600'}`}>
                            <strong>C:</strong> {q.option_c}
                          </div>
                          <div className={`p-2 rounded border ${q.correct_option === 'D' ? 'border-emerald-400 bg-emerald-50 font-bold text-emerald-900' : studentAns === 'D' ? 'border-rose-400 bg-rose-50 font-bold text-rose-900' : 'border-slate-200 bg-white text-slate-600'}`}>
                            <strong>D:</strong> {q.option_d}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                          <div>
                            Student Chose: <strong className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>Option {studentAns}</strong>
                            <span className="mx-2">&bull;</span>
                            Correct Key: <strong className="text-emerald-700">Option {q.correct_option}</strong>
                          </div>
                        </div>

                        {q.explanation && (
                          <div className="text-[11px] text-slate-500 bg-white/70 p-2 rounded border border-slate-200/50 italic">
                            💡 Explanation: {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-lg">
                  No individual question snapshot available for this attempt.
                </div>
              )}
            </div>

            <div className="modal-footer flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                {!inspectingAttempt.is_passed && (
                  <button
                    onClick={() => {
                      handleResetCooldown(
                        inspectingAttempt.student,
                        inspectingAttempt.topic,
                        inspectingAttempt.student_name || inspectingAttempt.student_username
                      );
                      setInspectingAttempt(null);
                    }}
                    disabled={resettingCooldown}
                    className="btn-secondary text-xs flex items-center gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50"
                  >
                    <RotateCcw size={13} />
                    <span>Clear 10-Min Cooldown for Student</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setInspectingAttempt(null)}
                className="btn-secondary text-xs"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
