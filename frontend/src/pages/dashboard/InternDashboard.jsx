import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useAuth } from '../../hooks/useAuth';
import { internshipTaskService } from '../../services';
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
  const [application,  setApplication]  = useState(null);
  const [loading,      setLoading]      = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [pRes, eRes] = await Promise.all([
        internshipTaskService.getWeeklyProgress(),
        internshipTaskService.getMyEnrollments(),
      ]);
      if (pRes.data?.success) setProgress(pRes.data.data);
      if (eRes.data?.success) setEnrollments(eRes.data.enrollments || []);
      try {
        const aRes = await api.get(`/applications/user/${user._id}`);
        if (aRes.data?.data) setApplication(aRes.data.data);
      } catch (_) {}
    } catch { toast.error('Failed to load dashboard'); }
    finally  { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  /* ── loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-light">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
          <div className="w-14 h-14 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-slate-400 font-medium">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

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

        {/* ══ CHARTS ROW ════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Weekly Area Chart — 2/3 */}
          <motion.div {...fade(0.35)} className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-primary mb-4">📈 Weekly Task Progress</h3>
            {s.weeklyProgress?.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={s.weeklyProgress} margin={{ top:4, right:4, bottom:0, left:-10 }}>
                  <defs>
                    <linearGradient id="gComp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0A3D62" stopOpacity={0.18}/>
                      <stop offset="95%" stopColor="#0A3D62" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gPend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#74B9FF" stopOpacity={0.18}/>
                      <stop offset="95%" stopColor="#74B9FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="week" tick={{ fill:'#94a3b8', fontSize:12 }}/>
                  <YAxis tick={{ fill:'#94a3b8', fontSize:12 }}/>
                  <Tooltip contentStyle={TIP}/>
                  <Legend wrapperStyle={{ color:'#64748b', fontSize:12 }}/>
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#0A3D62" strokeWidth={2.5} fill="url(#gComp)" dot={{ fill:'#0A3D62', r:4 }}/>
                  <Area type="monotone" dataKey="pending"   name="Pending"   stroke="#74B9FF" strokeWidth={2.5} fill="url(#gPend)" dot={{ fill:'#74B9FF', r:4 }}/>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex flex-col items-center justify-center text-slate-300">
                <span className="text-5xl mb-3">📊</span>
                <p className="font-semibold text-slate-400">No data yet</p>
                <p className="text-sm text-slate-300 mt-1">Complete tasks to see progress charts</p>
              </div>
            )}
          </motion.div>

          {/* Pie — 1/3 */}
          <motion.div {...fade(0.4)} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-primary mb-4">🎯 Distribution</h3>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={72} paddingAngle={3} dataKey="value">
                      {pieData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                    </Pie>
                    <Tooltip contentStyle={TIP}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background:d.color }}/>
                        <span className="text-slate-600">{d.name}</span>
                      </div>
                      <span className="font-bold text-primary">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-slate-300">
                <span className="text-5xl mb-3">🎯</span>
                <p className="text-sm text-slate-400 text-center">Go to My Tasks to get started!</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* ══ SCORE TREND + ENROLLMENTS ═════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Score line */}
          <motion.div {...fade(0.45)} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-primary mb-4">⭐ AI Score Trend</h3>
            {s.weeklyProgress?.some(w => w.averageScore > 0) ? (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={s.weeklyProgress} margin={{ top:4, right:4, bottom:0, left:-10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="week" tick={{ fill:'#94a3b8', fontSize:12 }}/>
                  <YAxis domain={[0,100]} tick={{ fill:'#94a3b8', fontSize:12 }}/>
                  <Tooltip contentStyle={TIP}/>
                  <Line type="monotone" dataKey="averageScore" name="Avg Score" stroke="#0A3D62" strokeWidth={3}
                    dot={{ fill:'#0A3D62', r:5, strokeWidth:2, stroke:'#fff' }}
                    activeDot={{ r:8, stroke:'#0A3D62', strokeWidth:2, fill:'#74B9FF' }}/>
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[210px] flex flex-col items-center justify-center text-slate-300">
                <span className="text-5xl mb-3">⭐</span>
                <p className="text-sm text-slate-400">Submit tasks to see your score trend</p>
              </div>
            )}
          </motion.div>

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