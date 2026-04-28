import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiClock, FiAlertCircle, FiCheckCircle, FiChevronRight, 
  FiChevronLeft, FiFlag, FiArrowLeft, FiAward
} from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Navbar } from '../components/layout/Navbar';

export const QuizTakePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const fetchQuiz = useCallback(async () => {
    try {
      const res = await api.get(`/quizzes/${id}`);
      if (res.data.success) {
        setQuiz(res.data.data);
        setTimeRemaining(res.data.data.timeLimit * 60);
      }
    } catch (err) {
      toast.error('Failed to load quiz');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  // Timer logic
  useEffect(() => {
    if (!quiz || result || timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, result, timeRemaining]);

  const handleSelectOption = (questionId, optionText) => {
    setAnswers({ ...answers, [questionId]: optionText });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    // Check if all questions answered
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < quiz.questions.length && timeRemaining > 0) {
      if (!window.confirm(`You have only answered ${answeredCount}/${quiz.questions.length} questions. Submit anyway?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([qId, selected]) => ({
        questionId: qId,
        selectedAnswer: selected
      }));

      const res = await api.post(`/quizzes/${id}/submit`, {
        answers: formattedAnswers,
        timeTaken: (quiz.timeLimit * 60) - timeRemaining
      });

      if (res.data.success) {
        setResult(res.data.data);
        toast.success('Quiz submitted successfully!');
      }
    } catch (err) {
      toast.error('Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100"
          >
            <div className={`p-10 text-center text-white ${result.isPassed ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                {result.isPassed ? <FiAward size={40} /> : <FiAlertCircle size={40} />}
              </div>
              <h1 className="text-3xl font-extrabold mb-2">
                {result.isPassed ? 'Congratulations!' : 'Keep Practicing!'}
              </h1>
              <p className="opacity-90 font-medium">
                {result.isPassed ? "You've successfully passed the theory assessment." : "You didn't reach the passing score this time."}
              </p>
            </div>

            <div className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Your Score</p>
                  <p className={`text-4xl font-black ${result.isPassed ? 'text-emerald-500' : 'text-red-500'}`}>{Math.round(result.percentage)}%</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Passing Score</p>
                  <p className="text-4xl font-black text-slate-700">{result.passingScore}%</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
                >
                  Back to Dashboard
                </button>
                {!result.isPassed && (
                   <button 
                   onClick={() => window.location.reload()}
                   className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-[0.98]"
                 >
                   Try Again
                 </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const q = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Quiz Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
              <FiArrowLeft size={20} />
            </button>
            <h2 className="font-bold text-slate-800 hidden sm:block">{quiz.title}</h2>
          </div>

          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono font-bold ${timeRemaining < 60 ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
              <FiClock />
              {formatTime(timeRemaining)}
            </div>
            <button 
              onClick={handleSubmit}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-500/20"
            >
              Submit
            </button>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 w-full">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-primary"
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          
          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-100 shadow-slate-200/50"
            >
              <div className="flex flex-col gap-8">
                <div className="space-y-4">
                  <p className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-xs">
                      {currentQuestion + 1}
                    </span>
                    Question {currentQuestion + 1} of {quiz.questions.length}
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight">
                    {q.question}
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {q.options.map((opt, idx) => {
                    const isSelected = answers[q._id] === opt.text;
                    return (
                      <button 
                        key={idx}
                        onClick={() => handleSelectOption(q._id, opt.text)}
                        className={`group flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                          isSelected 
                          ? 'bg-blue-50 border-primary text-primary shadow-md shadow-blue-500/10' 
                          : 'bg-white border-slate-100 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors ${
                          isSelected ? 'bg-primary border-primary text-white' : 'border-slate-200 text-slate-400 group-hover:border-slate-400'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="font-semibold text-lg">{opt.text}</span>
                        {isSelected && (
                          <div className="ml-auto w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white">
                            <FiCheckCircle size={14} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <button 
              disabled={currentQuestion === 0}
              onClick={() => setCurrentQuestion(prev => prev - 1)}
              className="flex items-center gap-2 px-6 py-3 font-bold text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all"
            >
              <FiChevronLeft size={20} />
              Previous
            </button>
            
            <div className="flex gap-2">
              {quiz.questions.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === currentQuestion ? 'bg-primary w-6' : (answers[quiz.questions[idx]._id] ? 'bg-blue-200' : 'bg-slate-200')
                  }`}
                />
              ))}
            </div>

            {currentQuestion === quiz.questions.length - 1 ? (
              <button 
                onClick={handleSubmit}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
              >
                Finish Quiz
                <FiFlag />
              </button>
            ) : (
              <button 
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
              >
                Next
                <FiChevronRight />
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm font-medium">
            <FiAlertCircle />
            <span>Warning: Exiting the page or closing the tab will submit your quiz automatically.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizTakePage;
