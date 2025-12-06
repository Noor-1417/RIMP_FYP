import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Button, Input, TextArea } from '../common/FormElements';

const GradingModal = ({ isOpen, onClose, submission, onGraded }) => {
  const [status, setStatus] = useState('graded-passed');
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (submission) {
      setStatus(submission.status || 'grading');
      setScore(submission.aiResult?.score ? String(Math.round(submission.aiResult.score)) : '');
      setNotes(submission.aiResult?.feedback || '');
    } else {
      setStatus('grading');
      setScore('');
      setNotes('');
    }
  }, [submission]);

  const handleSave = async () => {
    if (!submission?._id) return;
    if (score && (isNaN(Number(score)) || Number(score) < 0 || Number(score) > 100)) {
      toast.error('Score must be a number between 0 and 100');
      return;
    }

    setLoading(true);
    try {
      const payload = { status, score: score !== '' ? Number(score) : undefined, notes };
      const res = await api.post(`/admin/submissions/${submission._id}/grade`, payload);
      toast.success(res.data?.message || 'Submission graded');
      if (onGraded) onGraded();
      onClose();
    } catch (err) {
      console.error('Grade error', err);
      toast.error(err?.response?.data?.message || 'Failed to grade submission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg max-w-2xl w-full shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Grade Submission</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="text-sm text-gray-600">Student</div>
                <div className="font-medium">{submission?.student?.firstName} {submission?.student?.lastName} ({submission?.student?.email})</div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Task</div>
                <div className="font-medium">{submission?.task?.title}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Score (0-100)" value={score} onChange={(e) => setScore(e.target.value)} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                    <option value="grading">Grading</option>
                    <option value="graded-passed">Passed</option>
                    <option value="graded-failed">Failed</option>
                  </select>
                </div>
              </div>

              <TextArea label="Notes / Feedback" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} isLoading={loading}>Save Grade</Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GradingModal;
