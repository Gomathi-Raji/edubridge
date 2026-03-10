import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  MapPin,
  Target,
  Code,
  Clock,
  Globe,
  BookOpen,
  Loader2,
  Star,
} from 'lucide-react';
import { profilesApi } from '../services/api';
import type { UserData } from '../contexts/UserContext';

interface StudentOnboardingProps {
  user: UserData;
  onComplete: (recommendations: any[]) => void;
}

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'basics', title: 'About You', icon: GraduationCap },
  { id: 'goals', title: 'Learning Goals', icon: Target },
  { id: 'skills', title: 'Skills & Interests', icon: Code },
  { id: 'preferences', title: 'Preferences', icon: Clock },
  { id: 'review', title: 'Review & Submit', icon: CheckCircle2 },
];

const AGE_GROUPS = ['Under 18', '18-24', '25-34', '35-44', '45+'];
const EDUCATION_LEVELS = ['High School', 'Undergraduate', 'Graduate', 'Post-Graduate', 'Self-Taught'];
const EXPERIENCE_LEVELS = ['Complete Beginner', 'Some Experience', 'Intermediate', 'Advanced'];

const LEARNING_GOALS = [
  'Get a tech job', 'Build personal projects', 'Freelance/Contract work',
  'Career switch', 'Academic research', 'Start a business',
  'Improve current skills', 'Prepare for certifications',
];

const INTEREST_OPTIONS = [
  'Web Development', 'Mobile Development', 'AI / Machine Learning',
  'Data Science', 'Cloud Computing', 'Cybersecurity',
  'Game Development', 'DevOps', 'Blockchain',
  'IoT', 'UI/UX Design', 'Database Management',
];

const SKILL_OPTIONS = [
  'HTML/CSS', 'JavaScript', 'TypeScript', 'Python', 'Java',
  'C/C++', 'React', 'Node.js', 'SQL', 'Git',
  'Docker', 'AWS', 'Machine Learning', 'Data Analysis',
  'Flutter', 'Swift', 'Kotlin', 'Rust', 'Go',
];

const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Kannada', 'Spanish', 'French'];
const SCHEDULE_OPTIONS = ['Morning (6AM-12PM)', 'Afternoon (12PM-5PM)', 'Evening (5PM-9PM)', 'Night (9PM-12AM)', 'Flexible'];
const DAILY_HOURS = ['< 1 hour', '1-2 hours', '2-4 hours', '4-6 hours', '6+ hours'];

export const StudentOnboarding: React.FC<StudentOnboardingProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form state
  const [ageGroup, setAgeGroup] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [location, setLocation] = useState('');
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>(['English']);
  const [preferredSchedule, setPreferredSchedule] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [dailyHours, setDailyHours] = useState('');

  const toggle = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true; // welcome
      case 1: return ageGroup && educationLevel && location;
      case 2: return learningGoals.length > 0 && experienceLevel;
      case 3: return interests.length > 0 && skills.length > 0;
      case 4: return preferredSchedule && dailyHours && preferredLanguages.length > 0;
      case 5: return true; // review
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await profilesApi.save({
        user_id: user.id,
        age_group: ageGroup,
        education_level: educationLevel,
        location,
        learning_goals: learningGoals,
        interests,
        skills,
        preferred_languages: preferredLanguages,
        preferred_schedule: preferredSchedule,
        experience_level: experienceLevel,
        daily_hours: dailyHours,
      });

      const recs = await profilesApi.getRecommendations(user.id);
      onComplete(recs);
    } catch (err) {
      console.error('Onboarding save failed:', err);
      onComplete([]);
    } finally {
      setLoading(false);
    }
  };

  const renderChips = (
    options: string[],
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(selected, setSelected, opt)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selected.includes(opt)
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  const renderSingleSelect = (
    options: string[],
    selected: string,
    setSelected: (val: string) => void
  ) => (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => setSelected(opt)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selected === opt
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto">
              <Sparkles className="text-indigo-600" size={36} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">
              Welcome, {user.name}! 🎉
            </h2>
            <p className="text-slate-500 text-lg max-w-md mx-auto">
              Let's personalize your learning experience. Answer a few questions so we can match you with the best mentors and courses.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-1"><Clock size={14} /> ~2 minutes</span>
              <span className="flex items-center gap-1"><Target size={14} /> 5 quick steps</span>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="text-indigo-600" size={24} />
              <h2 className="text-2xl font-bold text-slate-900">Tell us about yourself</h2>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Age Group</label>
              {renderSingleSelect(AGE_GROUPS, ageGroup, setAgeGroup)}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Education Level</label>
              {renderSingleSelect(EDUCATION_LEVELS, educationLevel, setEducationLevel)}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="City, State or Country"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="text-indigo-600" size={24} />
              <h2 className="text-2xl font-bold text-slate-900">What are your goals?</h2>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Select your learning goals <span className="text-indigo-500">(pick multiple)</span>
              </label>
              {renderChips(LEARNING_GOALS, learningGoals, setLearningGoals)}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Experience Level</label>
              {renderSingleSelect(EXPERIENCE_LEVELS, experienceLevel, setExperienceLevel)}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Code className="text-indigo-600" size={24} />
              <h2 className="text-2xl font-bold text-slate-900">Skills & Interests</h2>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Topics you're interested in <span className="text-indigo-500">(pick multiple)</span>
              </label>
              {renderChips(INTEREST_OPTIONS, interests, setInterests)}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Skills you already have <span className="text-indigo-500">(pick any that apply)</span>
              </label>
              {renderChips(SKILL_OPTIONS, skills, setSkills)}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-indigo-600" size={24} />
              <h2 className="text-2xl font-bold text-slate-900">Learning Preferences</h2>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preferred Languages</label>
              {renderChips(LANGUAGE_OPTIONS, preferredLanguages, setPreferredLanguages)}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preferred Schedule</label>
              {renderSingleSelect(SCHEDULE_OPTIONS, preferredSchedule, setPreferredSchedule)}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Study Time</label>
              {renderSingleSelect(DAILY_HOURS, dailyHours, setDailyHours)}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="text-indigo-600" size={24} />
              <h2 className="text-2xl font-bold text-slate-900">Review Your Profile</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReviewCard label="Age Group" value={ageGroup} />
              <ReviewCard label="Education" value={educationLevel} />
              <ReviewCard label="Experience" value={experienceLevel} />
              <ReviewCard label="Location" value={location} icon={<MapPin size={14} />} />
              <ReviewCard label="Daily Study" value={dailyHours} icon={<Clock size={14} />} />
              <ReviewCard label="Schedule" value={preferredSchedule} />
            </div>

            <div className="space-y-3">
              <ReviewTags label="Learning Goals" items={learningGoals} color="indigo" />
              <ReviewTags label="Interests" items={interests} color="emerald" />
              <ReviewTags label="Skills" items={skills} color="amber" />
              <ReviewTags label="Languages" items={preferredLanguages} color="blue" />
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
              <Star className="text-indigo-600 mt-0.5 shrink-0" size={18} />
              <p className="text-sm text-indigo-700">
                After submitting, we'll analyze your profile and recommend mentors who best match your goals, interests, and learning style.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i < step
                      ? 'bg-indigo-600 text-white'
                      : i === step
                      ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {i < step ? <CheckCircle2 size={18} /> : <s.icon size={18} />}
                </div>
                <span className={`text-[10px] font-bold uppercase hidden md:block ${
                  i <= step ? 'text-indigo-600' : 'text-slate-400'
                }`}>
                  {s.title}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded ${
                  i < step ? 'bg-indigo-600' : 'bg-slate-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            {step > 0 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : <div />}

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
              >
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-lg shadow-indigo-200"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Finding Mentors...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Complete & Find Mentors
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Helper Components ───────────────────────────────────────────────────────

const ReviewCard: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-slate-50 rounded-xl p-3">
    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</p>
    <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
      {icon} {value || '—'}
    </p>
  </div>
);

const colorMap: Record<string, string> = {
  indigo: 'bg-indigo-100 text-indigo-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
};

const ReviewTags: React.FC<{ label: string; items: string[]; color: string }> = ({ label, items, color }) => (
  <div>
    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">{label}</p>
    <div className="flex flex-wrap gap-1.5">
      {items.map(item => (
        <span key={item} className={`px-3 py-1 rounded-full text-xs font-medium ${colorMap[color] || colorMap.indigo}`}>
          {item}
        </span>
      ))}
      {items.length === 0 && <span className="text-xs text-slate-400">None selected</span>}
    </div>
  </div>
);
