import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
} from 'recharts';
import {
  FiUsers, FiCheckCircle, FiClock, FiArrowUpRight,
  FiDownload, FiBell, FiBook, FiRefreshCw, FiFolder,
  FiEye, FiAward,
} from 'react-icons/fi';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

/* ── Animation variants ───────────────────────────── */
const ANIM = {
  container: { hidden:{ opacity:0 }, show:{ opacity:1, transition:{ staggerChildren:0.08 }}},
  item:      { hidden:{ opacity:0, y:12 }, show:{ opacity:1, y:0, transition:{ type:'spring', stiffness:120, damping:16 }}},
};

/* ── Status badge helper ──────────────────────────── */
function enrollmentBadge(status) {
  const map = {
    active:    'bg-green-900/50 text-green-300 border-green-700/40',
    completed: 'bg-blue-900/50 text-blue-300 border-blue-700/40',
    cancelled: 'bg-red-900/50 text-red-300 border-red-700/40',
    pending:   'bg-yellow-900/50 text-yellow-300 border-yellow-700/40',
  };
  return map[status] || 'bg-gray-700/50 text-gray-300 border-gray-600/40';
}

/* ══════════════════════════════════════════════════ */
export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [sidebarOpen,        setSidebarOpen]        = useState(false);
  const [searchQuery,        setSearchQuery]         = useState('');
  const [stats,              setStats]               = useState(null);
  const [students,           setStudents]            = useState([]);
  const [submissions,        setSubmissions]         = useState([]);
  const [categories,         setCategories]          = useState([]);
  const [loadingStats,       setLoadingStats]        = useState(true);
  const [loadingStudents,    setLoadingStudents]     = useState(true);
  const [loadingSubmissions, setLoadingSubmissions]  = useState(true);
  const [loadingCategories,  setLoadingCategories]   = useState(true);
  const [refreshing,         setRefreshing]          = useState(false);

  /* ── Chart data ── */
  const weeklyData = [
    { week:'W1', students:0 }, { week:'W2', students:0 },
    { week:'W3', students:0 }, { week:'W4', students:0 },
  ];

  const fetchAll = useCallback(async () => {
    // Stats
    setLoadingStats(true);
    try {
      const r = await api.get('/admin/stats');
      setStats(r.data?.data || r.data);
    } catch { toast.error('Failed to load stats'); }
    finally { setLoadingStats(false); }

    // Real students (role:intern, with enrollments)
    setLoadingStudents(true);
    try {
      const r = await api.get('/admin/students', { params: { limit: 10, page: 1 } });
      const data = r.data?.data || [];
      setStudents(Array.isArray(data) ? data : []);
    } catch { console.error('Students fetch failed'); }
    finally { setLoadingStudents(false); }

    // Submissions
    setLoadingSubmissions(true);
    try {
      const r = await api.get('/admin/submissions', { params: { limit: 8 } });
      const data = r.data?.data || [];
      setSubmissions(Array.isArray(data) ? data : []);
    } catch { console.error('Submissions fetch failed'); }
    finally { setLoadingSubmissions(false); }

    // Categories
    setLoadingCategories(true);
    try {
      const r = await api.get('/admin/categories', { params: { limit: 20 } });
      const data = r.data?.data || [];
      setCategories(Array.isArray(data) ? data : []);
    } catch { console.error('Categories fetch failed'); }
    finally { setLoadingCategories(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
    toast.success('Dashboard refreshed!');
  };

  /* ── Filtered search ── */
  const filteredStudents = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return students;
    return students.filter(s =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.enrollments?.some(e => e.category?.name?.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  const filteredSubmissions = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return submissions;
    return submissions.filter(s =>
      `${s.student?.firstName} ${s.student?.lastName}`.toLowerCase().includes(q) ||
      s.task?.title?.toLowerCase().includes(q)
    );
  }, [submissions, searchQuery]);

  /* ── Stats card config ── */
  const STAT_CARDS = [
    { key:'totalStudents',       title:'Total Students',     icon:FiUsers,        grad:'from-blue-900/40 to-blue-800/20',   border:'border-blue-700/50',  badge:'bg-blue-500/20 text-blue-300' },
    { key:'activeEnrollments',   title:'Active Enrollments', icon:FiCheckCircle,  grad:'from-green-900/40 to-green-800/20', border:'border-green-700/50', badge:'bg-green-500/20 text-green-300' },
    { key:'totalCategories',     title:'Courses',            icon:FiFolder,       grad:'from-amber-900/40 to-amber-800/20', border:'border-amber-700/50', badge:'bg-amber-500/20 text-amber-300' },
    { key:'pendingSubmissions',  title:'Pending Review',     icon:FiClock,        grad:'from-red-900/40 to-red-800/20',     border:'border-red-700/50',   badge:'bg-red-500/20 text-red-300' },
  ];

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}/>

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} onSearch={setSearchQuery}/>

        <main className="flex-1 overflow-auto bg-gray-900">
          <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">

            {/* ── Header ── */}
            <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} className="flex items-start justify-between">
              <div>
                <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">Dashboard</h1>
                <p className="text-gray-400 mt-1 text-sm">Real-time platform overview — all data from live accounts</p>
                <div className="border-b border-gray-800 mt-4"/>
              </div>
              <button onClick={handleRefresh} disabled={refreshing}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-lg text-blue-300 font-semibold transition-all disabled:opacity-50 mt-2">
                <FiRefreshCw size={18} className={refreshing ? 'animate-spin' : ''}/>
                Refresh
              </button>
            </motion.div>

            {/* ── Stat Cards ── */}
            <motion.div variants={ANIM.container} initial="hidden" animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STAT_CARDS.map(c => (
                <motion.div key={c.key} variants={ANIM.item} whileHover={{ y:-4 }}
                  className={`bg-gradient-to-br ${c.grad} border ${c.border} rounded-2xl p-6 shadow-md`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">{c.title}</p>
                      <h3 className="text-4xl font-extrabold text-cyan-300">{loadingStats ? '…' : (stats?.[c.key] ?? 0)}</h3>
                    </div>
                    <div className={`w-14 h-14 ${c.badge} rounded-xl flex items-center justify-center`}>
                      <c.icon size={26}/>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* ── Quick Actions ── */}
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
              className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-6 border border-blue-700/30">
              <h3 className="text-xl font-bold text-cyan-200 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {[
                  { icon:'👥', label:'Students',    path:'/admin/students' },
                  { icon:'📚', label:'Categories',  path:'/admin/categories' },
                  { icon:'📤', label:'Submissions', path:'/admin/submissions' },
                  { icon:'📊', label:'Analytics',   path:'/admin/analytics' },
                  { icon:'🔔', label:'Notifications', path:'/admin/notifications' },
                  { icon:'⚙️', label:'Settings',    path:'/admin/settings' },
                ].map(a => (
                  <button key={a.path} onClick={() => navigate(a.path)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-blue-500/60 hover:bg-gray-700/50 transition-all text-gray-300 hover:text-white">
                    <span className="text-2xl">{a.icon}</span>
                    <span className="text-xs font-semibold">{a.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* ── Categories Overview (real data) ── */}
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-cyan-300">📚 Course Overview</h2>
                <button onClick={() => navigate('/admin/categories')}
                  className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center gap-1 transition-colors">
                  Manage <FiArrowUpRight size={14}/>
                </button>
              </div>
              {loadingCategories ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-800/50 rounded-xl animate-pulse"/>)}
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-gray-800/40 rounded-xl border border-gray-700/40">
                  <div className="text-3xl mb-2">📭</div>
                  <p>No courses created yet. <button onClick={() => navigate('/admin/categories')} className="text-blue-400 underline">Add a course</button></p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map(cat => (
                    <motion.div key={cat._id} whileHover={{ y:-4, boxShadow:'0 16px 32px rgba(0,0,0,0.4)' }}
                      className="bg-gradient-to-br from-gray-800/70 to-gray-900/50 rounded-xl p-5 border border-gray-700/40 hover:border-blue-500/50 transition-all cursor-pointer"
                      onClick={() => navigate('/admin/categories')}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">{cat.icon || '📚'}</span>
                          <div>
                            <h3 className="font-bold text-cyan-300 text-sm leading-tight">{cat.name}</h3>
                            <p className="text-xs text-gray-400 capitalize">{cat.difficulty} • {cat.duration} weeks</p>
                          </div>
                        </div>
                        <div style={{ background: cat.color || '#3b82f6' }}
                          className="w-2 h-2 rounded-full mt-1 flex-shrink-0"/>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-900/40 rounded-lg px-2 py-1.5 text-center">
                          <p className="font-bold text-cyan-300">{cat.enrolledCount ?? 0}</p>
                          <p className="text-gray-400">Enrolled</p>
                        </div>
                        <div className="bg-gray-900/40 rounded-lg px-2 py-1.5 text-center">
                          <p className="font-bold text-cyan-300">{cat.capacity ?? '∞'}</p>
                          <p className="text-gray-400">Capacity</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* ── Real Students Table ── */}
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
              className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden shadow-lg">
              <div className="px-6 py-5 border-b border-gray-700/50 flex items-center justify-between bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                <div>
                  <h2 className="text-xl font-semibold text-cyan-300">👥 Registered Students</h2>
                  <p className="text-gray-400 text-sm mt-0.5">
                    {loadingStudents ? 'Loading…' : `${filteredStudents.length} student${filteredStudents.length!==1?'s':''} registered`}
                  </p>
                </div>
                <button onClick={() => navigate('/admin/students')}
                  className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-500/10">
                  View All <FiArrowUpRight size={14}/>
                </button>
              </div>

              {loadingStudents ? (
                <div className="p-10 text-center">
                  <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
                  <p className="text-gray-400">Loading registered students…</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="text-4xl mb-2">👤</div>
                  <p className="text-gray-400 font-medium">No students registered yet</p>
                  <p className="text-gray-500 text-sm mt-1">Students will appear here once they sign up and create accounts</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700/50 bg-gray-900/40">
                        {['Student','Email','Joined','Enrolled In','Progress','Status'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/30">
                      {filteredStudents.map((s, i) => {
                        const enrollment = s.enrollments?.[0];
                        const isActive   = s.isActive !== false;
                        return (
                          <motion.tr key={s._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.04 }}
                            className="hover:bg-gray-700/20 transition-colors cursor-pointer"
                            onClick={() => navigate(`/admin/students`)}>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {s.firstName?.[0]?.toUpperCase()}{s.lastName?.[0]?.toUpperCase()}
                                </div>
                                <span className="font-semibold text-cyan-300">{s.firstName} {s.lastName}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-gray-400 text-sm">{s.email}</td>
                            <td className="px-5 py-4 text-gray-400 text-sm whitespace-nowrap">
                              {s.enrollmentDate ? new Date(s.enrollmentDate).toLocaleDateString() : s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-5 py-4">
                              {s.enrollments?.length > 0 ? (
                                <div className="space-y-1">
                                  {s.enrollments.slice(0,2).map(en => (
                                    <span key={en._id} className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border mr-1 ${enrollmentBadge(en.status)}`}>
                                      {en.category?.name || '—'}
                                    </span>
                                  ))}
                                  {s.enrollments.length > 2 && <span className="text-xs text-gray-500">+{s.enrollments.length-2} more</span>}
                                </div>
                              ) : (
                                <span className="text-gray-600 text-xs">Not enrolled</span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-700 rounded-full h-1.5">
                                  <div className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                                    style={{ width: `${s.totalEnrollments > 0 ? Math.round((s.activeEnrollments/s.totalEnrollments)*100) : 0}%` }}/>
                                </div>
                                <span className="text-xs text-gray-400">{s.totalEnrollments || 0} course{s.totalEnrollments!==1?'s':''}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${isActive ? 'bg-emerald-900/40 text-emerald-300' : 'bg-red-900/40 text-red-300'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-red-400'}`}/>
                                {isActive ? 'Active' : 'Suspended'}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* ── Submissions Section (real data) ── */}
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
              className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden shadow-lg">
              <div className="px-6 py-5 border-b border-gray-700/50 flex items-center justify-between bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                <div>
                  <h2 className="text-xl font-semibold text-cyan-300">📤 Recent Submissions</h2>
                  <p className="text-gray-400 text-sm mt-0.5">Latest AI-graded task submissions from students</p>
                </div>
                <button onClick={() => navigate('/admin/submissions')}
                  className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-500/10">
                  View All <FiArrowUpRight size={14}/>
                </button>
              </div>

              {loadingSubmissions ? (
                <div className="p-10 text-center">
                  <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
                  <p className="text-gray-400">Loading submissions…</p>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-gray-400 font-medium">No submissions yet</p>
                  <p className="text-gray-500 text-sm mt-1">Student task submissions will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700/50 bg-gray-900/40">
                        {['Student','Task','Course','AI Score','Status','Source'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/30">
                      {filteredSubmissions.map((sub, i) => {
                        const statusMap = {
                          submitted:     'bg-yellow-900/40 text-yellow-300',
                          'graded-passed':'bg-green-900/40 text-green-300',
                          approved:      'bg-green-900/40 text-green-300',
                          'graded-failed':'bg-red-900/40 text-red-300',
                          rejected:      'bg-red-900/40 text-red-300',
                        };
                        return (
                          <motion.tr key={sub._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.04 }}
                            className="hover:bg-gray-700/20 transition-colors">
                            <td className="px-5 py-4 text-cyan-300 font-medium">
                              {sub.student?.firstName} {sub.student?.lastName}
                            </td>
                            <td className="px-5 py-4 text-gray-300 max-w-[160px] truncate">{sub.task?.title || '—'}</td>
                            <td className="px-5 py-4 text-gray-400 text-xs">{sub.category?.name || '—'}</td>
                            <td className="px-5 py-4">
                              {sub.aiResult?.score != null
                                ? <span className="font-bold text-cyan-400">{sub.aiResult.score}<span className="text-gray-500 font-normal text-xs">/100</span></span>
                                : <span className="text-gray-600">—</span>}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusMap[sub.status] || 'bg-gray-700 text-gray-300'}`}>
                                {sub.status}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`text-xs px-2 py-0.5 rounded ${sub.source==='ai-task' ? 'bg-purple-900/40 text-purple-300' : 'bg-gray-700 text-gray-400'}`}>
                                {sub.source==='ai-task' ? '🤖 AI' : '📋 Classic'}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;