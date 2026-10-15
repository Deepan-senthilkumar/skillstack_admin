import React, { useState, useEffect } from 'react';
import {
  Award, BookOpen, Users, CheckCircle2, Clock, Trash2, Edit3,
  Search, Filter, Plus, Eye, RefreshCw, AlertTriangle, ShieldCheck,
  X, Check, ExternalLink, GraduationCap, FileText, Ban, ArrowLeft
} from 'lucide-react';
import { api, isDemoUser, notifyDemoRestriction } from '../api';

export default function EnrollmentsCertificatesTab({ user }) {
  const [subTab, setSubTab] = useState('enrollments'); // 'enrollments' | 'certificates'
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & dedicated views
  const [previewCert, setPreviewCert] = useState(null);
  const [editingCert, setEditingCert] = useState(null);
  const [manualCertModal, setManualCertModal] = useState(false);
  const [studyLogModal, setStudyLogModal] = useState(null);
  const [studentProgressList, setStudentProgressList] = useState([]);
  const [loadingStudyLog, setLoadingStudyLog] = useState(false);

  // Sync active detail view with top fixed command bar
  useEffect(() => {
    if (previewCert) {
      window.dispatchEvent(new CustomEvent('admin:set-header', {
        detail: {
          section: 'Students & Operations',
          breadcrumb: `Certificates / #${previewCert.certificate_id}`,
          title: `Certificate: ${previewCert.student_name}`
        }
      }));
    } else if (studyLogModal) {
      window.dispatchEvent(new CustomEvent('admin:set-header', {
        detail: {
          section: 'Students & Operations',
          breadcrumb: `Student Enrollments / Learning Log`,
          title: `${studyLogModal.student_name || studyLogModal.student_username}'s Learning Log`
        }
      }));
    } else {
      window.dispatchEvent(new CustomEvent('admin:set-header', { detail: null }));
    }
    return () => {
      window.dispatchEvent(new CustomEvent('admin:set-header', { detail: null }));
    };
  }, [previewCert, studyLogModal]);
  const [manualForm, setManualForm] = useState({
    student_id: '',
    subject_id: '',
    student_name: '',
    course_name: '',
    grade_percentage: 100
  });

  const [subjects, setSubjects] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [actionMsg, setActionMsg] = useState(null);

  const handleOpenStudyLog = async (enrollment) => {
    setStudyLogModal(enrollment);
    setLoadingStudyLog(true);
    try {
      const data = await api.getStudentTopicProgress(enrollment.student);
      const list = Array.isArray(data) ? data : (data?.results || []);
      setStudentProgressList(list);
    } catch (e) {
      console.error('Failed to load student study log', e);
      setStudentProgressList([]);
    } finally {
      setLoadingStudyLog(false);
    }
  };

  const handleClearCooldown = async (topicId) => {
    if (!studyLogModal) return;
    try {
      await api.clearQuizCooldown(studyLogModal.student, topicId);
      showNotification('Assessment cooldown cleared for student');
      const data = await api.getStudentTopicProgress(studyLogModal.student);
      setStudentProgressList(Array.isArray(data) ? data : (data?.results || []));
    } catch (e) {
      showNotification(e.message || 'Failed to clear cooldown', true);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [enrollRes, certRes, subsRes, usersRes] = await Promise.allSettled([
        api.getStaffEnrollments(),
        api.getStaffCertificates(),
        api.getSubjects(),
        api.getUsers ? api.getUsers() : Promise.resolve([])
      ]);

      if (enrollRes.status === 'fulfilled') {
        const list = Array.isArray(enrollRes.value) ? enrollRes.value : (enrollRes.value?.results || []);
        setEnrollments(list);
      }
      if (certRes.status === 'fulfilled') {
        const list = Array.isArray(certRes.value) ? certRes.value : (certRes.value?.results || []);
        setCertificates(list);
      }
      if (subsRes.status === 'fulfilled') {
        const list = Array.isArray(subsRes.value) ? subsRes.value : (subsRes.value?.results || []);
        setSubjects(list);
      }
      if (usersRes.status === 'fulfilled') {
        const list = Array.isArray(usersRes.value) ? usersRes.value : (usersRes.value?.results || []);
        setStudentsList(list);
      }
    } catch (e) {
      console.error('Error fetching enrollments/certificates:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (msg, isErr = false) => {
    setActionMsg({ text: msg, isError: isErr });
    setTimeout(() => setActionMsg(null), 4000);
  };

  // Status Change for Enrollment
  const handleUpdateEnrollmentStatus = async (enrollmentId, newStatus) => {
    if (isDemoUser(user)) {
      notifyDemoRestriction('Updating enrollment status');
      return;
    }
    try {
      await api.updateStaffEnrollment(enrollmentId, { status: newStatus });
      showNotification(`Enrollment updated to ${newStatus}`);
      fetchData();
    } catch (e) {
      showNotification(e.message || 'Failed to update enrollment', true);
    }
  };

  // Delete Enrollment
  const handleDeleteEnrollment = async (enrollmentId) => {
    if (isDemoUser(user)) {
      notifyDemoRestriction('Deleting enrollment');
      return;
    }
    if (!window.confirm('Are you sure you want to cancel and remove this student enrollment?')) return;
    try {
      await api.deleteStaffEnrollment(enrollmentId);
      showNotification('Enrollment removed successfully');
      fetchData();
    } catch (e) {
      showNotification(e.message || 'Failed to remove enrollment', true);
    }
  };

  // Save Edited Certificate
  const handleSaveCertificate = async (e) => {
    e.preventDefault();
    if (isDemoUser(user)) {
      notifyDemoRestriction('Editing certificate details');
      return;
    }
    try {
      await api.updateStaffCertificate(editingCert.id, {
        student_name: editingCert.student_name,
        course_name: editingCert.course_name,
        grade_percentage: editingCert.grade_percentage,
        is_revoked: editingCert.is_revoked
      });
      showNotification('Certificate credential updated successfully');
      setEditingCert(null);
      fetchData();
    } catch (err) {
      showNotification(err.message || 'Failed to update certificate', true);
    }
  };

  // Revoke Certificate
  const handleToggleRevokeCert = async (cert) => {
    if (isDemoUser(user)) {
      notifyDemoRestriction('Revoking / Reinstating certificate');
      return;
    }
    const newRevoked = !cert.is_revoked;
    const actionText = newRevoked ? 'revoke' : 'reinstate';
    if (!window.confirm(`Are you sure you want to ${actionText} certificate ${cert.certificate_id}?`)) return;

    try {
      await api.updateStaffCertificate(cert.id, {
        is_revoked: newRevoked,
        revoked_reason: newRevoked ? 'Revoked by faculty review' : ''
      });
      showNotification(`Certificate ${cert.certificate_id} ${newRevoked ? 'revoked' : 'reinstated'}`);
      fetchData();
    } catch (err) {
      showNotification(err.message || 'Failed to update certificate', true);
    }
  };

  // Delete Certificate
  const handleDeleteCertificate = async (certId) => {
    if (isDemoUser(user)) {
      notifyDemoRestriction('Deleting certificate');
      return;
    }
    if (!window.confirm('Permanently delete this certificate record?')) return;
    try {
      await api.deleteStaffCertificate(certId);
      showNotification('Certificate deleted permanently');
      fetchData();
    } catch (err) {
      showNotification(err.message || 'Failed to delete certificate', true);
    }
  };

  // Create Manual Certificate
  const handleCreateManualCert = async (e) => {
    e.preventDefault();
    if (isDemoUser(user)) {
      notifyDemoRestriction('Issuing certificate');
      return;
    }
    try {
      const payload = {
        student: manualForm.student_id ? parseInt(manualForm.student_id) : undefined,
        subject: manualForm.subject_id ? parseInt(manualForm.subject_id) : undefined,
        student_name: manualForm.student_name,
        course_name: manualForm.course_name,
        grade_percentage: parseFloat(manualForm.grade_percentage || 100)
      };
      await api.createStaffCertificate(payload);
      showNotification('Official certificate issued successfully!');
      setManualCertModal(false);
      setManualForm({
        student_id: '',
        subject_id: '',
        student_name: '',
        course_name: '',
        grade_percentage: 100
      });
      fetchData();
    } catch (err) {
      showNotification(err.message || 'Failed to issue manual certificate', true);
    }
  };

  // Filter Enrollments
  const filteredEnrollments = enrollments.filter(e => {
    const matchSearch = (e.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.subject_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.student_username || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;
    if (statusFilter === 'ALL') return true;
    return e.status === statusFilter;
  });

  // Filter Certificates
  const filteredCertificates = certificates.filter(c => {
    const matchSearch = (c.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.course_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.certificate_id || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  // Metric counts
  const totalEnrollments = enrollments.length;
  const activeCount = enrollments.filter(e => e.status === 'ACTIVE').length;
  const completedCount = enrollments.filter(e => e.status === 'COMPLETED').length;
  const totalCerts = certificates.length;

  // ----------------------------------------------------
  // DEDICATED INBUILT STUDENT LEARNING LOG VIEW
  // ----------------------------------------------------
  if (studyLogModal) {
    return (
      <div className="tab-pane-container animate-fade-in" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn-outline-sm"
              onClick={() => setStudyLogModal(null)}
            >
              <ArrowLeft size={16} /> Back to Enrollments
            </button>
            <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
              Course Track: <strong style={{ color: '#1E293B' }}>{studyLogModal.subject_name}</strong> • Batch: <span style={{ color: '#475569' }}>{studyLogModal.batch_name || 'Standard'}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleOpenStudyLog(studyLogModal)}
            className="btn-outline-sm"
          >
            <RefreshCw size={14} className={loadingStudyLog ? 'animate-spin' : ''} />
            <span>Refresh Log</span>
          </button>
        </div>

        {/* Student Overview Header Card */}
        <div className="card mb-4" style={{ padding: '20px 24px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: '#EEF2FF',
                color: '#4338CA',
                fontSize: '20px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {(studyLogModal.student_name || studyLogModal.student_username || 'S')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                    {studyLogModal.student_name || studyLogModal.student_username}'s Learning Log
                  </h3>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: '#EEF2FF',
                    color: '#4338CA'
                  }}>
                    @{studyLogModal.student_username}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                  Enrolled Course: <strong>{studyLogModal.subject_name}</strong> • Status: <strong style={{ color: studyLogModal.status === 'COMPLETED' ? '#059669' : '#2563EB' }}>{studyLogModal.status}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Progress</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#4338CA', marginTop: '2px' }}>
                  {Math.round(studyLogModal.progress_percentage || 0)}%
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Topics Mastered</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                  {studentProgressList.filter(p => p.is_completed).length} / {studentProgressList.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Topics Table List */}
        <div className="card" style={{ padding: '20px 24px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
            Individual Study & Assessment Records ({studentProgressList.length})
          </h4>

          {loadingStudyLog ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
              <RefreshCw size={24} className="animate-spin text-primary" style={{ margin: '0 auto 10px' }} />
              <div>Loading student topic logs...</div>
            </div>
          ) : studentProgressList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📖</div>
              <div style={{ fontWeight: 700, color: '#475569' }}>No separate topic logs recorded yet</div>
              <p style={{ fontSize: '0.8rem', maxWidth: '420px', margin: '6px auto 0' }}>
                As this student logs into the learning portal, studies topics, and answers chapter MCQs, their activity history and scores will be logged here.
              </p>
            </div>
          ) : (
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '12px 16px' }}>Topic & Module</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>MCQ Performance</th>
                    <th style={{ padding: '12px 16px' }}>Last Updated</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentProgressList.map((prog) => (
                    <tr key={prog.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{prog.topic_title}</div>
                        {prog.module_name && (
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{prog.module_name}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {prog.is_completed ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            background: '#ECFDF5',
                            color: '#059669',
                            fontWeight: 700,
                            fontSize: '0.78rem'
                          }}>
                            <CheckCircle2 size={13} /> Mastered
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            background: '#FFFBEB',
                            color: '#D97706',
                            fontWeight: 700,
                            fontSize: '0.78rem'
                          }}>
                            <Clock size={13} /> Reading / In Progress
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {prog.attempts_count > 0 ? (
                          <div>
                            <strong style={{ color: prog.last_passed ? '#059669' : '#DC2626' }}>
                              {prog.last_score} / {prog.last_total} ({prog.last_percentage}%)
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginLeft: '6px' }}>
                              ({prog.attempts_count} {prog.attempts_count === 1 ? 'attempt' : 'attempts'})
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>Study Notes Reading</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748B', fontSize: '0.8rem' }}>
                        {prog.completed_at ? new Date(prog.completed_at).toLocaleDateString() : (prog.updated_at ? new Date(prog.updated_at).toLocaleDateString() : 'N/A')}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {prog.is_in_cooldown ? (
                          <button
                            onClick={() => handleClearCooldown(prog.topic)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: '#FEE2E2',
                              border: '1px solid #FECACA',
                              color: '#DC2626',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            title="Clear student re-attempt cooldown"
                          >
                            Clear Cooldown ({Math.round((prog.cooldown_seconds_remaining || 0) / 60)}m)
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>Active</span>
                        )}
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

  // ----------------------------------------------------
  // DEDICATED INBUILT CERTIFICATE PREVIEW VIEW
  // ----------------------------------------------------
  if (previewCert) {
    return (
      <div className="tab-pane-container animate-fade-in" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn-outline-sm"
              onClick={() => setPreviewCert(null)}
            >
              <ArrowLeft size={16} /> Back to Certificates
            </button>
            <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
              Credential ID: <strong style={{ color: '#1E293B' }}>{previewCert.certificate_id}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-outline-sm"
              onClick={() => {
                const c = previewCert;
                setPreviewCert(null);
                setEditingCert({ ...c });
              }}
            >
              <Edit3 size={14} /> Edit Certificate
            </button>
          </div>
        </div>

        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          maxWidth: '860px',
          margin: '0 auto',
          padding: '44px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
          border: '6px double #7C3AED'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '999px',
              background: 'rgba(124, 58, 237, 0.08)',
              color: '#7C3AED',
              fontSize: '12.5px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              marginBottom: '16px'
            }}>
              SKILLSTACK ACADEMY OF ENGINEERING
            </div>

            <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#1F081C', margin: 0, fontFamily: 'serif' }}>
              Certificate of Academic Mastery
            </h2>
            <p style={{ fontSize: '14px', color: '#64748B', marginTop: '8px' }}>
              This is to certify that
            </p>

            <h3 style={{
              fontSize: '36px',
              fontWeight: 900,
              color: '#7C3AED',
              margin: '16px 0',
              borderBottom: '2px solid #FDC029',
              display: 'inline-block',
              paddingBottom: '6px'
            }}>
              {previewCert.student_name}
            </h3>

            <p style={{ fontSize: '15px', color: '#334155', maxWidth: '640px', margin: '0 auto 20px', lineHeight: 1.6 }}>
              has successfully completed all modules, sequential topic gates, theoretical MCQs, and automated compiler laboratories for
            </p>

            <h4 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: '0 0 24px' }}>
              {previewCert.course_name}
            </h4>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid #E2E8F0',
              paddingTop: '24px',
              marginTop: '32px',
              fontSize: '13px',
              color: '#64748B'
            }}>
              <div style={{ textAlign: 'left' }}>
                <div>Credential ID: <strong style={{ color: '#0F172A' }}>{previewCert.certificate_id}</strong></div>
                <div>Issued Date: <strong style={{ color: '#0F172A' }}>{new Date(previewCert.issued_at).toLocaleDateString()}</strong></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: '#7C3AED' }}>Academic Board &bull; SkillStack</div>
                <div>Status: <span style={{ color: previewCert.is_revoked ? '#DC2626' : '#16A34A', fontWeight: 700 }}>
                  {previewCert.is_revoked ? 'Revoked' : 'Verified Official'}
                </span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-pane-container" style={{ padding: '24px' }}>
      {/* Toast Alert */}
      {actionMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          padding: '12px 20px',
          borderRadius: '10px',
          background: actionMsg.isError ? '#FEF2F2' : '#ECFDF5',
          border: `1.5px solid ${actionMsg.isError ? '#EF4444' : '#10B981'}`,
          color: actionMsg.isError ? '#991B1B' : '#065F46',
          fontSize: '13px',
          fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }}>
          {actionMsg.text}
        </div>
      )}

      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={24} color="#7C3AED" />
            Enrollments &amp; Verified Certificates
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Manage student course registrations, monitor live syllabus progress, and issue or edit verified completion certificates.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setManualCertModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '9px 16px', borderRadius: '10px' }}
          >
            <Plus size={15} /> Issue Certificate
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '9px 14px', borderRadius: '10px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="card" style={{ padding: '16px 20px', borderRadius: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Registrations</div>
          <div style={{ fontSize: '26px', fontWeight: 850, color: '#7C3AED', marginTop: '4px' }}>{totalEnrollments}</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderRadius: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Learning</div>
          <div style={{ fontSize: '26px', fontWeight: 850, color: '#2563EB', marginTop: '4px' }}>{activeCount}</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderRadius: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Tracks Completed</div>
          <div style={{ fontSize: '26px', fontWeight: 850, color: '#059669', marginTop: '4px' }}>{completedCount}</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderRadius: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Issued Certificates</div>
          <div style={{ fontSize: '26px', fontWeight: 850, color: '#7E22CE', marginTop: '4px' }}>{totalCerts}</div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid #E2E8F0',
        marginBottom: '20px',
        paddingBottom: '8px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setSubTab('enrollments')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: subTab === 'enrollments' ? '#7C3AED' : 'transparent',
              color: subTab === 'enrollments' ? '#FFFFFF' : '#475569'
            }}
          >
            Course Enrollments ({enrollments.length})
          </button>

          <button
            onClick={() => setSubTab('certificates')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: subTab === 'certificates' ? '#7E22CE' : 'transparent',
              color: subTab === 'certificates' ? '#FFFFFF' : '#475569'
            }}
          >
            Official Certificates ({certificates.length})
          </button>
        </div>

        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search student or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '32px', fontSize: '12.5px', borderRadius: '8px', height: '34px' }}
            />
          </div>

          {subTab === 'enrollments' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
              style={{ fontSize: '12px', height: '34px', width: '130px', borderRadius: '8px' }}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="DROPPED">Dropped</option>
            </select>
          )}
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: ENROLLMENTS TABLE
          ========================================================================= */}
      {subTab === 'enrollments' && (
        <div className="card" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
          <div className="table-responsive">
            <table className="table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>Student</th>
                  <th style={{ padding: '12px 16px' }}>Course / Subject</th>
                  <th style={{ padding: '12px 16px' }}>Cohort Batch</th>
                  <th style={{ padding: '12px 16px' }}>Curriculum Progress</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Enrolled Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnrollments.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                      No course enrollment records found.
                    </td>
                  </tr>
                ) : (
                  filteredEnrollments.map(item => {
                    const pct = Math.min(100, Math.round(item.progress_percentage || 0));
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>
                            {item.student_name || item.student_username || 'Student'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>
                            @{item.student_username}
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>
                          {item.subject_name || `Subject #${item.subject}`}
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '11.5px', background: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            {item.batch_name || 'Standard Cohort'}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px', minWidth: '160px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
                            <span style={{ color: '#64748B' }}>Progress</span>
                            <span style={{ color: '#7C3AED' }}>{pct}%</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #7C3AED, #FDC029)', borderRadius: '3px' }} />
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateEnrollmentStatus(item.id, e.target.value)}
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              background: item.status === 'COMPLETED' ? '#ECFDF5' : item.status === 'ACTIVE' ? '#EFF6FF' : '#F1F5F9',
                              color: item.status === 'COMPLETED' ? '#059669' : item.status === 'ACTIVE' ? '#1D4ED8' : '#475569',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="DROPPED">Dropped</option>
                          </select>
                        </td>

                        <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748B' }}>
                          {item.enrolled_at ? new Date(item.enrolled_at).toLocaleDateString() : 'N/A'}
                        </td>

                        <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => handleOpenStudyLog(item)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '5px 11px',
                              background: '#EEF2FF',
                              border: '1px solid #C7D2FE',
                              color: '#4338CA',
                              borderRadius: '7px',
                              fontWeight: 700,
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              marginRight: '8px',
                              transition: 'all 0.15s ease'
                            }}
                            title="View Student Separate Study Log"
                          >
                            <Eye size={13} />
                            <span>Study Log</span>
                          </button>
                          <button
                            onClick={() => handleDeleteEnrollment(item.id)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: '#EF4444', padding: '4px 8px' }}
                            title="Delete / Cancel Enrollment"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: CERTIFICATES TABLE
          ========================================================================= */}
      {subTab === 'certificates' && (
        <div className="card" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
          <div className="table-responsive">
            <table className="table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>Credential ID</th>
                  <th style={{ padding: '12px 16px' }}>Student Registered Name</th>
                  <th style={{ padding: '12px 16px' }}>Course Track</th>
                  <th style={{ padding: '12px 16px' }}>Grade</th>
                  <th style={{ padding: '12px 16px' }}>Issue Date</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCertificates.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                      No verified certificates issued yet.
                    </td>
                  </tr>
                ) : (
                  filteredCertificates.map(cert => (
                    <tr key={cert.id} style={{ borderBottom: '1px solid #F1F5F9', background: cert.is_revoked ? '#FEF2F2' : 'transparent' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '11.5px', fontWeight: 700, color: '#7E22CE' }}>
                        {cert.certificate_id}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{cert.student_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>Verified Student</div>
                      </td>

                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>
                        {cert.course_name}
                      </td>

                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#059669' }}>
                        {Math.round(cert.grade_percentage || 100)}%
                      </td>

                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748B' }}>
                        {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'N/A'}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {cert.is_revoked ? (
                          <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', background: '#FEE2E2', color: '#DC2626' }}>
                            REVOKED
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', background: '#ECFDF5', color: '#059669' }}>
                            VERIFIED
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            onClick={() => setPreviewCert(cert)}
                            className="btn btn-ghost btn-sm"
                            title="Preview Certificate Document"
                            style={{ color: '#2563EB', padding: '4px 6px' }}
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            onClick={() => setEditingCert({ ...cert })}
                            className="btn btn-ghost btn-sm"
                            title="Edit Certificate Details"
                            style={{ color: '#7C3AED', padding: '4px 6px' }}
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            onClick={() => handleToggleRevokeCert(cert)}
                            className="btn btn-ghost btn-sm"
                            title={cert.is_revoked ? 'Reinstate Certificate' : 'Revoke Certificate'}
                            style={{ color: cert.is_revoked ? '#10B981' : '#F59E0B', padding: '4px 6px' }}
                          >
                            <Ban size={15} />
                          </button>

                          <button
                            onClick={() => handleDeleteCertificate(cert.id)}
                            className="btn btn-ghost btn-sm"
                            title="Delete Certificate"
                            style={{ color: '#EF4444', padding: '4px 6px' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: EDIT CERTIFICATE DETAILS
          ========================================================================= */}
      {editingCert && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '500px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                Edit Certificate Credential
              </h3>
              <button
                onClick={() => setEditingCert(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCertificate}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Credential ID
                </label>
                <input
                  type="text"
                  value={editingCert.certificate_id}
                  disabled
                  className="form-control"
                  style={{ background: '#F1F5F9', fontFamily: 'monospace', fontSize: '12.5px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Student Registered Full Name *
                </label>
                <input
                  type="text"
                  value={editingCert.student_name}
                  onChange={(e) => setEditingCert({ ...editingCert, student_name: e.target.value })}
                  required
                  className="form-control"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Course Track Name *
                </label>
                <input
                  type="text"
                  value={editingCert.course_name}
                  onChange={(e) => setEditingCert({ ...editingCert, course_name: e.target.value })}
                  required
                  className="form-control"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Final Grade Percentage
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={editingCert.grade_percentage}
                  onChange={(e) => setEditingCert({ ...editingCert, grade_percentage: e.target.value })}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingCert(null)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: MANUAL ISSUE CERTIFICATE
          ========================================================================= */}
      {manualCertModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                Issue Official Certificate Manually
              </h3>
              <button
                onClick={() => setManualCertModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateManualCert}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Student Registered Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deepan Velusamy"
                  value={manualForm.student_name}
                  onChange={(e) => setManualForm({ ...manualForm, student_name: e.target.value })}
                  required
                  className="form-control"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Associated Subject / Track (Optional Link)
                </label>
                <select
                  value={manualForm.subject_id}
                  onChange={(e) => {
                    const sid = e.target.value;
                    const sub = subjects.find(s => String(s.id) === String(sid));
                    setManualForm({
                      ...manualForm,
                      subject_id: sid,
                      course_name: sub ? sub.name : manualForm.course_name
                    });
                  }}
                  className="form-control"
                >
                  <option value="">-- Choose Track or Type Custom Name Below --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Course Track Display Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Systems Engineering with C Programming"
                  value={manualForm.course_name}
                  onChange={(e) => setManualForm({ ...manualForm, course_name: e.target.value })}
                  required
                  className="form-control"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Mastery Grade Percentage
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={manualForm.grade_percentage}
                  onChange={(e) => setManualForm({ ...manualForm, grade_percentage: e.target.value })}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setManualCertModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Issue Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
