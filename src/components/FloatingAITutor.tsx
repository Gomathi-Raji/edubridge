import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  Sparkles, 
  Code, 
  HelpCircle, 
  Lightbulb, 
  Briefcase,
  Languages,
  MoreVertical,
  CheckCircle2,
  XCircle,
  BookOpen,
  ListChecks,
  X,
  MessageCircle,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message } from '../types';
import { geminiService } from '../services/geminiService';
import { profilesApi } from '../services/api';
import { useUser } from '../contexts/UserContext';

export const FloatingAITutor: React.FC = () => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quiz, setQuiz] = useState<any[] | null>(null);
  const [lessonPlan, setLessonPlan] = useState<any | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [profile, setProfile] = useState<any>(null);
  const [quizTopic, setQuizTopic] = useState('');
  const [planTopic, setPlanTopic] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (!user || initRef.current) return;
    initRef.current = true;
    (async () => {
      try {
        const p = await profilesApi.get(user.id);
        setProfile(p);
        const interests = typeof p.interests === 'string' ? JSON.parse(p.interests) : (p.interests || []);
        const goals = typeof p.learning_goals === 'string' ? JSON.parse(p.learning_goals) : (p.learning_goals || []);
        setQuizTopic(interests[0] || 'Programming');
        setPlanTopic(interests[0] || 'Web Development');
        setMessages([{
          id: '1',
          sender: 'AI Tutor',
          content: `Hello ${user.name.split(' ')[0]}! I'm your EduBridge AI tutor. Based on your profile, I see you're interested in ${interests.slice(0, 3).join(', ')} and working towards ${goals[0] || 'your learning goals'}. How can I help you today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAI: true
        }]);
      } catch {
        setMessages([{
          id: '1',
          sender: 'AI Tutor',
          content: `Hello ${user?.name?.split(' ')[0] || 'there'}! I'm your EduBridge AI tutor. How can I help you with your learning journey today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAI: true
        }]);
      }
    })();
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, quiz, isOpen]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'You',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAI: false
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setQuiz(null);
    setLessonPlan(null);

    try {
      const history = messages.map(m => ({
        role: m.isAI ? 'model' as const : 'user' as const,
        parts: [{ text: m.content }]
      }));
      
      const response = await geminiService.chat(textToSend, history);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'AI Tutor',
        content: response || "I'm sorry, I couldn't process that. Could you try again?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAI: true
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'AI Tutor',
        content: "Oops! I'm having a bit of trouble connecting to my brain right now. Please check your connection and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAI: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    if (isLoading) return;
    
    if (action === 'Generate quiz') {
      setIsLoading(true);
      setQuiz(null);
      setLessonPlan(null);
      try {
        const quizData = await geminiService.generateQuiz(quizTopic || "Programming Fundamentals");
        setQuiz(quizData);
        setQuizAnswers({});
      } catch (error) {
        console.error("Quiz Error:", error);
      } finally {
        setIsLoading(false);
      }
    } else if (action === 'Lesson plan') {
      setIsLoading(true);
      setQuiz(null);
      setLessonPlan(null);
      try {
        const plan = await geminiService.generateLessonPlan(planTopic || "Introduction to Programming");
        setLessonPlan(plan);
      } catch (error) {
        console.error("Lesson Plan Error:", error);
      } finally {
        setIsLoading(false);
      }
    } else if (action === 'Explain concept') {
      const interests = profile ? (typeof profile.interests === 'string' ? JSON.parse(profile.interests) : profile.interests) : [];
      const topic = interests[0] || 'Programming';
      handleSend(`Explain a key concept related to ${topic} that I should know as a ${profile?.experience_level || 'beginner'}.`);
    } else if (action === 'Practice problems') {
      const skills = profile ? (typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills) : [];
      const skill = skills[0] || 'JavaScript';
      handleSend(`Give me a practice problem to improve my ${skill} skills.`);
    } else if (action === 'Career advice') {
      const goals = profile ? (typeof profile.learning_goals === 'string' ? JSON.parse(profile.learning_goals) : profile.learning_goals) : [];
      const goal = goals[0] || 'getting a tech job';
      handleSend(`I want to achieve: ${goal}. What career advice can you give me based on my current skills and interests?`);
    }
  };

  const handleQuizAnswer = (index: number, answer: string) => {
    setQuizAnswers(prev => ({ ...prev, [index]: answer }));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-[calc(100vw-32px)] sm:w-[400px] h-[70vh] sm:h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">EduBridge AI Tutor</h3>
                  <div className="flex items-center gap-1.5">
                    <div className={cn("w-1.5 h-1.5 rounded-full", isLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-400")} />
                    <span className="text-[10px] font-medium opacity-80">
                      {isLoading ? "Thinking..." : "Online"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Minimize2 size={18} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-3 max-w-[90%]",
                    msg.isAI ? "mr-auto" : "ml-auto flex-row-reverse"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-[10px]",
                    msg.isAI ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"
                  )}>
                    {msg.isAI ? "AI" : (user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || "U")}
                  </div>
                  <div className="space-y-1">
                    <div className={cn(
                      "p-3 rounded-2xl shadow-sm text-xs leading-relaxed",
                      msg.isAI ? "bg-white text-slate-800 rounded-tl-none" : "bg-indigo-600 text-white rounded-tr-none"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex gap-3 mr-auto">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Sparkles size={12} className="animate-pulse" />
                  </div>
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                    <div className="flex gap-1 items-center">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                          className="w-1 h-1 bg-indigo-400 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {quiz && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-4">
                  <p className="text-xs font-bold text-indigo-600 flex items-center gap-2">
                    <Sparkles size={14} /> AI Quiz
                  </p>
                  {quiz.map((q, i) => (
                    <div key={i} className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-800">{q.question}</p>
                      <div className="grid grid-cols-1 gap-1">
                        {q.options.map((opt: string, j: number) => (
                          <button
                            key={j}
                            onClick={() => handleQuizAnswer(i, opt)}
                            className={cn(
                              "text-left px-3 py-2 rounded-lg text-[10px] border transition-all",
                              quizAnswers[i] === opt ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 hover:border-indigo-300"
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {lessonPlan && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3">
                  <p className="text-xs font-bold text-emerald-600 flex items-center gap-2">
                    <BookOpen size={14} /> Lesson Plan: {lessonPlan.topic}
                  </p>
                  <div className="space-y-2">
                    {lessonPlan.keyConcepts.slice(0, 2).map((c: any, i: number) => (
                      <div key={i} className="bg-white p-2 rounded-lg border border-emerald-50">
                        <p className="text-[10px] font-bold text-slate-800">{c.concept}</p>
                        <p className="text-[9px] text-slate-500 line-clamp-2">{c.explanation}</p>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setLessonPlan(null)}
                    className="w-full py-2 bg-emerald-600 text-white text-[10px] font-bold rounded-lg"
                  >
                    View Full Plan
                  </button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 border-t border-slate-100 bg-white flex gap-2 overflow-x-auto no-scrollbar">
              {[
                { label: 'Explain', icon: HelpCircle },
                { label: 'Quiz', icon: Sparkles },
                { label: 'Plan', icon: BookOpen },
                { label: 'Career', icon: Briefcase },
              ].map((action, i) => (
                <button 
                  key={i}
                  onClick={() => handleQuickAction(action.label === 'Explain' ? 'Explain concept' : action.label === 'Quiz' ? 'Generate quiz' : action.label === 'Plan' ? 'Lesson plan' : 'Career advice')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all whitespace-nowrap"
                >
                  <action.icon size={12} />
                  {action.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="relative flex items-center gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask your tutor..."
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs transition-all"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300",
          isOpen ? "bg-slate-800 text-white" : "bg-indigo-600 text-white"
        )}
      >
        {isOpen ? <Minimize2 size={24} /> : <MessageCircle size={24} />}
        {!isOpen && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold"
          >
            1
          </motion.div>
        )}
      </motion.button>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
