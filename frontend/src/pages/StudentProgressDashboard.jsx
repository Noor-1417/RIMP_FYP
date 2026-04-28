import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { Navbar } from '../components/layout/Navbar';
import { useAuth } from '../hooks/useAuth';
import { internshipTaskService } from '../services';
import toast from 'react-hot-toast';

const StatCard = ({ icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(10,61,98,0.12)' }}
    className="bg-white rounded-xl shadow-sm border border-light p-5 flex items-center gap-4"
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${color}`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-primary">{value}</p>
    </div>
  </motion.div>
);

const TIP = { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#0A3D62' };

export default function StudentProgressDashboard() {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    internshipTaskService.getWeeklyProgress()
      .then(res => { if (res.data?.success) setProgressData(res.data.data); })
      .catch(() => toast.error('Failed to load progress'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-light">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-gray-500 mt-4 font-medium">Loading your progress…</p>
          </div>
        </div>
      </div>
    );
  }

  const s = progressData || { totalTasks:0, completedTasks:0, pendingTasks:0, approvedTasks:0, rejectedTasks:0, submittedTasks:0, averageScore:0, weeklyProgress:[] };
  const overallPct = s.totalTasks > 0 ? Math.round((s.approvedTasks / s.totalTasks) * 100) : 0;

  const pieData = [
    { name: 'Approved',  value: s.approvedTasks,      color: '#10b981' },
    { name: 'Pending',   value: s.pendingTasks,        color: '#f59e0b' },
    { name: 'Submitted', value: s.submittedTasks || 0, color: '#74B9FF' },
    { name: 'Rejected',  value: s.rejectedTasks,       color: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-light">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-primary">📊 My Progress Report</h1>
          <p className="text-gray-500 mt-1">Detailed analytics for {user?.firstName}'s internship journey.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard icon="📋" label="Total Tasks"  value={s.totalTasks}        color="bg-blue-50"    delay={0}    />
          <StatCard icon="✅" label="Approved"     value={s.approvedTasks}     color="bg-green-50"   delay={0.05} />
          <StatCard icon="⏳" label="Pending"      value={s.pendingTasks}      color="bg-yellow-50"  delay={0.1}  />
          <StatCard icon="📤" label="Submitted"    value={s.submittedTasks||0} color="bg-indigo-50"  delay={0.15} />
          <StatCard icon="❌" label="Needs Work"   value={s.rejectedTasks}     color="bg-red-50"     delay={0.2}  />
          <StatCard icon="⭐" label="Avg Score"    value={`${s.averageScore}%`} color="bg-purple-50" delay={0.25} />
        </div>

        {/* Overall bar */}
        {s.totalTasks > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-light p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-primary">🏁 Overall Completion</h3>
              <span className="text-2xl font-bold text-secondary">{overallPct}%</span>
            </div>
            <div className="w-full h-4 bg-light rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${overallPct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#0A3D62,#74B9FF,#10b981)' }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1.5">
              <span>{s.approvedTasks} approved</span><span>{s.totalTasks} total</span>
            </div>
          </motion.div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.35 }}
            className="bg-white rounded-xl shadow-sm border border-light p-6">
            <h3 className="text-lg font-bold text-primary mb-4">📈 Weekly Task Completion</h3>
            {s.weeklyProgress?.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={s.weeklyProgress} margin={{ top:4, right:4, bottom:0, left:-10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                  <XAxis dataKey="week" tick={{ fill:'#6b7280', fontSize:12 }}/>
                  <YAxis tick={{ fill:'#6b7280', fontSize:12 }}/>
                  <Tooltip contentStyle={TIP}/>
                  <Legend wrapperStyle={{ color:'#6b7280', fontSize:12 }}/>
                  <Bar dataKey="completed" name="Completed" fill="#0A3D62" radius={[4,4,0,0]}/>
                  <Bar dataKey="pending"   name="Pending"   fill="#74B9FF" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex flex-col items-center justify-center text-gray-400">
                <span className="text-4xl mb-2">📊</span><p>Complete tasks to see charts</p>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.4 }}
            className="bg-white rounded-xl shadow-sm border border-light p-6">
            <h3 className="text-lg font-bold text-primary mb-4">⭐ Score Trend by Week</h3>
            {s.weeklyProgress?.some(w => w.averageScore > 0) ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={s.weeklyProgress} margin={{ top:4, right:4, bottom:0, left:-10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                  <XAxis dataKey="week" tick={{ fill:'#6b7280', fontSize:12 }}/>
                  <YAxis domain={[0,100]} tick={{ fill:'#6b7280', fontSize:12 }}/>
                  <Tooltip contentStyle={TIP}/>
                  <Line type="monotone" dataKey="averageScore" name="Avg Score" stroke="#0A3D62" strokeWidth={3} dot={{ fill:'#0A3D62', r:5 }} activeDot={{ r:7 }}/>
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex flex-col items-center justify-center text-gray-400">
                <span className="text-4xl mb-2">⭐</span><p>Submit tasks to see score trend</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Pie */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.45 }}
          className="bg-white rounded-xl shadow-sm border border-light p-6">
          <h3 className="text-lg font-bold text-primary mb-4">🎯 Task Status Distribution</h3>
          {pieData.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center gap-8">
              <ResponsiveContainer width={260} height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value">
                    {pieData.map((e,i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={TIP}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between p-3 rounded-lg bg-light">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: d.color }}/>
                      <span className="text-sm font-medium text-gray-700">{d.name}</span>
                    </div>
                    <span className="font-bold text-primary">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[160px] flex flex-col items-center justify-center text-gray-400">
              <span className="text-4xl mb-2">🎯</span><p>No task data yet — go to My Tasks to start!</p>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
