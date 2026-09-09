import { useState, useEffect } from 'react';
import {
  BarChart3, Calendar, Filter, Download,
  Layers, Users, Clock, Award, CheckCircle2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { api } from '../api';

export default function ReportsAnalyticsTab({ user }) {
  const [viewType, setViewType] = useState('daily'); // 'daily', 'monthly', 'yearly'
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [reportData, setReportData] = useState({
    kpis: {},
    logs: [],
    count: 0,
    next: null,
    previous: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadReport();
  }, [viewType, selectedBatch, selectedCourse, selectedStaff, selectedMonth, selectedYear, pageSize, page]);

  const loadFilterOptions = async () => {
    try {
      const [bRes, cRes, uRes] = await Promise.all([
        api.getBatches(),
        api.getSubjects(),
        api.getUsers({ role: 'STAFF' }),
      ]);
      setBatches(Array.isArray(bRes) ? bRes : (bRes.results || []));
      setCourses(Array.isArray(cRes) ? cRes : (cRes.results || []));
      setStaffList(Array.isArray(uRes) ? uRes : (uRes.results || []));
    } catch (e) {
      console.error('Failed to load report filter options', e);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = {
        view: viewType,
        page_size: pageSize,
        page: page,
      };
      if (selectedBatch) params.batch = selectedBatch;
      if (selectedCourse) params.course = selectedCourse;
      if (selectedStaff) params.staff = selectedStaff;

      if (viewType === 'monthly' && selectedMonth) {
        params.month = selectedMonth;
      } else if (viewType === 'yearly' && selectedYear) {
        params.year = selectedYear;
      }

      const res = await api.getReportingAnalytics(params);
      setReportData({
        kpis: res.results?.kpis || res.kpis || {},
        logs: res.results?.logs || res.logs || (Array.isArray(res) ? res : res.results || []),
        count: res.count || 0,
        next: res.next,
        previous: res.previous,
      });
    } catch (e) {
      console.error('Failed to load report analytics', e);
    } finally {
      setLoading(false);
    }
  };

  const kpis = reportData.kpis || {};
  const logsList = Array.isArray(reportData.logs) ? reportData.logs : [];
  const totalPages = Math.ceil((reportData.count || logsList.length) / pageSize) || 1;

  const handleExportCSV = () => {
    if (logsList.length === 0) {
      alert('No data to export.');
      return;
    }
    const headers = ['Date', 'Batch', 'Course', 'Session Type', 'Topic/Title', 'Enrolled', 'Attended', 'Attendance %', 'Trainer', 'Remarks'];
    const rows = logsList.map(l => [
      l.date,
      `"${l.batch_name || ''}"`,
      `"${l.course_name || ''}"`,
      l.session_type,
      `"${l.session_title || ''}"`,
      l.total_enrolled,
      l.students_attended,
      l.total_enrolled > 0 ? `${Math.round((l.students_attended / l.total_enrolled) * 100)}%` : '0%',
      `"${l.staff_name || ''}"`,
      `"${(l.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `skillstack_report_${viewType}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="tab-pane-container">
      {/* Header */}
      <div className="tab-pane-header">
        <div>
          <h2>Operational Reporting & Analytics</h2>
          <p className="text-muted">
            Multi-dimensional reporting across Daily, Monthly, and Yearly aggregates with customizable filters and configurable pagination.
          </p>
        </div>
        <button className="btn-primary" onClick={handleExportCSV}>
          <Download size={15} /> Export CSV Report
        </button>
      </div>

      {/* KPI Cards Summary */}
      <div className="stats-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap blue">
            <Calendar size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Sessions Conducted</span>
            <span className="kpi-value">{kpis.total_sessions || 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap emerald">
            <Users size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Overall Attendance Average</span>
            <div className="kpi-val-row">
              <span className="kpi-value">{kpis.overall_attendance_pct || 0}%</span>
              <span className="kpi-tag">{kpis.total_attended_sum || 0} Total Presents</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap purple">
            <Award size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Code Submissions</span>
            <div className="kpi-val-row">
              <span className="kpi-value">{kpis.total_submissions || 0}</span>
              <span className="kpi-tag success">{kpis.passed_submissions || 0} Passed</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap amber">
            <Clock size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Avg Execution Time</span>
            <span className="kpi-value">{kpis.avg_execution_time_ms || 0} ms</span>
          </div>
        </div>
      </div>

      {/* View Mode & Filter Controls */}
      <div className="filter-card mt-4">
        {/* View Mode Switcher (Daily, Monthly, Yearly) */}
        <div className="view-mode-tabs">
          <button
            className={`view-tab-btn ${viewType === 'daily' ? 'active' : ''}`}
            onClick={() => { setViewType('daily'); setPage(1); }}
          >
            Daily (Date-Wise)
          </button>
          <button
            className={`view-tab-btn ${viewType === 'monthly' ? 'active' : ''}`}
            onClick={() => { setViewType('monthly'); setPage(1); }}
          >
            Monthly Aggregate
          </button>
          <button
            className={`view-tab-btn ${viewType === 'yearly' ? 'active' : ''}`}
            onClick={() => { setViewType('yearly'); setPage(1); }}
          >
            Yearly Aggregate
          </button>
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2 flex-wrap">
          {viewType === 'monthly' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => { setSelectedMonth(e.target.value); setPage(1); }}
              className="filter-date-input"
            />
          )}

          {viewType === 'yearly' && (
            <select
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setPage(1); }}
              className="filter-select"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          )}

          <select
            value={selectedBatch}
            onChange={(e) => { setSelectedBatch(e.target.value); setPage(1); }}
            className="filter-select"
          >
            <option value="">All Batches</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={selectedCourse}
            onChange={(e) => { setSelectedCourse(e.target.value); setPage(1); }}
            className="filter-select"
          >
            <option value="">All Courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {user?.is_admin && (
            <select
              value={selectedStaff}
              onChange={(e) => { setSelectedStaff(e.target.value); setPage(1); }}
              className="filter-select"
            >
              <option value="">All Trainers</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.first_name || s.username}</option>
              ))}
            </select>
          )}

          {/* Page Size Selector */}
          <div className="flex items-center gap-1 ml-auto text-xs text-muted">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}
              className="filter-select text-xs py-1"
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="dashboard-section-card mt-4">
        {loading ? (
          <div className="loading-state">Generating report data…</div>
        ) : logsList.length === 0 ? (
          <div className="empty-card">
            <BarChart3 size={40} className="empty-icon text-muted" />
            <p>No log records match the selected report filter parameters.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Batch Name</th>
                    <th>Course</th>
                    <th>Session Type</th>
                    <th>Topic Covered</th>
                    <th>Enrolled</th>
                    <th>Attended</th>
                    <th>Rate</th>
                    <th>Trainer</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {logsList.map((log) => {
                    const pct = log.total_enrolled > 0 ? Math.round((log.students_attended / log.total_enrolled) * 100) : 0;
                    return (
                      <tr key={log.id}>
                        <td className="font-semibold">{log.date}</td>
                        <td className="text-primary font-medium">{log.batch_name}</td>
                        <td><span className="badge-pill course-pill">{log.course_name}</span></td>
                        <td>
                          <span className="badge-pill info">
                            {log.session_type === 'LAB' ? 'Lab Practice' : log.session_type}
                          </span>
                        </td>
                        <td className="text-sm font-medium">{log.session_title || log.topic_title || '—'}</td>
                        <td className="font-semibold">{log.total_enrolled}</td>
                        <td className="font-bold text-emerald">{log.students_attended}</td>
                        <td>
                          <span className={`badge-pill ${pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'danger'}`}>
                            {pct}%
                          </span>
                        </td>
                        <td className="text-xs font-semibold">{log.staff_name || 'Staff'}</td>
                        <td className="text-xs text-muted max-w-xs truncate" title={log.remarks}>
                          {log.remarks || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="pagination-bar">
              <span className="text-xs text-muted">
                Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({reportData.count || logsList.length} total entries)
              </span>

              <div className="pagination-buttons">
                <button
                  className="btn-outline-sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={15} /> Prev
                </button>
                <button
                  className="btn-outline-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
