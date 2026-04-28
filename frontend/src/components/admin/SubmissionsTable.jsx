import React from 'react';
import { motion } from 'framer-motion';
import { FiExternalLink } from 'react-icons/fi';

const STATUS_CFG = {
  submitted:     { label: 'Submitted',  bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
  grading:       { label: 'Grading',    bg: 'bg-blue-50',   text: 'text-blue-800',   border: 'border-blue-200'   },
  'graded-passed':{ label: 'Passed',   bg: 'bg-green-50',  text: 'text-green-800',  border: 'border-green-200'  },
  approved:      { label: 'Approved',   bg: 'bg-green-50',  text: 'text-green-800',  border: 'border-green-200'  },
  'graded-failed':{ label: 'Failed',   bg: 'bg-red-50',    text: 'text-red-800',    border: 'border-red-200'    },
  rejected:      { label: 'Needs Work', bg: 'bg-red-50',    text: 'text-red-800',    border: 'border-red-200'    },
};
const getStatus = (s) => STATUS_CFG[s] || { label: s, bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

// dark prop: true when used inside the dark AdminDashboard
export const SubmissionsTable = ({ submissions, loading, onGrade, dark = false }) => {
  const th  = dark ? 'text-gray-300 bg-gray-700/50 border-gray-600' : 'text-gray-500 bg-gray-50 border-gray-100';
  const tr  = dark ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-50 hover:bg-gray-50';
  const td1 = dark ? 'text-white' : 'text-gray-900';
  const td2 = dark ? 'text-gray-400' : 'text-gray-500';

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"/>
        <p className={`mt-3 font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Loading submissions…</p>
      </div>
    );
  }
  if (!submissions || submissions.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="text-4xl mb-2">📭</div>
        <p className={`font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>No submissions found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className={`border-b ${th}`}>
            {['Student', 'Task', 'Submitted', 'AI Score', 'Status', 'Actions'].map(h => (
              <th key={h} className={`px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide ${dark ? 'text-gray-300' : 'text-gray-500'}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {submissions.map((sub, i) => {
            const st = getStatus(sub.status);
            return (
              <motion.tr key={sub._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i*0.03 }}
                className={`border-b transition-colors ${tr}`}>
                <td className={`px-5 py-4 font-semibold ${td1}`}>
                  {sub.student?.firstName} {sub.student?.lastName}
                </td>
                <td className={`px-5 py-4 ${td2} max-w-[180px] truncate`}>{sub.task?.title || '—'}</td>
                <td className={`px-5 py-4 ${td2} whitespace-nowrap`}>
                  {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '—'}
                </td>
                <td className={`px-5 py-4 font-bold ${dark ? 'text-blue-300' : 'text-primary'}`}>
                  {sub.aiResult?.score != null ? `${Math.round(sub.aiResult.score)}%` : '—'}
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
                    {st.label}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {sub.contentUrl ? (
                      <a href={sub.contentUrl} target="_blank" rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 text-xs font-semibold transition-colors ${dark ? 'text-blue-400 hover:text-blue-300' : 'text-primary hover:text-secondary'}`}>
                        View <FiExternalLink size={12}/>
                      </a>
                    ) : <span className={td2}>—</span>}
                    {onGrade && (
                      <button onClick={() => onGrade(sub)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors ml-1">
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
  );
};

export default SubmissionsTable;
