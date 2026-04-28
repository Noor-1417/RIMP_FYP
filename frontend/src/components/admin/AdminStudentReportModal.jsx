import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  locked:       { label: 'Locked',       color: 'bg-gray-700 text-gray-300',       dot: 'bg-gray-400' },
  unlocked:     { label: 'Ready',        color: 'bg-emerald-900/50 text-emerald-300', dot: 'bg-emerald-400' },
  'in-progress':{ label: 'In Progress',  color: 'bg-blue-900/50 text-blue-300',      dot: 'bg-blue-400' },
  submitted:    { label: 'Submitted',    color: 'bg-yellow-900/50 text-yellow-300',   dot: 'bg-yellow-400' },
  approved:     { label: 'Approved',     color: 'bg-green-900/50 text-green-300',     dot: 'bg-green-400' },
  rejected:     { label: 'Needs Work',   color: 'bg-red-900/50 text-red-300',         dot: 'bg-red-400' },
  completed:    { label: 'Completed',    color: 'bg-green-900/50 text-green-300',     dot: 'bg-green-400' },
};

const enrollmentStatusColor = {
  active:    'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
  completed: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
  cancelled: 'bg-red-900/40 text-red-300 border-red-700/40',
  pending:   'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
};

export default function AdminStudentReportModal({ studentId, studentName, isOpen, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedEnrollment, setExpandedEnrollment] = useState(null);

  useEffect(() => {
    if (isOpen && studentId) {
      fetchReport();
    } else {
      setReport(null);
      setExpandedEnrollment(null);
    }
  }, [isOpen, studentId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/students/${studentId}/report`);
      if (res.data?.success) {
        setReport(res.data.data);
        // Auto-expand first enrollment if there's only one
        if (res.data.data.enrollments?.length === 1) {
          setExpandedEnrollment(res.data.data.enrollments[0]._id);
        }
      }
    } catch (err) {
      toast.error('Failed to load student report');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl z-50 flex flex-col bg-gray-900 border-l border-gray-700/60 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-sm flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  📋 Student Report
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">{studentName}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center">
                    <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent mb-3" />
                    <p className="text-gray-400 text-sm">Loading report...</p>
                  </div>
                </div>
              ) : !report ? (
                <div className="text-center py-16 text-gray-500">No data available</div>
              ) : (
                <>
                  {/* Student Info */}
                  <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Student Info</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-500">Name</div>
                        <div className="text-white font-semibold">
                          {report.student.firstName} {report.student.lastName}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Email</div>
                        <div className="text-gray-300 text-sm">{report.student.email}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Account Status</div>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${report.student.isActive ? 'bg-emerald-900/40 text-emerald-300' : 'bg-red-900/40 text-red-300'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${report.student.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          {report.student.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Enrolled Since</div>
                        <div className="text-gray-300 text-sm">
                          {report.student.enrollmentDate
                            ? new Date(report.student.enrollmentDate).toLocaleDateString()
                            : '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Courses', value: report.summary.totalEnrollments, icon: '🎓', color: 'text-cyan-400' },
                      { label: 'Total Tasks', value: report.summary.totalTasks, icon: '📋', color: 'text-blue-400' },
                      { label: 'Approved', value: report.summary.totalApproved, icon: '✅', color: 'text-emerald-400' },
                    ].map((s) => (
                      <div key={s.label} className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50 text-center">
                        <div className="text-2xl mb-1">{s.icon}</div>
                        <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-gray-400">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Enrollments */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Enrolled Courses ({report.enrollments.length})
                    </h3>

                    {report.enrollments.length === 0 ? (
                      <div className="bg-gray-800/40 rounded-xl p-8 text-center border border-gray-700/40">
                        <div className="text-4xl mb-2">📭</div>
                        <p className="text-gray-400">No enrollments yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {report.enrollments.map((enrollment) => {
                          const isExpanded = expandedEnrollment === enrollment._id;
                          const eColor = enrollmentStatusColor[enrollment.status] || enrollmentStatusColor.pending;
                          return (
                            <div
                              key={enrollment._id}
                              className="bg-gray-800/60 rounded-xl border border-gray-700/50 overflow-hidden"
                            >
                              {/* Enrollment Header */}
                              <button
                                className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-700/30 transition-colors"
                                onClick={() => setExpandedEnrollment(isExpanded ? null : enrollment._id)}
                              >
                                <span className="text-2xl flex-shrink-0">
                                  {enrollment.category?.icon || '📚'}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-white">
                                      {enrollment.category?.name || 'Unknown Course'}
                                    </h4>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${eColor}`}>
                                      {enrollment.status || 'pending'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {enrollment.selectedDuration} weeks •{' '}
                                    Started {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : '—'}
                                  </p>
                                </div>

                                {/* Progress */}
                                <div className="flex-shrink-0 text-right mr-2">
                                  <div className="text-sm font-bold text-cyan-400">
                                    {enrollment.taskSummary.approved}/{enrollment.taskSummary.total}
                                  </div>
                                  <div className="text-xs text-gray-500">tasks done</div>
                                </div>

                                <svg
                                  className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>

                              {/* Progress Bar */}
                              <div className="px-4 pb-3">
                                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-700"
                                    style={{ width: `${enrollment.taskSummary.progressPct}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                  <span>{enrollment.taskSummary.progressPct}% complete</span>
                                  <span className="flex gap-3">
                                    {enrollment.taskSummary.submitted > 0 && (
                                      <span className="text-yellow-400">{enrollment.taskSummary.submitted} submitted</span>
                                    )}
                                    {enrollment.taskSummary.rejected > 0 && (
                                      <span className="text-red-400">{enrollment.taskSummary.rejected} needs work</span>
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Task List (expanded) */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="overflow-hidden border-t border-gray-700/50"
                                  >
                                    <div className="p-4">
                                      {enrollment.tasks.length === 0 ? (
                                        <p className="text-gray-500 text-sm text-center py-4">
                                          🤖 No AI tasks generated yet
                                        </p>
                                      ) : (
                                        <div className="space-y-2">
                                          <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium px-2 mb-2">
                                            <div className="col-span-1">#</div>
                                            <div className="col-span-5">Task</div>
                                            <div className="col-span-3">Status</div>
                                            <div className="col-span-3 text-right">Score</div>
                                          </div>
                                          {enrollment.tasks.map((task, idx) => {
                                            const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.locked;
                                            return (
                                              <div
                                                key={task._id}
                                                className="grid grid-cols-12 gap-2 items-center bg-gray-900/40 rounded-lg px-3 py-2.5"
                                              >
                                                <div className="col-span-1 text-xs text-gray-500 font-medium">
                                                  W{task.weekNumber}
                                                </div>
                                                <div className="col-span-5">
                                                  <div className="text-sm text-gray-200 font-medium line-clamp-1">
                                                    {task.title}
                                                  </div>
                                                  {task.deadline && (
                                                    <div className="text-xs text-gray-500">
                                                      Due: {new Date(task.deadline).toLocaleDateString()}
                                                    </div>
                                                  )}
                                                </div>
                                                <div className="col-span-3">
                                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                    {cfg.label}
                                                  </span>
                                                </div>
                                                <div className="col-span-3 text-right">
                                                  {task.score !== null ? (
                                                    <div>
                                                      <span className={`text-sm font-bold ${task.evaluationStatus === 'PASS' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {task.score}
                                                      </span>
                                                      <span className="text-xs text-gray-500">/100</span>
                                                      <div className={`text-xs ${task.evaluationStatus === 'PASS' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        {task.evaluationStatus}
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <span className="text-gray-600 text-xs">—</span>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-700/50 bg-gray-900/80">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors font-medium text-sm"
              >
                Close Report
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
