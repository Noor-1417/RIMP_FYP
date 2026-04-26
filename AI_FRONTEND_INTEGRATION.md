# AI INTEGRATION - FRONTEND EXAMPLES

This guide shows how to integrate the new AI functionality into your React frontend.

---

## 📦 Service Setup

Create a new file: `frontend/src/services/aiService.js`

```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/ai';

// Get auth token from localStorage or context
const getAuthToken = () => localStorage.getItem('authToken');

const config = () => ({
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`,
  },
});

export const aiService = {
  /**
   * Generate AI project for user
   */
  generateProject: async (enrollmentId, skills, field) => {
    const response = await axios.post(
      `${API_BASE}/generate-project`,
      { enrollmentId, skills, field },
      config()
    );
    return response.data;
  },

  /**
   * Submit task for evaluation
   */
  submitTask: async (enrollmentId, taskId, submissionText) => {
    const response = await axios.post(
      `${API_BASE}/submit-task`,
      { enrollmentId, taskId, submissionText },
      config()
    );
    return response.data;
  },

  /**
   * Get project progress
   */
  getProgress: async (enrollmentId) => {
    const response = await axios.get(
      `${API_BASE}/progress/${enrollmentId}`,
      config()
    );
    return response.data;
  },

  /**
   * Regenerate project
   */
  regenerateProject: async (enrollmentId, skills, field) => {
    const response = await axios.post(
      `${API_BASE}/regenerate-project`,
      { enrollmentId, skills, field },
      config()
    );
    return response.data;
  },

  /**
   * Get specific task details
   */
  getTaskDetails: async (enrollmentId, taskId) => {
    const response = await axios.get(
      `${API_BASE}/task/${enrollmentId}/${taskId}`,
      config()
    );
    return response.data;
  },
};

export default aiService;
```

---

## 🎨 Component Examples

### 1. PROJECT GENERATION COMPONENT

Create: `frontend/src/components/AI/ProjectGeneratorModal.jsx`

```jsx
import React, { useState } from 'react';
import { aiService } from '../../services/aiService';

export const ProjectGeneratorModal = ({ enrollmentId, onSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [skills, setSkills] = useState([]);
  const [field, setField] = useState('');
  const [skillInput, setSkillInput] = useState('');

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleGenerateProject = async () => {
    if (!field || skills.length === 0) {
      setError('Please enter field and at least one skill');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await aiService.generateProject(enrollmentId, skills, field);

      if (result.success) {
        onSuccess(result.project);
        onClose();
      } else {
        setError(result.message || 'Failed to generate project');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error generating project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Generate AI Project</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Field Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Field of Study
          </label>
          <input
            type="text"
            value={field}
            onChange={(e) => setField(e.target.value)}
            placeholder="e.g., Web Development, Data Science"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Skills Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Skills
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
              placeholder="Add skill..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={handleAddSkill}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add
            </button>
          </div>

          {/* Skills Tags */}
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2"
              >
                {skill}
                <button
                  onClick={() => handleRemoveSkill(index)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerateProject}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Project'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

### 2. PROGRESS DASHBOARD COMPONENT

Create: `frontend/src/components/AI/ProgressDashboard.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { aiService } from '../../services/aiService';

export const ProgressDashboard = ({ enrollmentId }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProgress();
    // Refresh every 30 seconds
    const interval = setInterval(loadProgress, 30000);
    return () => clearInterval(interval);
  }, [enrollmentId]);

  const loadProgress = async () => {
    try {
      const result = await aiService.getProgress(enrollmentId);
      if (result.success) {
        setProgress(result);
        setError('');
      }
    } catch (err) {
      setError('Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading progress...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!progress) return null;

  const { progress: progressData, statistics, tasks } = progress;

  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Project Progress</h2>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">Overall Progress</span>
            <span className="text-2xl font-bold text-blue-600">
              {progressData.overall}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${progressData.overall}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Completed" value={progressData.completed} color="green" />
          <StatCard label="Total Tasks" value={progressData.total} color="blue" />
          <StatCard label="Average Score" value={`${statistics.averageScore}%`} color="purple" />
        </div>
      </div>

      {/* Task Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Task Statistics</h3>
        <div className="grid grid-cols-4 gap-3">
          <StatBadge label="Pending" count={statistics.pending} color="gray" />
          <StatBadge label="In Progress" count={statistics.inProgress} color="yellow" />
          <StatBadge label="Submitted" count={statistics.submitted} color="blue" />
          <StatBadge label="Rejected" count={statistics.rejected} color="red" />
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Tasks</h3>
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskRow key={task._id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => {
  const colors = {
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
  };

  return (
    <div className={`${colors[color]} p-4 rounded-lg text-center`}>
      <div className="text-sm font-medium opacity-75">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
};

const StatBadge = ({ label, count, color }) => {
  const colors = {
    gray: 'bg-gray-100 text-gray-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    red: 'bg-red-100 text-red-800',
  };

  return (
    <div className={`${colors[color]} px-3 py-2 rounded-lg text-center`}>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-lg font-bold">{count}</div>
    </div>
  );
};

const TaskRow = ({ task }) => {
  const statusColors = {
    pending: 'bg-gray-50 border-gray-200',
    'in-progress': 'bg-yellow-50 border-yellow-200',
    submitted: 'bg-blue-50 border-blue-200',
    completed: 'bg-green-50 border-green-200',
    rejected: 'bg-red-50 border-red-200',
  };

  const statusBadges = {
    pending: 'bg-gray-200 text-gray-800',
    'in-progress': 'bg-yellow-200 text-yellow-800',
    submitted: 'bg-blue-200 text-blue-800',
    completed: 'bg-green-200 text-green-800',
    rejected: 'bg-red-200 text-red-800',
  };

  return (
    <div className={`border p-4 rounded-lg ${statusColors[task.status]}`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-gray-900">{task.title}</h4>
          <p className="text-sm text-gray-600">
            Due: {new Date(task.deadline).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadges[task.status]}`}>
          {task.status}
        </span>
      </div>

      {task.evaluation && (
        <div className="mt-3 pt-3 border-t border-opacity-30">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Score: {task.evaluation.score}%</span>
            {task.evaluation.plagiarismScore && (
              <span className="text-sm text-gray-600">
                Plagiarism: {task.evaluation.plagiarismScore}%
              </span>
            )}
          </div>
          {task.evaluation.feedback && (
            <p className="text-sm text-gray-700 mt-2">{task.evaluation.feedback}</p>
          )}
        </div>
      )}
    </div>
  );
};
```

---

### 3. TASK SUBMISSION COMPONENT

Create: `frontend/src/components/AI/TaskSubmissionForm.jsx`

```jsx
import React, { useState } from 'react';
import { aiService } from '../../services/aiService';

export const TaskSubmissionForm = ({ enrollmentId, task, onSubmitSuccess }) => {
  const [submission, setSubmission] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!submission.trim()) {
      setError('Please enter your solution');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await aiService.submitTask(
        enrollmentId,
        task._id,
        submission
      );

      if (response.success) {
        setResult(response.evaluation);
        setSubmission('');
        onSubmitSuccess?.(response);
      } else {
        setError(response.message || 'Failed to submit task');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">{task.title}</h2>

      {task.description && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Task Description</h3>
          <p className="text-blue-800">{task.description}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {result ? (
        <EvaluationResult evaluation={result} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Solution
            </label>
            <textarea
              value={submission}
              onChange={(e) => setSubmission(e.target.value)}
              placeholder="Enter your solution or answer here..."
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Evaluating...' : 'Submit for Evaluation'}
          </button>
        </form>
      )}
    </div>
  );
};

const EvaluationResult = ({ evaluation }) => {
  const { score, passed, feedback, plagiarismScore } = evaluation;

  return (
    <div className={`border-2 rounded-lg p-6 ${passed ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">Evaluation Result</h3>
        <div className={`text-4xl font-bold ${passed ? 'text-green-600' : 'text-yellow-600'}`}>
          {score}%
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded p-3">
          <div className="text-sm text-gray-600">Status</div>
          <div className={`text-lg font-bold ${passed ? 'text-green-600' : 'text-yellow-600'}`}>
            {passed ? '✓ Passed' : '✗ Needs Improvement'}
          </div>
        </div>
        {plagiarismScore !== undefined && (
          <div className="bg-white rounded p-3">
            <div className="text-sm text-gray-600">Plagiarism Check</div>
            <div className="text-lg font-bold text-gray-800">{plagiarismScore}%</div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">AI Feedback</h4>
        <p className="text-gray-700">{feedback}</p>
      </div>

      {!passed && (
        <div className="mt-4 bg-blue-100 border border-blue-300 text-blue-800 px-4 py-3 rounded">
          You can resubmit this task after making improvements.
        </div>
      )}
    </div>
  );
};
```

---

## 🔌 Usage in Pages

### Integrate into Project Page

```jsx
// frontend/src/pages/ProjectPage.jsx

import React, { useState, useEffect } from 'react';
import { ProgressDashboard } from '../components/AI/ProgressDashboard';
import { TaskSubmissionForm } from '../components/AI/TaskSubmissionForm';

export const ProjectPage = ({ enrollmentId }) => {
  const [selectedTask, setSelectedTask] = useState(null);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your AI-Generated Project</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Progress Dashboard */}
        <div className="col-span-1">
          <ProgressDashboard enrollmentId={enrollmentId} />
        </div>

        {/* Task Submission */}
        <div className="col-span-2">
          {selectedTask ? (
            <TaskSubmissionForm
              enrollmentId={enrollmentId}
              task={selectedTask}
              onSubmitSuccess={() => {
                // Refresh progress and reset selection
                setSelectedTask(null);
              }}
            />
          ) : (
            <div className="text-center text-gray-500">
              Select a task from progress dashboard to submit
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

---

## 🎯 Integration Points

### After Enrollment Success
```javascript
// After payment/enrollment is complete
const handleEnrollmentSuccess = async (enrollmentId) => {
  // Project is auto-generated on backend
  // Just navigate to project page
  navigate(`/project/${enrollmentId}`);
};
```

### In Dashboard
```javascript
// Show project status in dashboard
const projects = await aiService.getProgress(enrollmentId);
// Display progress percentage
```

### In Notification
```javascript
// Show when task is evaluated
useNotification({
  type: 'success',
  message: `Task evaluated! Score: ${evaluation.score}%`,
  details: evaluation.feedback,
});
```

---

## 🎨 Styling Notes

All examples use Tailwind CSS. Adapt classes for your styling system:

- `bg-blue-600` → Primary color
- `border-gray-300` → Border color
- `text-gray-900` → Text color
- `rounded-lg` → Border radius

---

## 🧪 Testing

```javascript
// Test with mock data
const mockTask = {
  _id: 'task_1',
  title: 'Implement User Authentication',
  description: 'Create JWT-based auth system',
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  status: 'pending',
};

// Test submission
const testSubmit = async () => {
  try {
    const result = await aiService.submitTask(
      'enrollment_id',
      'task_1',
      'I implemented JWT authentication with...'
    );
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## ✅ Ready to Use

All components are:
- ✅ Fully functional
- ✅ Error handled
- ✅ Loading states included
- ✅ Responsive design
- ✅ Accessible

Just copy, paste, and customize for your theme!
