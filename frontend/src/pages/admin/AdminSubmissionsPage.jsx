import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import GradingModal from '../../components/admin/GradingModal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiExternalLink, FiEye, FiZap } from 'react-icons/fi';

/* ── Status helpers ──────────────────────────────── */
const STATUS_CFG = {
  submitted:     { label: 'Submitted',  bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  grading:       { label: 'Grading',    bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500'   },
  'graded-passed':{ label: 'Passed',    bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500'  },
  approved:      { label: 'Approved',   bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500'  },
  'graded-failed':{ label: 'Failed',    bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500'    },
  rejected:      { label: 'Needs Work', bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500'    },
};
const getStatus = (s) => STATUS_CFG[s] || { label: s, bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' };

/* ── Detail Modal ────────────────────────────────── */
function DetailModal({ submission, onClose }) {
  if (!submission) return null;
  const st = getStatus(submission.status);
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9 }}
        onClick={e=>e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
          style={{ background:'linear-gradient(90deg,#0A3D62,#1a6ba0)' }}>
          <div>
            <h3 className="font-bold text-white">Submission Details</h3>
            <p className="text-blue-200 text-sm mt-0.5">{submission.task?.title}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Student */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm">
              {submission.student?.firstName?.[0]}{submission.student?.lastName?.[0]}
            </div>
            <div>
              <p className="font-bold text-gray-900">{submission.student?.firstName} {submission.student?.lastName}</p>
              <p className="text-sm text-gray-500">{submission.student?.email}</p>
            </div>
            <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Category', submission.category?.name || '—'],
              ['Submitted', new Date(submission.submittedAt).toLocaleString()],
              ['Source', submission.source === 'ai-task' ? '🤖 AI Task' : '📋 Classic Task'],
            ].map(([l,v])=>(
              <div key={l} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400 font-medium">{l}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{v}</p>
              </div>
            ))}
          </div>

          {/* AI Evaluation */}
          {submission.aiResult && (
            <div className={`rounded-xl p-4 border ${submission.aiResult.status==='PASS'?'bg-green-50 border-green-200':'bg-red-50 border-red-200'}`}>
              <p className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5"><FiZap size={14}/>AI Evaluation Result</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  ['Score', `${submission.aiResult.score}/100`],
                  ['Plagiarism', `${submission.aiResult.plagiarism ?? '—'}%`],
                  ['Result', submission.aiResult.status || '—'],
                ].map(([l,v])=>(
                  <div key={l} className="text-center bg-white rounded-lg p-2 border border-gray-100">
                    <p className="text-xs font-bold text-gray-800">{v}</p>
                    <p className="text-xs text-gray-400">{l}</p>
                  </div>
                ))}
              </div>
              {submission.aiResult.feedback && <p className="text-sm text-gray-700 leading-relaxed">{submission.aiResult.feedback}</p>}
            </div>
          )}

          {/* Submission content */}
          {submission.message && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 font-medium mb-1">Student Message</p>
              <p className="text-sm text-gray-700">{submission.message}</p>
            </div>
          )}
          {submission.contentUrl && (
            <a href={submission.contentUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary font-semibold hover:text-secondary transition-colors">
              <FiExternalLink size={14}/> View Submitted Work
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══ Main Page ════════════════════════════════════════ */
export const AdminSubmissionsPage = () => {
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [submissions,  setSubmissions]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [status,       setStatus]       = useState('');
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);
  const [pagination,   setPagination]   = useState({});
  const [detailSub,    setDetailSub]    = useState(null);
  const [gradingOpen,  setGradingOpen]  = useState(false);
  const [gradeSub,     setGradeSub]     = useState(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/submissions', { params: { status, page, limit: 20 } });
      const data = res.data || {};
      setSubmissions(data.data || []);
      setPagination(data.pagination || {});
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const FILTERS = [
    { value: '',              label: 'All' },
    { value: 'submitted',     label: 'Submitted' },
    { value: 'graded-passed', label: 'Passed' },
    { value: 'graded-failed', label: 'Failed/Rejected' },
  ];

  const filtered = search.trim()
    ? submissions.filter(s =>
        `${s.student?.firstName} ${s.student?.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        s.task?.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.student?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : submissions;

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}/>

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)}/>

        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">

            {/* Header */}
            <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">📤 Student Submissions</h1>
              <p className="text-gray-500 mt-1">AI-evaluated task submissions from all enrolled students.</p>
            </motion.div>

            {/* Stat pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label:'Total',    value: pagination.total || submissions.length,                                                              color:'bg-blue-50 text-blue-800 border-blue-200' },
                { label:'Submitted',value: submissions.filter(s=>s.status==='submitted').length,                                                color:'bg-yellow-50 text-yellow-800 border-yellow-200' },
                { label:'Passed',   value: submissions.filter(s=>['graded-passed','approved'].includes(s.status)).length,                      color:'bg-green-50 text-green-800 border-green-200' },
                { label:'AI Tasks', value: submissions.filter(s=>s.source==='ai-task').length,                                                  color:'bg-purple-50 text-purple-800 border-purple-200' },
              ].map(p=>(
                <div key={p.label} className={`rounded-xl p-4 border ${p.color}`}>
                  <p className="text-2xl font-extrabold">{p.value}</p>
                  <p className="text-xs font-semibold mt-0.5">{p.label}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by student name, email, or task…"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"/>
                <div className="flex gap-2 flex-wrap">
                  {FILTERS.map(f=>(
                    <button key={f.value} onClick={()=>{setStatus(f.value);setPage(1);}}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${status===f.value?'bg-primary text-white border-primary':'border-gray-200 text-gray-600 hover:border-primary'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Table */}
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
                  <p className="text-gray-400">Loading submissions…</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-gray-500 font-medium">No submissions found</p>
                  <p className="text-gray-400 text-sm mt-1">Students haven't submitted any tasks yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        {['Student','Task / Category','Submitted','AI Score','Status','Source','Actions'].map(h=>(
                          <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map((sub, i) => {
                        const st = getStatus(sub.status);
                        return (
                          <motion.tr key={sub._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                            className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                                  {sub.student?.firstName?.[0]}{sub.student?.lastName?.[0]}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{sub.student?.firstName} {sub.student?.lastName}</p>
                                  <p className="text-xs text-gray-400">{sub.student?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-medium text-gray-800 truncate max-w-[180px]">{sub.task?.title || '—'}</p>
                              {sub.category?.name && <p className="text-xs text-gray-400 mt-0.5">{sub.category.icon} {sub.category.name}</p>}
                            </td>
                            <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '—'}</td>
                            <td className="px-5 py-4">
                              {sub.aiResult?.score != null
                                ? <span className="font-bold text-primary">{sub.aiResult.score}<span className="text-gray-400 font-normal text-xs">/100</span></span>
                                : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}/>
                                {st.label}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`text-xs font-medium px-2 py-1 rounded-lg ${sub.source==='ai-task'?'bg-purple-50 text-purple-700':'bg-gray-50 text-gray-600'}`}>
                                {sub.source==='ai-task'?'🤖 AI':'📋 Classic'}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <button onClick={()=>setDetailSub(sub)}
                                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                  <FiEye size={12}/> View
                                </button>
                                {sub.contentUrl && (
                                  <a href={sub.contentUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                                    <FiExternalLink size={12}/> Link
                                  </a>
                                )}
                                {sub.source !== 'ai-task' && (
                                  <button onClick={()=>{setGradeSub(sub);setGradingOpen(true);}}
                                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                                    Grade
                                  </button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2">
                {Array.from({ length: pagination.pages }, (_, i) => i+1).map(pn => (
                  <button key={pn} onClick={()=>setPage(pn)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${page===pn?'bg-primary text-white':'border border-gray-200 text-gray-600 hover:border-primary'}`}>
                    {pn}
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {detailSub && <DetailModal submission={detailSub} onClose={()=>setDetailSub(null)}/>}
      </AnimatePresence>

      {/* Grade modal (classic tasks only) */}
      <GradingModal
        isOpen={gradingOpen}
        onClose={()=>{setGradingOpen(false);setGradeSub(null);}}
        submission={gradeSub}
        onGraded={fetchSubmissions}
      />
    </div>
  );
};

export default AdminSubmissionsPage;
