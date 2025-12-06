import React from 'react';
import { motion } from 'framer-motion';
import { FiExternalLink } from 'react-icons/fi';

const statusColors = {
  submitted: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50',
  'grading': 'bg-blue-500/20 text-blue-400 border border-blue-500/50',
  'graded-passed': 'bg-green-500/20 text-green-400 border border-green-500/50',
  'graded-failed': 'bg-red-500/20 text-red-400 border border-red-500/50',
};

export const SubmissionsTable = ({ submissions, loading, onGrade }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-gray-400">Loading submissions...</p>
      </div>
    );
  }

  if (!submissions || submissions.length === 0) {
    return <div className="p-6 text-center text-gray-500">No submissions found.</div>;
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="bg-transparent rounded-lg overflow-hidden">
      {/* Desktop/tablet view */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700/50 border-b border-gray-600">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-200">Student</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-200">Task</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-200">Submitted</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-200">AI Score</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-200">Status</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => (
              <motion.tr key={sub._id} variants={item} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
                <td className="px-6 py-4 text-sm font-semibold text-white">{sub.student?.firstName} {sub.student?.lastName}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{sub.task?.title}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm font-semibold text-primary">{sub.aiResult?.score ? `${Math.round(sub.aiResult.score)}%` : '—'}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[sub.status] || 'bg-gray-700/50 text-gray-300'}`}>{sub.status}</span>
                </td>
                <td className="px-6 py-4 text-sm flex items-center gap-3">
                  {sub.contentUrl ? (
                    <a href={sub.contentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:text-secondary font-semibold transition-colors">View <FiExternalLink size={16} /></a>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                  <button onClick={() => onGrade && onGrade(sub)} className="ml-2 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1 rounded-md">Grade</button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/card view */}
      <div className="sm:hidden space-y-3">
        {submissions.map((sub) => (
          <motion.div key={sub._id} variants={item} className="bg-gray-800/40 border border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-300 font-semibold">{sub.student?.firstName} {sub.student?.lastName}</div>
                <div className="text-xs text-gray-400">{sub.student?.email}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-primary">{sub.aiResult?.score ? `${Math.round(sub.aiResult.score)}%` : '—'}</div>
                <div className={`text-xs mt-1 inline-block px-2 py-1 rounded-full ${statusColors[sub.status] || 'bg-gray-700/50 text-gray-300'}`}>{sub.status}</div>
              </div>
            </div>

            <div className="mt-3 text-sm text-gray-300">{sub.task?.title}</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-xs text-gray-400">{new Date(sub.submittedAt).toLocaleString()}</div>
              <div className="flex items-center gap-2">
                {sub.contentUrl ? (
                  <a href={sub.contentUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-sm">View</a>
                ) : (
                  <span className="text-gray-500 text-sm">—</span>
                )}
                <button onClick={() => onGrade && onGrade(sub)} className="ml-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1 rounded-md">Grade</button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default SubmissionsTable;
