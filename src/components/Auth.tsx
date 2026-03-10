import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  UserCircle, 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  Sparkles,
  Globe,
  CheckCircle2
} from 'lucide-react';
import { usersApi } from '../services/api';
import type { UserData } from '../contexts/UserContext';

interface AuthProps {
  onLogin: (userData: UserData) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<'student' | 'mentor' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Try to login via API (uses demo users from DB)
      const response = await usersApi.login({ email, role: selectedRole });
      
      if (response && response.id) {
        const userData: UserData = {
          id: response.id,
          name: response.name,
          email: response.email,
          role: response.role,
          avatar: response.avatar || '',
          languages: JSON.parse(response.languages || '[]'),
        };
        onLogin(userData);
      } else {
        // Create demo user if API doesn't return one
        const userData: UserData = {
          id: `${selectedRole}-${Date.now()}`,
          name: name || (selectedRole === 'mentor' ? 'Demo Mentor' : selectedRole === 'admin' ? 'Demo Admin' : 'Demo Student'),
          email: email || `${selectedRole}@edubridge.ai`,
          role: selectedRole,
          avatar: '',
          languages: ['English'],
        };
        onLogin(userData);
      }
    } catch (err) {
      // Fallback to demo user
      const userData: UserData = {
        id: `${selectedRole}-${Date.now()}`,
        name: name || (selectedRole === 'mentor' ? 'Demo Mentor' : selectedRole === 'admin' ? 'Demo Admin' : 'Demo Student'),
        email: email || `${selectedRole}@edubridge.ai`,
        role: selectedRole,
        avatar: '',
        languages: ['English'],
      };
      onLogin(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (role: 'student' | 'mentor' | 'admin') => {
    setIsLoading(true);
    // Quick demo login with pre-defined users
    const demoUsers: Record<string, UserData> = {
      student: { id: 'student-1', name: 'John Doe', email: 'john@edubridge.ai', role: 'student', avatar: 'user123', languages: ['English'] },
      mentor: { id: 'mentor-1', name: 'Dr. Sarah Chen', email: 'sarah@edubridge.ai', role: 'mentor', avatar: 'mentor1', languages: ['English', 'Hindi', 'Tamil'] },
      admin: { id: 'admin-1', name: 'Admin User', email: 'admin@edubridge.ai', role: 'admin', avatar: 'admin1', languages: ['English'] },
    };
    setTimeout(() => {
      onLogin(demoUsers[role]);
      setIsLoading(false);
    }, 500);
  };

  const roles = [
    { id: 'student', label: 'Student', icon: User, desc: 'Access courses, AI tutor, and community' },
    { id: 'mentor', label: 'Mentor', icon: UserCircle, desc: 'Manage sessions, guide students, and share expertise' },
    { id: 'admin', label: 'Admin', icon: ShieldCheck, desc: 'Platform oversight, analytics, and user management' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100 rounded-full blur-[120px] opacity-50" />
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden border border-white/20">
        {/* Left Side: Branding/Info */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-indigo-600 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-indigo-600 font-bold text-2xl">E</span>
              </div>
              <span className="text-2xl font-bold tracking-tight">EduBridge Global</span>
            </div>

            <div className="space-y-8">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-bold leading-tight"
              >
                Bridging the gap <br /> 
                <span className="text-indigo-200">with AI-powered</span> <br />
                education.
              </motion.h1>

              <div className="space-y-6">
                {[
                  { icon: Globe, text: "Satellite-enabled learning for rural areas" },
                  { icon: Sparkles, text: "Personalized AI tutoring 24/7" },
                  { icon: CheckCircle2, text: "Industry-recognized certifications" }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <item.icon size={20} className="text-indigo-200" />
                    </div>
                    <span className="font-medium text-indigo-50">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-12 border-t border-white/10">
            <p className="text-sm text-indigo-200">Join 50,000+ students from 200+ rural communities worldwide.</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-6 md:p-16 flex flex-col justify-center">
          <div className="mb-6 md:mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-sm md:text-base text-slate-500">
              {isLogin ? "Enter your credentials to access your dashboard" : "Start your learning journey with EduBridge"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Your Role</label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id as any)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
                      selectedRole === role.id 
                        ? "bg-indigo-50 border-indigo-600 text-indigo-600 shadow-lg shadow-indigo-100" 
                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    <role.icon size={20} />
                    <span className="text-[10px] font-bold uppercase">{role.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-end">
                <button type="button" className="text-xs font-bold text-indigo-600 hover:underline">Forgot Password?</button>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 font-bold text-indigo-600 hover:underline"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>

          {/* Quick Demo Login */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-3 font-medium">Quick Demo Login</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('student')}
                disabled={isLoading}
                className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('mentor')}
                disabled={isLoading}
                className="flex-1 py-2.5 bg-purple-50 text-purple-600 rounded-xl text-xs font-bold hover:bg-purple-100 transition-colors disabled:opacity-50"
              >
                Mentor
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                disabled={isLoading}
                className="flex-1 py-2.5 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
