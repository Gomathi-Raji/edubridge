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

export const Courses: React.FC = () => {
  const { user } = useUser();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isRecLoading, setIsRecLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await profilesApi.get(user!.id);
        if (!cancelled) setProfile(p);
        const generated = await geminiService.generatePersonalizedCourses(p);
        if (!cancelled) {
          setCourses(generated);
          const cats = ['All', ...new Set<string>(generated.map((c: any) => c.category))];
          setCategories(cats);
        }
      } catch (err) {
        console.error('Courses load error:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
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
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Sparkles size={48} className="text-indigo-600 animate-pulse" />
        <p className="text-slate-500 font-medium">Generating personalized courses based on your profile...</p>
      </div>
    );
  }

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
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen size={48} className="text-white/30" />
              </div>
              <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold text-indigo-600 shadow-sm">
                {course.category}
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
