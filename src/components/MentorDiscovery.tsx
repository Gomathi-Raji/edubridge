import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Star, 
  Languages, 
  Calendar,
  MessageSquare,
  MapPin,
  CheckCircle,
  Sparkles,
  RefreshCw,
  User
} from 'lucide-react';
import { motion } from 'motion/react';
import { Mentor } from '../types';
import { geminiService } from '../services/geminiService';
import { profilesApi } from '../services/api';
import { useUser } from '../contexts/UserContext';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export const MentorDiscovery: React.FC = () => {
  const { user } = useUser();
  const [search, setSearch] = useState('');
  const [mentors, setMentors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMentors = async () => {
    setIsLoading(true);
    try {
      const profile = await profilesApi.get(user!.id);
      const data = await geminiService.generatePersonalizedMentors(profile);
      setMentors(data);
    } catch (err) {
      console.error('Mentor load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, [user]);

  const filteredMentors = mentors.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.expertise?.some((e: string) => e.toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'busy': return 'bg-amber-500';
      case 'offline': return 'bg-slate-300';
      default: return 'bg-slate-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Sparkles size={48} className="text-indigo-600 animate-pulse" />
        <p className="text-slate-500 font-medium">Finding mentors that match your profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Find Your Mentor</h2>
          <p className="text-slate-500">AI-matched mentors based on your profile and goals</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search expertise..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchMentors}
            disabled={isLoading}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredMentors.map((mentor, i) => (
          <motion.div
            key={mentor.id || i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card overflow-hidden group hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300"
          >
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
              <div className="absolute inset-0 flex items-center justify-center">
                <User size={56} className="text-white/30" />
              </div>
              <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg flex items-center gap-1 text-xs font-bold text-slate-900 shadow-sm">
                <Star size={12} className="text-amber-500 fill-current" />
                {mentor.rating}
              </div>
            </div>
            
            <div className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-900">{mentor.name}</h3>
                <div className={cn("w-2 h-2 rounded-full", getStatusColor(mentor.status))} title={mentor.status} />
                <CheckCircle size={14} className="text-indigo-500 ml-auto" />
              </div>
              <p className="text-xs text-slate-500 mb-4">{mentor.experience} experience</p>
              
              <div className="flex flex-wrap gap-1.5 mb-4">
                {mentor.expertise.map((exp, j) => (
                  <span key={j} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full">
                    {exp}
                  </span>
                ))}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Languages size={14} />
                  {Array.isArray(mentor.languages) ? mentor.languages.join(', ') : mentor.languages}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar size={14} />
                  {mentor.availability}
                </div>
              </div>

              {mentor.matchReason && (
                <div className="mb-4 px-3 py-2 bg-indigo-50 rounded-lg">
                  <p className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 mb-0.5"><Sparkles size={10} /> Why this mentor</p>
                  <p className="text-[10px] text-indigo-700 leading-relaxed">{mentor.matchReason}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100">
                  Book Session
                </button>
                <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
                  <MessageSquare size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
