import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { taskService } from '../services';
import { Card, ProgressBar } from '../components/common/LayoutElements';
import { Button } from '../components/common/FormElements';
import { useNavigate } from 'react-router-dom';

export const TasksPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        // backend should support filtering by assignedTo or /tasks/my
        const res = await taskService.getAll({ assignedTo: user?._id });
        const data = res.data || res;
        setTasks(data.data || data);
      } catch (err) {
        console.error(err);
        setError('Failed to load tasks. Please refresh the page.');
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetch();
  }, [user]);

  const onStart = (task) => {
    navigate(`/tasks/${task._id}`);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">My Tasks</h2>
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-gray-600">No tasks assigned yet.</p>
      ) : (
        <div className="grid gap-4">
          {tasks.map((t) => (
            <Card key={t._id} hoverable>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{t.title}</h3>
                  <p className="text-sm text-gray-600">Due: {new Date(t.dueDate).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <ProgressBar percentage={Math.round((t.completedSteps || 0) / (t.totalSteps || 1) * 100)} label="Progress" />
                  <Button onClick={() => onStart(t)}>Start</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksPage;
