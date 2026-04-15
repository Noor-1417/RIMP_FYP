import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user || !user._id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/applications/user/${user._id}`);
        setApplication(res.data.data);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setApplication(null);
        } else {
          console.error(err);
          setError('Failed to load application. Please refresh the page.');
          toast.error('Failed to load application');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const downloadHtml = () => {
    if (!application) return;
    const p = application;
    const style = `body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;background:#f3f4f6;margin:0;padding:32px;color:#0f172a}.cv-container{max-width:800px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 10px 30px rgba(2,6,23,0.08)}.cv-head{background:linear-gradient(90deg,#0ea5e9 -10%,#06b6d4 40%,#10b981 100%);color:#fff;padding:28px 32px}.name{font-size:28px;margin:0;font-weight:800}.title{margin-top:6px;opacity:.95}.contact{margin-top:10px;font-size:13px;opacity:.95;display:flex;gap:12px;flex-wrap:wrap}.cv-body{padding:28px 32px;display:grid;grid-template-columns:1fr;gap:18px}.section h4{margin:0 0 10px 0;font-size:16px;color:#0f172a;font-weight:700;border-left:4px solid #06b6d4;padding-left:12px;background:linear-gradient(90deg,rgba(6,182,212,0.03),transparent);border-radius:4px;padding:8px 12px;display:inline-block}.card{padding:12px 14px;border-radius:8px;background:#f8fafc;border:1px solid #e6eef3;margin-bottom:10px}`;

    const esc = (s='') => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.fullName||'CV')}</title><style>${style}</style></head><body><div class="cv-container"><div class="cv-head"><h1 class="name">${esc(p.fullName)}</h1><div class="title">${esc(p.title||'')}</div><div class="contact">${esc(p.email||'')}</div></div><div class="cv-body"><div class="section"><h4>Summary</h4><div class="card">${esc(p.summary||'')}</div></div><div class="section"><h4>Education</h4>${(p.education||[]).map(e=>`<div class="card"><div style="font-weight:700">${esc(e.degree||'')} • ${esc(e.institution||'')}</div><div class="muted">${esc(e.year||'')} ${e.gpa? '• GPA ' + esc(e.gpa):''}</div></div>`).join('')}</div><div class="section"><h4>Experience</h4>${(p.experience||[]).map(ex=>`<div class="card"><div style="font-weight:700">${esc(ex.role||'')} • ${esc(ex.company||'')}</div><div class="muted">${esc(ex.start||'')} ${ex.end? '—' + esc(ex.end):''}</div><div>${esc(ex.description||'')}</div></div>`).join('')}</div><div class="section"><h4>Projects</h4>${(p.projects||[]).map(pr=>`<div class="card"><div style="font-weight:700">${esc(pr.name||'')}</div><div>${esc(pr.description||'')}</div><div class="muted">Tech: ${esc(pr.technologies||'')}</div></div>`).join('')}</div></div></div></body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(p.fullName||'cv').replace(/\s+/g,'_').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const generatePdfFromHtml = async (htmlContent, fileName = 'cv.pdf') => {
    // Create offscreen container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = '842px';
    container.style.padding = '20px';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    try {
      const canvas = await (await import('html2canvas')).default(container, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const jsPDFModule = (await import('jspdf')).default;
      const pdf = new jsPDFModule({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      container.remove();
    }
  };



  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
        <p className="text-gray-400 mb-6">Welcome back{user ? `, ${user.firstName}` : ''}</p>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-6 bg-gray-800 rounded">Loading...</div>
        ) : !application ? (
          <div className="p-6 bg-gray-800 rounded">
            <p className="text-gray-300">You have not submitted your CV yet.</p>
            <button onClick={() => navigate('/cv-builder')} className="mt-4 bg-indigo-600 px-4 py-2 rounded">Fill CV</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-gray-800 p-6 rounded">
              <h2 className="text-xl font-semibold">{application.fullName}</h2>
              <p className="text-gray-400">{application.email}</p>

              <div className="mt-4">
                <h3 className="text-sm text-gray-300 font-semibold">Application Status</h3>
                <p className="mt-2 text-yellow-300 font-medium">{application.status}</p>
              </div>

              <div className="mt-6">
                <h3 className="text-sm text-gray-300 font-semibold">Education</h3>
                {(application.education||[]).map((e,i)=>(<div key={i} className="mt-2 bg-gray-900 p-3 rounded"><div className="font-medium">{e.degree} • {e.institution}</div><div className="text-gray-400 text-sm">{e.year} {e.gpa ? `• GPA ${e.gpa}` : ''}</div></div>))}
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded">
              <button onClick={() => navigate('/cv-builder?edit=1')} className="w-full bg-blue-600 py-2 rounded mb-3">View / Edit CV</button>
              <button onClick={downloadHtml} className="w-full bg-green-600 py-2 rounded">Download CV</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
