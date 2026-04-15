import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const StudentsTable = ({ students, loading, onRefresh }) => {
  const navigate = useNavigate();

  const getProgressPercentage = (student) => {
    if (!student.enrollments || student.enrollments.length === 0) return 0;
    const activeCount = student.enrollments.filter(e => e.status === 'active').length;
    const completedCount = student.enrollments.filter(e => e.status === 'completed').length;
    const total = student.enrollments.length;
    const completed = completedCount;
    return Math.round((completed / total) * 100);
  };

  const getStatusBadge = (student) => {
    if (!student.enrollments || student.enrollments.length === 0) {
      return { label: '🔴 Not Started', color: 'bg-red-100 text-red-800' };
    }
    const activeCount = student.enrollments.filter(e => e.status === 'active').length;
    const completedCount = student.enrollments.filter(e => e.status === 'completed').length;
    const total = student.enrollments.length;

    if (completedCount === total) {
      return { label: '🔵 Completed', color: 'bg-blue-100 text-blue-800' };
    } else if (activeCount > 0) {
      return { label: '🟡 In Progress', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: '🟢 Active', color: 'bg-green-100 text-green-800' };
    }
  };

  const handleViewProfile = (studentId) => {
    navigate(`/admin/students/${studentId}`);
  };

  const handleViewTasks = (studentId) => {
    navigate(`/admin/tasks?student=${studentId}`);
  };

  const handleRemoveStudent = (studentId) => {
    if (window.confirm('Are you sure you want to remove this student?')) {
      toast.success('Student removed');
      // TODO: Implement backend removal API call
      onRefresh?.();
    }
  };

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
        <p className="mt-2 text-gray-400">Loading students...</p>
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500 text-lg">No students found.</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="bg-transparent rounded-lg overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700/50 border-b border-gray-600">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-200">Name</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-200">Email</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-200">Category</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-200">Progress</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-200">Status</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const progress = getProgressPercentage(student);
              const statusBadge = getStatusBadge(student);
              const category = student.enrollments?.[0]?.category?.name || 'N/A';

              return (
                <motion.tr
                  key={student._id}
                  variants={item}
                  className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-black">
                    {student.firstName} {student.lastName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{student.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-block bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/50">
                      {category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-300 w-8">{progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewProfile(student._id)}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                        title="View Profile"
                      >
                        <FiEye size={18} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewTasks(student._id)}
                        className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                        title="View Tasks"
                      >
                        <FiEdit2 size={18} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRemoveStudent(student._id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Remove Student"
                      >
                        <FiTrash2 size={18} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default StudentsTable;
