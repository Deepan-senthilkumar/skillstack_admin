import { useState, useEffect } from 'react';
import {
  Users, BookOpen, Layers, CheckCircle2, Clock,
  Calendar, Award, ArrowUpRight, Plus, Eye, BarChart3
} from 'lucide-react';
import { api } from '../api';

export default function OverviewTab({ user, onNavigate }) {
  const [stats, setStats] = useState({
    activeBatches: 0,
    totalStudents: 0,
    totalStaff: 0,
    totalCourses: 0,
    todayLoggedBatches: 0,
    todayAttendanceAvg: 0,
    totalSubmissions: 0,
    passedSubmissions: 0,
    passRate: 0,
  });
  const [matrixData, setMatrixData] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const [batchesRes, usersRes, coursesRes, matrixRes, subsRes] = await Promise.all([
        api.getBatches().catch(() => []),
        api.getUsers().catch(() => []),
        api.getSubjects().catch(() => []),
        api.getDailyBatchMatrix().catch(() => ({ matrix: [] })),
        api.getSubmissions({ page_size: 5 }).catch(() => ({ results: [] })),
      ]);

      const batches = Array.isArray(batchesRes) ? batchesRes : (batchesRes.results || []);
      const users = Array.isArray(usersRes) ? usersRes : (usersRes.results || []);
      const courses = Array.isArray(coursesRes) ? coursesRes : (coursesRes.results || []);
      const matrix = matrixRes.matrix || [];
      const subs = Array.isArray(subsRes) ? subsRes : (subsRes.results || []);

      const students = users.filter(u => u.role === 'STUDENT');
      const staffList = users.filter(u => u.role === 'STAFF');

      const loggedBatches = matrix.filter(m => m.has_entry);
      const totalEnrolledToday = matrix.reduce((acc, m) => acc + (m.total_enrolled || 0), 0);
      const totalAttendedToday = matrix.reduce((acc, m) => acc + (m.students_attended || 0), 0);
      const attendanceAvg = totalEnrolledToday > 0 ? Math.round((totalAttendedToday / totalEnrolledToday) * 100) : 0;

      const passedSubs = subs.filter(s => s.is_passed).length;
      const passRate = subs.length > 0 ? Math.round((passedSubs / subs.length) * 100) : 0;

      setStats({
        activeBatches: batches.filter(b => b.status === 'ACTIVE').length,
        totalStudents: students.length,
        totalStaff: staffList.length,
        totalCourses: courses.length,
        todayLoggedBatches: loggedBatches.length,
        todayTotalBatches: matrix.length,
        todayAttendanceAvg: attendanceAvg,
        totalSubmissions: subs.length,
        passedSubmissions: passedSubs,
        passRate,
      });

      setMatrixData(matrix);
      setRecentSubmissions(subs);
    } catch (e) {
      console.error('Failed to load overview', e);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <div className="overview-container">
      {/* Header Banner */}
      <div className="overview-welcome-card">
        <div className="welcome-text">
          <h2>Welcome back, {user?.first_name || user?.username || 'Trainer'}! 👋</h2>
          <p className="welcome-subtitle">
            Tutor Operations Center • {todayStr} • Role: <strong className="role-badge">{user?.is_admin ? 'Super Admin / Owner' : 'Staff Trainer'}</strong>
          </p>
        </div>
        <div className="welcome-actions">
          <button className="btn-primary" onClick={() => onNavigate('daily_task')}>
            <Plus size={16} /> Log Today's Class
          </button>
          <button className="btn-secondary" onClick={() => onNavigate('batches')}>
            <Layers size={16} /> Manage Batches
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        <div className="kpi-card" onClick={() => onNavigate('batches')}>
          <div className="kpi-icon-wrap blue">
            <Layers size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Active Batches</span>
            <div className="kpi-val-row">
              <span className="kpi-value">{stats.activeBatches}</span>
              <span className="kpi-tag">Running</span>
            </div>
          </div>
        </div>

        <div className="kpi-card" onClick={() => onNavigate('users')}>
          <div className="kpi-icon-wrap emerald">
            <Users size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Learners Enrolled</span>
            <div className="kpi-val-row">
              <span className="kpi-value">{stats.totalStudents}</span>
              <span className="kpi-sublabel">({stats.totalStaff} Staff)</span>
            </div>
          </div>
        </div>

        <div className="kpi-card" onClick={() => onNavigate('daily_task')}>
          <div className="kpi-icon-wrap amber">
            <Calendar size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Today's Batch Logs</span>
            <div className="kpi-val-row">
              <span className="kpi-value">{stats.todayLoggedBatches} / {stats.todayTotalBatches || stats.activeBatches}</span>
              <span className="kpi-tag amber">{stats.todayAttendanceAvg}% Attended</span>
            </div>
          </div>
        </div>

        <div className="kpi-card" onClick={() => onNavigate('submissions')}>
          <div className="kpi-icon-wrap purple">
            <Award size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Submissions Pass Rate</span>
            <div className="kpi-val-row">
              <span className="kpi-value">{stats.passRate}%</span>
              <span className="kpi-sublabel">Auto-validated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Batch Matrix Quick Overview */}
      <div className="dashboard-section-card">
        <div className="section-card-header">
          <div>
            <h3>Today's Multi-Batch Status Grid</h3>
            <p className="text-muted">Live view across all batches running today (duplicate courses distinguished by batch)</p>
          </div>
          <button className="btn-outline" onClick={() => onNavigate('daily_task')}>
            Open Daily Tracker <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Batch Name</th>
                <th>Course</th>
                <th>Schedule</th>
                <th>Trainers</th>
                <th>Enrolled</th>
                <th>Attended</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {matrixData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    {loading ? 'Loading batch schedule…' : 'No active batches configured yet.'}
                  </td>
                </tr>
              ) : (
                matrixData.map((row) => (
                  <tr key={row.batch_id}>
                    <td className="font-semibold text-primary">{row.batch_name}</td>
                    <td><span className="badge-pill course-pill">{row.course_name}</span></td>
                    <td className="text-muted"><Clock size={13} className="inline mr-1" />{row.schedule}</td>
                    <td>{row.staff_names?.join(', ') || 'Unassigned'}</td>
                    <td><strong>{row.total_enrolled}</strong> students</td>
                    <td>
                      {row.has_entry ? (
                        <span className="attendance-metric">
                          <strong>{row.students_attended}</strong> / {row.total_enrolled} ({Math.round((row.students_attended / (row.total_enrolled || 1)) * 100)}%)
                        </span>
                      ) : (
                        <span className="text-muted italic">Pending log</span>
                      )}
                    </td>
                    <td>
                      {row.has_entry ? (
                        <span className="badge-pill success">
                          <CheckCircle2 size={12} /> {row.session_type}
                        </span>
                      ) : (
                        <span className="badge-pill warning">Needs Entry</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Code Submissions Stream */}
      <div className="dashboard-section-card">
        <div className="section-card-header">
          <div>
            <h3>Recent Auto-Validated Submissions</h3>
            <p className="text-muted">Live compilation & test results against Admin expected outputs</p>
          </div>
          <button className="btn-outline" onClick={() => onNavigate('submissions')}>
            View All Submissions <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Batch / Course</th>
                <th>Problem</th>
                <th>Language</th>
                <th>Result</th>
                <th>Exec Time</th>
                <th>Attempt</th>
              </tr>
            </thead>
            <tbody>
              {recentSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">No submissions recorded yet.</td>
                </tr>
              ) : (
                recentSubmissions.map((sub) => (
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
                      <div>{sub.batch_name || 'General'}</div>
                      <div className="text-xs text-muted">{sub.course_name}</div>
                    </td>
                    <td className="font-medium">{sub.problem_title}</td>
                    <td><span className="lang-tag">{sub.language}</span></td>
                    <td>
                      <span className={`badge-pill ${sub.is_passed ? 'success' : 'danger'}`}>
                        {sub.is_passed ? 'PASSED' : (sub.status || 'FAILED')}
                      </span>
                    </td>
                    <td>{sub.execution_time_ms ? `${sub.execution_time_ms} ms` : '—'}</td>
                    <td>#{sub.attempt_number || 1}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
