import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { internshipTaskService, groqTaskService } from '../services';
import { Navbar } from '../components/layout/Navbar';
import MentorChatbot from '../components/MentorChatbot';
import toast from 'react-hot-toast';

const STATUS_CFG = {
  locked:       { label: 'Locked',      icon: '🔒', bg: 'bg-gray-200',    text: 'text-gray-600' },
  unlocked:     { label: 'Ready',       icon: '🟢', bg: 'bg-green-100',   text: 'text-green-800' },
  'in-progress':{ label: 'In Progress', icon: '🔄', bg: 'bg-blue-100',    text: 'text-blue-800' },
  submitted:    { label: 'Submitted',   icon: '📤', bg: 'bg-yellow-100',  text: 'text-yellow-800' },
  approved:     { label: 'Approved',    icon: '✅', bg: 'bg-green-200',   text: 'text-green-900' },
  rejected:     { label: 'Needs Work',  icon: '❌', bg: 'bg-red-100',     text: 'text-red-800' },
};

/* ── Inline AI Mentor Chat ───────────────────────────────── */
function MentorChatPanel({ currentTaskId }) {
  const [msgs, setMsgs] = useState([{
    role: 'assistant',
    content: "👋 Hi! I'm your AI Mentor powered by Groq AI (LLaMA 3.3 70B). Ask me anything about your tasks — I'll guide you with hints and explanations without giving away direct answers!",
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async () => {
    const t = input.trim(); if (!t || loading) return;
    setMsgs(p => [...p, { role: 'student', content: t }]);
    setInput(''); setLoading(true);
    try {
      const res = await internshipTaskService.chat({ message: t, taskId: currentTaskId || undefined, conversationHistory: msgs.slice(-6) });
      if (res.data?.success) setMsgs(p => [...p, { role: 'assistant', content: res.data.reply }]);
      else throw new Error();
    } catch { setMsgs(p => [...p, { role: 'assistant', content: 'Sorry, try again in a moment!' }]); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-[540px] bg-white rounded-xl border border-light shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 flex items-center gap-3 flex-shrink-0" style={{ background: 'linear-gradient(90deg,#0A3D62,#1e5a8e)' }}>
        <span className="text-2xl">🤖</span>
        <div><p className="text-white font-bold text-sm">AI Mentor Chat</p><p className="text-blue-200 text-xs">Groq AI • LLaMA 3.3 70B • Guidance mode</p></div>
        <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
      </div>
      {currentTaskId && <div className="bg-secondary/10 border-b border-secondary/20 px-4 py-1.5 text-xs text-primary font-medium">📋 Contextual help active for selected task</div>}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-light">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'student' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-1 text-white">🤖</div>}
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
              m.role === 'student'
                ? 'bg-primary text-white rounded-br-md'
                : 'bg-white text-gray-800 border border-light rounded-bl-md'
            }`}>
              <div className="whitespace-pre-wrap break-words">{m.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs mr-2 text-white">🤖</div>
            <div className="bg-white border border-light px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
              <div className="flex gap-1.5">{[0,150,300].map(d=><div key={d} className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>)}</div>
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* Input */}
      <div className="border-t border-light px-4 py-3 bg-white flex-shrink-0">
        <div className="flex gap-2">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}
            placeholder="Ask about your task, concepts, or approach…" disabled={loading}
            className="flex-1 bg-light border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"/>
          <button onClick={send} disabled={loading||!input.trim()} className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-all flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-1.5">Mentorship mode — I guide, you learn 🎓</p>
      </div>
    </div>
  );
}

/* ── Task Detail View ────────────────────────────────────── */
function TasksView({ enrollmentId, onBack }) {
  const [tasks, setTasks] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [files, setFiles] = useState([]);
  const [githubLink, setGithubLink] = useState('');
  const [message, setMessage] = useState('');
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try { setLoading(true); const res = await internshipTaskService.getTasksByEnrollment(enrollmentId);
      if (res.data?.success) { setTasks(res.data.tasks||[]); setEnrollment(res.data.enrollment); }
    } catch { toast.error('Failed to load tasks'); } finally { setLoading(false); }
  }, [enrollmentId]);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    const tid = toast.loading('🤖 Generating AI tasks with Groq LLaMA 3.3 70B…');
    try {
      const res = await groqTaskService.generateTasks(enrollmentId);
      if (res.data?.success) { toast.success(res.data.message||'✅ Tasks generated!',{id:tid}); await load(); }
    } catch (err) { toast.error(err.response?.data?.message||'Failed to generate',{id:tid}); }
    finally { setGenerating(false); }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
    if (fileRef.current) fileRef.current.value = ''; // clear input to allow re-selecting same file
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (taskId) => {
    if (!message && !githubLink && files.length === 0) { toast.error('Provide a message, files, or GitHub link'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      if (githubLink) fd.append('githubLink', githubLink);
      if (message) fd.append('message', message);
      
      const res = await internshipTaskService.submitTask(taskId, fd);
      if (res.data?.success) { 
        toast.success(res.data.message||'Submitted!'); 
        setFiles([]); 
        setGithubLink(''); 
        setMessage(''); 
        await load(); 
      }
    } catch (err) { toast.error(err.response?.data?.message||'Submission failed'); }
    finally { setSubmitting(false); }
  };

  const done = tasks.filter(t=>t.status==='approved').length;
  const pct = tasks.length>0?Math.round((done/tasks.length)*100):0;

  if (loading) return <div className="flex justify-center py-16"><div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <button onClick={onBack} className="text-secondary hover:text-primary font-medium transition-colors">← My Internships</button>
        <span className="text-gray-400">/</span>
        <span className="text-primary font-semibold">{enrollment?.categoryName||'Tasks'}</span>
      </div>

      {/* Progress */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-xl border border-light shadow-sm p-4 mb-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-600">Overall Progress</span>
            <span className="font-bold text-primary">{done}/{tasks.length} approved</span>
          </div>
          <div className="w-full h-3 bg-light rounded-full overflow-hidden">
            <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:1}} className="h-full rounded-full" style={{background:'linear-gradient(90deg,#0A3D62,#74B9FF)'}}/>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-light rounded-xl p-1 border border-gray-200 w-fit">
        {[{id:'tasks',label:'📋 Tasks'},{id:'mentor',label:'🤖 AI Mentor'}].map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab===tab.id?'bg-primary text-white shadow':'text-gray-600 hover:text-primary'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Tasks Tab */}
        {activeTab==='tasks' && (
          <motion.div key="tasks" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
            {tasks.length===0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-light shadow-sm">
                <div className="text-5xl mb-3">🤖</div>
                <h3 className="text-xl font-bold text-primary mb-2">No AI Tasks Generated Yet</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">Click below and Groq AI (LLaMA 3.3 70B) will generate personalised tasks for your internship category.</p>
                <button onClick={handleGenerate} disabled={generating}
                  className="px-8 py-3 bg-primary text-white font-bold rounded-xl disabled:opacity-60 hover:opacity-90 transition-all flex items-center gap-2 mx-auto shadow-md">
                  {generating?<><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Generating…</>:'⚡ Generate My AI Tasks'}
                </button>
                <p className="text-xs text-gray-400 mt-3">Powered by Groq AI • LLaMA 3.3 70B</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task, idx) => {
                  const cfg = STATUS_CFG[task.status]||STATUS_CFG.locked;
                  const isLocked = task.status==='locked';
                  const isExpanded = expanded===task._id;
                  const canSubmit = ['unlocked','in-progress','rejected'].includes(task.status);
                  const order = task.taskOrder||task.orderNumber||idx+1;
                  return (
                    <motion.div key={task._id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:idx*0.04}}
                      className={`rounded-xl border transition-all ${isLocked?'bg-gray-50 border-gray-200 opacity-70':isExpanded?'bg-white border-primary/30 shadow-md':'bg-white border-light shadow-sm hover:border-secondary/50 hover:shadow-md'}`}>
                      <div className={`flex items-center gap-3 p-4 ${isLocked?'cursor-not-allowed':'cursor-pointer'}`}
                        onClick={()=>!isLocked&&setExpanded(isExpanded?null:task._id)}>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                          {task.status==='approved'?'✓':order}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold truncate ${isLocked?'text-gray-400':'text-primary'}`}>{task.title}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">Week {task.weekNumber} • Due: {task.deadlineDate?new Date(task.deadlineDate).toLocaleDateString():'—'}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.text}`}>{cfg.icon} {cfg.label}</span>
                        {task.evaluation?.score!=null && (
                          <div className={`text-right flex-shrink-0 ${task.evaluation.status==='PASS'?'text-green-700':'text-red-600'}`}>
                            <div className="text-base font-bold">{task.evaluation.score}<span className="text-xs text-gray-400">/100</span></div>
                          </div>
                        )}
                        {!isLocked && <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded?'rotate-180':''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.25}} className="overflow-hidden border-t border-light">
                            <div className="px-4 pb-4 pt-3 space-y-4">
                              <p className="text-sm text-gray-700 leading-relaxed">{task.description}</p>
                              {task.requirements?.length>0 && (
                                <div>
                                  <h5 className="text-sm font-bold text-primary mb-2">Requirements</h5>
                                  <ul className="space-y-1">{task.requirements.map((r,i)=><li key={i} className="text-sm text-gray-600 flex gap-2"><span className="text-secondary font-bold">•</span>{r}</li>)}</ul>
                                </div>
                              )}
                              {task.evaluation && (
                                <div className={`rounded-xl p-4 border ${task.evaluation.status==='PASS'?'bg-green-50 border-green-200':'bg-red-50 border-red-200'}`}>
                                  <h5 className="text-sm font-bold text-primary mb-3">🤖 AI Evaluation Result</h5>
                                  <div className="grid grid-cols-3 gap-2 mb-3">
                                    {[['Score',task.evaluation.score],['Plagiarism',`${task.evaluation.plagiarism_percent}%`],['Result',task.evaluation.status]].map(([l,v])=>(
                                      <div key={l} className="text-center bg-white rounded-lg p-2 border border-gray-100">
                                        <div className={`text-lg font-bold ${l==='Result'?(task.evaluation.status==='PASS'?'text-green-700':'text-red-600'):'text-primary'}`}>{v}</div>
                                        <div className="text-xs text-gray-500">{l}</div>
                                      </div>
                                    ))}
                                  </div>
                                  <p className="text-sm text-gray-700">{task.evaluation.feedback}</p>
                                  {task.evaluation.improvements?.length>0&&(
                                    <ul className="mt-2 space-y-1">{task.evaluation.improvements.map((im,i)=><li key={i} className="text-xs text-yellow-700 flex gap-1"><span>→</span>{im}</li>)}</ul>
                                  )}
                                </div>
                              )}
                              {canSubmit && (
                                <div className="bg-light rounded-xl p-4 space-y-3">
                                  <h5 className="text-sm font-bold text-primary">{task.status==='rejected'?'🔄 Resubmit':'📤 Submit Your Work'}</h5>
                                  
                                  <div className="space-y-2">
                                    <input type="file" multiple accept=".pdf,.zip,.doc,.docx" ref={fileRef} onChange={handleFileChange}
                                      className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:text-sm hover:file:opacity-90 file:cursor-pointer bg-white rounded-lg border border-gray-200 p-1"/>
                                    
                                    {files.length > 0 && (
                                      <div className="flex flex-wrap gap-2 pt-1">
                                        {files.map((f, i) => (
                                          <div key={i} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs border border-blue-100">
                                            <span className="truncate max-w-[150px]">{f.name}</span>
                                            <button onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700 font-bold">×</button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <input type="url" placeholder="https://github.com/username/repo" value={githubLink} onChange={e=>setGithubLink(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary"/>
                                  <textarea rows={3} placeholder="Describe your approach and any notes…" value={message} onChange={e=>setMessage(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary resize-none"/>
                                  
                                  <button onClick={()=>handleSubmit(task._id)} disabled={submitting}
                                    className="w-full py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                                    {submitting?<><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Evaluating with AI…</>:'🚀 Submit for AI Review'}
                                  </button>
                                </div>
                              )}
                              <button onClick={()=>setActiveTab('mentor')}
                                className="w-full py-2 text-sm text-primary hover:text-secondary border border-secondary/40 hover:border-secondary rounded-xl transition-all font-medium">
                                🤖 Ask AI Mentor about this task
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* AI Mentor Tab */}
        {activeTab==='mentor' && (
          <motion.div key="mentor" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
            <div className="mb-4 bg-white rounded-xl p-4 border border-secondary/30 flex items-center gap-3 shadow-sm"
              style={{background:'linear-gradient(135deg,rgba(10,61,98,0.04),rgba(116,185,255,0.08))'}}>
              <span className="text-2xl">🤖</span>
              <div>
                <p className="font-bold text-primary text-sm">AI Mentor — Groq AI (LLaMA 3.3 70B)</p>
                <p className="text-xs text-gray-500">Guides you with hints and explanations — no direct answers.{expanded&&<span className="text-secondary ml-1">Task context is active.</span>}</p>
              </div>
            </div>
            <MentorChatPanel currentTaskId={expanded}/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Enrollment Selector (main view) ─────────────────────── */
export default function TasksPage() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    internshipTaskService.getMyEnrollments()
      .then(res => { if(res.data?.success) setEnrollments(res.data.enrollments||[]); })
      .catch(()=>toast.error('Failed to load enrollments'))
      .finally(()=>setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-light">
      <Navbar/>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {!selected ? (
          <>
            <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} className="mb-8">
              <h1 className="text-3xl font-bold text-primary">📋 My AI Tasks</h1>
              <p className="text-gray-500 mt-1">Select an internship to view and complete your AI-generated tasks.</p>
            </motion.div>

            {loading ? (
              <div className="flex justify-center py-20"><div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"/></div>
            ) : enrollments.length===0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-light shadow-sm">
                <div className="text-5xl mb-3">🎓</div>
                <h3 className="text-xl font-bold text-primary mb-2">No Active Internships</h3>
                <p className="text-gray-500 mb-6">Enroll in an internship and AI will generate personalised tasks for you.</p>
                <button onClick={()=>navigate('/categories')} className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition shadow-sm">
                  Browse Internships
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrollments.map((en, i) => {
                  const pct = en.taskProgress.percentage;
                  return (
                    <motion.div key={en._id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}
                      onClick={()=>setSelected(en._id)}
                      className="bg-white rounded-xl p-5 border border-light shadow-sm hover:border-secondary/60 hover:shadow-md cursor-pointer transition-all group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-primary group-hover:text-secondary transition-colors">{en.category?.name||'Internship'}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">{en.selectedDuration} weeks • Started {new Date(en.enrolledAt).toLocaleDateString()}</p>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-light flex items-center justify-center text-2xl ml-3 flex-shrink-0 border border-gray-100 shadow-sm" style={{color:en.category?.color||'#0A3D62'}}>
                          {en.category?.icon||'📚'}
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-gray-500">Task Progress</span>
                          <span className="font-bold text-primary">{en.taskProgress.approved}/{en.taskProgress.total} approved</span>
                        </div>
                        <div className="w-full h-2 bg-light rounded-full overflow-hidden border border-gray-100">
                          <div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:'linear-gradient(90deg,#0A3D62,#74B9FF)'}}/>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        {en.taskProgress.total===0
                          ? <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-semibold">⚡ Generate AI tasks</span>
                          : <span className="text-xs text-gray-400">{en.taskProgress.total} tasks • {pct}% done</span>}
                        <span className="text-sm text-secondary font-semibold group-hover:text-primary transition-colors">Open →</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* AI Info */}
            <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.4}}
              className="mt-8 bg-white rounded-xl p-5 border border-secondary/30 shadow-sm flex items-start gap-4"
              style={{background:'linear-gradient(135deg,rgba(10,61,98,0.03),rgba(116,185,255,0.07))'}}>
              <span className="text-3xl">🤖</span>
              <div>
                <h4 className="font-bold text-primary mb-1">Powered by Groq AI (LLaMA 3.3 70B)</h4>
                <p className="text-gray-500 text-sm">Tasks are AI-generated per your internship. Each submission is auto-evaluated with score, plagiarism check, and feedback. The AI Mentor tab guides you — not gives answers.</p>
              </div>
            </motion.div>
          </>
        ) : (
          <TasksView enrollmentId={selected} onBack={()=>setSelected(null)}/>
        )}
      </div>
      <MentorChatbot currentTaskId={null}/>
    </div>
  );
}
