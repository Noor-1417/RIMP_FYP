import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, ProgressBar } from '../components/common/LayoutElements';
import { Button } from '../components/common/FormElements';
import { Navbar } from '../components/layout/Navbar';
import { quizService } from '../services';
import toast from 'react-hot-toast';

export const QuizPage = ({ quizId = null }) => {
  const { id } = useParams();
  const finalQuizId = quizId || id;
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (finalQuizId) {
      fetchQuiz();
    }
  }, [finalQuizId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await quizService.getById(finalQuizId);
      setQuiz(response.data.data);
      setTimeLeft(response.data.data.timeLimit * 60); // Convert to seconds
    } catch (error) {
      toast.error('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  // Timer
  useEffect(() => {
    if (!quiz || showResults) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, showResults]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitQuiz = async () => {
    try {
      const answersArray = quiz.questions.map((q) => ({
        questionId: q._id,
        selectedAnswer: answers[q._id] || '',
      }));

      const response = await quizService.submit(finalQuizId, {
        answers: answersArray,
        timeTaken: quiz.timeLimit * 60 - timeLeft,
      });

      setResults(response.data.data);
      setShowResults(true);
      toast.success('Quiz submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit quiz');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <Navbar />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-light">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="text-center py-12">
            <p className="text-gray-600 text-lg">Quiz not found</p>
          </Card>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-light">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-primary mb-4">Quiz Complete!</h2>

                <div className="bg-gradient-to-r from-primary to-secondary p-8 rounded-lg text-white mb-6">
                  <p className="text-5xl font-bold mb-2">{results.percentage.toFixed(1)}%</p>
                  <p className="text-xl">Score: {results.score} / {results.percentage >= results.passingScore ? 'PASSED ✓' : 'FAILED ✗'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-gray-600">Your Score</p>
                    <p className="text-2xl font-bold text-primary">{results.score}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Passing Score</p>
                    <p className="text-2xl font-bold text-primary">{results.passingScore}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <ProgressBar
                    percentage={results.percentage}
                    label="Your Performance"
                    showLabel={true}
                  />
                </div>

                <div className="space-y-4">
                  <Button variant="primary" fullWidth onClick={() => navigate('/my-quizzes')}>
                    Back to Quizzes
                  </Button>
                  <Button variant="outline" fullWidth onClick={() => window.location.reload()}>
                    Retake Quiz
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-light">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Quiz Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">{quiz.title}</h1>
              <p className="text-gray-600">Question {currentQuestion + 1} of {quiz.questions.length}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-secondary">{formatTime(timeLeft)}</p>
              <p className="text-sm text-gray-600">Time Left</p>
            </div>
          </div>

          {/* Progress Bar */}
          <ProgressBar
            percentage={progress}
            label="Quiz Progress"
            showLabel={false}
          />
        </motion.div>

        {/* Question Card */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="mt-8">
            <div className="mb-8">
              <div className="flex items-start gap-4">
                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  {currentQuestion + 1}
                </div>
                <h3 className="text-xl font-bold text-primary">{question.question}</h3>
              </div>

              {question.image && (
                <img src={question.image} alt="Question" className="mt-4 rounded-lg max-w-full" />
              )}
            </div>

            {/* Answer Options */}
            <div className="space-y-3 mb-8">
              {question.type === 'mcq' && question.options ? (
                question.options.map((option, idx) => (
                  <motion.label
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center p-4 border-2 border-light rounded-lg cursor-pointer hover:border-secondary transition"
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      value={option.text}
                      checked={answers[question._id] === option.text}
                      onChange={() => handleAnswerChange(question._id, option.text)}
                      className="mr-4 w-4 h-4"
                    />
                    <span className="text-gray-700">{option.text}</span>
                  </motion.label>
                ))
              ) : question.type === 'short-answer' ? (
                <input
                  type="text"
                  placeholder="Enter your answer..."
                  value={answers[question._id] || ''}
                  onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                  className="w-full px-4 py-3 border-2 border-light rounded-lg focus:border-primary focus:outline-none"
                />
              ) : (
                <textarea
                  placeholder="Write your answer here..."
                  rows={6}
                  value={answers[question._id] || ''}
                  onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                  className="w-full px-4 py-3 border-2 border-light rounded-lg focus:border-primary focus:outline-none"
                />
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-light">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>

              <div className="flex gap-2">
                {Array.from({ length: quiz.questions.length }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQuestion(i)}
                    className={`w-8 h-8 rounded-full font-bold transition ${
                      i === currentQuestion
                        ? 'bg-primary text-white'
                        : answers[quiz.questions[i]._id]
                        ? 'bg-green-500 text-white'
                        : 'bg-light text-primary'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <Button
                variant={currentQuestion === quiz.questions.length - 1 ? 'primary' : 'outline'}
                onClick={() => {
                  if (currentQuestion === quiz.questions.length - 1) {
                    handleSubmitQuiz();
                  } else {
                    setCurrentQuestion(Math.min(quiz.questions.length - 1, currentQuestion + 1));
                  }
                }}
              >
                {currentQuestion === quiz.questions.length - 1 ? 'Submit' : 'Next'}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
