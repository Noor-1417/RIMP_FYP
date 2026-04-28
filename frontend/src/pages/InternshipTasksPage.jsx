import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { internshipTaskService, groqTaskService, quizService } from '../services';
import { Navbar } from '../components/layout/Navbar';
import MentorChatbot from '../components/MentorChatbot';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  locked:       { label: 'Locked',      icon: '🔒', color: 'bg-gray-600',    textColor: 'text-gray-300' },
  unlocked:     { label: 'Ready',       icon: '🟢', color: 'bg-emerald-600', textColor: 'text-emerald-300' },
  'in-progress':{ label: 'In Progress', icon: '🔄', color: 'bg-blue-600',    textColor: 'text-blue-300' },
  submitted:    { label: 'Submitted',   icon: '📤', color: 'bg-yellow-600',   textColor: 'text-yellow-300' },
  approved:     { label: 'Approved',    icon: '✅', color: 'bg-green-600',    textColor: 'text-green-300' },
  rejected:     { label: 'Needs Work',  icon: '❌', color: 'bg-red-600',      textColor: 'text-red-300' },
};

// ─── Inline Mentor Chat Panel ─────────────────────────────────────────────────
function InlineMentorChat({ currentTaskId }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm your AI Mentor powered by **Groq AI (LLaMA 3.3 70B)**. Ask me anything about your tasks — I'll guide you with hints and explanations without giving away direct solutions!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: 'student', content: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      const res = await internshipTaskService.chat({
        message: trimmed,
        taskId: currentTaskId || undefined,
        conversationHistory: messages.slice(-6).map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'student',
          content: m.content,
        })),
      });
      if (res.data?.success) {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }]);
      } else throw new Error('Failed');
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I had trouble with that. Please try again!' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex flex-col h-[600px] bg-gray-800/60 rounded-2xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-700 to-blue-800 px-5 py-4 flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">🤖</div>
        <div className="flex-1">
          <h4 className="text-white font-bold">AI Mentor Chat</h4>
          <p className="text-cyan-200 text-xs">Groq AI (LLaMA 3.3 70B) • Guidance without solutions</p>
        </div>
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
      </div>

      {currentTaskId && (
        <div className="bg-cyan-900/30 border-b border-cyan-700/30 px-4 py-2 text-xs text-cyan-300 flex items-center gap-1.5">
          <span>📋</span> Contextual help for your selected task
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-cyan-700/50 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-0.5">🤖</div>
            )}
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'student'
                  ? 'bg-cyan-600 text-white rounded-br-md'
                  : 'bg-gray-900/70 text-gray-200 border border-gray-700/50 rounded-bl-md'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-cyan-700/50 flex items-center justify-center text-sm mr-2">🤖</div>
            <div className="bg-gray-900/70 border border-gray-700/50 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1.5">
                {[0, 150, 300].map((d) => (
                  <div key={d} className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-700/50 px-4 py-3 bg-gray-900/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your task, concepts, or approach..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1.5 text-center">Mentorship mode — I guide, you learn 🎓</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InternshipTasksPage() {
  const { enrollmentId } = useParams();
  useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'mentor'

  const [file, setFile] = useState(null);
  const [githubLink, setGithubLink] = useState('');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const [tRes, qRes] = await Promise.all([
        internshipTaskService.getTasksByEnrollment(enrollmentId),
        quizService.getAvailable()
      ]);

      if (tRes.data?.success) {
        setTasks(tRes.data.tasks || []);
        setEnrollment(tRes.data.enrollment);
      }
      if (qRes.data?.success) {
        // Filter quizzes for THIS enrollment's category
        setQuizzes(qRes.data.data.filter(q => q.enrollmentId === enrollmentId) || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleGenerateTasks = async () => {
    setGeneratingTasks(true);
    const toastId = toast.loading('🤖 Generating AI tasks with Groq LLaMA 3.3 70B… please wait');
    try {
      const res = await groqTaskService.generateTasks(enrollmentId);
      if (res.data?.success) {
        toast.success(`✅ ${res.data.message || 'AI tasks generated!'}`, { id: toastId });
        await loadTasks();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate tasks';
      toast.error(msg, { id: toastId });
    } finally {
      setGeneratingTasks(false);
    }
  };

  const handleSubmit = async (taskId) => {
    if (!message && !githubLink && !file) {
      toast.error('Please provide at least a message, file, or GitHub link');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (githubLink) formData.append('githubLink', githubLink);
      if (message) formData.append('message', message);

      const res = await internshipTaskService.submitTask(taskId, formData);
      if (res.data?.success) {
        toast.success(res.data.message || 'Task submitted!');
        setFile(null); setGithubLink(''); setMessage('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        await loadTasks();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const completedCount = tasks.filter((t) => t.status === 'approved').length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
            <p className="text-gray-400 mt-4">Loading your tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button
            onClick={() => navigate('/student-progress')}
            className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm flex items-center gap-1 mb-3"
          >
            ← Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white mb-1">
            📋 {enrollment?.categoryName || 'Internship'} Tasks
          </h1>
          <p className="text-gray-400 text-sm">
            Complete tasks sequentially — each unlocks after the previous is approved.
          </p>

          {/* Progress Bar */}
          <div className="mt-4 bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Overall Progress</span>
              <span className="text-sm font-bold text-cyan-400">{completedCount}/{tasks.length} approved</span>
            </div>
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* ── Tab Switcher ── */}
        <div className="flex items-center gap-1 mb-6 bg-gray-800/60 rounded-xl p-1 border border-gray-700/50 w-fit">
          {[
            { id: 'tasks', label: '📋 My Tasks', count: tasks.length },
            { id: 'mentor', label: '🤖 AI Mentor', count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/40'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-700 text-gray-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tasks Tab ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'tasks' && (
            <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="space-y-4">
                {(() => {
                  // Merge tasks and quizzes
                  // Logic: After every 2 tasks, insert a quiz for that week
                  const items = [];
                  const sortedTasks = [...tasks].sort((a, b) => a.taskOrder - b.taskOrder);
                  
                  sortedTasks.forEach((task, idx) => {
                    items.push({ type: 'task', data: task });
                    // After task 2, 4, 6... check if a quiz for that week exists
                    if ((idx + 1) % 2 === 0) {
                      const week = (idx + 1) / 2;
                      const quiz = quizzes.find(q => q.week === week);
                      if (quiz) {
                        items.push({ type: 'quiz', data: quiz });
                      }
                    }
                  });

                  return items.map((item, idx) => {
                    if (item.type === 'quiz') {
                      const quiz = item.data;
                      return (
                        <motion.div
                          key={`quiz-${quiz._id}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`rounded-xl border p-5 flex items-center justify-between transition-all ${
                            !quiz.unlocked 
                              ? 'bg-slate-800/30 border-slate-700/30 opacity-60' 
                              : 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-blue-500/30 shadow-lg shadow-blue-500/5'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${quiz.unlocked ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'bg-gray-700'}`}>
                              {quiz.unlocked ? '📝' : '🔒'}
                            </div>
                            <div>
                              <h4 className={`font-bold ${quiz.unlocked ? 'text-blue-100' : 'text-gray-500'}`}>
                                {quiz.title}
                              </h4>
                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-0.5">
                                Theory Assessment • Week {quiz.week}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                             {!quiz.unlocked ? (
                               <div className="text-right">
                                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                                    {quiz.tasksNeeded} Tasks Left
                                  </span>
                               </div>
                             ) : quiz.hasAttempted && quiz.isPassed ? (
                               <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/20">
                                    Passed: {Math.round(quiz.lastScore)}%
                                  </span>
                               </div>
                             ) : (
                               <button 
                                 onClick={() => navigate(`/quiz/${quiz._id}`)}
                                 className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-blue-600/20"
                               >
                                 {quiz.hasAttempted ? 'Retake Quiz' : 'Start Quiz'}
                               </button>
                             )}
                          </div>
                        </motion.div>
                      );
                    }

                    const task = item.data;
                    const config = STATUS_CONFIG[task.status] || STATUS_CONFIG.locked;
                    const isExpanded = expandedTask === task._id;
                    const isLocked = task.status === 'locked';
                    const canSubmit = ['unlocked', 'in-progress', 'rejected'].includes(task.status);

                  return (
                    <motion.div
                      key={task._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`rounded-xl border transition-all duration-300 ${
                        isLocked
                          ? 'bg-gray-800/30 border-gray-700/30 opacity-60'
                          : isExpanded
                          ? 'bg-gray-800/80 border-cyan-500/40 shadow-lg shadow-cyan-500/5'
                          : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600/50'
                      }`}
                    >
                      {/* Task Header */}
                      <div
                        className={`flex items-center gap-4 p-5 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        onClick={() => !isLocked && setExpandedTask(isExpanded ? null : task._id)}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${config.color}`}>
                          {task.status === 'approved' ? '✓' : task.taskOrder}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold truncate ${isLocked ? 'text-gray-500' : 'text-white'}`}>{task.title}</h3>
                            <span className="text-xs">{config.icon}</span>
                          </div>
                          <p className={`text-xs mt-0.5 ${isLocked ? 'text-gray-600' : 'text-gray-400'}`}>
                            Week {task.weekNumber} • Due: {new Date(task.deadlineDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${config.color} text-white flex-shrink-0`}>
                          {config.label}
                        </span>
                        {task.evaluation?.score != null && (
                          <div className={`text-right flex-shrink-0 ${task.evaluation.status === 'PASS' ? 'text-emerald-400' : 'text-red-400'}`}>
                            <div className="text-lg font-bold">{task.evaluation.score}</div>
                            <div className="text-xs opacity-80">/ 100</div>
                          </div>
                        )}
                        {!isLocked && (
                          <svg className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </div>

                      {/* Expanded Content */}
                      <AnimatePresence>
                        {isExpanded && !isLocked && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 space-y-4 border-t border-gray-700/50 pt-4">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-300 mb-1">Description</h4>
                                <p className="text-sm text-gray-400 leading-relaxed">{task.description}</p>
                              </div>

                              {task.requirements?.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Requirements</h4>
                                  <ul className="space-y-1">
                                    {task.requirements.map((req, i) => (
                                      <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                                        <span className="text-cyan-400 mt-0.5">•</span>{req}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {task.evaluation && (
                                <div className={`rounded-lg p-4 border ${task.evaluation.status === 'PASS' ? 'bg-emerald-900/20 border-emerald-700/40' : 'bg-red-900/20 border-red-700/40'}`}>
                                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                    {task.evaluation.status === 'PASS' ? '✅' : '❌'} AI Evaluation Result
                                  </h4>
                                  <div className="grid grid-cols-3 gap-3 mb-3">
                                    {[
                                      { label: 'Score', value: task.evaluation.score },
                                      { label: 'Plagiarism', value: `${task.evaluation.plagiarism_percent}%` },
                                      { label: 'Result', value: task.evaluation.status, colored: true },
                                    ].map((s) => (
                                      <div key={s.label} className="text-center p-2 rounded bg-gray-800/50">
                                        <div className={`text-xl font-bold ${s.colored ? (task.evaluation.status === 'PASS' ? 'text-emerald-400' : 'text-red-400') : 'text-white'}`}>
                                          {s.value}
                                        </div>
                                        <div className="text-xs text-gray-400">{s.label}</div>
                                      </div>
                                    ))}
                                  </div>
                                  <p className="text-sm text-gray-300 mb-2">{task.evaluation.feedback}</p>
                                  {task.evaluation.improvements?.length > 0 && (
                                    <div>
                                      <h5 className="text-xs font-semibold text-yellow-400 mb-1">Improvements:</h5>
                                      <ul className="space-y-1">
                                        {task.evaluation.improvements.map((imp, i) => (
                                          <li key={i} className="text-xs text-gray-400 flex items-start gap-1">
                                            <span className="text-yellow-400">→</span> {imp}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}

                              {canSubmit && (
                                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                                  <h4 className="text-sm font-semibold text-white mb-3">
                                    {task.status === 'rejected' ? '🔄 Resubmit Your Work' : '📤 Submit Your Work'}
                                  </h4>
                                  <div className="space-y-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-400 mb-1">Upload File (PDF/ZIP, max 25MB)</label>
                                      <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.zip"
                                        onChange={(e) => setFile(e.target.files[0])}
                                        className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 file:cursor-pointer bg-gray-800 rounded-lg border border-gray-700 p-1"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-400 mb-1">GitHub Repository Link</label>
                                      <input
                                        type="url"
                                        placeholder="https://github.com/username/repo"
                                        value={githubLink}
                                        onChange={(e) => setGithubLink(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-400 mb-1">Message / Notes</label>
                                      <textarea
                                        placeholder="Describe your approach and any notes..."
                                        rows={3}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none transition-colors"
                                      />
                                    </div>
                                    <button
                                      onClick={() => handleSubmit(task._id)}
                                      disabled={submitting}
                                      className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                    >
                                      {submitting ? (
                                        <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Evaluating with AI...</>
                                      ) : (
                                        <>🚀 Submit for AI Review</>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Quick link to open mentor for this task */}
                              <button
                                onClick={() => setActiveTab('mentor')}
                                className="w-full py-2 text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-800/50 hover:border-cyan-600/60 rounded-lg transition-all flex items-center justify-center gap-1"
                              >
                                🤖 Ask AI Mentor about this task
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })})()
              }

                {tasks.length === 0 && (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🤖</div>
                    <h3 className="text-xl font-semibold text-white mb-2">No AI Tasks Yet</h3>
                    <p className="text-gray-400 mb-6">
                      Your AI-personalized tasks haven't been generated yet.
                      Click below and Groq AI (LLaMA 3.3 70B) will create tasks tailored for you.
                    </p>
                    <button
                      onClick={handleGenerateTasks}
                      disabled={generatingTasks}
                      className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-3 mx-auto shadow-lg shadow-purple-500/20"
                    >
                      {generatingTasks ? (
                        <><div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating with AI...</>
                      ) : (
                        <>⚡ Generate My AI Tasks</>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 mt-3">Powered by Groq AI • LLaMA 3.3 70B</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── AI Mentor Tab ── */}
          {activeTab === 'mentor' && (
            <motion.div key="mentor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="mb-4 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-xl p-4 border border-purple-700/40 flex items-start gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <h4 className="text-white font-semibold mb-0.5">AI Mentor — Groq AI (LLaMA 3.3 70B)</h4>
                  <p className="text-gray-400 text-sm">
                    Get personalized guidance on your tasks. The mentor helps you think and learn — it won't write your answers for you.
                    {expandedTask && <span className="text-cyan-400"> Context from your selected task is active.</span>}
                  </p>
                </div>
              </div>
              <InlineMentorChat currentTaskId={expandedTask} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Chatbot (always available) */}
      <MentorChatbot currentTaskId={expandedTask} />
    </div>
  );
}
