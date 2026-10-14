import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, CheckCircle2, Clock, User, Filter, Search, Sparkles, BookOpen, ShieldCheck, Check } from 'lucide-react';
import { api } from '../api';

export default function StudentDoubtsManagerTab({ user }) {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'PENDING' | 'RESOLVED'
  const [searchQuery, setSearchQuery] = useState('');
  const [replyTextMap, setReplyTextMap] = useState({});
  const [sendingId, setSendingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const loadDoubts = async () => {
    setLoading(true);
    try {
      const statusParam = filterStatus === 'ALL' ? '' : filterStatus;
      const data = await api.getStaffDoubts(statusParam);
      if (Array.isArray(data)) {
        setDoubts(data);
      }
    } catch (e) {
      console.warn('Failed to load student doubts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoubts();
  }, [filterStatus]);

  const handleSendReply = async (doubtId, studentName) => {
    const text = replyTextMap[doubtId]?.trim();
    if (!text) return;

    setSendingId(doubtId);
    try {
      await api.replyStaffDoubt(doubtId, text);
      setToastMessage(`Clarification sent directly to ${studentName}! Only this student can view this message.`);
      setTimeout(() => setToastMessage(null), 4000);
      setReplyTextMap(prev => ({ ...prev, [doubtId]: '' }));
      loadDoubts();
    } catch (e) {
      alert('Failed to send clarification. Please try again.');
    } finally {
      setSendingId(null);
    }
  };

  const filteredDoubts = doubts.filter(d => {
    const matchSearch = (
      (d.student_username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.topic_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.question || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchSearch;
  });

  const pendingCount = doubts.filter(d => d.status === 'PENDING').length;
  const resolvedCount = doubts.filter(d => d.status === 'RESOLVED').length;

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 9999,
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13.5px',
          fontWeight: 600,
          border: '1px solid #22C55E'
        }}>
          <Check size={16} color="#22C55E" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={26} color="#7B1C6E" />
            <span>Student Doubts &amp; Clarification Desk</span>
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#64748B' }}>
            Review topic questions asked by students and send them direct 1-on-1 private clarification messages.
          </p>
        </div>

        {/* Counter Badges */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            color: '#92400E',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '12.5px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Clock size={14} />
            <span>{pendingCount} Pending</span>
          </div>

          <div style={{
            background: '#DCFCE7',
            border: '1px solid #86EFAC',
            color: '#166534',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '12.5px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <CheckCircle2 size={14} />
            <span>{resolvedCount} Clarified</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'PENDING', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                background: filterStatus === st ? '#7B1C6E' : '#F1F5F9',
                color: filterStatus === st ? '#FFFFFF' : '#475569',
                transition: 'all 0.2s'
              }}
            >
              {st === 'ALL' ? 'All Doubts' : st === 'PENDING' ? '⏳ Pending Clarification' : '✅ Resolved'}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search by student, topic, or question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px 8px 36px',
              borderRadius: '999px',
              border: '1px solid #CBD5E1',
              fontSize: '12.5px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Doubts List */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#94A3B8' }}>
          Loading student doubts...
        </div>
      ) : filteredDoubts.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: '#FFFFFF',
          borderRadius: '20px',
          border: '1.5px dashed #CBD5E1',
          color: '#64748B'
        }}>
          <MessageSquare size={36} color="#94A3B8" style={{ marginBottom: '10px' }} />
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>No student doubts found</div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>
            When students ask questions in their portal on any topic, their questions will appear here for your personal clarification.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredDoubts.map((doubt) => {
            const isResolved = doubt.status === 'RESOLVED' && doubt.clarification_reply;
            return (
              <div
                key={doubt.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '20px',
                  border: `1.5px solid ${isResolved ? '#BBF7D0' : '#FED7AA'}`,
                  padding: '24px 28px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                }}
              >
                {/* Top Info Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '16px',
                  paddingBottom: '14px',
                  borderBottom: '1px solid #F1F5F9'
                }}>
                  {/* Student & Topic Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #7B1C6E 0%, #A82596 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '15px'
                    }}>
                      {(doubt.student_username || 'S')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                          {doubt.student_name || doubt.student_username}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748B' }}>
                          (@{doubt.student_username})
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#7B1C6E', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <BookOpen size={13} />
                        <span>{doubt.subject_name} &bull; {doubt.topic_title}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '999px',
                      background: isResolved ? '#DCFCE7' : '#FEF3C7',
                      color: isResolved ? '#166534' : '#92400E',
                      border: `1px solid ${isResolved ? '#86EFAC' : '#FDE68A'}`
                    }}>
                      {isResolved ? '✅ Clarified' : '⏳ Pending Response'}
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                      {doubt.created_at ? new Date(doubt.created_at).toLocaleString() : ''}
                    </span>
                  </div>
                </div>

                {/* Question */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', marginBottom: '6px' }}>
                    Student Question:
                  </div>
                  <div style={{
                    fontSize: '14.5px',
                    color: '#0F172A',
                    fontWeight: 600,
                    lineHeight: 1.5,
                    background: '#F8FAFC',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0'
                  }}>
                    {doubt.question}
                  </div>
                </div>

                {/* Already Clarified View */}
                {isResolved && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.04) 0%, rgba(34, 197, 94, 0.06) 100%)',
                    border: '1.5px solid rgba(22, 163, 74, 0.25)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={16} color="#16A34A" />
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#166534' }}>
                          Sent Clarification (by {doubt.replied_by_name || 'Prof. Deepan'}):
                        </span>
                      </div>
                      {doubt.replied_at && (
                        <span style={{ fontSize: '11px', color: '#64748B' }}>
                          {new Date(doubt.replied_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13.5px', color: '#14532D', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {doubt.clarification_reply}
                    </div>
                  </div>
                )}

                {/* Reply Form */}
                <div style={{ marginTop: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    {isResolved ? 'Update Clarification Message:' : 'Write Private Clarification Message:'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={`Write your detailed explanation for ${doubt.student_username}...`}
                    value={replyTextMap[doubt.id] !== undefined ? replyTextMap[doubt.id] : (isResolved ? doubt.clarification_reply : '')}
                    onChange={(e) => setReplyTextMap({ ...replyTextMap, [doubt.id]: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '13.5px',
                      fontFamily: 'inherit',
                      lineHeight: 1.5,
                      boxSizing: 'border-box',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                      onClick={() => handleSendReply(doubt.id, doubt.student_username)}
                      disabled={sendingId === doubt.id || !(replyTextMap[doubt.id] || '').trim()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '9px 20px',
                        borderRadius: '999px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: sendingId === doubt.id || !(replyTextMap[doubt.id] || '').trim() ? 'not-allowed' : 'pointer',
                        opacity: sendingId === doubt.id || !(replyTextMap[doubt.id] || '').trim() ? 0.6 : 1,
                        boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                      }}
                    >
                      <Send size={14} />
                      <span>{sendingId === doubt.id ? 'Sending...' : 'Send Clarification to Student'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
