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
import { StudentOnboarding } from './components/StudentOnboarding';
import { ProfilePage } from './components/ProfilePage';
import { View, ConnectionMode } from './types';
import { useUser, type UserData } from './contexts/UserContext';
import { profilesApi } from './services/api';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { user, isAuthenticated, login, logout, updateUser } = useUser();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('Internet');

  const handleLogin = async (userData: UserData) => {
    login(userData);

    if (userData.role === 'student') {
      // Check if student has completed onboarding
      try {
        const profile = await profilesApi.get(userData.id);
        if (profile && profile.onboarding_complete) {
          updateUser({ onboardingComplete: true });
          setCurrentView('dashboard');
        } else {
          setCurrentView('onboarding');
        }
      } catch {
        // No profile yet → show onboarding
        setCurrentView('onboarding');
      }
    } else {
      setCurrentView(
        userData.role === 'mentor' ? 'mentor-dashboard' : 'admin-dashboard'
      );
    }
  };

  const handleOnboardingComplete = (_recommendations: any[]) => {
    updateUser({ onboardingComplete: true });
    setCurrentView('dashboard');
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
      case 'onboarding': return <StudentOnboarding user={user!} onComplete={handleOnboardingComplete} />;
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
        <ProfilePage onRoleChange={(role) => {
          updateUser({ role });
          setCurrentView(role === 'student' ? 'dashboard' : role === 'mentor' ? 'mentor-dashboard' : 'admin-dashboard');
        }} />
      );
      default: return <StudentDashboard onGoLive={goToLiveSessions} />;
    }
  };

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  // Full-screen onboarding for new students
  if (currentView === 'onboarding') {
    return <StudentOnboarding user={user!} onComplete={handleOnboardingComplete} />;
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
