import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Lock, 
  Star, 
  ChevronRight,
  Target,
  Flag,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { geminiService } from '../services/geminiService';
import { profilesApi } from '../services/api';
import { useUser } from '../contexts/UserContext';

export const LearningPath: React.FC = () => {
  const { user } = useUser();
  const [milestones, setMilestones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [goal, setGoal] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [level, setLevel] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await profilesApi.get(user!.id);
        if (!cancelled) {
          setProfile(p);
          const goals = typeof p.learning_goals === 'string' ? JSON.parse(p.learning_goals) : p.learning_goals;
          const interests = typeof p.interests === 'string' ? JSON.parse(p.interests) : p.interests;
          const primaryGoal = goals?.[0] || interests?.[0] || 'Technology';
          setGoal(primaryGoal);
          const expMap: Record<string, string> = { 'Complete Beginner': 'Level 1 Starter', 'Some Experience': 'Level 2 Explorer', 'Intermediate': 'Level 3 Builder', 'Advanced': 'Level 4 Expert' };
          setLevel(expMap[p.experience_level] || 'Level 1 Starter');
          fetchPath(primaryGoal);
        }
      } catch (err) {
        console.error('Profile load error:', err);
        fetchPath('Fullstack Web Development');
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const fetchPath = async (targetGoal: string) => {
    setIsLoading(true);
    try {
      const data = await geminiService.generateLearningPath(targetGoal);
      const formatted = data.map((m: any, i: number) => ({
        id: i + 1,
        title: m.title,
        description: m.description,
        status: i === 0 ? 'completed' : i === 1 ? 'current' : 'locked',
        icon: i === 0 ? CheckCircle2 : i === 1 ? Target : i === 4 ? Flag : Lock,
        color: i === 0 ? 'text-emerald-500' : i === 1 ? 'text-indigo-600' : 'text-slate-400'
      }));
      setMilestones(formatted);
    } catch (error) {
      console.error("Error fetching path:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Your Learning Path</h2>
          <p className="text-slate-500">Personalized roadmap based on your goals</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input 
              type="text" 
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 w-64"
              placeholder="Enter your goal..."
            />
            <button 
              onClick={() => fetchPath(goal)}
              disabled={isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm">
            <Star size={16} fill="currentColor" />
            {level || 'Level 1 Starter'}
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Connection Line */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-slate-100" />
        
        <div className="space-y-12">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Sparkles size={48} className="text-indigo-600 animate-pulse" />
              <p className="text-slate-500 font-medium">AI is crafting your personalized path...</p>
            </div>
          ) : (
            milestones.map((m, i) => (
            <motion.div 
              key={m.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative flex items-start gap-8 group"
            >
              <div className={cn(
                "z-10 w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300",
                m.status === 'completed' ? "bg-emerald-50 text-emerald-500" : 
                m.status === 'current' ? "bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-200" : 
                "bg-white text-slate-300 border border-slate-200"
              )}>
                <m.icon size={28} />
              </div>

              <div className={cn(
                "flex-1 glass-card p-6 transition-all duration-300",
                m.status === 'current' ? "border-indigo-200 ring-4 ring-indigo-50" : "hover:border-slate-300"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={cn(
                    "font-bold text-lg",
                    m.status === 'locked' ? "text-slate-400" : "text-slate-900"
                  )}>
                    {m.title}
                  </h3>
                  {m.status === 'current' && (
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
                      In Progress
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mb-4">{m.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold",
                      m.status === 'completed' ? "bg-emerald-100 text-emerald-600" :
                      m.status === 'current' ? "bg-indigo-100 text-indigo-600" :
                      "bg-slate-100 text-slate-400"
                    )}>
                      {m.status === 'completed' ? 'Completed' : m.status === 'current' ? 'In Progress' : 'Upcoming'}
                    </div>
                  </div>
                  <button className={cn(
                    "flex items-center gap-1 text-sm font-bold transition-colors",
                    m.status === 'locked' ? "text-slate-300 cursor-not-allowed" : "text-indigo-600 hover:text-indigo-700"
                  )}>
                    {m.status === 'completed' ? 'Review' : 'Continue'}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )))}
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
