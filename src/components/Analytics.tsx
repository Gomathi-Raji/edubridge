import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { Sparkles, TrendingUp, Lightbulb, AlertCircle } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { profilesApi } from '../services/api';
import { useUser } from '../contexts/UserContext';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

export const Analytics: React.FC = () => {
  const { user } = useUser();
  const [insights, setInsights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [skillData, setSkillData] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [additionalStats, setAdditionalStats] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await profilesApi.get(user!.id);
        const data = await geminiService.generateSkillAnalytics(profile);
        if (!cancelled) {
          setSkillData(data.skillData || []);
          setProgressData(data.progressData || []);
          setAdditionalStats(data.stats || []);
          setInsights(data.insights || []);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Sparkles size={48} className="text-indigo-600 animate-pulse" />
        <p className="text-slate-500 font-medium">Analyzing your learning data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Learning Analytics</h2>
        <p className="text-slate-500">Deep dive into your progress and skill mastery</p>
      </div>

      {/* AI Insights Section */}
      <div className="glass-card p-8 bg-indigo-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <h3 className="text-xl font-bold">AI Learning Insights</h3>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-3 py-4">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200" />
              <span className="text-sm font-medium opacity-80">Analyzing your performance...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {insights.map((insight, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20"
                >
                  <div className="flex items-center gap-2 mb-3">
                    {i === 0 ? <TrendingUp size={18} className="text-emerald-300" /> : 
                     i === 1 ? <Lightbulb size={18} className="text-amber-300" /> : 
                     <AlertCircle size={18} className="text-rose-300" />}
                    <p className="text-xs font-bold uppercase tracking-wider opacity-60">
                      {i === 0 ? "Strength" : i === 1 ? "Opportunity" : "Focus Area"}
                    </p>
                  </div>
                  <p className="text-sm font-bold mb-2">{insight.insight}</p>
                  <p className="text-xs opacity-80 leading-relaxed">{insight.recommendation}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skill Mastery Radar */}
        <div className="glass-card p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-8">Skill Mastery Radar</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar
                  name="Skills"
                  dataKey="A"
                  stroke="#4f46e5"
                  fill="#4f46e5"
                  fillOpacity={0.4}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                  }} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Completion Bar */}
        <div className="glass-card p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-8">Weekly Course Completion</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                  }} 
                />
                <Bar 
                  dataKey="completed" 
                  fill="#4f46e5" 
                  radius={[6, 6, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {additionalStats.map((stat: any, i: number) => (
          <div key={i} className="glass-card p-6 border-l-4 border-indigo-600">
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
            <p className="text-xs text-emerald-500 font-bold mt-2">{stat.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
