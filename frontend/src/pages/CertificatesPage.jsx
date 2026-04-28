import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { certificateService, internshipTaskService } from '../services';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

/* ── helpers ─────────────────────────────────────────── */
const GRADE_COLOR = { A: '#10b981', B: '#0A3D62', C: '#f59e0b', D: '#ef4444' };
const GRADE_LABEL = { A: 'Excellent', B: 'Good', C: 'Satisfactory', D: 'Pass' };

function gradeColor(g) { return GRADE_COLOR[g] || '#0A3D62'; }

/* ── Certificate Template (for preview / download) ─── */
const CertTemplate = React.forwardRef(({ cert }, ref) => (
  <div ref={ref} id={`cert-${cert._id}`}
    style={{
      width: 900, height: 636, background: 'white',
      border: '22px solid #0A3D62', boxShadow: 'inset 0 0 0 4px #74B9FF, 0 10px 30px rgba(0,0,0,0.1)',
      fontFamily: 'Georgia, serif', position: 'relative', overflow: 'hidden', borderRadius: 4,
    }}>
    {/* Subtle Watermark */}
    <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%) rotate(-30deg)', fontSize:120, fontWeight:900, color:'rgba(10, 61, 98, 0.03)', whiteSpace:'nowrap', pointerEvents:'none', zIndex:0 }}>
        VERIFIED CERTIFICATE
    </div>

    {/* Corner ornaments */}
    {[['0,0','0deg'],['100%,0','90deg'],['100%,100%','180deg'],['0,100%','270deg']].map(([pos,rot],i)=>(
      <div key={i} style={{ position:'absolute', top:pos.split(',')[1]==='0'?12:'auto', bottom:pos.split(',')[1]==='100%'?12:'auto', left:pos.split(',')[0]==='0'?12:'auto', right:pos.split(',')[0]==='100%'?12:'auto', width:60, height:60, borderTop:`5px solid #0A3D62`, borderLeft:`5px solid #0A3D62`, transform:`rotate(${rot})`, zIndex:1 }}/>
    ))}

    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', padding:'40px 80px', textAlign:'center', position:'relative', zIndex:2 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <div style={{ width:40, height:40, background:'#0A3D62', borderRadius:8, color:'white', fontWeight:900, fontSize:24, display:'flex', alignItems:'center', justifyContent:'center' }}>R</div>
          <div style={{ fontSize:14, letterSpacing:4, color:'#0A3D62', fontWeight:700, textTransform:'uppercase' }}>RIMP AI PLATFORM</div>
      </div>

      <div style={{ fontSize:48, fontWeight:900, color:'#0A3D62', letterSpacing:8, textTransform:'uppercase', lineHeight:1.1, marginBottom:4 }}>Certificate</div>
      <div style={{ fontSize:18, color:'#74B9FF', letterSpacing:4, textTransform:'uppercase', fontWeight:600, marginBottom:32 }}>of Excellence</div>

      <div style={{ fontSize:14, color:'#64748b', fontStyle:'italic', marginBottom:12 }}>This prestigious award is presented to</div>
      <div style={{ fontSize:42, fontWeight:800, color:'#0A3D62', marginBottom:6, borderBottom:'3px solid #74B9FF', paddingBottom:12, minWidth:450, fontFamily:'"Times New Roman", Times, serif' }}>
        {cert.intern?.firstName} {cert.intern?.lastName}
      </div>
      <div style={{ fontSize:14, color:'#64748b', margin:'16px 0 8px' }}>for outstanding performance and successful completion of the internship in</div>
      <div style={{ fontSize:26, fontWeight:700, color:'#0A3D62', marginBottom:32, display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:32 }}>{cert.category?.icon || '🚀'}</span>
        {cert.category?.name}
      </div>

      {/* Stats row */}
      <div style={{ display:'flex', gap:60, marginBottom:40, background:'rgba(116, 185, 255, 0.05)', padding:'15px 40px', borderRadius:20, border:'1px solid rgba(116, 185, 255, 0.2)' }}>
        {[
          ['Grade', cert.grade, gradeColor(cert.grade)],
          ['Final Score', `${cert.score}%`, '#0A3D62'],
          ['Completion', '100%', '#10b981'],
        ].map(([l,v,c])=>(
          <div key={l} style={{ textAlign:'center' }}>
            <div style={{ fontSize:26, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:2, fontWeight:700 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* QR + footer */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', borderTop:'1px solid #e2e8f0', paddingTop:25 }}>
        <div style={{ display:'flex', alignItems:'center', gap:15 }}>
            {cert.qrCode && <div style={{ padding:6, background:'white', border:'1px solid #e2e8f0', borderRadius:8 }}><img src={cert.qrCode} alt="QR" style={{ width:64, height:64 }}/></div>}
            <div style={{ textAlign:'left' }}>
              <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase' }}>Verification ID</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#0A3D62', fontFamily:'monospace' }}>{cert.certificateNumber}</div>
              <div style={{ fontSize:10, color:'#94a3b8', marginTop:4 }}>Issued: {new Date(cert.issueDate).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div>
            </div>
        </div>

        <div style={{ textAlign:'center' }}>
            <div style={{ color:'#0A3D62', fontWeight:900, fontSize:22, fontStyle:'italic', marginBottom:2, fontFamily:'"Brush Script MT", cursive' }}>RIMP Board</div>
            <div style={{ width:160, borderTop:'2px solid #0A3D62', paddingTop:6, fontSize:11, color:'#64748b', fontWeight:700, textTransform:'uppercase' }}>
                Authorized Signature
            </div>
        </div>
      </div>
    </div>
  </div>
));
CertTemplate.displayName = 'CertTemplate';

/* ── Reusable Download Function ─────────────────────── */
const downloadCertificate = async (cert, elementId) => {
  try {
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF }       = await import('jspdf');
    const el = document.getElementById(elementId);
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null });
    const img    = canvas.toDataURL('image/png');
    const pdf    = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
    pdf.addImage(img, 'PNG', 0, 0, 297, 210);
    pdf.save(`RIMP-${cert.certificateNumber}.pdf`);
    await certificateService.download(cert._id).catch(()=>{});
    toast.success('Certificate downloaded!');
  } catch (err) {
    console.error(err);
    toast.error('Download failed');
  }
};

/* ── Enrollment Progress Card ─────────────────────────── */
function EnrollmentCard({ enrollment, cert, onGenerate, generating }) {
  const pct  = enrollment.taskProgress.percentage;
  const done = enrollment.taskProgress.approved;
  const total = enrollment.taskProgress.total;
  const allDone = total > 0 && done === total;

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="h-1.5 w-full" style={{ background: allDone ? '#10b981' : 'linear-gradient(90deg,#0A3D62,#74B9FF)', backgroundSize:`${pct}% 100%`, backgroundRepeat:'no-repeat', backgroundColor:'#e2e8f0' }}/>

      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shadow-sm"
              style={{ color: enrollment.category?.color || '#0A3D62' }}>
              {enrollment.category?.icon || '📚'}
            </div>
            <div>
              <h3 className="font-bold text-primary leading-tight">{enrollment.category?.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{enrollment.selectedDuration} weeks • Started {new Date(enrollment.enrolledAt).toLocaleDateString()}</p>
            </div>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${allDone ? 'bg-green-100 text-green-800' : 'bg-blue-50 text-primary'}`}>
            {allDone ? '✅ Complete' : `${done}/${total} done`}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-400">Task Progress</span>
            <span className="font-bold text-primary">{pct}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:1 }}
              className="h-full rounded-full"
              style={{ background: allDone ? '#10b981' : 'linear-gradient(90deg,#0A3D62,#74B9FF)' }}/>
          </div>
        </div>

        {/* Action Links */}
        <div className="mb-4 flex gap-2">
            <Link to={`/my-tasks/${enrollment._id}`} className="text-xs font-bold text-secondary hover:underline flex items-center gap-1">
                View Tasks →
            </Link>
        </div>

        {/* Certificate status */}
        {cert ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
            <span className="text-2xl">🎓</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-green-800">Certificate Issued!</p>
              <p className="text-xs text-green-600">Grade {cert.grade} • {GRADE_LABEL[cert.grade]}</p>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-lg text-white" style={{ background: gradeColor(cert.grade) }}>{cert.grade}</span>
          </div>
        ) : allDone ? (
          <button onClick={() => onGenerate(enrollment._id)}
            disabled={generating}
            className="w-full py-3 font-bold rounded-xl text-white flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-all shadow-sm"
            style={{ background: 'linear-gradient(90deg,#0A3D62,#1a6ba0)' }}>
            {generating
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Generating…</>
              : '🎓 Generate My Certificate'}
          </button>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <p className="text-sm text-slate-500">🔒 Complete all {total} tasks to unlock</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Certificate Detail Modal ─────────────────────────── */
function CertModal({ cert, onClose }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    await downloadCertificate(cert, `cert-${cert._id}`);
    setDownloading(false);
  };

  const shareUrl = `${window.location.origin}/verify/${cert.certificateNumber}`;
  const copyShareLink = () => {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
        className="max-w-4xl w-full" onClick={e=>e.stopPropagation()}>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-4">
              <button onClick={onClose} className="text-white/80 hover:text-white text-sm flex items-center gap-1 transition-colors">
                ← Back
              </button>
              <button onClick={copyShareLink} className="text-white/80 hover:text-white text-sm flex items-center gap-1 transition-colors">
                🔗 Copy Share Link
              </button>
          </div>
          <button onClick={handleDownload} disabled={downloading}
            className="px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-60 hover:opacity-90 transition text-white shadow-lg"
            style={{ background:'linear-gradient(90deg,#0A3D62,#74B9FF)' }}>
            {downloading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Downloading…</> : '⬇ Download PDF'}
          </button>
        </div>

        {/* Scale to fit screen */}
        <div className="overflow-hidden rounded-xl shadow-2xl bg-white" style={{ transform:'scale(0.85)', transformOrigin:'top center', marginBottom:'-100px' }}>
          <CertTemplate cert={cert}/>
        </div>

        <div className="mt-8 text-center text-white/60 text-xs bg-black/20 py-3 rounded-full backdrop-blur-sm max-w-sm mx-auto">
          Certificate ID: <span className="font-mono font-bold text-white/90">{cert.certificateNumber}</span>
          &nbsp;•&nbsp; Verified by RIMP AI
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══ Main Page ═══════════════════════════════════════════ */
export const CertificatesPage = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [certs,       setCerts]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [generating,  setGenerating]  = useState(null); // enrollmentId being generated
  const [viewCert,    setViewCert]    = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [enrRes, certRes] = await Promise.all([
        internshipTaskService.getMyEnrollments(),
        certificateService.getMine(),
      ]);
      if (enrRes.data?.success)  setEnrollments(enrRes.data.enrollments || []);
      if (certRes.data?.success) setCerts(certRes.data.data || []);
    } catch {
      toast.error('Failed to load certificate data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async (enrollmentId) => {
    setGenerating(enrollmentId);
    const tid = toast.loading('🎓 Generating your verified certificate…');
    try {
      const res = await certificateService.generateForEnrollment(enrollmentId);
      if (res.data?.success) {
        toast.success(res.data.message || '🎓 Certificate generated!', { id: tid });
        await load();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate certificate';
      toast.error(msg, { id: tid });
    } finally {
      setGenerating(null);
    }
  };

  // Map cert by categoryId
  const certByCategory = {};
  certs.forEach(c => { certByCategory[c.category?._id] = c; });

  return (
    <div className="min-h-screen" style={{ background:'#F1F2F6' }}>
      <Navbar/>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-primary">🎓 My Certificates</h1>
          <p className="text-slate-500 mt-1">Complete all tasks in a course to earn your AI-verified certificate.</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-5xl mb-3">🎓</div>
            <h3 className="text-xl font-bold text-primary mb-2">No Internships Yet</h3>
            <p className="text-slate-500">Enroll in a course and complete all AI tasks to earn a verified certificate.</p>
          </div>
        ) : (
          <>
            {/* Earned Certificates Banner */}
            {certs.length > 0 && (
              <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                className="mb-6 rounded-2xl p-5 border border-green-200 flex items-center gap-4"
                style={{ background:'linear-gradient(135deg,rgba(16,185,129,0.07),rgba(16,185,129,0.03))' }}>
                <span className="text-4xl">🏆</span>
                <div className="flex-1">
                  <h3 className="font-bold text-green-800">You've earned {certs.length} certificate{certs.length>1?'s':''}!</h3>
                  <p className="text-sm text-green-600">Click "View Certificate" to preview and download your verified PDF.</p>
                </div>
              </motion.div>
            )}

            {/* Issued Certificates */}
            {certs.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-primary mb-4">✅ Issued Certificates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {certs.map((cert, i) => (
                    <motion.div key={cert._id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}
                      className="bg-white rounded-2xl border-2 border-green-200 shadow-sm overflow-hidden">
                      <div className="h-2" style={{ background: `linear-gradient(90deg,${gradeColor(cert.grade)},#74B9FF)` }}/>
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{cert.category?.icon || '📚'}</span>
                            <h3 className="font-bold text-primary text-sm">{cert.category?.name}</h3>
                          </div>
                          <span className="text-xs font-extrabold px-2.5 py-1 rounded-full text-white"
                            style={{ background: gradeColor(cert.grade) }}>
                            {cert.grade}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {[['Score',`${cert.score}%`],['Tasks',`${cert.tasksCompleted}/${cert.totalTasks}`],['Result',GRADE_LABEL[cert.grade]]].map(([l,v])=>(
                            <div key={l} className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
                              <p className="text-xs font-bold text-primary">{v}</p>
                              <p className="text-xs text-slate-400">{l}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-slate-400 mb-3 font-mono">{cert.certificateNumber}</p>
                        <div className="flex gap-2">
                          <button onClick={() => setViewCert(cert)}
                            className="flex-1 py-2 text-sm font-bold text-white rounded-xl hover:opacity-90 transition shadow-md"
                            style={{ background:'linear-gradient(90deg,#0A3D62,#1a6ba0)' }}>
                            View
                          </button>
                          <button onClick={() => downloadCertificate(cert, `cert-hidden-${cert._id}`)}
                            className="px-4 py-2 text-sm font-bold border-2 border-primary text-primary rounded-xl hover:bg-primary hover:text-white transition">
                            ⬇
                          </button>
                        </div>
                        {/* Hidden template for list download */}
                        <div style={{ position:'absolute', left:'-9999px', top:0 }}>
                            <CertTemplate cert={cert} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Internships Progress */}
            <div>
              <h2 className="text-lg font-bold text-primary mb-4">
                {certs.length > 0 ? '📋 Other Internships' : '📋 Your Internships'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrollments
                  .filter(en => !certByCategory[en.category?._id])
                  .map(en => (
                    <EnrollmentCard
                      key={en._id}
                      enrollment={en}
                      cert={certByCategory[en.category?._id]}
                      onGenerate={handleGenerate}
                      generating={generating === en._id}
                    />
                  ))}
                {enrollments.filter(en => !certByCategory[en.category?._id]).length === 0 && (
                  <div className="col-span-2 text-center py-8 text-slate-400">
                    <p>🎉 All your internships have certificates!</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Certificate Detail Modal */}
      <AnimatePresence>
        {viewCert && <CertModal cert={viewCert} onClose={() => setViewCert(null)}/>}
      </AnimatePresence>
    </div>
  );
};

export default CertificatesPage;
