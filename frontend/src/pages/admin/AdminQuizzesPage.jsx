import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiEdit2, FiTrash2, FiClock, FiCheckCircle, 
  FiAlertCircle, FiBookOpen, FiSearch, FiRefreshCw, FiMoreVertical
} from 'react-icons/fi';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const AdminQuizzesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    week: 1,
    totalPoints: 100,
    passingScore: 60,
    timeLimit: 30,
    questions: [
      { 
        question: '', 
        type: 'mcq', 
        options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }],
        points: 10
      }
    ],
    isPublished: true
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, cRes] = await Promise.all([
        api.get('/quizzes'),
        api.get('/categories')
      ]);
      setQuizzes(qRes.data.data || []);
      setCategories(cRes.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (quiz = null) => {
    if (quiz) {
      setEditingQuiz(quiz);
      setFormData({
        ...quiz,
        category: quiz.category?._id || quiz.category
      });
    } else {
      setEditingQuiz(null);
      setFormData({
        title: '',
        description: '',
        category: categories[0]?._id || '',
        week: 1,
        totalPoints: 100,
        passingScore: 60,
        timeLimit: 30,
        questions: [{ question: '', type: 'mcq', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }], points: 10 }],
        isPublished: true
      });
    }
    setShowModal(true);
  };

  const handleAddQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { question: '', type: 'mcq', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }], points: 10 }]
    });
  };

  const handleRemoveQuestion = (idx) => {
    const newQs = formData.questions.filter((_, i) => i !== idx);
    setFormData({ ...formData, questions: newQs });
  };

  const handleQuestionChange = (idx, field, value) => {
    const newQs = [...formData.questions];
    newQs[idx][field] = value;
    setFormData({ ...formData, questions: newQs });
  };

  const handleOptionChange = (qIdx, oIdx, field, value) => {
    const newQs = [...formData.questions];
    newQs[qIdx].options[oIdx][field] = value;
    
    // If setting isCorrect to true, set others to false for MCQ
    if (field === 'isCorrect' && value === true) {
      newQs[qIdx].options.forEach((opt, i) => {
        if (i !== oIdx) opt.isCorrect = false;
      });
    }
    
    setFormData({ ...formData, questions: newQs });
  };

  const handleAddOption = (qIdx) => {
    const newQs = [...formData.questions];
    newQs[qIdx].options.push({ text: '', isCorrect: false });
    setFormData({ ...formData, questions: newQs });
  };

  const handleRemoveOption = (qIdx, oIdx) => {
    const newQs = [...formData.questions];
    newQs[qIdx].options = newQs[qIdx].options.filter((_, i) => i !== oIdx);
    setFormData({ ...formData, questions: newQs });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingQuiz) {
        await api.put(`/quizzes/${editingQuiz._id}`, formData);
        toast.success('Quiz updated successfully');
      } else {
        await api.post('/quizzes', formData);
        toast.success('Quiz created successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save quiz');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await api.delete(`/quizzes/${id}`);
      toast.success('Quiz deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete quiz');
    }
  };

  const filteredQuizzes = quizzes.filter(q => 
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} onSearch={setSearchQuery} />
        
        <main className="flex-1 overflow-auto bg-gray-900 p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  Theory Quizzes
                </h1>
                <p className="text-gray-400 mt-1">Manage conceptual assessments for students</p>
              </div>
              <button 
                onClick={() => handleOpenModal()}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95"
              >
                <FiPlus size={20} />
                Create New Quiz
              </button>
            </div>

            {/* Quiz Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 animate-pulse">Loading assessments...</p>
              </div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="bg-gray-800/50 border border-gray-700 rounded-3xl p-12 text-center">
                <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiBookOpen size={40} className="text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Quizzes Found</h3>
                <p className="text-gray-400 mb-8">Start by creating your first theory-based assessment.</p>
                <button onClick={() => handleOpenModal()} className="text-blue-400 hover:underline font-semibold">
                  + Create Quiz
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuizzes.map((quiz) => (
                  <motion.div 
                    key={quiz._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/80 border border-gray-700 rounded-2xl overflow-hidden group hover:border-blue-500/50 transition-all"
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${quiz.isPublished ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-700 text-gray-400'}`}>
                          {quiz.isPublished ? 'Published' : 'Draft'}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenModal(quiz)} className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors">
                            <FiEdit2 size={18} />
                          </button>
                          <button onClick={() => handleDelete(quiz._id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold text-blue-100 group-hover:text-blue-400 transition-colors line-clamp-1">{quiz.title}</h3>
                        <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          {quiz.category?.name || 'Uncategorized'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="bg-gray-900/50 p-3 rounded-xl border border-gray-700/50">
                          <p className="text-[10px] text-blue-400 uppercase font-bold">Questions</p>
                          <p className="text-lg font-bold text-slate-100">{quiz.questions?.length || 0}</p>
                        </div>
                        <div className="bg-gray-900/50 p-3 rounded-xl border border-gray-700/50">
                          <p className="text-[10px] text-blue-400 uppercase font-bold">Time Limit</p>
                          <p className="text-lg font-bold text-slate-100">{quiz.timeLimit}m</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                        <div className="flex items-center gap-1">
                          <FiClock />
                          Week {quiz.week}
                        </div>
                        <div className="flex items-center gap-1">
                          <FiCheckCircle />
                          Pass: {quiz.passingScore}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Quiz Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-gray-800 border border-gray-700 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-blue-100">
                  {editingQuiz ? 'Edit Quiz' : 'Create New Assessment'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                  <FiPlus size={24} className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-8">
                {/* Basic Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-blue-400">Quiz Title</label>
                    <input 
                      required
                      type="text" 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-slate-100 focus:border-blue-500 outline-none transition-all font-semibold"
                      placeholder="e.g. React Fundamentals Quiz"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-blue-400">Internship Category</label>
                    <select 
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-slate-100 focus:border-blue-500 outline-none transition-all font-semibold"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-blue-400">Week</label>
                      <input type="number" min="1" value={formData.week} onChange={(e) => setFormData({...formData, week: parseInt(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-slate-100 outline-none font-semibold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-blue-400">Time (m)</label>
                      <input type="number" min="1" value={formData.timeLimit} onChange={(e) => setFormData({...formData, timeLimit: parseInt(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-slate-100 outline-none font-semibold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-blue-400">Pass %</label>
                      <input type="number" min="1" max="100" value={formData.passingScore} onChange={(e) => setFormData({...formData, passingScore: parseInt(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-slate-100 outline-none font-semibold" />
                    </div>
                  </div>
                </div>

                {/* Questions Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                      <FiBookOpen />
                      Questions ({formData.questions.length})
                    </h3>
                    <button 
                      type="button" 
                      onClick={handleAddQuestion}
                      className="text-sm font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <FiPlus /> Add Question
                    </button>
                  </div>

                  <div className="space-y-6">
                    {formData.questions.map((q, qIdx) => (
                      <div key={qIdx} className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6 relative group">
                        <button 
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="absolute top-4 right-4 text-gray-600 hover:text-red-400 transition-colors"
                        >
                          <FiTrash2 size={18} />
                        </button>

                        <div className="space-y-4">
                          <div className="flex gap-4">
                            <span className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">
                              {qIdx + 1}
                            </span>
                            <div className="flex-1 space-y-2">
                              <input 
                                required
                                type="text"
                                placeholder="Enter your question here..."
                                value={q.question}
                                onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)}
                                className="w-full bg-transparent border-b border-gray-700 py-1 text-lg font-bold text-blue-100 outline-none focus:border-blue-500 transition-all"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-12">
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-3 bg-gray-800/50 p-2 rounded-xl border border-gray-700/50">
                                <input 
                                  type="radio" 
                                  checked={opt.isCorrect}
                                  onChange={() => handleOptionChange(qIdx, oIdx, 'isCorrect', true)}
                                  className="w-4 h-4 text-blue-500 bg-gray-900 border-gray-700"
                                />
                                <input 
                                  required
                                  type="text" 
                                  value={opt.text}
                                  onChange={(e) => handleOptionChange(qIdx, oIdx, 'text', e.target.value)}
                                  placeholder={`Option ${oIdx + 1}`}
                                  className="flex-1 bg-transparent text-sm font-semibold text-slate-200 outline-none"
                                />
                                {q.options.length > 2 && (
                                  <button type="button" onClick={() => handleRemoveOption(qIdx, oIdx)} className="text-gray-600 hover:text-red-400">
                                    <FiTrash2 size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                            {q.options.length < 4 && (
                              <button 
                                type="button" 
                                onClick={() => handleAddOption(qIdx)}
                                className="text-xs font-bold text-gray-500 hover:text-blue-400 flex items-center gap-1 justify-center border border-dashed border-gray-700 rounded-xl p-2"
                              >
                                <FiPlus /> Add Option
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>

              <div className="p-6 border-t border-gray-700 bg-gray-800/50 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({...formData, isPublished: e.target.checked})}
                      className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">Publish immediately</span>
                  </label>
                </div>
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSubmit}
                    className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                  >
                    {editingQuiz ? 'Save Changes' : 'Create Quiz'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminQuizzesPage;
