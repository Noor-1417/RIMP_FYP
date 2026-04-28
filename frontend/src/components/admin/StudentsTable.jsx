import React from 'react';
import { motion } from 'framer-motion';
import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const StudentsTable = ({ students, loading, onRefresh }) => {
  const navigate = useNavigate();

  const getProgressPercentage = (student) => {
    if (!student.enrollments || student.enrollments.length === 0) return 0;
    const completedCount = student.enrollments.filter(e => e.status === 'completed').length;
    return Math.round((completedCount / student.enrollments.length) * 100);
  };

  const getStatusBadge = (student) => {
    if (!student.enrollments || student.enrollments.length === 0)
      return { label: 'Not Started', color: 'bg-red-50 text-red-700 border border-red-200' };
    const active    = student.enrollments.filter(e => e.status === 'active').length;
    const completed = student.enrollments.filter(e => e.status === 'completed').length;
    const total     = student.enrollments.length;
    if (completed === total) return { label: '✅ Completed',   color: 'bg-blue-50  text-blue-800  border border-blue-200'   };
    if (active > 0)          return { label: '⏳ In Progress', color: 'bg-yellow-50 text-yellow-800 border border-yellow-200' };
    return                          { label: '🟢 Active',      color: 'bg-green-50  text-green-800  border border-green-200'  };
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"/>
        <p className="mt-3 text-gray-500 font-medium">Loading students…</p>
      </div>
    );
  }
  if (!students || students.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="text-4xl mb-2">👥</div>
        <p className="text-gray-500 font-medium">No students found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {['Student', 'Email', 'Category', 'Progress', 'Status', 'Actions'].map(h => (
              <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {students.map((student, i) => {
            const progress    = getProgressPercentage(student);
            const statusBadge = getStatusBadge(student);
            const category    = student.enrollments?.[0]?.category?.name || '—';
            return (
              <motion.tr key={student._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                      {student.firstName?.[0]}{student.lastName?.[0]}
                    </div>
                    <span className="font-semibold text-gray-900">{student.firstName} {student.lastName}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-500">{student.email}</td>
                <td className="px-5 py-4">
                  <span className="inline-block bg-blue-50 text-primary px-2.5 py-1 rounded-full text-xs font-semibold border border-blue-100">
                    {category}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2 flex-shrink-0">
                      <div className="h-2 rounded-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width:`${progress}%` }}/>
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-8">{progress}%</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadge.color}`}>{statusBadge.label}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => navigate(`/admin/students/${student._id}`)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Profile">
                      <FiEye size={16}/>
                    </button>
                    <button onClick={() => navigate(`/admin/tasks?student=${student._id}`)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="View Tasks">
                      <FiEdit2 size={16}/>
                    </button>
                    <button onClick={() => { if(window.confirm('Remove this student?')) { toast.success('Student removed'); onRefresh?.(); } }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remove">
                      <FiTrash2 size={16}/>
                    </button>
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

export default StudentsTable;
