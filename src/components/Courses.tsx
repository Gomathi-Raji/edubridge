import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Play, 
  Clock, 
  Users, 
  Star,
  BookOpen,
  CheckCircle,
  BarChart,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { Course } from '../types';
import { geminiService } from '../services/geminiService';
import { profilesApi } from '../services/api';
import { useUser } from '../contexts/UserContext';

const MOCK_COURSES = [
  { id: 'c1', title: 'Full-Stack Web Development', instructor: 'Dr. Priya Sharma', category: 'Web Development', language: 'English', rating: 4.8, students: 12400, duration: '40 hours', progress: 35, image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop' },
  { id: 'c2', title: 'Python for Data Science', instructor: 'Prof. Rajesh Kumar', category: 'Data Science', language: 'English', rating: 4.9, students: 18200, duration: '35 hours', progress: 0, image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=250&fit=crop' },
  { id: 'c3', title: 'React & TypeScript Masterclass', instructor: 'Anita Desai', category: 'Web Development', language: 'English', rating: 4.7, students: 8900, duration: '28 hours', progress: 70, image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop' },
  { id: 'c4', title: 'AI / Machine Learning Fundamentals', instructor: 'Dr. Arvind Patel', category: 'AI / Machine Learning', language: 'English', rating: 4.9, students: 22100, duration: '45 hours', progress: 0, image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop' },
  { id: 'c5', title: 'Cloud Computing with AWS', instructor: 'Vikram Singh', category: 'Cloud Computing', language: 'English', rating: 4.6, students: 9700, duration: '30 hours', progress: 100, image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop' },
  { id: 'c6', title: 'Mobile App Development with Flutter', instructor: 'Sneha Reddy', category: 'Mobile Development', language: 'English', rating: 4.7, students: 7600, duration: '32 hours', progress: 0, image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop' },
  { id: 'c7', title: 'Cybersecurity Essentials', instructor: 'Karthik Nair', category: 'Cybersecurity', language: 'English', rating: 4.5, students: 6300, duration: '25 hours', progress: 20, image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop' },
  { id: 'c8', title: 'DevOps & CI/CD Pipeline', instructor: 'Ravi Menon', category: 'DevOps', language: 'English', rating: 4.6, students: 5400, duration: '22 hours', progress: 0, image: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400&h=250&fit=crop' },
  // Tamil courses
  { id: 'c9', title: 'வலை மேம்பாடு அறிமுகம் (Web Dev Intro)', instructor: 'முருகன் செல்வம்', category: 'Web Development', language: 'Tamil', rating: 4.6, students: 3200, duration: '20 மணி நேரம்', progress: 0, image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop' },
  { id: 'c10', title: 'Python நிரலாக்கம் (Python Programming)', instructor: 'கவிதா ராஜன்', category: 'Data Science', language: 'Tamil', rating: 4.7, students: 4100, duration: '25 மணி நேரம்', progress: 0, image: 'https://images.unsplash.com/photo-1515879218367-8466d910auj7?w=400&h=250&fit=crop' },
  { id: 'c11', title: 'செயற்கை நுண்ணறிவு (AI Basics)', instructor: 'சுரேஷ் குமார்', category: 'AI / Machine Learning', language: 'Tamil', rating: 4.5, students: 2800, duration: '18 மணி நேரம்', progress: 0, image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=250&fit=crop' },
  // Telugu courses
  { id: 'c12', title: 'వెబ్ డెవలప్‌మెంట్ బేసిక్స్ (Web Dev Basics)', instructor: 'రాజేష్ రెడ్డి', category: 'Web Development', language: 'Telugu', rating: 4.6, students: 2900, duration: '22 గంటలు', progress: 0, image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop' },
  { id: 'c13', title: 'డేటా సైన్స్ తెలుగులో (Data Science in Telugu)', instructor: 'ప్రియ శర్మ', category: 'Data Science', language: 'Telugu', rating: 4.7, students: 3500, duration: '28 గంటలు', progress: 0, image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop' },
  { id: 'c14', title: 'మొబైల్ యాప్ డెవలప్‌మెంట్ (Mobile Apps)', instructor: 'వెంకట్ నాయుడు', category: 'Mobile Development', language: 'Telugu', rating: 4.5, students: 1800, duration: '20 గంటలు', progress: 0, image: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?w=400&h=250&fit=crop' },
  // Hindi courses
  { id: 'c15', title: 'वेब डेवलपमेंट हिंदी में (Web Dev in Hindi)', instructor: 'अमित शर्मा', category: 'Web Development', language: 'Hindi', rating: 4.8, students: 15600, duration: '30 घंटे', progress: 10, image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400&h=250&fit=crop' },
  { id: 'c16', title: 'पाइथन प्रोग्रामिंग (Python in Hindi)', instructor: 'नेहा गुप्ता', category: 'Data Science', language: 'Hindi', rating: 4.9, students: 21000, duration: '35 घंटे', progress: 0, image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&h=250&fit=crop' },
  { id: 'c17', title: 'मशीन लर्निंग सीखें (Learn ML in Hindi)', instructor: 'राहुल वर्मा', category: 'AI / Machine Learning', language: 'Hindi', rating: 4.7, students: 11200, duration: '40 घंटे', progress: 0, image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=250&fit=crop' },
  { id: 'c18', title: 'साइबर सुरक्षा (Cybersecurity Hindi)', instructor: 'सुनीता यादव', category: 'Cybersecurity', language: 'Hindi', rating: 4.5, students: 5800, duration: '22 घंटे', progress: 0, image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=250&fit=crop' },
];

const ALL_LANGUAGES = ['All', 'English', 'Hindi', 'Tamil', 'Telugu'];

export const Courses: React.FC = () => {
  const { user } = useUser();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isRecLoading, setIsRecLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const courses = MOCK_COURSES;
  const categories = ['All', ...Array.from(new Set(courses.map(c => c.category)))];

  useEffect(() => {
    (async () => {
      try {
        const p = await profilesApi.get(user!.id);
        setProfile(p);
      } catch (err) {
        console.error('Profile load error:', err);
      }
    })();
  }, [user]);

  const fetchRecommendations = async () => {
    if (!profile) return;
    setIsRecLoading(true);
    try {
      const interests = typeof profile.interests === 'string' ? JSON.parse(profile.interests) : profile.interests;
      const data = await geminiService.recommendCourses(interests);
      setRecommendations(data);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setIsRecLoading(false);
    }
  };

  useEffect(() => {
    if (profile) fetchRecommendations();
  }, [profile]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase()) || 
                         course.instructor.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    const matchesLanguage = selectedLanguage === 'All' || course.language === selectedLanguage;
    return matchesSearch && matchesCategory && matchesLanguage;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Course Library</h2>
          <p className="text-slate-500">Personalized courses based on your interests and goals</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search courses..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="glass-card p-6 border-indigo-100 bg-indigo-50/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-600" />
            <h3 className="font-bold text-slate-900">AI Recommended for You</h3>
          </div>
          <button 
            onClick={fetchRecommendations}
            disabled={isRecLoading}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw size={12} className={isRecLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isRecLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white/50 rounded-xl animate-pulse" />
            ))
          ) : (
            recommendations.map((rec, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <h4 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{rec.title}</h4>
                <p className="text-[10px] text-slate-500 line-clamp-2">{rec.description}</p>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
              selectedCategory === cat 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Language Filter */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Language:</span>
        <div className="flex gap-2">
          {ALL_LANGUAGES.map((lang) => (
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

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course, i) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card overflow-hidden group hover:shadow-xl transition-all duration-300"
          >
            <div className="relative h-48 overflow-hidden">
              <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold text-indigo-600 shadow-sm">
                  {course.category}
                </span>
                {course.language !== 'English' && (
                  <span className="px-2 py-1 bg-amber-400/90 backdrop-blur-sm rounded-lg text-[10px] font-bold text-white shadow-sm">
                    {course.language}
                  </span>
                )}
              </div>
              <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg flex items-center gap-1 text-[10px] font-bold text-slate-900 shadow-sm">
                <Star size={10} className="text-amber-500 fill-current" />
                {course.rating}
              </div>
              {course.progress > 0 && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-200">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-1000" 
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              )}
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{course.instructor}</span>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  <Clock size={10} />
                  {course.duration}
                </div>
              </div>
              <h3 className="font-bold text-slate-900 mb-3 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                {course.title}
              </h3>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Users size={14} />
                    {course.students || 0}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {course.progress === 100 ? (
                  <button className="flex-1 py-2 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg flex items-center justify-center gap-2 border border-emerald-100">
                    <CheckCircle size={14} />
                    Completed
                  </button>
                ) : (
                  <button className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 flex items-center justify-center gap-2">
                    <Play size={14} fill="currentColor" />
                    {course.progress > 0 ? 'Continue Learning' : 'Start Course'}
                  </button>
                )}
                <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
                  <BarChart size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={24} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No courses found</h3>
          <p className="text-slate-500">Try adjusting your search or filter to find what you're looking for.</p>
        </div>
      )}
    </div>
  );
};
