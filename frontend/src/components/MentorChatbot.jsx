import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { internshipTaskService } from '../services';

export default function MentorChatbot({ currentTaskId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your AI Mentor. Ask me anything about your internship tasks — I\'ll guide you with hints and explanations. I won\'t give you complete solutions, but I\'ll help you learn!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'student', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await internshipTaskService.chat({
        message: trimmed,
        taskId: currentTaskId || undefined,
        conversationHistory: messages.slice(-6).map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'student',
          content: m.content,
        })),
      });

      if (res.data?.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
      } else {
        throw new Error('Failed');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I had trouble processing your question. Please try again!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 flex items-center justify-center hover:shadow-xl hover:shadow-cyan-500/40 transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-2xl">🤖</span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[520px] bg-gray-900 border border-gray-700/60 rounded-2xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 to-blue-700 px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg">
                🤖
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold text-sm">AI Mentor</h4>
                <p className="text-cyan-100 text-xs opacity-80">Guidance • Hints • No direct solutions</p>
              </div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-[340px] scrollbar-thin">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'student'
                        ? 'bg-cyan-600 text-white rounded-br-md'
                        : 'bg-gray-800 text-gray-200 border border-gray-700/50 rounded-bl-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 border border-gray-700/50 px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-700/50 px-3 py-3 bg-gray-900/90">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your task..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
