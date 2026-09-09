import { useState, useEffect } from 'react';
import {
  Users, BookOpen, Layers, CheckCircle2, Clock,
  Calendar, Award, ArrowUpRight, Plus, Eye, BarChart3,
  Sparkles, TrendingUp, AlertCircle, Check, ArrowRight,
  Code2, UserCheck, ShieldCheck, Flame
} from 'lucide-react';
import { api } from '../api';

export default function DashboardPage({ user, onNavigate }) {
  const [stats, setStats] = useState({
    activeBatches: 0,
    totalBatches: 0,
    totalStudents: 0,
    totalStaff: 0,
    totalCourses: 0,
    todayLoggedBatches: 0,
    todayTotalBatches: 0,
    todayAttendanceAvg: 0,
    totalEnrolledToday: 0,
    totalAttendedToday: 0,
    totalSubmissions: 0,
    passedSubmissions: 0,
    passRate: 0,
  });

  const [matrixData, setMatrixData] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [batchesRes, usersRes, coursesRes, matrixRes, subsRes] = await Promise.all([
        api.getBatches().catch(() => []),
        api.getUsers().catch(() => []),
        api.getSubjects().catch(() => []),
        api.getDailyBatchMatrix().catch(() => ({ matrix: [] })),
        api.getSubmissions({ page_size: 6 }).catch(() => ({ results: [] })),
      ]);

      const batches = Array.isArray(batchesRes) ? batchesRes : (batchesRes.results || []);
      const users = Array.isArray(usersRes) ? usersRes : (usersRes.results || []);
      const courses = Array.isArray(coursesRes) ? coursesRes : (coursesRes.results || []);
      const matrix = matrixRes.matrix || [];
      const subs = Array.isArray(subsRes) ? subsRes : (subsRes.results || []);

      const students = users.filter(u => u.role === 'STUDENT');
      const trainers = users.filter(u => u.role === 'STAFF' || u.is_admin_role);

      const loggedBatches = matrix.filter(m => m.has_entry);
      const totalEnrolledToday = matrix.reduce((acc, m) => acc + (m.total_enrolled || 0), 0);
      const totalAttendedToday = matrix.reduce((acc, m) => acc + (m.students_attended || 0), 0);
      const attendanceAvg = totalEnrolledToday > 0 ? Math.round((totalAttendedToday / totalEnrolledToday) * 100) : 0;

      const passedSubs = subs.filter(s => s.is_passed).length;
      const passRate = subs.length > 0 ? Math.round((passedSubs / subs.length) * 100) : 0;

      setStats({
        activeBatches: batches.filter(b => b.status === 'ACTIVE').length,
        totalBatches: batches.length,
        totalStudents: students.length,
        totalStaff: trainers.length,
        totalCourses: courses.length,
        todayLoggedBatches: loggedBatches.length,
        todayTotalBatches: matrix.length,
        todayAttendanceAvg: attendanceAvg,
        totalEnrolledToday,
        totalAttendedToday,
        totalSubmissions: subs.length,
        passedSubmissions: passedSubs,
        passRate,
      });

      setMatrixData(matrix);
      setRecentSubmissions(subs);
      setCoursesList(courses);
      setStaffList(trainers);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="dashboard-page-view animate-fade-in">
      {/* Top Welcome Hero Banner */}
      <div className="dash-hero-card">
        <div className="dash-hero-content">
          <div className="dash-hero-pill">
            <Flame size={14} className="text-warning animate-pulse" />
            <span>Tutor Operations Hub</span>
          </div>
          <h1 className="dash-hero-title">
            Welcome back, {user?.first_name || user?.username || 'Trainer'}! 👋
          </h1>
          <p className="dash-hero-desc">
            Today is <strong className="text-white font-medium">{todayFormatted}</strong>. You have{' '}
            <span className="hero-highlight">{stats.activeBatches} Active Batches</span> and{' '}
            <span className="hero-highlight">{stats.todayTotalBatches - stats.todayLoggedBatches} Sessions</span> remaining to be logged today.
          </p>

          <div className="dash-hero-quick-actions">
            <button className="dash-action-btn primary" onClick={() => onNavigate('daily_task')}>
              <Plus size={16} />
              <span>Log Today's Class / Lab</span>
            </button>
            <button className="dash-action-btn secondary" onClick={() => onNavigate('batches')}>
              <Layers size={16} />
              <span>Manage Batches</span>
            </button>
            <button className="dash-action-btn outline" onClick={() => onNavigate('submissions')}>
              <Code2 size={16} />
              <span>Review Code</span>
            </button>
            <button className="dash-action-btn outline" onClick={() => onNavigate('reports')}>
              <BarChart3 size={16} />
              <span>View Analytics</span>
            </button>
          </div>
        </div>

        <div className="dash-hero-badge-art">
          <div className="hero-attendance-gauge">
            <div className="gauge-metric-value">{stats.todayAttendanceAvg}%</div>
            <div className="gauge-metric-label">Today's Attendance</div>
            <div className="gauge-sub-info">
              {stats.totalAttendedToday} of {stats.totalEnrolledToday} students present
            </div>
            <div className="gauge-progress-bar">
              <div className="gauge-fill" style={{ width: `${stats.todayAttendanceAvg}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* KPI 4-Card Grid */}
      <div className="kpi-metric-grid">
        {/* Metric 1 */}
        <div className="kpi-card" onClick={() => onNavigate('batches')}>
          <div className="kpi-card-header">
            <span className="kpi-card-label">Active Batches</span>
            <div className="kpi-icon-bubble magenta">
              <Layers size={20} />
            </div>
          </div>
          <div className="kpi-metric-number">{stats.activeBatches}</div>
          <div className="kpi-card-footer">
            <span className="kpi-pill success">
              <TrendingUp size={12} /> {stats.totalBatches} Total
            </span>
            <span className="kpi-footnote">Morning & Evening</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="kpi-card" onClick={() => onNavigate('users')}>
          <div className="kpi-card-header">
            <span className="kpi-card-label">Enrolled Students</span>
            <div className="kpi-icon-bubble gold">
              <Users size={20} />
            </div>
          </div>
          <div className="kpi-metric-number">{stats.totalStudents}</div>
          <div className="kpi-card-footer">
            <span className="kpi-pill success">
              <UserCheck size={12} /> 100% Active
            </span>
            <span className="kpi-footnote">Across all courses</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="kpi-card" onClick={() => onNavigate('daily_task')}>
          <div className="kpi-card-header">
            <span className="kpi-card-label">Today's Class Logs</span>
            <div className="kpi-icon-bubble emerald">
              <Calendar size={20} />
            </div>
          </div>
          <div className="kpi-metric-number">
            {stats.todayLoggedBatches} <span className="text-lg text-muted">/ {stats.todayTotalBatches}</span>
          </div>
          <div className="kpi-card-footer">
            <span className={`kpi-pill ${stats.todayLoggedBatches === stats.todayTotalBatches ? 'success' : 'warning'}`}>
              {stats.todayLoggedBatches === stats.todayTotalBatches ? 'All Logged' : 'Pending Logs'}
            </span>
            <span className="kpi-footnote">Session tracking</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="kpi-card" onClick={() => onNavigate('submissions')}>
          <div className="kpi-card-header">
            <span className="kpi-card-label">Code Pass Rate</span>
            <div className="kpi-icon-bubble purple">
              <Award size={20} />
            </div>
          </div>
          <div className="kpi-metric-number">{stats.passRate}%</div>
          <div className="kpi-card-footer">
            <span className="kpi-pill info">
              <Code2 size={12} /> {stats.passedSubmissions} Passed
            </span>
            <span className="kpi-footnote">Auto-grader output</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="dash-sections-grid">
        {/* Left Column: Today's Batch Matrix */}
        <div className="dash-panel-card">
          <div className="dash-panel-header">
            <div>
              <h2 className="dash-panel-title">Today's Batch Attendance & Session Tracker</h2>
              <p className="dash-panel-subtitle">Real-time status for all scheduled course batches today</p>
            </div>
            <button className="panel-header-btn" onClick={() => onNavigate('daily_task')}>
              <span>View All Logs</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="dash-batch-matrix-list">
            {loading ? (
              <div className="p-8 text-center text-muted">Loading live batch status...</div>
            ) : matrixData.length === 0 ? (
              <div className="p-8 text-center text-muted">No active batches scheduled for today.</div>
            ) : (
              matrixData.map((item) => (
                <div key={item.batch_id} className={`matrix-batch-row ${item.has_entry ? 'completed' : 'pending'}`}>
                  <div className="matrix-row-info">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{item.batch_name}</span>
                      <span className="course-chip">{item.course_name}</span>
                    </div>
                    <div className="matrix-meta-line">
                      <span className="text-xs text-muted">Trainer: {item.trainer_name || 'Assigned Staff'}</span>
                      {item.session_title && (
                        <span className="text-xs text-primary font-medium">• {item.session_title}</span>
                      )}
                    </div>
                  </div>

                  <div className="matrix-row-status">
                    {item.has_entry ? (
                      <div className="status-badge-group">
                        <span className="status-chip success">
                          <CheckCircle2 size={13} />
                          <span>Logged ({item.students_attended}/{item.total_enrolled} Present)</span>
                        </span>
                      </div>
                    ) : (
                      <div className="status-badge-group">
                        <span className="status-chip warning">
                          <Clock size={13} />
                          <span>Pending Log</span>
                        </span>
                        <button
                          className="btn-quick-log"
                          onClick={() => onNavigate('daily_task')}
                        >
                          Log Now
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Recent Submissions & Course Quick Access */}
        <div className="dash-panel-card">
          <div className="dash-panel-header">
            <div>
              <h2 className="dash-panel-title">Recent Code Submissions</h2>
              <p className="dash-panel-subtitle">Latest student submissions from sandboxed code editor</p>
            </div>
            <button className="panel-header-btn" onClick={() => onNavigate('submissions')}>
              <span>Inspect All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="recent-submissions-list">
            {loading ? (
              <div className="p-8 text-center text-muted">Loading submissions...</div>
            ) : recentSubmissions.length === 0 ? (
              <div className="p-8 text-center text-muted">No submissions recorded yet.</div>
            ) : (
              recentSubmissions.map((sub) => (
                <div key={sub.id} className="submission-feed-item">
                  <div className="sub-feed-left">
                    <div className="sub-user-avatar">
                      {(sub.student_name || 'S')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-900">{sub.problem_title}</div>
                      <div className="text-xs text-muted">
                        by <strong className="text-gray-700">{sub.student_name}</strong> • {new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="sub-feed-right">
                    <span className="lang-tag uppercase">{sub.language || 'py'}</span>
                    <span className={`sub-status-pill ${sub.is_passed ? 'passed' : 'failed'}`}>
                      {sub.is_passed ? 'PASSED' : sub.status || 'FAILED'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Course Breakdown Strip */}
          <div className="course-quick-strip">
            <div className="strip-title">Active Courses ({coursesList.length})</div>
            <div className="strip-chips">
              {coursesList.map((c) => (
                <div key={c.id} className="course-micro-pill" onClick={() => onNavigate('courses')}>
                  <BookOpen size={12} />
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
