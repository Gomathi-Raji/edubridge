import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { StudentDashboard } from './components/StudentDashboard';
import { FloatingAITutor } from './components/FloatingAITutor';
import { LearningPath } from './components/LearningPath';
import { Auth } from './components/Auth';
import { MentorDiscovery } from './components/MentorDiscovery';
import { LiveClassroom } from './components/LiveClassroom';
import { MentorDashboard } from './components/MentorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Analytics } from './components/Analytics';
import { Community } from './components/Community';
import { Messages } from './components/Messages';
import { Courses } from './components/Courses';
import { View, ConnectionMode } from './types';
import { useUser, type UserData } from './contexts/UserContext';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { user, isAuthenticated, login, logout, updateUser } = useUser();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('Internet');

  const handleLogin = (userData: UserData) => {
    login(userData);
    setCurrentView(
      userData.role === 'student' ? 'dashboard' 
      : userData.role === 'mentor' ? 'mentor-dashboard' 
      : 'admin-dashboard'
    );
  };

  const handleLogout = () => {
    logout();
    setCurrentView('dashboard');
  };

  const goToLiveSessions = () => {
    setCurrentView('live-sessions');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <StudentDashboard user={user!} onGoLive={goToLiveSessions} />;
      case 'learning-path': return <LearningPath />;
      case 'mentors': return <MentorDiscovery />;
      case 'courses': return <Courses />;
      case 'live-sessions': return <LiveClassroom userRole={user?.role} userName={user?.name} />;
      case 'mentor-dashboard': return <MentorDashboard user={user!} onGoLive={goToLiveSessions} />;
      case 'admin-dashboard': return <AdminDashboard />;
      case 'analytics': return <Analytics />;
      case 'community': return <Community />;
      case 'messages': return <Messages />;
      case 'settings': return (
        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Settings</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-bold text-slate-900">Switch Role (Demo Only)</p>
                <p className="text-sm text-slate-500">Change your platform perspective</p>
              </div>
              <select 
                value={user?.role || 'student'}
                onChange={(e) => {
                  const role = e.target.value as 'student' | 'mentor' | 'admin';
                  updateUser({ role });
                  setCurrentView(role === 'student' ? 'dashboard' : role === 'mentor' ? 'mentor-dashboard' : 'admin-dashboard');
                }}
                className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold text-slate-700 outline-none"
              >
                <option value="student">Student</option>
                <option value="mentor">Mentor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="p-4 border border-slate-100 rounded-xl">
              <p className="font-bold text-slate-900 mb-4">Account Information</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                  <input 
                    type="text" 
                    value={user?.name || ''} 
                    onChange={(e) => updateUser({ name: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-lg p-2 text-sm" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                  <input 
                    type="text" 
                    value={user?.email || ''} 
                    onChange={(e) => updateUser({ email: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-lg p-2 text-sm" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
      default: return <StudentDashboard onGoLive={goToLiveSessions} />;
    }
  };

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        collapsed={collapsed} 
        setCollapsed={setCollapsed}
        userRole={user?.role || 'student'}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav 
          connectionMode={connectionMode}
          setConnectionMode={setConnectionMode}
          aiAvailable={true}
          liveSessionsCount={3}
        />
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
        <FloatingAITutor />
      </div>
    </div>
  );
}
