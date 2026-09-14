import { useState, useEffect } from 'react';
import {
  HelpCircle, Plus, Edit2, Trash2, ArrowLeft, Check,
  Search, Filter, Sparkles, BookOpen, Layers, AlertCircle, FileText,
  Upload, CheckCircle2, X, RefreshCw, Eye, Award
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import PaginationControls from './PaginationControls';

export default function TopicQuizManagerTab({ user, defaultTopicId = null }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('ALL');
  const [selectedTopicId, setSelectedTopicId] = useState(defaultTopicId ? String(defaultTopicId) : 'ALL');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkJsonText, setBulkJsonText] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);

  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    explanation: '',
    order: 1,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [questionsRes, subsRes, topicsRes] = await Promise.all([
        api.getQuizQuestions().catch(() => []),
        api.getSubjects().catch(() => []),
        api.getTopics().catch(() => []),
      ]);

      const safeQuestions = Array.isArray(questionsRes) ? questionsRes : (questionsRes?.results || []);
      const safeSubs = Array.isArray(subsRes) ? subsRes : (subsRes?.results || []);
      const safeTopics = Array.isArray(topicsRes) ? topicsRes : (topicsRes?.results || []);

      setQuestions(safeQuestions);
      setSubjects(safeSubs);
      setTopics(safeTopics);

      if (defaultTopicId && safeTopics.some(t => String(t.id) === String(defaultTopicId) || t.topic_id === defaultTopicId)) {
        setSelectedTopicId(String(defaultTopicId));
      }
    } catch (e) {
      console.error('Failed to load quiz manager data', e);
      toast.error('Failed to load quiz question bank.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    const defaultSub = selectedSubjectId !== 'ALL' ? selectedSubjectId : (subjects[0]?.id || '');
    const linkedTopics = topics.filter(t => !defaultSub || String(t.subject_id) === String(defaultSub));
    const defaultTop = selectedTopicId !== 'ALL' ? selectedTopicId : (linkedTopics[0]?.id || topics[0]?.id || '');

    const topicQuestions = questions.filter(q => String(q.topic) === String(defaultTop));

    setEditingQuestion(null);
    setFormData({
      subject: defaultSub,
      topic: defaultTop,
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_option: 'A',
      explanation: '',
      order: topicQuestions.length + 1,
    });
    setFieldErrors({});
    setViewMode('form');
  };

  const handleOpenEdit = (q) => {
    setEditingQuestion(q);
    const topObj = topics.find(t => t.id === q.topic || t.id === q.topic?.id);
    setFormData({
      subject: topObj?.subject_id || subjects[0]?.id || '',
      topic: q.topic,
      question_text: q.question_text || '',
      option_a: q.option_a || '',
      option_b: q.option_b || '',
      option_c: q.option_c || '',
      option_d: q.option_d || '',
      correct_option: q.correct_option || 'A',
      explanation: q.explanation || '',
      order: q.order || 1,
    });
    setFieldErrors({});
    setViewMode('form');
  };

  const handleDelete = async (q) => {
    const isConfirmed = await confirm({
      title: 'Delete Question',
      message: `Are you sure you want to delete this question? This action cannot be undone.`,
      confirmText: 'Delete Question',
      confirmVariant: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await api.deleteQuizQuestion(q.id);
      setQuestions(prev => prev.filter(item => item.id !== q.id));
      toast.success('Question deleted successfully');
    } catch (e) {
      toast.error(e.message || 'Failed to delete question');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.topic) errors.topic = 'Topic is required';
    if (!formData.question_text.trim()) errors.question_text = 'Question text is required';
    if (!formData.option_a.trim()) errors.option_a = 'Option A is required';
    if (!formData.option_b.trim()) errors.option_b = 'Option B is required';
    if (!formData.option_c.trim()) errors.option_c = 'Option C is required';
    if (!formData.option_d.trim()) errors.option_d = 'Option D is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    setFieldErrors({});

    try {
      const payload = {
        topic: Number(formData.topic),
        question_text: formData.question_text.trim(),
        option_a: formData.option_a.trim(),
        option_b: formData.option_b.trim(),
        option_c: formData.option_c.trim(),
        option_d: formData.option_d.trim(),
        correct_option: formData.correct_option,
        explanation: formData.explanation.trim(),
        order: Number(formData.order) || 1,
      };

      if (editingQuestion) {
        const updated = await api.updateQuizQuestion(editingQuestion.id, payload);
        setQuestions(prev => prev.map(item => item.id === editingQuestion.id ? updated : item));
        toast.success('Question updated successfully!');
      } else {
        const created = await api.createQuizQuestion(payload);
        setQuestions(prev => [created, ...prev]);
        toast.success('Question added to topic bank!');
      }
      setViewMode('list');
    } catch (err) {
      toast.error(err.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!formData.topic && selectedTopicId === 'ALL') {
      toast.error('Please select a topic to upload questions to.');
      return;
    }

    const targetTopicId = formData.topic || selectedTopicId;

    try {
      let parsed = [];
      try {
        parsed = JSON.parse(bulkJsonText);
      } catch (err) {
        toast.error('Invalid JSON format. Please provide a valid JSON array of questions.');
        return;
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        toast.error('Please provide an array containing at least 1 question.');
        return;
      }

      setBulkImporting(true);
      const res = await api.bulkUploadQuizQuestions(targetTopicId, parsed);
      toast.success(res.message || `Successfully imported ${parsed.length} questions!`);
      setBulkModalOpen(false);
      setBulkJsonText('');
      await loadAllData();
    } catch (err) {
      toast.error(err.message || 'Failed to bulk import questions.');
    } finally {
      setBulkImporting(false);
    }
  };

  const handleLoadSampleJson = () => {
    const sample = [
      {
        question_text: "What is the primary function of memory allocation in programming?",
        option_a: "To reserve storage space in RAM for program variables",
        option_b: "To compile code faster",
        option_c: "To format hard drives",
        option_d: "To connect to internet networks",
        correct_option: "A",
        explanation: "Memory allocation reserves a specified amount of RAM for variables and data structures during execution.",
        order: 1
      },
      {
        question_text: "Which keyword is used to define a constant variable in modern programming?",
        option_a: "static",
        option_b: "const",
        option_c: "var",
        option_d: "let",
        correct_option: "B",
        explanation: "The const keyword ensures that a variable value cannot be re-assigned once initialized.",
        order: 2
      }
    ];
    setBulkJsonText(JSON.stringify(sample, null, 2));
  };

  // Filter questions
  const filteredQuestions = questions.filter(q => {
    const topObj = topics.find(t => t.id === q.topic || t.id === q.topic?.id);
    const subId = topObj?.subject_id || q.subject_id;

    if (selectedSubjectId !== 'ALL' && String(subId) !== String(selectedSubjectId)) {
      return false;
    }
    if (selectedTopicId !== 'ALL' && String(q.topic) !== String(selectedTopicId) && String(topObj?.id) !== String(selectedTopicId)) {
      return false;
    }
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase();
      const matchText = q.question_text?.toLowerCase().includes(s);
      const matchTopic = q.topic_title?.toLowerCase().includes(s);
      const matchExpl = q.explanation?.toLowerCase().includes(s);
      return matchText || matchTopic || matchExpl;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;
  const paginatedQuestions = filteredQuestions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Topic questions count for active filter
  const currentTopicQuestionsCount = selectedTopicId !== 'ALL'
    ? questions.filter(q => String(q.topic) === String(selectedTopicId) || String(topics.find(t => t.id === q.topic)?.id) === String(selectedTopicId)).length
    : null;

  return (
    <div className="admin-page-container">
      {/* Header Bar */}
      <div className="admin-page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <HelpCircle size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Topic Quiz Question Bank (20+ MCQs)</h1>
              <p className="text-xs text-slate-500">
                Manage randomized assessment questions with choices (A, B, C, D), 50% passing gate &amp; 10-min cooldown.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {viewMode === 'list' ? (
            <>
              <button
                onClick={() => {
                  setBulkJsonText('');
                  setBulkModalOpen(true);
                }}
                className="btn-secondary flex items-center gap-2"
                style={{ fontSize: '13px', padding: '8px 14px' }}
              >
                <Upload size={15} />
                <span>Bulk Import (20+ JSON)</span>
              </button>

              <button
                onClick={handleOpenCreate}
                className="btn-primary flex items-center gap-2"
                style={{ fontSize: '13px', padding: '8px 16px' }}
              >
                <Plus size={16} />
                <span>Add Question</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setViewMode('list')}
              className="btn-secondary flex items-center gap-2"
              style={{ fontSize: '13px', padding: '8px 14px' }}
            >
              <ArrowLeft size={15} />
              <span>Back to Question Bank</span>
            </button>
          )}
        </div>
      </div>

      {/* Pre-filtered topic banner */}
      {defaultTopicId && selectedTopicId !== 'ALL' && !loading && (() => {
        const topicObj = topics.find(t => String(t.id) === String(selectedTopicId));
        if (!topicObj) return null;
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1.5px solid rgba(99, 102, 241, 0.25)',
            fontSize: '12.5px',
            fontWeight: 600,
            color: '#3730A3',
            marginBottom: '4px',
            flexWrap: 'wrap',
          }}>
            <HelpCircle size={15} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>
              Viewing MCQ questions for topic: <strong>"{topicObj.title}"</strong>
              &nbsp;— Add 20+ randomized questions so students can take the assessment.
            </span>
            <button
              onClick={() => setSelectedTopicId('ALL')}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#4338CA',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
                flexShrink: 0,
              }}
            >
              View All Topics
            </button>
          </div>
        );
      })()}

      {viewMode === 'list' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Subject Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Filter by Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setSelectedTopicId('ALL');
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="ALL">All Subjects ({subjects.length})</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Topic Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Filter by Topic</label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => {
                    setSelectedTopicId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="ALL">All Topics</option>
                  {topics
                    .filter(t => selectedSubjectId === 'ALL' || String(t.subject_id) === String(selectedSubjectId))
                    .map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Search Question / Keyword</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search question text..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Target 20+ Questions Metric Banner */}
            {selectedTopicId !== 'ALL' && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <Award size={16} className={currentTopicQuestionsCount >= 20 ? 'text-emerald-600' : 'text-amber-600'} />
                  <span className="font-semibold text-slate-700">
                    Topic Bank Status: {currentTopicQuestionsCount} Question{currentTopicQuestionsCount !== 1 ? 's' : ''} Added
                  </span>
                  <span className="text-slate-400">&bull;</span>
                  <span className={currentTopicQuestionsCount >= 20 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {currentTopicQuestionsCount >= 20
                      ? '✅ Target 20+ Reached! (5 Questions will be shuffled at random per student test)'
                      : `⚠️ ${20 - currentTopicQuestionsCount} more recommended to reach full 20+ question pool`}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setFormData(prev => ({ ...prev, topic: selectedTopicId }));
                    setBulkModalOpen(true);
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  + Add 20 Questions
                </button>
              </div>
            )}
          </div>

          {/* Question List Table */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
              <p className="text-xs">Loading question bank...</p>
            </div>
          ) : paginatedQuestions.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <HelpCircle size={36} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-700 mb-1">No Questions Found</h3>
              <p className="text-xs text-slate-500 mb-4">
                {selectedTopicId !== 'ALL'
                  ? 'No questions added for this topic yet. Add 20+ questions so students can take secure randomized tests.'
                  : 'Start by adding multiple choice questions for your curriculum topics.'}
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={handleOpenCreate}
                  className="btn-primary text-xs"
                >
                  + Add Single Question
                </button>
                <button
                  onClick={() => setBulkModalOpen(true)}
                  className="btn-secondary text-xs"
                >
                  Bulk Import Questions
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                      <th className="p-3.5 w-14 text-center">#</th>
                      <th className="p-3.5 w-1/4">Topic &amp; Subject</th>
                      <th className="p-3.5 w-2/5">Question Prompt &amp; Choices</th>
                      <th className="p-3.5 w-20 text-center">Correct</th>
                      <th className="p-3.5 w-28 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedQuestions.map((q, idx) => (
                      <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 text-center font-mono text-slate-400">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-800">{q.topic_title || 'Topic'}</div>
                          <div className="text-[11px] text-slate-500">{q.subject_name || q.module_name || 'Curriculum'}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800 mb-1.5 line-clamp-2">
                            {q.question_text}
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                            <span className={q.correct_option === 'A' ? 'font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded' : ''}>
                              <strong>A:</strong> {q.option_a}
                            </span>
                            <span className={q.correct_option === 'B' ? 'font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded' : ''}>
                              <strong>B:</strong> {q.option_b}
                            </span>
                            <span className={q.correct_option === 'C' ? 'font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded' : ''}>
                              <strong>C:</strong> {q.option_c}
                            </span>
                            <span className={q.correct_option === 'D' ? 'font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded' : ''}>
                              <strong>D:</strong> {q.option_d}
                            </span>
                          </div>
                          {q.explanation && (
                            <div className="mt-1 text-[10.5px] text-slate-400 italic">
                              💡 {q.explanation}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                            {q.correct_option}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(q)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-indigo-600"
                              title="Edit Question"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(q)}
                              className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                              title="Delete Question"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-3 border-t border-slate-200">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalResults={filteredQuestions.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Question Create / Edit Form */
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-4xl mx-auto">
          <h2 className="text-base font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <HelpCircle size={18} className="text-indigo-600" />
            <span>{editingQuestion ? 'Edit Quiz Question' : 'Add Question to Topic Bank'}</span>
          </h2>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Subject */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject / Course *</label>
                <select
                  value={formData.subject}
                  onChange={(e) => {
                    const subId = e.target.value;
                    const linked = topics.filter(t => !subId || String(t.subject_id) === String(subId));
                    setFormData(prev => ({
                      ...prev,
                      subject: subId,
                      topic: linked[0]?.id || ''
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Topic *</label>
                <select
                  value={formData.topic}
                  onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border ${fieldErrors.topic ? 'border-rose-500' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white`}
                >
                  <option value="">-- Select Topic --</option>
                  {topics
                    .filter(t => !formData.subject || String(t.subject_id) === String(formData.subject))
                    .map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                </select>
                {fieldErrors.topic && <p className="text-[11px] text-rose-500 mt-0.5">{fieldErrors.topic}</p>}
              </div>
            </div>

            {/* Question Text */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Question Prompt *</label>
              <textarea
                rows={3}
                value={formData.question_text}
                onChange={(e) => setFormData(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="e.g. What is the output of the following statement or core concept?"
                className={`w-full px-3 py-2 rounded-lg border ${fieldErrors.question_text ? 'border-rose-500' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
              {fieldErrors.question_text && <p className="text-[11px] text-rose-500 mt-0.5">{fieldErrors.question_text}</p>}
            </div>

            {/* 4 Choices */}
            <div className="space-y-2.5 pt-2">
              <label className="block font-bold text-slate-800 text-xs">Four Multiple Choices (Select the correct option below) *</label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Option A */}
                <div className={`p-3 rounded-lg border transition-all ${formData.correct_option === 'A' ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500' : 'border-slate-200 bg-slate-50/50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-700">Option A</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-emerald-700">
                      <input
                        type="radio"
                        name="correct_option"
                        value="A"
                        checked={formData.correct_option === 'A'}
                        onChange={(e) => setFormData(prev => ({ ...prev, correct_option: e.target.value }))}
                        className="accent-emerald-600"
                      />
                      Correct Answer
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.option_a}
                    onChange={(e) => setFormData(prev => ({ ...prev, option_a: e.target.value }))}
                    placeholder="Choice A text"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                  {fieldErrors.option_a && <p className="text-[10.5px] text-rose-500 mt-0.5">{fieldErrors.option_a}</p>}
                </div>

                {/* Option B */}
                <div className={`p-3 rounded-lg border transition-all ${formData.correct_option === 'B' ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500' : 'border-slate-200 bg-slate-50/50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-700">Option B</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-emerald-700">
                      <input
                        type="radio"
                        name="correct_option"
                        value="B"
                        checked={formData.correct_option === 'B'}
                        onChange={(e) => setFormData(prev => ({ ...prev, correct_option: e.target.value }))}
                        className="accent-emerald-600"
                      />
                      Correct Answer
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.option_b}
                    onChange={(e) => setFormData(prev => ({ ...prev, option_b: e.target.value }))}
                    placeholder="Choice B text"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                  {fieldErrors.option_b && <p className="text-[10.5px] text-rose-500 mt-0.5">{fieldErrors.option_b}</p>}
                </div>

                {/* Option C */}
                <div className={`p-3 rounded-lg border transition-all ${formData.correct_option === 'C' ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500' : 'border-slate-200 bg-slate-50/50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-700">Option C</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-emerald-700">
                      <input
                        type="radio"
                        name="correct_option"
                        value="C"
                        checked={formData.correct_option === 'C'}
                        onChange={(e) => setFormData(prev => ({ ...prev, correct_option: e.target.value }))}
                        className="accent-emerald-600"
                      />
                      Correct Answer
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.option_c}
                    onChange={(e) => setFormData(prev => ({ ...prev, option_c: e.target.value }))}
                    placeholder="Choice C text"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                  {fieldErrors.option_c && <p className="text-[10.5px] text-rose-500 mt-0.5">{fieldErrors.option_c}</p>}
                </div>

                {/* Option D */}
                <div className={`p-3 rounded-lg border transition-all ${formData.correct_option === 'D' ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500' : 'border-slate-200 bg-slate-50/50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-700">Option D</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-emerald-700">
                      <input
                        type="radio"
                        name="correct_option"
                        value="D"
                        checked={formData.correct_option === 'D'}
                        onChange={(e) => setFormData(prev => ({ ...prev, correct_option: e.target.value }))}
                        className="accent-emerald-600"
                      />
                      Correct Answer
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.option_d}
                    onChange={(e) => setFormData(prev => ({ ...prev, option_d: e.target.value }))}
                    placeholder="Choice D text"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                  {fieldErrors.option_d && <p className="text-[10.5px] text-rose-500 mt-0.5">{fieldErrors.option_d}</p>}
                </div>
              </div>
            </div>

            {/* Explanation & Order */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="md:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">Explanation / Solution Note (Shown during review)</label>
                <input
                  type="text"
                  value={formData.explanation}
                  onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                  placeholder="Explain why the correct answer is right..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sort Order</label>
                <input
                  type="number"
                  min={1}
                  value={formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center gap-2 text-xs"
              >
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                <span>{editingQuestion ? 'Update Question' : 'Save to Question Bank'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {bulkModalOpen && (
        <div className="modal-overlay" onClick={() => setBulkModalOpen(false)}>
          <div className="modal-content max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Upload size={18} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">Bulk Upload 20+ Questions (JSON Format)</h3>
              </div>
              <button
                onClick={() => setBulkModalOpen(false)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body py-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <p className="text-slate-600">
                  Paste a JSON array of questions to quickly populate the topic with 20+ MCQs:
                </p>
                <button
                  type="button"
                  onClick={handleLoadSampleJson}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Sparkles size={13} /> Load Template Sample
                </button>
              </div>

              <textarea
                rows={12}
                value={bulkJsonText}
                onChange={(e) => setBulkJsonText(e.target.value)}
                placeholder={`[\n  {\n    "question_text": "Question 1 prompt",\n    "option_a": "Choice A",\n    "option_b": "Choice B",\n    "option_c": "Choice C",\n    "option_d": "Choice D",\n    "correct_option": "A",\n    "explanation": "Why choice A is right"\n  }\n]`}
                className="w-full p-3 font-mono text-[11.5px] rounded-lg border border-slate-200 bg-slate-900 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>

            <div className="modal-footer flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setBulkModalOpen(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpload}
                disabled={bulkImporting || !bulkJsonText.trim()}
                className="btn-primary flex items-center gap-2 text-xs"
              >
                {bulkImporting ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                <span>Import Questions</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
