import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskService } from '../services';
import { storageService } from '../services/storage';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/LayoutElements';
import { Button, Input } from '../components/common/FormElements';

export const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [link, setLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await taskService.getById(id);
        const data = res.data || res;
        setTask(data.data || data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const onFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const onSubmit = async () => {
    if (!user) return navigate('/login');
    setSubmitting(true);
    try {
      let publicUrl = link || null;
      const files = [];
      if (file) {
        const presigned = await storageService.getPresigned(file.name, file.type);
        await storageService.uploadFileToPresigned(presigned.uploadUrl, file);
        publicUrl = presigned.publicUrl;
        files.push(publicUrl);
      }

      await taskService.submit(id, { contentUrl: publicUrl, files });
      alert('Submitted — grading in progress.');
      navigate('/tasks');
    } catch (err) {
      console.error(err);
      alert('Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!task) return <div className="p-6">Task not found.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card>
        <h2 className="text-2xl font-semibold mb-2">{task.title}</h2>
        <p className="text-gray-700 mb-4">{task.description}</p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Upload submission (file)</label>
          <Input type="file" onChange={onFileChange} />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Or paste a link</label>
          <Input type="text" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
        </div>

        <div className="flex gap-2">
          <Button onClick={onSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</Button>
          <Button variant="secondary" onClick={() => navigate('/tasks')}>Back</Button>
        </div>
      </Card>
    </div>
  );
};

export default TaskDetail;
