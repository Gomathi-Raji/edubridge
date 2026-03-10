import React, { useState, useEffect } from 'react';
import { 
  Hash, 
  MessageSquare, 
  Users, 
  Plus, 
  Search,
  MoreVertical,
  Smile,
  Image as ImageIcon,
  Paperclip,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from '../services/geminiService';
import { profilesApi } from '../services/api';
import { useUser } from '../contexts/UserContext';

export const Community: React.FC = () => {
  const { user } = useUser();
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [channels, setChannels] = useState<string[]>([]);
  const [studyGroups, setStudyGroups] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await profilesApi.get(user!.id);
        const data = await geminiService.generateCommunityData(profile);
        if (!cancelled) {
          setChannels(data.channels || []);
          setStudyGroups(data.studyGroups || []);
          setOnlineUsers(data.onlineUsers || []);
          setChats(data.recentMessages || []);
        }
      } catch (err) {
        console.error('Community data error:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const text = chats.map(c => `${c.user}: ${c.msg}`).join('\n');
      const response = await geminiService.chat(`Summarize this community discussion in 2 sentences: \n${text}`);
      setSummary(response);
    } catch (error) {
      console.error("Error summarizing:", error);
    } finally {
      setIsSummarizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Sparkles size={48} className="text-indigo-600 animate-pulse" />
        <p className="text-slate-500 font-medium">Setting up your personalized community...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex glass-card overflow-hidden">
      {/* Channels Sidebar */}
      <div className="w-64 border-r border-slate-100 bg-slate-50/50 flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <h3 className="font-bold text-slate-900">EduBridge Global</h3>
          <button className="p-1 hover:bg-slate-100 rounded">
            <Plus size={18} className="text-slate-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Discussion Channels</p>
            <div className="space-y-1">
              {channels.map((ch, idx) => (
                <button key={ch} className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  idx === 0 ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-600 hover:bg-slate-100"
                )}>
                  <Hash size={16} />
                  {ch}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Study Groups</p>
            <div className="space-y-1">
              {studyGroups.map(ch => (
                <button key={ch} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all">
                  <Users size={16} />
                  {ch}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash size={20} className="text-slate-400" />
            <h3 className="font-bold text-slate-900">general</h3>
            <span className="w-px h-4 bg-slate-200 mx-2" />
            <p className="text-xs text-slate-500 font-medium">Global discussion for all students and mentors</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              <Sparkles size={14} className={isSummarizing ? "animate-pulse" : ""} />
              {isSummarizing ? "Summarizing..." : "AI Summary"}
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder="Search messages" className="pl-9 pr-4 py-1.5 bg-slate-50 border-none rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 w-48" />
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {summary && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-indigo-600 text-white px-6 py-4 overflow-hidden"
            >
              <div className="flex items-start gap-3">
                <Sparkles size={16} className="mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">AI Thread Summary</p>
                  <p className="text-sm leading-relaxed">{summary}</p>
                </div>
                <button onClick={() => setSummary(null)} className="p-1 hover:bg-white/10 rounded">
                  <ChevronDown size={16} className="rotate-180" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {chats.map((chat, i) => (
            <div key={i} className="flex gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {chat.user?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-900 text-sm">{chat.user}</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase",
                    chat.role === 'Mentor' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                  )}>
                    {chat.role}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{chat.time}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{chat.msg}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-2">
            <textarea 
              placeholder="Message #general" 
              className="w-full bg-transparent border-none outline-none p-3 text-sm resize-none h-20"
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <div className="flex items-center gap-1">
                <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Plus size={18} /></button>
                <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><ImageIcon size={18} /></button>
                <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Paperclip size={18} /></button>
                <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Smile size={18} /></button>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-shadow shadow-lg shadow-indigo-100">
                Send Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Online Users */}
      <div className="w-64 border-l border-slate-100 bg-slate-50/50 p-4 overflow-y-auto hidden xl:block">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Online — {onlineUsers.filter(u => u.online).length}</p>
        <div className="space-y-4">
          {onlineUsers.map((u, i) => (
            <div key={i} className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-slate-200" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{u.name}</p>
                <p className="text-[10px] text-slate-500 font-medium">{u.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
