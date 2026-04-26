import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ProgressBar } from './ProgressBar';
import { TaskCard } from './TaskCard';
import { TaskSubmissionModal } from './TaskSubmissionModal';

/**
 * AIProjectDashboard Component
 * Displays AI-generated internship project with tasks and progress tracking
 */
export const AIProjectDashboard = ({ enrollmentId, categoryName }) => {
  const [project, setProject] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const token = localStorage.getItem('token');

  // Fetch project data on component mount
  useEffect(() => {
    fetchProject();
  }, [enrollmentId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/projects/${enrollmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setProject(response.data.project);
        await fetchProgress();
      } else {
        setError('Failed to load project');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Project not found. Please generate one.');
      } else {
        setError('Error loading project: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await axios.get(`/projects/${enrollmentId}/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setProgress(response.data);
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
    }
  };

  const handleTaskSelect = (task) => {
    setSelectedTask(task);
    setShowSubmitModal(true);
  };

  const handleTaskSubmitted = async () => {
    await fetchProject();
    await fetchProgress();
    setShowSubmitModal(false);
    setSelectedTask(null);
  };

  const handleRegenerate = async () => {
    if (!window.confirm('Are you sure you want to regenerate this project? Your progress will be reset.')) {
      return;
    }

    try {
      setRegenerating(true);
      const response = await axios.post(
        `/projects/${enrollmentId}/regenerate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setProject(response.data.project);
        await fetchProgress();
      }
    } catch (err) {
      setError('Error regenerating project: ' + err.message);
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const isCompleted = progress?.progress === 100;

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
            <p className="text-gray-600 mt-2">{project.description}</p>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {regenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>

        {/* Project Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-semibold capitalize">{project.status}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Start Date</p>
            <p className="font-semibold">
              {new Date(project.startDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Tasks</p>
            <p className="font-semibold">{project.totalTasks}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Completed</p>
            <p className="font-semibold">{project.completedTasks}/{project.totalTasks}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Overall Progress</h2>
        <ProgressBar progress={project.progress} />
        <div className="mt-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{project.progress}%</p>
          {isCompleted && (
            <p className="text-green-600 font-semibold mt-2">🎉 Congratulations! Project completed!</p>
          )}
        </div>
      </div>

      {/* Project Details */}
      {project.objectives && project.objectives.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Objectives</h2>
          <ul className="space-y-2">
            {project.objectives.map((objective, idx) => (
              <li key={idx} className="flex items-start">
                <span className="mr-3 text-green-500">✓</span>
                <span>{objective}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Task Statistics */}
      {progress && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-blue-600">{progress.taskStats.total}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">{progress.taskStats.completed}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-2xl font-bold text-yellow-600">{progress.taskStats.inProgress}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-purple-600">{progress.taskStats.pending}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{progress.taskStats.rejected}</p>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Tasks</h2>
        <div className="space-y-3">
          {progress?.tasks.map((task, idx) => (
            <TaskCard
              key={task._id || idx}
              task={task}
              onSubmit={() => handleTaskSelect(task)}
            />
          ))}
        </div>
      </div>

      {/* Task Submission Modal */}
      {showSubmitModal && selectedTask && (
        <TaskSubmissionModal
          task={selectedTask}
          enrollmentId={enrollmentId}
          onClose={() => setShowSubmitModal(false)}
          onSubmitted={handleTaskSubmitted}
        />
      )}

      {/* Certificate Section */}
      {isCompleted && progress?.certificateGenerated && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">Certificate</h2>
          <p className="text-yellow-700">
            Your certificate has been generated! You can download it from your certificates page.
          </p>
        </div>
      )}
    </div>
  );
};

export default AIProjectDashboard;
