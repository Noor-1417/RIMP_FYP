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
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks assigned yet.</p>
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
