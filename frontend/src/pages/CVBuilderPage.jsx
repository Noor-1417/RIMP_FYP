import React, { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/layout/Navbar';

export default function CVBuilderPage() {
  const [personal, setPersonal] = useState({
    fullName: '',
    title: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    summary: '',
  });
  const [education, setEducation] = useState([{ degree: '', institution: '', year: '', gpa: '', id: Date.now().toString() }]);
  const [experience, setExperience] = useState([{ company: '', role: '', start: '', end: '', description: '', id: Date.now().toString() }]);
  const [projects, setProjects] = useState([{ name: '', description: '', technologies: '', id: Date.now().toString() }]);
  const [certifications, setCertifications] = useState([{ name: '', issuer: '', date: '', id: Date.now().toString() }]);
  const [skills, setSkills] = useState({ technical: '', soft: '' });

  const previewRef = useRef();
  const [submitting, setSubmitting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadError, setLoadError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isEdit = params.get('edit') === '1' || params.get('edit') === 'true';

    const checkExisting = async () => {
      setIsInitializing(true);
      setLoadError('');
      if (!user || !user._id) {
        setIsInitializing(false);
        return;
      }
      try {
        const res = await api.get(`/applications/user/${user._id}`);
        if (res.data && res.data.data) {
          if (!isEdit) {
            navigate('/intern-dashboard');
          } else {
            const app = res.data.data;
            setPersonal({
              fullName: app.fullName || '',
              title: app.title || '',
              email: app.email || user.email || '',
              phone: app.phone || '',
              website: '',
              address: app.address || '',
              summary: app.summary || '',
            });
            setEducation(app.education?.map(item => ({ ...item, id: item.id || Date.now().toString() })) || [{ degree: '', institution: '', year: '', gpa: '', id: Date.now().toString() }]);
            setExperience(app.experience?.map(item => ({ ...item, id: item.id || Date.now().toString() })) || [{ company: '', role: '', start: '', end: '', description: '', id: Date.now().toString() }]);
            setProjects(app.projects?.map(item => ({ ...item, id: item.id || Date.now().toString() })) || [{ name: '', description: '', technologies: '', id: Date.now().toString() }]);
            setCertifications(app.certifications?.map(item => ({ ...item, id: item.id || Date.now().toString() })) || [{ name: '', issuer: '', date: '', id: Date.now().toString() }]);
            setSkills(app.skills || { technical: '', soft: '' });
          }
        } else {
          if (user.skills) setSkills(user.skills);
          setPersonal((prev) => ({
            ...prev,
            email: user.email || prev.email,
            fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || prev.fullName,
          }));
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          if (user.skills) setSkills(user.skills);
          setPersonal((prev) => ({
            ...prev,
            email: user.email || prev.email,
            fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || prev.fullName,
          }));
        } else {
          setLoadError('Unable to verify your existing application. You may continue.');
        }
      } finally {
        setIsInitializing(false);
      }
    };
    checkExisting();
  }, [user, navigate, location.search]);

  // Updated addRow with id (minimal change)
  const addRow = useCallback((setter, state) => {
    const newItem = Object.keys(state[0] || {}).reduce((acc, k) => { acc[k] = ''; return acc; }, {});
    newItem.id = Date.now().toString() + Math.random();
    setter([...state, newItem]);
  }, []);

  const removeRow = useCallback((setter, state, idx) => setter(state.filter((_, i) => i !== idx)), []);

  const updateRow = useCallback((setter, state, idx, field, value) => {
    const copy = [...state];
    copy[idx] = { ...copy[idx], [field]: value };
    setter(copy);
  }, []);

  const escapeHtml = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const buildCvHtml = useCallback(() => {
    const p = personal;
    const style = `
      body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; background:#f3f4f6;margin:0;padding:32px;color:#0f172a}
      .cv-container{max-width:800px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 10px 30px rgba(2,6,23,0.08)}
      .cv-head{background:linear-gradient(90deg,#0ea5e9 -10%,#06b6d4 40%,#10b981 100%);color:#fff;padding:28px 32px}
      .name{font-size:28px;margin:0;font-weight:800}
      .title{margin-top:6px;opacity:.95}
      .contact{margin-top:10px;font-size:13px;opacity:.95;display:flex;gap:12px;flex-wrap:wrap}
      .cv-body{padding:28px 32px;display:grid;grid-template-columns:1fr;gap:18px}
      .section h4{margin:0 0 10px 0;font-size:16px;color:#0f172a;font-weight:700;border-left:4px solid #06b6d4;padding-left:12px;background:linear-gradient(90deg,rgba(6,182,212,0.03),transparent);border-radius:4px;padding:8px 12px;display:inline-block}
      .card{padding:12px 14px;border-radius:8px;background:#f8fafc;border:1px solid #e6eef3;margin-bottom:10px}
      .muted{color:#334155;opacity:.9;font-size:13px}
      .skill-list{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
      .skill-pill{background:#e6f7ff;color:#0369a1;padding:6px 10px;border-radius:999px;font-size:13px;border:1px solid #bae6fd}
      @media print{body{background:#fff;padding:0}.cv-container{box-shadow:none}}
    `;

    const personalHtml = `
      <div class="cv-head">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
          <div>
            <h1 class="name">${escapeHtml(p.fullName || 'Your Name')}</h1>
            <div class="title">${escapeHtml(p.title || '')}</div>
            <div class="contact">
              ${p.email ? `<div>${escapeHtml(p.email)}</div>` : ''}
              ${p.phone ? `<div>${escapeHtml(p.phone)}</div>` : ''}
              ${p.website ? `<div>${escapeHtml(p.website)}</div>` : ''}
              ${p.address ? `<div>${escapeHtml(p.address)}</div>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    const summaryHtml = p.summary ? `<div class="section"><h4>Summary</h4><div class="card muted">${escapeHtml(p.summary)}</div></div>` : '';

    const educationHtml = education?.length ? `<div class="section"><h4>Education</h4>${education.filter(e=>e.degree||e.institution).map(e=>`<div class="card"><div style="display:flex;justify-content:space-between;gap:12px;"><div style="font-weight:700">${escapeHtml(e.degree||'')} <span style="font-weight:600;color:#475569"> - ${escapeHtml(e.institution||'')}</span></div><div class="muted">${escapeHtml(e.year||'')} ${e.gpa?` • GPA ${escapeHtml(e.gpa)}`:''}</div></div></div>`).join('')}</div>` : '';

    const expHtml = experience?.length ? `<div class="section"><h4>Work Experience</h4>${experience.filter(ex=>ex.company||ex.role).map(ex=>`<div class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;"><div><div style="font-weight:700">${escapeHtml(ex.role||'')} <span style="font-weight:600;color:#475569"> at ${escapeHtml(ex.company||'')}</span></div><div class="muted" style="margin-top:6px">${escapeHtml(ex.description||'')}</div></div><div class="muted">${escapeHtml(ex.start||'')}${ex.end? ' — ' + escapeHtml(ex.end):''}</div></div>`).join('')}</div>` : '';

    const projectsHtml = projects?.length ? `<div class="section"><h4>Projects</h4>${projects.filter(pj=>pj.name).map(pj=>`<div class="card"><div style="font-weight:700">${escapeHtml(pj.name||'')}</div><div class="project-meta">${escapeHtml(pj.description||'')}</div><div class="muted" style="margin-top:8px">Technologies: ${escapeHtml(pj.technologies||'')}</div></div>`).join('')}</div>` : '';

    const skillsHtml = (skills.technical||skills.soft) ? `<div class="section"><h4>Skills</h4><div class="card">${skills.technical?`<div style="font-weight:700;margin-bottom:6px">Technical</div><div class="skill-list">${skills.technical.split(',').map(s=>`<span class="skill-pill">${escapeHtml(s.trim())}</span>`).join('')}</div>`:''}${skills.soft?`<div style="margin-top:8px;font-weight:700">Soft Skills</div><div class="skill-list">${skills.soft.split(',').map(s=>`<span class="skill-pill">${escapeHtml(s.trim())}</span>`).join('')}</div>`:''}</div></div>` : '';

    const certHtml = certifications?.length ? `<div class="section"><h4>Certifications</h4>${certifications.filter(c=>c.name).map(c=>`<div class="card"><div style="font-weight:700">${escapeHtml(c.name||'')}</div><div class="muted">${escapeHtml(c.issuer||'')} • ${escapeHtml(c.date||'')}</div></div>`).join('')}</div>` : '';

    return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(p.fullName||'Curriculum Vitae')}</title><style>${style}</style></head><body><div class="cv-container">${personalHtml}<div class="cv-body"><div class="left">${summaryHtml}${educationHtml}${expHtml}${projectsHtml}</div><div class="right">${skillsHtml}${certHtml}</div></div></div></body></html>`;
  }, [personal, education, experience, projects, certifications, skills]);

  const generatePdfFromHtml = useCallback(async (htmlContent, fileName = 'cv.pdf') => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = '842px';
    container.style.padding = '20px';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
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
  }, []);

  const downloadPdf = useCallback(async () => {
    if (!personal.fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    const html = buildCvHtml();
    await generatePdfFromHtml(html, `${personal.fullName.replace(/\s+/g, '_').toLowerCase()}_cv.pdf`);
    toast.success('CV downloaded successfully!');
  }, [personal.fullName, buildCvHtml, generatePdfFromHtml]);

  const openPrintPreview = useCallback(() => {
    const html = buildCvHtml();
    const newWin = window.open('', '_blank', 'noopener,noreferrer');
    if (!newWin) return toast.error('Popup blocked. Please allow popups for print preview.');
    newWin.document.open();
    newWin.document.write(html);
    newWin.document.close();
    setTimeout(() => { 
      newWin.focus(); 
      newWin.print(); 
    }, 500);
  }, [buildCvHtml]);

  const handleSubmitApplication = useCallback(async () => {
    if (!personal.fullName.trim() || !personal.email.trim()) {
      toast.error('Please fill in name and email at minimum');
      return;
    }

    try {
      setSubmitting(true);

      // Remove temporary React IDs before sending to backend
      const cleanEducation = education.map(({ id, ...rest }) => rest);
      const cleanExperience = experience.map(({ id, ...rest }) => rest);
      const cleanProjects = projects.map(({ id, ...rest }) => rest);
      const cleanCertifications = certifications.map(({ id, ...rest }) => rest);

      const payload = {
        fullName: personal.fullName,
        email: personal.email,
        phone: personal.phone,
        address: personal.address,
        title: personal.title,
        summary: personal.summary,
        education: cleanEducation,
        experience: cleanExperience,
        projects: cleanProjects,
        certifications: cleanCertifications,
        skills,
      };

      // Check if user already has an applicationb
      try {
        const existing = await api.get(`/applications/user/${user._id}`);
        if (existing.data && existing.data.data) {
          // Update existing
          const appId = existing.data.data._id;
          const res = await api.put(`/applications/${appId}`, payload);
          if (res.data && res.data.success) {
            toast.success('Application updated successfully!');
            navigate('/intern-dashboard');
            return;
          }
        }
      } catch (err) {
        if (!(err.response && err.response.status === 404)) {
          throw err;
        }
      }

      // Create new
      const res = await api.post('/applications', payload);
      if (res.data && res.data.success) {
        toast.success('Application submitted successfully!');
        navigate('/intern-dashboard');
      } else {
        toast.error(res.data?.message || 'Submission failed');
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  }, [personal, education, experience, projects, certifications, skills, user._id, navigate]);

  // Memoized handlers for each form section (prevents focus loss)
  const handlePersonalChange = useCallback((field, value) => {
    setPersonal(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleEducationUpdate = useCallback((idx, field, value) => {
    updateRow(setEducation, education, idx, field, value);
  }, [education, updateRow]);

  const handleExperienceUpdate = useCallback((idx, field, value) => {
    updateRow(setExperience, experience, idx, field, value);
  }, [experience, updateRow]);

  const handleProjectsUpdate = useCallback((idx, field, value) => {
    updateRow(setProjects, projects, idx, field, value);
  }, [projects, updateRow]);

  const handleCertificationsUpdate = useCallback((idx, field, value) => {
    updateRow(setCertifications, certifications, idx, field, value);
  }, [certifications, updateRow]);

  const handleSkillsChange = useCallback((type, value) => {
    setSkills(prev => ({ ...prev, [type]: value }));
  }, []);

  // Early returns AFTER all hooks declared
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4 py-8">
        <div className="rounded-3xl bg-slate-900 p-10 shadow-2xl text-center w-full max-w-lg">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-400 mb-5" />
          <p className="text-lg font-semibold">Verifying your application details…</p>
        </div>
      </div>
    );
  }

  // Input component (unchanged)
  const Input = ({ label, value, onChange, placeholder, type = 'text' }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 13, color: '#0f172a', marginBottom: 6, fontWeight: 700 }}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', boxSizing: 'border-box' }} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Build Your CV</h1>
            <p className="text-slate-600">Create a professional curriculum vitae and submit your internship application</p>
          </div>

          {loadError && (
            <div className="mb-6 max-w-6xl rounded-lg border border-rose-400 bg-rose-50 px-4 py-3 text-rose-700 text-sm">
              {loadError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">1</span>
                  Personal Information
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={personal.fullName}
                      onChange={(e) => handlePersonalChange('fullName', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={personal.email}
                      onChange={(e) => handlePersonalChange('email', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Phone"
                      value={personal.phone}
                      onChange={(e) => handlePersonalChange('phone', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                    <input
                      type="text"
                      placeholder="Professional Title"
                      value={personal.title}
                      onChange={(e) => handlePersonalChange('title', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Website/Portfolio"
                      value={personal.website}
                      onChange={(e) => handlePersonalChange('website', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                    <input
                      type="text"
                      placeholder="Address"
                      value={personal.address}
                      onChange={(e) => handlePersonalChange('address', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                  <textarea
                    placeholder="Professional Summary"
                    value={personal.summary}
                    onChange={(e) => handlePersonalChange('summary', e.target.value)}
                    rows="4"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                  />
                </div>
              </div>

              {/* Education */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">2</span>
                    Education
                  </h2>
                  <button
                    onClick={() => addRow(setEducation, education)}
                    className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-3">
                  {education.map((edu, idx) => (
                    <div key={edu.id || idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Degree"
                          value={edu.degree}
                          onChange={(e) => handleEducationUpdate(idx, 'degree', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm transition"
                        />
                        <input
                          type="text"
                          placeholder="Institution"
                          value={edu.institution}
                          onChange={(e) => handleEducationUpdate(idx, 'institution', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm transition"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Graduation Year"
                          value={edu.year}
                          onChange={(e) => handleEducationUpdate(idx, 'year', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm transition"
                        />
                        <input
                          type="text"
                          placeholder="GPA (optional)"
                          value={edu.gpa}
                          onChange={(e) => handleEducationUpdate(idx, 'gpa', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm transition"
                        />
                      </div>
                      <button
                        onClick={() => removeRow(setEducation, education, idx)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Experience */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">3</span>
                    Work Experience
                  </h2>
                  <button
                    onClick={() => addRow(setExperience, experience)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-3">
                  {experience.map((exp, idx) => (
                    <div key={exp.id || idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Job Title"
                          value={exp.role}
                          onChange={(e) => handleExperienceUpdate(idx, 'role', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition"
                        />
                        <input
                          type="text"
                          placeholder="Company"
                          value={exp.company}
                          onChange={(e) => handleExperienceUpdate(idx, 'company', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Start Date"
                          value={exp.start}
                          onChange={(e) => handleExperienceUpdate(idx, 'start', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition"
                        />
                        <input
                          type="text"
                          placeholder="End Date"
                          value={exp.end}
                          onChange={(e) => handleExperienceUpdate(idx, 'end', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition"
                        />
                      </div>
                      <textarea
                        placeholder="Job Description"
                        value={exp.description}
                        onChange={(e) => handleExperienceUpdate(idx, 'description', e.target.value)}
                        rows="3"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none transition"
                      />
                      <button
                        onClick={() => removeRow(setExperience, experience, idx)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">4</span>
                    Projects
                  </h2>
                  <button
                    onClick={() => addRow(setProjects, projects)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-3">
                  {projects.map((proj, idx) => (
                    <div key={proj.id || idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                      <input
                        type="text"
                        placeholder="Project Name"
                        value={proj.name}
                        onChange={(e) => handleProjectsUpdate(idx, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm transition"
                      />
                      <textarea
                        placeholder="Project Description"
                        value={proj.description}
                        onChange={(e) => handleProjectsUpdate(idx, 'description', e.target.value)}
                        rows="2"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm resize-none transition"
                      />
                      <input
                        type="text"
                        placeholder="Technologies Used (comma-separated)"
                        value={proj.technologies}
                        onChange={(e) => handleProjectsUpdate(idx, 'technologies', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm transition"
                      />
                      <button
                        onClick={() => removeRow(setProjects, projects, idx)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-sm font-bold">5</span>
                    Certifications
                  </h2>
                  <button
                    onClick={() => addRow(setCertifications, certifications)}
                    className="px-3 py-1 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-3">
                  {certifications.map((cert, idx) => (
                    <div key={cert.id || idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Certification Name"
                          value={cert.name}
                          onChange={(e) => handleCertificationsUpdate(idx, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-sm transition"
                        />
                        <input
                          type="text"
                          placeholder="Issuing Organization"
                          value={cert.issuer}
                          onChange={(e) => handleCertificationsUpdate(idx, 'issuer', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-sm transition"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Date Obtained"
                        value={cert.date}
                        onChange={(e) => handleCertificationsUpdate(idx, 'date', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-sm transition"
                      />
                      <button
                        onClick={() => removeRow(setCertifications, certifications, idx)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">6</span>
                  Skills
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Technical Skills (comma-separated)</label>
                    <textarea
                      placeholder="e.g. JavaScript, React, Node.js, MongoDB"
                      value={skills.technical}
                      onChange={(e) => handleSkillsChange('technical', e.target.value)}
                      rows="3"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Soft Skills (comma-separated)</label>
                    <textarea
                      placeholder="e.g. Communication, Leadership, Problem Solving"
                      value={skills.soft}
                      onChange={(e) => handleSkillsChange('soft', e.target.value)}
                      rows="3"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview & Actions Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24 space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Actions</h3>
                
                <button
                  onClick={downloadPdf}
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-2"
                >
                  📥 Download PDF
                </button>

                <button
                  onClick={openPrintPreview}
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-2"
                >
                  🖨️ Print Preview
                </button>

                <button
                  onClick={handleSubmitApplication}
                  disabled={submitting || !personal.fullName.trim()}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-2"
                >
                  {submitting ? '⏳ Submitting...' : '✅ Submit Application'}
                </button>

                <div className="border-t border-slate-200 pt-4">
                  <h4 className="font-semibold text-slate-700 mb-3">Preview</h4>
                  <div
                    ref={previewRef}
                    className="bg-slate-50 border border-slate-300 rounded-lg p-4 text-xs max-h-96 overflow-auto"
                    style={{ fontSize: '10px', lineHeight: '1.3' }}
                    dangerouslySetInnerHTML={{ __html: buildCvHtml() }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}