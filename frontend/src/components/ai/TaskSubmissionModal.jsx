import React, { useState } from 'react';
import axios from 'axios';

/**
 * TaskSubmissionModal Component
 * Modal for submitting task work with AI evaluation
 */
export const TaskSubmissionModal = ({
  task,
  enrollmentId,
  onClose,
  onSubmitted,
}) => {
  const [submissionText, setSubmissionText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  const token = localStorage.getItem('token');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!submissionText.trim()) {
      setError('Please enter your submission');
      return;
    }

    if (submissionText.trim().length < 50) {
      setError('Submission must be at least 50 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await axios.post(
        `/projects/${enrollmentId}/submit-task`,
        {
          taskId: task._id,
          submissionText: submissionText.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setEvaluation(response.data.evaluation);
        setSuccess(true);
      }
    } catch (err) {
      setError('Error submitting task: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (success) {
      onSubmitted();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {success ? 'Submission Evaluated' : `Submit: ${task.title}`}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {success && evaluation ? (
            // Evaluation Results
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${evaluation.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className={`font-semibold text-lg ${evaluation.passed ? 'text-green-900' : 'text-red-900'}`}>
                  {evaluation.passed ? '✓ Submission Accepted' : '✗ Submission Rejected'}
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Score</p>
                  <p className="text-3xl font-bold text-blue-600">{evaluation.score}</p>
                  <p className="text-xs text-gray-500">out of 100</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Plagiarism</p>
                  <p className="text-3xl font-bold text-purple-600">{evaluation.plagiarismScore}%</p>
                  <p className="text-xs text-gray-500">Similarity</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {evaluation.passed ? 'PASS' : 'FAIL'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Feedback</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{evaluation.feedback}</p>
              </div>

              {!evaluation.passed && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Your submission was not accepted. Please review the feedback and resubmit your work.
                  </p>
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            // Submission Form
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Task Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-blue-800">{task.description}</p>
                )}
                <p className="text-xs text-blue-600 mt-2">
                  Deadline: {new Date(task.deadline).toLocaleDateString()}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Submission Textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Submission
                </label>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Enter your submission here... (minimum 50 characters)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="10"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {submissionText.length} characters
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-sm text-gray-600">
                <p className="font-semibold text-gray-900 mb-2">AI Evaluation Criteria:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Quality and completeness of the submission</li>
                  <li>Originality (plagiarism check)</li>
                  <li>Alignment with task requirements</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || submissionText.trim().length < 50}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="inline-block animate-spin">⟳</span>
                      Evaluating...
                    </>
                  ) : (
                    'Submit for Evaluation'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskSubmissionModal;
