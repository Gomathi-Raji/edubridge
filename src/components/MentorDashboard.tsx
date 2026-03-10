import React from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  Star, 
  ArrowUpRight, 
  CheckCircle2, 
  XCircle,
  Video,
  MoreVertical,
  Radio,
  Share2
} from 'lucide-react';
import { motion } from 'motion/react';
import type { UserData } from '../contexts/UserContext';

interface MentorDashboardProps {
  user: UserData;
  onGoLive: () => void;
}

export const MentorDashboard: React.FC<MentorDashboardProps> = ({ user, onGoLive }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome, {user.name.split(' ')[0]}! 🎓</h1>
          <p className="text-slate-500 mt-1">You have 3 session requests waiting for approval.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            Manage Availability
          </button>
          <button
            onClick={() => {
              const sessionId = `session-${Date.now()}`;
              const shareUrl = `${window.location.origin}?session=${sessionId}&role=student`;
              navigator.clipboard.writeText(shareUrl);
              alert(`Session link copied! Share this with students: ${shareUrl}`);
            }}
            className="px-4 py-2 bg-indigo-100 border border-indigo-200 rounded-xl text-sm font-semibold text-indigo-700 hover:bg-indigo-200 transition-colors flex items-center gap-2"
          >
            <Share2 size={16} />
            Share Session
          </button>
          <button 
            onClick={onGoLive}
            className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl text-sm font-semibold text-white hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-200 flex items-center gap-2"
          >
            <Radio size={16} className="animate-pulse" />
            Go Live Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Students', value: '24', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Upcoming Sessions', value: '8', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Mentorship Hours', value: '156h', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Average Rating', value: '4.95', icon: Star, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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
                +5%
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
        {/* Session Requests */}
        <div className="lg:col-span-2 glass-card p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Session Requests</h3>
          <div className="space-y-4">
            {[
              { name: 'Alice Wang', topic: 'React Hooks Deep Dive', time: 'Today, 2:00 PM', avatar: 'https://picsum.photos/seed/s1/40/40' },
              { name: 'Bob Smith', topic: 'Career Path in AI', time: 'Tomorrow, 10:00 AM', avatar: 'https://picsum.photos/seed/s2/40/40' },
              { name: 'Charlie Davis', topic: 'Code Review: Portfolio', time: 'Mar 12, 4:30 PM', avatar: 'https://picsum.photos/seed/s3/40/40' },
            ].map((req, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <img src={req.avatar} alt="" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                  <div>
                    <p className="font-bold text-slate-900">{req.name}</p>
                    <p className="text-xs text-slate-500">{req.topic}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">{req.time}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Scheduled Time</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all">
                      <CheckCircle2 size={18} />
                    </button>
                    <button className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all">
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="glass-card p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Today's Schedule</h3>
          <div className="space-y-6">
            {[
              { time: '11:00 AM', title: 'Live Q&A: Web Dev', type: 'Classroom', color: 'bg-indigo-500' },
              { time: '1:30 PM', title: '1-on-1: David Miller', type: 'Session', color: 'bg-emerald-500' },
              { time: '3:00 PM', title: 'Curriculum Review', type: 'Admin', color: 'bg-amber-500' },
            ].map((session, i) => (
              <div key={i} className="relative pl-6 border-l-2 border-slate-100">
                <div className={cn("absolute left-[-5px] top-0 w-2 h-2 rounded-full", session.color)} />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{session.time}</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{session.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase">{session.type}</span>
                  <button className="text-indigo-600 hover:text-indigo-700 transition-colors">
                    <Video size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 bg-slate-50 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-100 transition-all">
            View Full Calendar
          </button>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
