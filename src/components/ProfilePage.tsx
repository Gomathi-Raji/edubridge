import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User,
  GraduationCap,
  MapPin,
  Target,
  Code,
  Clock,
  Globe,
  BookOpen,
  Star,
  Edit3,
  Save,
  X,
  Loader2,
  Sparkles,
  Calendar,
  Mail,
  Shield,
} from 'lucide-react';
import { profilesApi } from '../services/api';
import { useUser } from '../contexts/UserContext';

interface ProfilePageProps {
  onRoleChange: (role: 'student' | 'mentor' | 'admin') => void;
}

const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Kannada', 'Spanish', 'French'];
const SCHEDULE_OPTIONS = ['Morning (6AM-12PM)', 'Afternoon (12PM-5PM)', 'Evening (5PM-9PM)', 'Night (9PM-12AM)', 'Flexible'];
const DAILY_HOURS = ['< 1 hour', '1-2 hours', '2-4 hours', '4-6 hours', '6+ hours'];
const EXPERIENCE_LEVELS = ['Complete Beginner', 'Some Experience', 'Intermediate', 'Advanced'];

export const ProfilePage: React.FC<ProfilePageProps> = ({ onRoleChange }) => {
  const { user, updateUser } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    (async () => {
      try {
        const p = await profilesApi.get(user!.id);
        setProfile(p);
      } catch (err) {
        console.error('Profile load error:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user]);

  const parseJSON = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return [val]; }
    }
    return [];
  };

  const startEditing = () => {
    setEditData({
      preferred_languages: parseJSON(profile?.preferred_languages),
      preferred_schedule: profile?.preferred_schedule || '',
      daily_hours: profile?.daily_hours || '',
      experience_level: profile?.experience_level || '',
      location: profile?.location || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await profilesApi.save({
        user_id: user!.id,
        age_group: profile.age_group,
        education_level: profile.education_level,
        location: editData.location,
        learning_goals: parseJSON(profile.learning_goals),
        interests: parseJSON(profile.interests),
        skills: parseJSON(profile.skills),
        preferred_languages: editData.preferred_languages,
        preferred_schedule: editData.preferred_schedule,
        experience_level: editData.experience_level,
        daily_hours: editData.daily_hours,
      });
      const updated = await profilesApi.get(user!.id);
      setProfile(updated);
      setIsEditing(false);
    } catch (err) {
      console.error('Profile save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLanguage = (lang: string) => {
    setEditData((prev: any) => ({
      ...prev,
      preferred_languages: prev.preferred_languages.includes(lang)
        ? prev.preferred_languages.filter((l: string) => l !== lang)
        : [...prev.preferred_languages, lang],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 size={48} className="text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading your profile...</p>
      </div>
    );
  }

  const learningGoals = parseJSON(profile?.learning_goals);
  const interests = parseJSON(profile?.interests);
  const skills = parseJSON(profile?.skills);
  const languages = parseJSON(profile?.preferred_languages);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        <div className="h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-50" />
        </div>
        <div className="px-8 pb-6 -mt-12 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
              <span className="text-3xl font-bold text-indigo-600">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{user?.name}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Mail size={14} /> {user?.email}</span>
                <span className="flex items-center gap-1"><Shield size={14} /> {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)}</span>
                {profile?.location && (
                  <span className="flex items-center gap-1"><MapPin size={14} /> {profile.location}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <button
                  onClick={startEditing}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Edit3 size={14} /> Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
                  >
                    <X size={14} /> Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Role Switcher (Demo) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-900">Switch Role (Demo Only)</p>
            <p className="text-sm text-slate-500">Change your platform perspective</p>
          </div>
          <select
            value={user?.role || 'student'}
            onChange={(e) => onRoleChange(e.target.value as 'student' | 'mentor' | 'admin')}
            className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold text-slate-700 outline-none"
          >
            <option value="student">Student</option>
            <option value="mentor">Mentor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* About You */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <GraduationCap size={18} className="text-indigo-600" /> About You
          </h3>
          <div className="space-y-3">
            <InfoRow label="Age Group" value={profile?.age_group || 'Not set'} />
            <InfoRow label="Education Level" value={profile?.education_level || 'Not set'} />
            <InfoRow label="Experience Level" value={
              isEditing ? (
                <select
                  value={editData.experience_level}
                  onChange={(e) => setEditData({ ...editData, experience_level: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-full"
                >
                  {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              ) : (profile?.experience_level || 'Not set')
            } />
            <InfoRow label="Location" value={
              isEditing ? (
                <input
                  type="text"
                  value={editData.location}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-full"
                />
              ) : (profile?.location || 'Not set')
            } />
          </div>
        </motion.div>

        {/* Schedule & Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-6"
        >
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Clock size={18} className="text-indigo-600" /> Schedule & Hours
          </h3>
          <div className="space-y-3">
            <InfoRow label="Preferred Schedule" value={
              isEditing ? (
                <select
                  value={editData.preferred_schedule}
                  onChange={(e) => setEditData({ ...editData, preferred_schedule: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-full"
                >
                  {SCHEDULE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (profile?.preferred_schedule || 'Not set')
            } />
            <InfoRow label="Daily Study Hours" value={
              isEditing ? (
                <select
                  value={editData.daily_hours}
                  onChange={(e) => setEditData({ ...editData, daily_hours: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-full"
                >
                  {DAILY_HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              ) : (profile?.daily_hours || 'Not set')
            } />
          </div>
        </motion.div>

        {/* Learning Goals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Target size={18} className="text-indigo-600" /> Learning Goals
          </h3>
          <div className="flex flex-wrap gap-2">
            {learningGoals.length > 0 ? learningGoals.map((goal: string) => (
              <span key={goal} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100">
                {goal}
              </span>
            )) : (
              <p className="text-sm text-slate-400">No learning goals set</p>
            )}
          </div>
        </motion.div>

        {/* Interests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-6"
        >
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Star size={18} className="text-indigo-600" /> Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {interests.length > 0 ? interests.map((interest: string) => (
              <span key={interest} className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-100">
                {interest}
              </span>
            )) : (
              <p className="text-sm text-slate-400">No interests set</p>
            )}
          </div>
        </motion.div>

        {/* Skills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Code size={18} className="text-indigo-600" /> Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {skills.length > 0 ? skills.map((skill: string) => (
              <span key={skill} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
                {skill}
              </span>
            )) : (
              <p className="text-sm text-slate-400">No skills set</p>
            )}
          </div>
        </motion.div>

        {/* Languages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-6"
        >
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Globe size={18} className="text-indigo-600" /> Preferred Languages
          </h3>
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang}
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${
                    editData.preferred_languages?.includes(lang)
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-amber-300'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {languages.length > 0 ? languages.map((lang: string) => (
                <span key={lang} className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100">
                  {lang}
                </span>
              )) : (
                <p className="text-sm text-slate-400">No languages set</p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    {typeof value === 'string' ? (
      <span className="text-sm font-medium text-slate-700">{value}</span>
    ) : (
      <div className="w-48">{value}</div>
    )}
  </div>
);
