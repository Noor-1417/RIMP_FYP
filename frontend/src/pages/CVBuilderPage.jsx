import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAuth } from '../hooks/useAuth';

/*
  CVBuilderPage.jsx

  Self-contained React page that lets the user fill CV fields and download
  a professional CV as HTML (or open print preview to save as PDF).

  Usage: Add a route or render <CVBuilderPage /> after login/signup.
*/

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

  const [education, setEducation] = useState([{ degree: '', institution: '', year: '', gpa: '' }]);
  const [experience, setExperience] = useState([{ company: '', role: '', start: '', end: '', description: '' }]);
  const [projects, setProjects] = useState([{ name: '', description: '', technologies: '' }]);
  const [certifications, setCertifications] = useState([{ name: '', issuer: '', date: '' }]);
  const [skills, setSkills] = useState({ technical: '', soft: '' });

  const previewRef = useRef();
  const [submitting, setSubmitting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadError, setLoadError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const location = useLocation();

  useEffect(() => {
    // If user already has an application and NOT in edit mode, redirect to intern dashboard
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
        // If found and not editing, navigate to intern dashboard
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
            setEducation(app.education && app.education.length ? app.education : [{ degree: '', institution: '', year: '', gpa: '' }]);
            setExperience(app.experience && app.experience.length ? app.experience : [{ company: '', role: '', start: '', end: '', description: '' }]);
            setProjects(app.projects && app.projects.length ? app.projects : [{ name: '', description: '', technologies: '' }]);
            setCertifications(app.certifications && app.certifications.length ? app.certifications : [{ name: '', issuer: '', date: '' }]);
            setSkills(app.skills || { technical: '', soft: '' });
          }
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          // no existing application yet
        } else {
          console.error('Error checking application:', err);
          setLoadError('Unable to verify your existing application. You may continue and submit this form.');
        }
      } finally {
        setIsInitializing(false);
      }
    };

    checkExisting();
  }, [user, navigate, location.search]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4 py-8">
        <div className="rounded-3xl bg-slate-900 p-10 shadow-2xl text-center w-full max-w-lg">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-400 mb-5" />
          <p className="text-lg font-semibold">Verifying your application details…</p>
          <p className="mt-2 text-slate-400">This should only take a moment.</p>
        </div>
      </div>
    );
  }

  // helpers for repeatable sections
  const addRow = (setter, state) => setter([...state, Object.keys(state[0] || {}).reduce((acc, k) => { acc[k] = ''; return acc; }, {})]);
  const removeRow = (setter, state, idx) => setter(state.filter((_, i) => i !== idx));
  const updateRow = (setter, state, idx, field, value) => {
    const copy = [...state];
    copy[idx] = { ...copy[idx], [field]: value };
    setter(copy);
  };

  const escapeHtml = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const buildCvHtml = () => {
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
      @media(min-width:900px){.cv-body{grid-template-columns:1fr 320px}}
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

    const educationHtml = education && education.length ? `<div class="section"><h4>Education</h4>${education.filter(e=>e.degree||e.institution).map(e=>`<div class="card"><div style="display:flex;justify-content:space-between;gap:12px;"><div style="font-weight:700">${escapeHtml(e.degree||'')} <span style="font-weight:600;color:#475569"> - ${escapeHtml(e.institution||'')}</span></div><div class="muted">${escapeHtml(e.year||'')} ${e.gpa?`• GPA ${escapeHtml(e.gpa)}`:''}</div></div></div>`).join('')}</div>` : '';

    const expHtml = experience && experience.length ? `<div class="section"><h4>Work Experience</h4>${experience.filter(ex=>ex.company||ex.role).map(ex=>`<div class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;"><div><div style="font-weight:700">${escapeHtml(ex.role||'')} <span style="font-weight:600;color:#475569"> at ${escapeHtml(ex.company||'')}</span></div><div class="muted" style="margin-top:6px">${escapeHtml(ex.description||'')}</div></div><div class="muted">${escapeHtml(ex.start||'')}${ex.end? ' — ' + escapeHtml(ex.end):''}</div></div>`).join('')}</div>` : '';

    const projectsHtml = projects && projects.length ? `<div class="section"><h4>Projects</h4>${projects.filter(pj=>pj.name).map(pj=>`<div class="card"><div style="font-weight:700">${escapeHtml(pj.name||'')}</div><div class="project-meta">${escapeHtml(pj.description||'')}</div><div class="muted" style="margin-top:8px">Technologies: ${escapeHtml(pj.technologies||'')}</div></div>`).join('')}</div>` : '';

    const skillsHtml = (skills.technical||skills.soft) ? `<div class="section"><h4>Skills</h4><div class="card">${skills.technical?`<div style="font-weight:700;margin-bottom:6px">Technical</div><div class="skill-list">${skills.technical.split(',').map(s=>`<span class="skill-pill">${escapeHtml(s.trim())}</span>`).join('')}</div>`:''}${skills.soft?`<div style="margin-top:8px;font-weight:700">Soft Skills</div><div class="skill-list">${skills.soft.split(',').map(s=>`<span class="skill-pill">${escapeHtml(s.trim())}</span>`).join('')}</div>`:''}</div></div>` : '';

    const certHtml = certifications && certifications.length ? `<div class="section"><h4>Certifications</h4>${certifications.filter(c=>c.name).map(c=>`<div class="card"><div style="font-weight:700">${escapeHtml(c.name||'')}</div><div class="muted">${escapeHtml(c.issuer||'')} • ${escapeHtml(c.date||'')}</div></div>`).join('')}</div>` : '';

    const contactHtml = `<div class="section"><h4>Contact</h4><div class="card muted">${p.email?`<div><strong>Email:</strong> ${escapeHtml(p.email)}</div>`:''}${p.phone?`<div><strong>Phone:</strong> ${escapeHtml(p.phone)}</div>`:''}${p.website?`<div><strong>Website:</strong> ${escapeHtml(p.website)}</div>`:''}${p.address?`<div><strong>Address:</strong> ${escapeHtml(p.address)}</div>`:''}</div></div>`;

    return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(p.fullName||'Curriculum Vitae')}</title><style>${style}</style></head><body><div class="cv-container">${personalHtml}<div class="cv-body"><div class="left">${summaryHtml}${educationHtml}${expHtml}${projectsHtml}</div><div class="right">${skillsHtml}${certHtml}${contactHtml}</div></div></div></body></html>`;
  };

  const downloadHtml = () => {
    const html = buildCvHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(personal.fullName || 'cv').replace(/\s+/g, '_').toLowerCase()}.html`;
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
    container.style.width = '842px'; // A4 width at 96dpi approx
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
  };

  const openPrintPreview = () => {
    const html = buildCvHtml();
    const newWin = window.open('', '_blank', 'noopener,noreferrer');
    if (!newWin) return alert('Popup blocked. Allow popups to open print preview.');
    newWin.document.open();
    newWin.document.write(html);
    newWin.document.close();
    setTimeout(() => { newWin.focus(); newWin.print(); }, 500);
  };

  const downloadPdf = async () => {
    const html = buildCvHtml();
    await generatePdfFromHtml(html, `${(personal.fullName || 'cv').replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  const handleSubmitApplication = async () => {
    try {
      setSubmitting(true);

      const payload = {
        fullName: personal.fullName,
        email: personal.email,
        phone: personal.phone,
        address: personal.address,
        title: personal.title,
        summary: personal.summary,
        education,
        experience,
        projects,
        certifications,
        skills,
      };

      // Check if user already has an application
      try {
        const existing = await api.get(`/applications/user/${user._id}`);
        if (existing.data && existing.data.data) {
          // update
          const appId = existing.data.data._id;
          const res = await api.put(`/applications/${appId}`, payload);
            if (res.data && res.data.success) {
            toast.success('Your application has been updated!');
            navigate('/intern-dashboard');
            return;
          }
        }
      } catch (err) {
        // if 404, no existing application — fall through to create
        if (!(err.response && err.response.status === 404)) {
          console.error('Error checking existing application:', err);
          toast.error('Failed to submit application');
          return;
        }
      }

      const res = await api.post('/applications', payload);
      if (res.data && res.data.success) {
        toast.success('Your application has been submitted!');
        // Redirect student to intern dashboard after successful submission
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
  };

  // small input component
  const Input = ({ label, value, onChange, placeholder, type = 'text' }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 13, color: '#0f172a', marginBottom: 6, fontWeight: 700 }}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', boxSizing: 'border-box' }} />
    </div>
  );

  // page styles
  const pageStyle = { fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial', background: '#0f172a', minHeight: '100vh', padding: 24, color: '#e6eef3' };
  const containerStyle = { maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 };
  const panelStyle = { background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.04)', padding: 20, borderRadius: 12, boxShadow: '0 8px 30px rgba(2,6,23,0.6)' };

  // small helpers for buttons / inputs
  function tinyButtonStyle() { return { background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#cfe7ff', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }; }
  function tinyDangerButtonStyle() { return { background: 'linear-gradient(90deg,#ef4444,#f97316)', border: 'none', color: 'white', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }; }
  function rowInputStyle() { return { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: '#021425', color: '#dbeafe', boxSizing: 'border-box' }; }

  return (
    <div style={pageStyle}>
      <style>{`@media (max-width:980px){.cv-grid{grid-template-columns:1fr!important}}`}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#e6f0ff' }}>Create Your CV</h2>
          <div style={{ marginTop: 6, color: '#a7b8cf' }}>Fill out details and export a professional CV</div>
        </div>

      </div>

      {loadError && (
        <div className="mx-auto mb-6 max-w-5xl rounded-lg border border-rose-400 bg-rose-50 px-4 py-3 text-rose-700 text-sm">
          {loadError}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={downloadHtml} style={{ background: 'linear-gradient(90deg,#0369a1,#06b6d4)', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 20px rgba(3,105,161,0.18)' }} title="Download HTML CV">Download HTML</button>
          <button onClick={downloadPdf} style={{ background: 'linear-gradient(90deg,#06b6d4,#10b981)', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 20px rgba(6,182,212,0.12)' }} title="Download PDF">Download PDF</button>
          <button onClick={openPrintPreview} style={{ background: 'linear-gradient(90deg,#06b6d4,#10b981)', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 20px rgba(6,182,212,0.12)' }} title="Open print preview (save as PDF)">Print Preview</button>
          <button onClick={handleSubmitApplication} disabled={submitting} style={{ background: 'linear-gradient(90deg,#7c3aed,#a78bfa)', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 10, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 8px 20px rgba(124,58,237,0.16)' }} title="Submit your application">{submitting ? 'Submitting…' : 'Submit Application'}</button>
        </div>

      <div className="cv-grid" style={containerStyle}>
        <div style={{ ...panelStyle }}>
          {/* Personal Info */}
          <section style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0, color: '#e6f0ff', fontSize: 16, fontWeight: 800 }}>Personal Information</h3>
            <div style={{ marginTop: 12 }}>
              <Input label="Full name" value={personal.fullName} onChange={(v)=>setPersonal({...personal, fullName:v})} placeholder="John Doe" />
              <Input label="Professional title" value={personal.title} onChange={(v)=>setPersonal({...personal, title:v})} placeholder="Frontend Engineer" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="Email" value={personal.email} onChange={(v)=>setPersonal({...personal, email:v})} placeholder="you@example.com" />
                <Input label="Phone" value={personal.phone} onChange={(v)=>setPersonal({...personal, phone:v})} placeholder="+1 555 555 555" />
              </div>
              <Input label="Website / LinkedIn" value={personal.website} onChange={(v)=>setPersonal({...personal, website:v})} placeholder="https://..." />
              <Input label="Address" value={personal.address} onChange={(v)=>setPersonal({...personal, address:v})} placeholder="City, Country" />
              <div style={{ marginTop: 8 }}>
                <label style={{ display: 'block', fontSize: 13, color: '#cfe7ff', marginBottom: 6, fontWeight: 700 }}>Summary</label>
                <textarea value={personal.summary} onChange={(e)=>setPersonal({...personal, summary:e.target.value})} rows={4} placeholder="Short 1-2 sentence professional summary" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', resize: 'vertical', background: 'white', color: '#0b1220' }} />
              </div>
            </div>
          </section>

          {/* Education */}
          <section style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#e6f0ff', fontSize: 16, fontWeight: 800 }}>Education</h3>
              <div><button onClick={()=>addRow(setEducation, education)} style={tinyButtonStyle()}>+ Add</button></div>
            </div>
            <div style={{ marginTop: 12 }}>
              {education.map((ed, idx) => (
                <div key={idx} style={{ marginBottom: 10, padding: 10, borderRadius: 8, background: '#031427', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={ed.degree} onChange={(e)=>updateRow(setEducation, education, idx, 'degree', e.target.value)} placeholder="Degree (e.g., B.Sc. Computer Science)" style={rowInputStyle()} />
                    <input value={ed.institution} onChange={(e)=>updateRow(setEducation, education, idx, 'institution', e.target.value)} placeholder="Institution" style={rowInputStyle()} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input value={ed.year} onChange={(e)=>updateRow(setEducation, education, idx, 'year', e.target.value)} placeholder="Year (e.g., 2024)" style={rowInputStyle()} />
                    <input value={ed.gpa} onChange={(e)=>updateRow(setEducation, education, idx, 'gpa', e.target.value)} placeholder="GPA (optional)" style={rowInputStyle()} />
                    <button onClick={()=>removeRow(setEducation, education, idx)} style={tinyDangerButtonStyle()}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Work Experience */}
          <section style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#e6f0ff', fontSize: 16, fontWeight: 800 }}>Work Experience</h3>
              <div><button onClick={()=>addRow(setExperience, experience)} style={tinyButtonStyle()}>+ Add</button></div>
            </div>
            <div style={{ marginTop: 12 }}>
              {experience.map((ex, idx) => (
                <div key={idx} style={{ marginBottom: 10, padding: 10, borderRadius: 8, background: '#031427', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <input value={ex.company} onChange={(e)=>updateRow(setExperience, experience, idx, 'company', e.target.value)} placeholder="Company" style={rowInputStyle()} />
                    <input value={ex.role} onChange={(e)=>updateRow(setExperience, experience, idx, 'role', e.target.value)} placeholder="Role / Title" style={rowInputStyle()} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input value={ex.start} onChange={(e)=>updateRow(setExperience, experience, idx, 'start', e.target.value)} placeholder="Start (e.g., Jan 2022)" style={rowInputStyle()} />
                    <input value={ex.end} onChange={(e)=>updateRow(setExperience, experience, idx, 'end', e.target.value)} placeholder="End (e.g., Present)" style={rowInputStyle()} />
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <textarea value={ex.description} onChange={(e)=>updateRow(setExperience, experience, idx, 'description', e.target.value)} placeholder="Brief description of role & achievements" rows={3} style={{ ...rowInputStyle(), resize: 'vertical' }} />
                    <div style={{ marginTop: 8, textAlign: 'right' }}><button onClick={()=>removeRow(setExperience, experience, idx)} style={tinyDangerButtonStyle()}>Remove</button></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Projects */}
          <section style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#e6f0ff', fontSize: 16, fontWeight: 800 }}>Projects</h3>
              <div><button onClick={()=>addRow(setProjects, projects)} style={tinyButtonStyle()}>+ Add</button></div>
            </div>
            <div style={{ marginTop: 12 }}>
              {projects.map((p, idx) => (
                <div key={idx} style={{ marginBottom: 10, padding: 10, borderRadius: 8, background: '#031427', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <input value={p.name} onChange={(e)=>updateRow(setProjects, projects, idx, 'name', e.target.value)} placeholder="Project name" style={rowInputStyle()} />
                  <textarea value={p.description} onChange={(e)=>updateRow(setProjects, projects, idx, 'description', e.target.value)} placeholder="Short description" rows={2} style={{ ...rowInputStyle(), marginTop: 8 }} />
                  <input value={p.technologies} onChange={(e)=>updateRow(setProjects, projects, idx, 'technologies', e.target.value)} placeholder="Technologies (comma separated)" style={{ ...rowInputStyle(), marginTop: 8 }} />
                  <div style={{ marginTop: 8, textAlign: 'right' }}><button onClick={()=>removeRow(setProjects, projects, idx)} style={tinyDangerButtonStyle()}>Remove</button></div>
                </div>
              ))}
            </div>
          </section>

          {/* Certifications */}
          <section style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#e6f0ff', fontSize: 16, fontWeight: 800 }}>Certifications</h3>
              <div><button onClick={()=>addRow(setCertifications, certifications)} style={tinyButtonStyle()}>+ Add</button></div>
            </div>
            <div style={{ marginTop: 12 }}>
              {certifications.map((c, idx) => (
                <div key={idx} style={{ marginBottom: 10, padding: 10, borderRadius: 8, background: '#031427', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={c.name} onChange={(e)=>updateRow(setCertifications, certifications, idx, 'name', e.target.value)} placeholder="Certification name" style={rowInputStyle()} />
                    <input value={c.issuer} onChange={(e)=>updateRow(setCertifications, certifications, idx, 'issuer', e.target.value)} placeholder="Issuer" style={rowInputStyle()} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input value={c.date} onChange={(e)=>updateRow(setCertifications, certifications, idx, 'date', e.target.value)} placeholder="Date (e.g., 2024)" style={rowInputStyle()} />
                    <div style={{ marginLeft: 'auto' }}><button onClick={()=>removeRow(setCertifications, certifications, idx)} style={tinyDangerButtonStyle()}>Remove</button></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right column preview / quick inputs */}
        <div style={{ ...panelStyle }}>
          <h3 style={{ margin: 0, color: '#e6f0ff', fontSize: 16, fontWeight: 800 }}>Skills</h3>
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#cfe7ff', marginBottom: 6, fontWeight: 700 }}>Technical (comma separated)</label>
            <input value={skills.technical} onChange={(e)=>setSkills({...skills, technical: e.target.value})} placeholder="React, Node.js, SQL" style={rowInputStyle()} />
            <label style={{ display: 'block', fontSize: 13, color: '#cfe7ff', marginTop: 12, marginBottom: 6, fontWeight: 700 }}>Soft Skills (comma separated)</label>
            <input value={skills.soft} onChange={(e)=>setSkills({...skills, soft: e.target.value})} placeholder="Communication, Teamwork" style={rowInputStyle()} />
          </div>

          <hr style={{ border: 'none', height: 1, background: 'rgba(255,255,255,0.04)', margin: '18px 0' }} />

          <h3 style={{ margin: 0, color: '#e6f0ff', fontSize: 16, fontWeight: 800 }}>Quick Contact</h3>
          <div style={{ marginTop: 12 }}>
            <Input label="Email" value={personal.email} onChange={(v)=>setPersonal({...personal, email:v})} placeholder="you@example.com" />
            <Input label="Phone" value={personal.phone} onChange={(v)=>setPersonal({...personal, phone:v})} placeholder="+1 555 555 555" />
          </div>

          <hr style={{ border: 'none', height: 1, background: 'rgba(255,255,255,0.04)', margin: '18px 0' }} />

          <h3 style={{ margin: 0, color: '#e6f0ff', fontSize: 16, fontWeight: 800 }}>Preview</h3>
          <div style={{ marginTop: 12 }}>
            <div ref={previewRef} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ background: 'linear-gradient(90deg,#0369a1,#06b6d4)', color: 'white', padding: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{personal.fullName || 'Your Name'}</div>
                <div style={{ fontSize: 12, opacity: 0.95 }}>{personal.title || 'Professional Title'}</div>
              </div>
              <div style={{ padding: 12, background: '#031427', color: '#cfe7ff' }}>
                <div style={{ fontSize: 13, marginBottom: 6, color: '#cfe7ff' }}>{personal.summary ? (personal.summary.length > 120 ? personal.summary.slice(0, 120) + '…' : personal.summary) : 'Add a short summary to highlight your profile'}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{skills.technical ? skills.technical.split(',').slice(0,6).map((s,i)=>(<span key={i} style={{ background: '#052f44', color: '#9be7ff', padding: '6px 8px', borderRadius: 999, fontSize: 12 }}>{s.trim()}</span>)) : <span style={{ color: '#94a3b8' }}>Add technical skills</span>}</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button onClick={downloadHtml} style={{ flex: 1, background: '#0ea5e9', border: 'none', color: 'white', padding: 10, borderRadius: 8, fontWeight: 700 }}>Download HTML</button>
            <button onClick={openPrintPreview} style={{ flex: 1, background: '#10b981', border: 'none', color: 'white', padding: 10, borderRadius: 8, fontWeight: 700 }}>Print / Save PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}


