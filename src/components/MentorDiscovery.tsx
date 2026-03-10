import React, { useState } from 'react';
import { 
  Search, 
  Star, 
  Languages, 
  Calendar,
  MessageSquare,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useUser } from '../contexts/UserContext';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

const MOCK_MENTORS = [
  {
    id: 'm1', name: 'Dr. Priya Sharma', expertise: ['Web Development', 'React', 'Node.js'], experience: '12 years',
    rating: 4.9, languages: ['English', 'Hindi'], availability: 'Mon-Fri, 10AM-6PM', status: 'online',
    matchReason: 'Expert in full-stack web development with strong mentoring track record',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face',
  },
  {
    id: 'm2', name: 'Prof. Rajesh Kumar', expertise: ['Data Science', 'Python', 'Machine Learning'], experience: '15 years',
    rating: 4.8, languages: ['English', 'Hindi', 'Tamil'], availability: 'Flexible', status: 'online',
    matchReason: 'Renowned data science professor with industry consulting experience',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&crop=face',
  },
  {
    id: 'm3', name: 'Anita Desai', expertise: ['UI/UX Design', 'React', 'TypeScript'], experience: '8 years',
    rating: 4.7, languages: ['English', 'Telugu'], availability: 'Weekdays, 2PM-8PM', status: 'busy',
    matchReason: 'Combines design thinking with strong frontend engineering skills',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face',
  },
  {
    id: 'm4', name: 'முருகன் செல்வம் (Murugan S.)', expertise: ['Web Development', 'JavaScript', 'Python'], experience: '10 years',
    rating: 4.6, languages: ['Tamil', 'English'], availability: 'Evening (5PM-9PM)', status: 'online',
    matchReason: 'Teaches web development in Tamil with hands-on project approach',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
  },
  {
    id: 'm5', name: 'నాగేష్ రెడ్డి (Nagesh Reddy)', expertise: ['Mobile Development', 'Flutter', 'Cloud Computing'], experience: '9 years',
    rating: 4.7, languages: ['Telugu', 'English', 'Hindi'], availability: 'Mon-Sat, 11AM-7PM', status: 'online',
    matchReason: 'Expert in cross-platform mobile development with Telugu instruction',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
  },
  {
    id: 'm6', name: 'नेहा गुप्ता (Neha Gupta)', expertise: ['AI / Machine Learning', 'Data Science', 'Python'], experience: '11 years',
    rating: 4.9, languages: ['Hindi', 'English'], availability: 'Flexible', status: 'online',
    matchReason: 'Published AI researcher who teaches in Hindi for accessibility',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face',
  },
  {
    id: 'm7', name: 'Vikram Singh', expertise: ['Cloud Computing', 'AWS', 'DevOps'], experience: '13 years',
    rating: 4.6, languages: ['English', 'Hindi'], availability: 'Weekdays, 9AM-5PM', status: 'offline',
    matchReason: 'AWS certified architect with extensive DevOps mentoring experience',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
  },
  {
    id: 'm8', name: 'கவிதா ராஜன் (Kavitha R.)', expertise: ['Data Science', 'SQL', 'Python'], experience: '7 years',
    rating: 4.5, languages: ['Tamil', 'English'], availability: 'Evening (5PM-9PM)', status: 'busy',
    matchReason: 'Data analyst turned educator, teaches analytics in Tamil',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
  },
  {
    id: 'm9', name: 'राहुल वर्मा (Rahul Verma)', expertise: ['Cybersecurity', 'Networking', 'Cloud Computing'], experience: '14 years',
    rating: 4.8, languages: ['Hindi', 'English'], availability: 'Mon-Fri, 10AM-6PM', status: 'online',
    matchReason: 'Cybersecurity expert offering Hindi instruction for aspiring security professionals',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&crop=face',
  },
  {
    id: 'm10', name: 'Sneha Reddy', expertise: ['Mobile Development', 'React', 'JavaScript'], experience: '6 years',
    rating: 4.5, languages: ['English', 'Telugu', 'Hindi'], availability: 'Flexible', status: 'online',
    matchReason: 'Multilingual mentor specializing in mobile and frontend development',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face',
  },
];

const LANGUAGE_FILTERS = ['All', 'English', 'Hindi', 'Tamil', 'Telugu'];

export const MentorDiscovery: React.FC = () => {
  const { user } = useUser();
  const [search, setSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');

  const filteredMentors = MOCK_MENTORS.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.expertise.some(e => e.toLowerCase().includes(search.toLowerCase()));
    const matchesLanguage = selectedLanguage === 'All' || m.languages.includes(selectedLanguage);
    return matchesSearch && matchesLanguage;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'busy': return 'bg-amber-500';
      case 'offline': return 'bg-slate-300';
      default: return 'bg-slate-300';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Find Your Mentor</h2>
          <p className="text-slate-500">Browse mentors across languages and expertise areas</p>
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
        </div>
      </div>

      {/* Language Filter */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Language:</span>
        <div className="flex gap-2">
          {LANGUAGE_FILTERS.map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedLanguage === lang
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-amber-300'
              }`}
            >
              {lang}
            </button>
          ))}
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
            <div className="relative h-48 overflow-hidden">
              <img src={mentor.image} alt={mentor.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
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
