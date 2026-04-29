import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { FiClock } from 'react-icons/fi';
import { Navbar } from '../../components/layout/Navbar';
import { useAuth } from '../../hooks/useAuth';
import { internshipTaskService, quizService } from '../../services';
import api from '../../utils/api';
import toast from 'react-hot-toast';

/* ── helpers ─────────────────────────────────────────── */
const TIP = {
  backgroundColor: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  color: '#0A3D62',
  boxShadow: '0 4px 16px rgba(10,61,98,0.10)',
};

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.45, ease: 'easeOut' },
});

/* ── Stat Card ───────────────────────────────────────── */
const StatCard = ({ icon, label, value, sub, accent, delay }) => (
  <motion.div {...fade(delay)} whileHover={{ y: -4, boxShadow: '0 10px 28px rgba(10,61,98,0.13)' }}
    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 cursor-default">
    <div className={`w-13 h-13 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${accent}`}
      style={{ width: 52, height: 52 }}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide truncate">{label}</p>
      <p className="text-2xl font-extrabold text-primary leading-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </motion.div>
);

/* ── Quick Action Button ─────────────────────────────── */
const QAction = ({ icon, label, desc, color, onClick }) => (
  <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`w-full text-left p-4 rounded-2xl border shadow-sm transition-all flex items-start gap-3 ${color}`}>
    <span className="text-2xl mt-0.5">{icon}</span>
    <div>
      <p className="font-bold text-sm">{label}</p>
      <p className="text-xs opacity-75 mt-0.5">{desc}</p>
    </div>
  </motion.button>
);

/* ══════════════════════════════════════════════════════ */
export const InternDashboard = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [progress,     setProgress]     = useState(null);
  const [enrollments,  setEnrollments]  = useState([]);
  const [quizzes,      setQuizzes]      = useState([]);
  const [quizData,     setQuizData]     = useState(null);
  const [application,  setApplication]  = useState(null);
  const hasLoaded = useRef(false);

  const load = useCallback(async () => {
    // Aggressive guard: if we've tried once, never try again in this mount cycle
    if (!user?._id || hasLoaded.current) return;
    hasLoaded.current = true;
    
    try {
      // Load everything but don't let failures trigger a re-render loop
      const [pRes, eRes] = await Promise.all([
        internshipTaskService.getWeeklyProgress().catch(() => null),
        internshipTaskService.getMyEnrollments().catch(() => null),
      ]);

      if (pRes?.data?.success) setProgress(pRes.data.data);
      if (eRes?.data?.success) setEnrollments(eRes.data.enrollments || []);
      
      // Fetch available quizzes (Optional)
      quizService.getAvailable()
        .then(res => {
          if (res.data?.success) {
            setQuizzes(res.data.data || []);
            setQuizData(res.data);
          }
        })
        .catch(() => {});

      // Fetch user application (Optional)
      api.get(`/applications/user/${user._id}`)
        .then(res => {
          if (res.data?.data) setApplication(res.data.data);
        })
        .catch(() => {});
      
    } catch (err) {
      console.warn('Dashboard non-critical load issue:', err.message);
    }
  }, [user?._id]);

  useEffect(() => { load(); }, [load]);



  const s = progress || {
    totalTasks:0, approvedTasks:0, pendingTasks:0,
    rejectedTasks:0, submittedTasks:0, averageScore:0, weeklyProgress:[],
  };
  const pct = s.totalTasks > 0 ? Math.round((s.approvedTasks / s.totalTasks) * 100) : 0;

  const pieData = [
    { name:'Approved',  value:s.approvedTasks,      color:'#10b981' },
    { name:'Pending',   value:s.pendingTasks,        color:'#f59e0b' },
    { name:'Submitted', value:s.submittedTasks||0,   color:'#74B9FF' },
    { name:'Needs Work',value:s.rejectedTasks,       color:'#ef4444' },
  ].filter(d => d.value > 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen" style={{ background: '#F1F2F6' }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ══ HERO HEADER ══════════════════════════════════ */}
        <motion.div {...fade(0)} className="mb-8 rounded-2xl overflow-hidden shadow-md"
          style={{ background: 'linear-gradient(135deg, #0A3D62 0%, #1a5276 50%, #0d47a1 100%)' }}>
          <div className="px-7 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <p className="text-blue-300 text-sm font-semibold tracking-wide mb-1">{greeting} 👋</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-blue-200 mt-1 text-sm">Intern Portal &nbsp;•&nbsp; AI-Powered Internship Program</p>

              {s.totalTasks > 0 && (
                <div className="mt-4 max-w-xs">
                  <div className="flex justify-between text-xs text-blue-200 mb-1">
                    <span>Overall completion</span>
                    <span className="font-bold text-white">{pct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg,#74B9FF,#10b981)' }}
                    />
                  </div>
                  <p className="text-blue-300 text-xs mt-1">{s.approvedTasks} of {s.totalTasks} tasks approved</p>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-extrabold text-primary shadow-lg"
                style={{ background: 'linear-gradient(135deg,#74B9FF,#a8d8ff)' }}>
                {(user?.firstName?.[0] || '')}{(user?.lastName?.[0] || '')}
              </div>
              <p className="text-center text-xs text-blue-300 mt-2 font-medium capitalize">{user?.role}</p>
            </div>
          </div>
        </motion.div>

        {/* ══ STAT CARDS ════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard icon="📋" label="Total Tasks"   value={s.totalTasks}        accent="bg-blue-50"    delay={0.05} />
          <StatCard icon="✅" label="Approved"      value={s.approvedTasks}     accent="bg-green-50"   delay={0.1}  />
          <StatCard icon="⏳" label="Pending"       value={s.pendingTasks}      accent="bg-yellow-50"  delay={0.15} />
          <StatCard icon="📤" label="Submitted"     value={s.submittedTasks||0} accent="bg-indigo-50"  delay={0.2}  />
          <StatCard icon="❌" label="Needs Work"    value={s.rejectedTasks}     accent="bg-red-50"     delay={0.25} />
          <StatCard icon="⭐" label="AI Avg Score"  value={`${s.averageScore}%`} accent="bg-purple-50" delay={0.3}  />
        </div>

        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center mb-6">
          <h2 className="text-2xl font-bold text-primary mb-2">Welcome to your Dashboard</h2>
          <p className="text-slate-500">Your internships and tasks will appear here.</p>
        </div>

          {/* Active internships */}
          <motion.div {...fade(0.5)} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary">🎓 My Internships</h3>
              <button onClick={() => navigate('/categories')}
                className="text-xs font-semibold text-secondary border border-secondary/40 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                + Browse
              </button>
            </div>
            {enrollments.length > 0 ? (
              <div className="space-y-3">
                {enrollments.map(en => {
                  const p2 = en.taskProgress.percentage;
                  return (
                    <div key={en._id} onClick={() => navigate('/tasks')}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-secondary/40 cursor-pointer transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-xl shadow-sm flex-shrink-0"
                        style={{ color: en.category?.color || '#0A3D62' }}>
                        {en.category?.icon || '📚'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-primary group-hover:text-secondary transition-colors truncate">{en.category?.name}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width:`${p2}%`, background:'linear-gradient(90deg,#0A3D62,#74B9FF)' }}/>
                          </div>
                          <span className="text-xs text-slate-400 flex-shrink-0">{p2}%</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-primary">{en.taskProgress.approved}/{en.taskProgress.total}</p>
                        <p className="text-xs text-slate-400">done</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-300">
                <span className="text-4xl mb-2">🎓</span>
                <p className="text-slate-400 font-medium mb-3">No active internships</p>
                <button onClick={() => navigate('/categories')}
                  className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-sm">
                  Browse Internships
                </button>
              </div>
            )}
          </motion.div>
        </div>
        
        {/* ══ ADMIN QUIZZES (Theory based) ══════════════════ */}
        <AnimatePresence>
          {quizData && (
            <motion.div {...fade(0.52)} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-lg">📝</span>
                  Admin Quizzes
                </h3>
                <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-wider">
                  1 Quiz per 2 Tasks
                </span>
              </div>

              {/* Unlocked Quizzes */}
              {quizzes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {quizzes.map((quiz) => (
                    <motion.div 
                      key={quiz._id}
                      whileHover={{ y: -4 }}
                      className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl" style={{ color: quiz.category?.color }}>
                            {quiz.category?.icon || '📚'}
                          </div>
                          {quiz.hasAttempted ? (
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${quiz.isPassed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                              {quiz.isPassed ? `Passed: ${Math.round(quiz.lastScore)}%` : 'Failed'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                              New
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-primary mb-1 line-clamp-1">{quiz.title}</h4>
                        <p className="text-xs text-slate-400 mb-4 line-clamp-2">Topic covered in your recent tasks</p>
                        
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-6">
                          <span className="flex items-center gap-1"><FiClock /> {quiz.timeLimit}m</span>
                          <span className="flex items-center gap-1">📝 {quiz.questions.length} Qs</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => navigate(`/quiz/${quiz._id}`)}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                          quiz.hasAttempted && quiz.isPassed 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                          : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/10'
                        }`}
                        disabled={quiz.hasAttempted && quiz.isPassed}
                      >
                        {quiz.hasAttempted ? (quiz.isPassed ? 'Completed' : 'Retake Quiz') : 'Start Quiz'}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Upcoming (Locked) Quizzes */}
              {quizData.lockInfo && quizData.lockInfo.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quizData.lockInfo.map((info, idx) => (
                    <div key={idx} className="bg-slate-50/50 border border-slate-200 border-dashed rounded-2xl p-4 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg grayscale opacity-50">
                          🔒
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-slate-600 line-clamp-1">{info.title}</h5>
                          <p className="text-[10px] text-slate-400 font-medium">Unlocked after {info.totalRequired} tasks</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 mb-1">
                           {info.tasksNeeded} tasks left
                         </div>
                         <div className="w-24 h-1 bg-slate-200 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-amber-400" 
                             style={{ width: `${(info.currentApproved / info.totalRequired) * 100}%` }}
                           />
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {quizzes.length === 0 && (!quizData.lockInfo || quizData.lockInfo.length === 0) && (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-2xl">
                    📚
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">No Assessments Yet</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Enroll in a course and complete tasks to start receiving conceptual assessments.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ QUICK ACTIONS ══════════════════════════════════ */}
        <motion.div {...fade(0.55)} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-primary mb-4">⚡ Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QAction icon="📋" label="My Tasks"        desc="View & submit AI tasks"       color="bg-primary text-white border-primary/20"           onClick={() => navigate('/tasks')}           />
            <QAction icon="🎓" label="Browse Courses"  desc="Find new internships"         color="bg-secondary/10 text-primary border-secondary/30"   onClick={() => navigate('/categories')}      />
            <QAction icon="📊" label="Progress Report" desc="Detailed analytics"           color="bg-green-600 text-white border-green-500/20"         onClick={() => navigate('/student-progress')}/>
            <QAction icon="📄" label={application?'My CV':'Build CV'} desc={application?'View or update':'Create your profile'} color="bg-purple-600 text-white border-purple-500/20" onClick={() => navigate('/cv-builder')}/>
          </div>
        </motion.div>

        {/* ══ AI BANNER ══════════════════════════════════════ */}
        <motion.div {...fade(0.6)}
          className="rounded-2xl p-6 border border-blue-100 flex items-start gap-5 shadow-sm"
          style={{ background:'linear-gradient(135deg,rgba(10,61,98,0.04) 0%,rgba(116,185,255,0.09) 100%)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-sm"
            style={{ background:'linear-gradient(135deg,#0A3D62,#74B9FF)' }}>
            🤖
          </div>
          <div>
            <h4 className="font-bold text-primary text-base mb-1">AI-Powered by Groq (LLaMA 3.3 70B)</h4>
            <p className="text-slate-500 text-sm leading-relaxed">
              Your tasks are generated and auto-evaluated by Groq AI. Each submission gets a <strong className="text-primary">score</strong>, <strong className="text-primary">plagiarism check</strong>, and
              actionable feedback. Use the <strong className="text-primary">🤖 AI Mentor</strong> in My Tasks for guided hints — not direct answers.
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default InternDashboard;