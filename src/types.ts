export type View = 
  | 'dashboard' 
  | 'ai-tutor' 
  | 'mentors' 
  | 'live-sessions' 
  | 'courses' 
  | 'learning-path' 
  | 'community' 
  | 'analytics' 
  | 'messages' 
  | 'settings'
  | 'mentor-dashboard'
  | 'admin-dashboard'
  | 'onboarding';

export type ConnectionMode = 'Internet' | 'Edge Hub' | 'Satellite';

export interface User {
  name: string;
  role: 'student' | 'mentor' | 'admin';
  avatar: string;
}

export interface Mentor {
  id: string;
  name: string;
  expertise: string[];
  experience: string;
  rating: number;
  languages: string[];
  availability: string;
  image: string;
  status: 'online' | 'busy' | 'offline';
}

export interface Course {
  id: string;
  title: string;
  progress: number;
  instructor: string;
  thumbnail: string;
}

export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isAI?: boolean;
}
