import React from 'react';

/**
 * TaskCard Component
 * Displays individual task with status and submission details
 */
export const TaskCard = ({ task, onSubmit }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'submitted':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in-progress':
        return '⟳';
      case 'submitted':
        return '📤';
      case 'rejected':
        return '✗';
      case 'pending':
      default:
        return '○';
    }
  };

  const isDeadlinePassed = new Date(task.deadline) < new Date();
  const daysUntilDeadline = Math.ceil(
    (new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-start justify-between gap-4">
        {/* Left section: Task info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${getStatusColor(task.status)}`}>
              {getStatusIcon(task.status)}
            </span>
            <h3 className="font-semibold text-lg text-gray-900">{task.title}</h3>
          </div>

          {task.description && (
            <p className="text-gray-600 text-sm mb-3">{task.description}</p>
          )}

          {/* Task metadata */}
          <div className="flex flex-wrap gap-3 text-sm">
            <span className={`px-2 py-1 rounded border ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
            <span
              className={`px-2 py-1 rounded ${
                isDeadlinePassed
                  ? 'bg-red-50 text-red-600'
                  : daysUntilDeadline <= 3
                  ? 'bg-yellow-50 text-yellow-600'
                  : 'bg-gray-50 text-gray-600'
              }`}
            >
              Deadline: {new Date(task.deadline).toLocaleDateString()}
              {daysUntilDeadline > 0 && ` (${daysUntilDeadline} days)`}
            </span>
          </div>

          {/* Evaluation results if available */}
          {task.evaluation && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Score: {task.evaluation.score}/100
              </p>
              <p className="text-sm text-gray-700">{task.evaluation.feedback}</p>
              {task.evaluation.plagiarismScore !== undefined && (
                <p className="text-xs text-gray-600 mt-1">
                  Plagiarism Score: {task.evaluation.plagiarismScore}%
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right section: Action button */}
        <div className="flex flex-col gap-2">
          {task.status === 'pending' || task.status === 'rejected' ? (
            <button
              onClick={onSubmit}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm whitespace-nowrap"
            >
              {task.status === 'rejected' ? 'Resubmit' : 'Submit'}
            </button>
          ) : task.status === 'submitted' ? (
            <span className="text-xs text-gray-500 text-center">⏳ Evaluating...</span>
          ) : task.status === 'completed' ? (
            <span className="text-xs text-green-600 font-semibold text-center">✓ Completed</span>
          ) : (
            <button
              onClick={onSubmit}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm whitespace-nowrap"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
