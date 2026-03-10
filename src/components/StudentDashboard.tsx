import React from 'react';
import { 
  BookOpen, 
  Users, 
  Clock, 
  Trophy,
  ArrowUpRight,
  PlayCircle,
  Radio,
  Share2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'motion/react';
import type { UserData } from '../contexts/UserContext';

const data = [
  { name: 'Mon', progress: 40 },
  { name: 'Tue', progress: 35 },
  { name: 'Wed', progress: 65 },
  { name: 'Thu', progress: 55 },
  { name: 'Fri', progress: 85 },
  { name: 'Sat', progress: 70 },
  { name: 'Sun', progress: 90 },
];

interface StudentDashboardProps {
  user: UserData;
  onGoLive: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onGoLive }) => {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Welcome back, {user.name.split(' ')[0]}! 👋</h1>
          <p className="text-sm md:text-slate-500 mt-1">You've completed 85% of your weekly goals. Keep it up!</p>
        </div>
        <div className="flex gap-2 md:gap-3">
          <button className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            Report
          </button>
          <button
            onClick={() => {
              const sessionId = `session-${Date.now()}`;
              const shareUrl = `${window.location.origin}?session=${sessionId}&role=student`;
              navigator.clipboard.writeText(shareUrl);
              alert(`Session link copied! Ask your mentor to share their session: ${shareUrl}`);
            }}
            className="flex-1 md:flex-none px-4 py-2 bg-indigo-100 border border-indigo-200 rounded-xl text-xs md:text-sm font-semibold text-indigo-700 hover:bg-indigo-200 transition-colors flex items-center justify-center gap-2"
          >
            <Share2 size={16} />
            Find Session
          </button>
          <button 
            onClick={onGoLive}
            className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl text-xs md:text-sm font-semibold text-white hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-200 flex items-center gap-2"
          >
            <Radio size={16} className="animate-pulse" />
            Join Live
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Courses Active', value: '4', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Mentor Sessions', value: '12', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Learning Hours', value: '48h', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Skill Points', value: '1,250', icon: Trophy, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-start justify-between">
              <div className={cn("p-3 rounded-xl", stat.bg)}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
                <ArrowUpRight size={14} />
                +12%
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Chart */}
        <div className="lg:col-span-2 glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Learning Activity</h3>
              <p className="text-sm text-slate-500">Your engagement over the last 7 days</p>
            </div>
            <select className="text-sm border-none bg-slate-50 rounded-lg px-3 py-1.5 outline-none font-medium text-slate-600">
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="progress" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorProgress)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Courses */}
        <div className="glass-card p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Active Courses</h3>
          <div className="space-y-6">
            {[
              { title: 'Advanced React Patterns', progress: 75, instructor: 'Sarah Drasner', color: 'bg-indigo-600' },
              { title: 'UI/UX Design Systems', progress: 45, instructor: 'Gary Simon', color: 'bg-emerald-500' },
              { title: 'Data Structures with AI', progress: 90, instructor: 'Colt Steele', color: 'bg-amber-500' },
            ].map((course, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{course.title}</p>
                  <span className="text-xs font-bold text-slate-500">{course.progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${course.progress}%` }}
                    className={cn("h-full rounded-full", course.color)}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">by {course.instructor}</p>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all">
            Browse More Courses
          </button>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
