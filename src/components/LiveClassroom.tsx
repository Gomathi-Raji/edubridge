import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Users,
  PhoneOff,
  Phone,
  Send,
  Sparkles,
  Wifi,
  Zap,
  Hand,
  Disc,
  ChevronDown,
  Maximize2,
  Minimize2,
  Copy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from '../services/geminiService';
import { streamingService, type StreamConfig } from '../services/streamingService';
import { signalingClient } from '../services/signalingClient';

// ─── Types ────────────────────────────────────────────────────────────────────
type SideTab = 'chat' | 'qa' | 'participants';

interface PeerInfo {
  id: string;
  userId: string;
  userName: string;
  role: 'mentor' | 'student';
}

interface ChatMsg {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

interface Question {
  id: string;
  userId: string;
  userName: string;
  text: string;
  votes: number;
  answered: boolean;
}

interface LiveClassroomProps {
  userRole?: 'mentor' | 'student' | 'admin';
  userName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const LiveClassroom: React.FC<LiveClassroomProps> = ({ userRole, userName: initialUserName }) => {
  // ── Lobby state ──────────────────────────────────────────────────────────
  const [role, setRole] = useState<'mentor' | 'student'>(userRole === 'mentor' ? 'mentor' : 'student');
  const [userName, setUserName] = useState(initialUserName || '');
  const [sessionId, setSessionId] = useState('session-1');

  // ── Sync props to state when they change ─────────────────────────────────
  useEffect(() => {
    if (userRole === 'mentor' || userRole === 'student') {
      setRole(userRole);
    }
  }, [userRole]);

  useEffect(() => {
    if (initialUserName) {
      setUserName(initialUserName);
    }
  }, [initialUserName]);

  // ── Parse URL parameters for session sharing ────────────────────────────
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionParam = urlParams.get('session');
    const roleParam = urlParams.get('role');

    if (sessionParam) {
      setSessionId(sessionParam);
    }

    if (roleParam === 'mentor' || roleParam === 'student') {
      setRole(roleParam);
    }

    // Clear URL parameters after parsing
    if (sessionParam || roleParam) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // ── Session state ────────────────────────────────────────────────────────
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  // ── Peers & streams ──────────────────────────────────────────────────────
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // ── Chat & Q&A ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<SideTab>('chat');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');

  // ── AI features ──────────────────────────────────────────────────────────
  const [sessionSummary, setSessionSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // ── Timer ──────────────────────────────────────────────────────────────
  const [sessionDuration, setSessionDuration] = useState(0);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // ── Session timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSessionActive) return;
    const interval = setInterval(() => setSessionDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, [isSessionActive]);

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? `${h}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── Auto-scroll chat ────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── Set remote stream on video element ──────────────────────────────────
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      // Only set if different to prevent flickering
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream]);

  // ── Re-attach local stream when session becomes active ──────────────────
  useEffect(() => {
    if (isSessionActive && role === 'mentor' && localVideoRef.current) {
      const localStream = streamingService.getLocalStream();
      // Only set if different to prevent flickering
      if (localStream && localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    }
  }, [isSessionActive, role]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      signalingClient.disconnect();
      streamingService.stopAll();
    };
  }, []);

  // ── Create peer connection + wire ICE/track callbacks ───────────────────
  const createPCForPeer = useCallback((peerId: string) => {
    streamingService.createPeerConnection(peerId, {
      onIceCandidate: (candidate) => {
        signalingClient.sendIceCandidate(peerId, candidate);
      },
      onTrack: (stream) => {
        setRemoteStream(stream);
      },
      onDisconnect: () => {
        setPeers((prev) => prev.filter((p) => p.id !== peerId));
        streamingService.closePeerConnection(peerId);
      },
    });
  }, []);

  // ── Mentor: create PC + send offer to a student ─────────────────────────
  const sendOfferToPeer = useCallback(async (peerId: string) => {
    createPCForPeer(peerId);
    const offer = await streamingService.createOffer(peerId);
    signalingClient.sendOffer(peerId, offer);
  }, [createPCForPeer]);

  // ── Setup signaling event handlers ──────────────────────────────────────
  const setupSignaling = useCallback((myRole: 'mentor' | 'student') => {
    const offs: (() => void)[] = [];

    // Joined the session room successfully
    offs.push(signalingClient.on('joined', (msg: any) => {
      const existingPeers: PeerInfo[] = (msg.peers || []).map((p: any) => ({
        id: p.id, userId: p.userId, userName: p.userName, role: p.role,
      }));
      setPeers(existingPeers);

      // Mentor: send offer to every student already in the room
      if (myRole === 'mentor') {
        existingPeers.forEach((p) => sendOfferToPeer(p.id));
      }
    }));

    // A new peer joined
    offs.push(signalingClient.on('peer-joined', (msg: any) => {
      const newPeer: PeerInfo = {
        id: msg.peer.id, userId: msg.peer.userId,
        userName: msg.peer.userName, role: msg.peer.role,
      };
      setPeers((prev) => [...prev, newPeer]);

      // Mentor: send offer to the new peer
      if (myRole === 'mentor') {
        sendOfferToPeer(msg.peer.id);
      }
    }));

    // Peer left
    offs.push(signalingClient.on('peer-left', (msg: any) => {
      setPeers((prev) => prev.filter((p) => p.id !== msg.peerId));
      streamingService.closePeerConnection(msg.peerId);
      if (myRole === 'student') setRemoteStream(null);
    }));

    // Receive WebRTC offer (student receives from mentor)
    offs.push(signalingClient.on('offer', async (msg: any) => {
      if (myRole === 'student') {
        createPCForPeer(msg.fromId);
        const answer = await streamingService.handleOffer(msg.fromId, msg.offer);
        signalingClient.sendAnswer(msg.fromId, answer);
      }
    }));

    // Receive WebRTC answer (mentor receives from student)
    offs.push(signalingClient.on('answer', async (msg: any) => {
      await streamingService.handleAnswer(msg.fromId, msg.answer);
    }));

    // ICE candidate
    offs.push(signalingClient.on('ice-candidate', async (msg: any) => {
      await streamingService.addIceCandidate(msg.fromId, msg.candidate);
    }));

    // Chat message
    offs.push(signalingClient.on('chat', (msg: any) => {
      setChatMessages((prev) => [...prev, msg.message]);
    }));

    // Question
    offs.push(signalingClient.on('question', (msg: any) => {
      setQuestions((prev) => [msg.question, ...prev]);
    }));

    // Hand raise notification (could show toast)
    offs.push(signalingClient.on('hand-raise', () => {}));

    return () => offs.forEach((off) => off());
  }, [createPCForPeer, sendOfferToPeer]);

  // ── Join / Start session ─────────────────────────────────────────────────
  const handleJoinSession = async () => {
    if (!userName.trim() || !sessionId.trim()) return;

    const userId = `${role}-${Date.now()}`;

    // Mentor must capture camera first
    if (role === 'mentor') {
      try {
        const config: StreamConfig = { video: true, audio: true, screen: false, resolution: '720p', codec: 'H264' };
        const stream = await streamingService.startCapture(config);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        console.error('Camera access failed:', err);
        return;
      }
    }

    // Setup signaling event handlers & connect
    cleanupRef.current = setupSignaling(role);
    signalingClient.connect(sessionId, userId, userName, role);

    setIsSessionActive(true);
    setSessionDuration(0);
  };

  const handleEndSession = () => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    signalingClient.disconnect();
    streamingService.stopAll();
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setIsSessionActive(false);
    setIsScreenSharing(false);
    setIsRecording(false);
    setRemoteStream(null);
    setPeers([]);
    setChatMessages([]);
    setQuestions([]);
    setSessionDuration(0);
    setHandRaised(false);
  };

  // ── Toggle controls ──────────────────────────────────────────────────────
  const toggleMic = () => {
    const next = !isMicOn;
    setIsMicOn(next);
    streamingService.toggleAudio(next);
  };

  const toggleCam = () => {
    const next = !isCamOn;
    setIsCamOn(next);
    streamingService.toggleVideo(next);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      streamingService.stopScreenShare();
      const camTrack = streamingService.getLocalStream()?.getVideoTracks()[0];
      if (camTrack) streamingService.replaceVideoTrack(camTrack);
      setIsScreenSharing(false);
    } else {
      try {
        const screen = await streamingService.startScreenShare();
        const screenTrack = screen.getVideoTracks()[0];
        streamingService.replaceVideoTrack(screenTrack);
        screenTrack.onended = () => {
          const camTrack = streamingService.getLocalStream()?.getVideoTracks()[0];
          if (camTrack) streamingService.replaceVideoTrack(camTrack);
          setIsScreenSharing(false);
        };
        setIsScreenSharing(true);
      } catch {
        /* user cancelled */
      }
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      streamingService.stopRecording();
      setIsRecording(false);
    } else {
      streamingService.startRecording();
      setIsRecording(true);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // ── Chat (via signaling WebSocket) ───────────────────────────────────────
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    signalingClient.sendChat(chatInput);
    setChatInput('');
  };

  // ── Q&A (via signaling WebSocket) ────────────────────────────────────────
  const handleAskQuestion = () => {
    if (!newQuestion.trim()) return;
    signalingClient.sendQuestion(newQuestion);
    setNewQuestion('');
  };

  const toggleHandRaise = () => {
    const next = !handRaised;
    setHandRaised(next);
    signalingClient.sendHandRaise(next);
  };

  // ── AI Summarize ─────────────────────────────────────────────────────────
  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const chatText = chatMessages.map((m) => `${m.senderName}: ${m.content}`).join('\n');
      const prompt = chatText
        ? `Summarize this live classroom discussion in 3 concise bullet points:\n${chatText}`
        : 'No messages to summarize yet.';
      const response = await geminiService.chat(prompt);
      setSessionSummary(response ?? 'Summary unavailable.');
    } catch {
      setSessionSummary('Could not generate summary. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const participantCount = peers.length + 1;

  // ── Pre-session lobby ────────────────────────────────────────────────────
  if (!isSessionActive) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-10 max-w-lg w-full text-center space-y-6"
        >
          <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto">
            <Video size={36} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Live Classroom</h2>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              Real WebRTC streaming. Mentor broadcasts to all students on the local network.
            </p>
          </div>

          {/* Role selector */}
          <div className="flex gap-3">
            <button
              onClick={() => setRole('mentor')}
              className={cn(
                'flex-1 py-3 rounded-xl font-bold text-sm transition-all border-2',
                role === 'mentor'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              )}
            >
              Mentor
            </button>
            <button
              onClick={() => setRole('student')}
              className={cn(
                'flex-1 py-3 rounded-xl font-bold text-sm transition-all border-2',
                role === 'student'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              )}
            >
              Student
            </button>
          </div>

          {/* Name input */}
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your name..."
            className="w-full px-4 py-3 bg-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-center font-medium"
          />

          {/* Session ID with copy button */}
          <div className="flex gap-2">
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Session ID..."
              className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-center font-medium"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(sessionId);
              }}
              className="px-4 py-3 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 transition-colors"
              title="Copy Session ID"
            >
              <Copy size={18} />
            </button>
          </div>

          {/* QR Code for Session Sharing */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-6 text-center">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Share Session</h3>
            <p className="text-xs text-slate-600 mb-4">Scan QR code or share link to join instantly</p>
            <div className="flex justify-center mb-4">
              <QRCodeSVG
                value={`${window.location.origin}?session=${sessionId}&role=${role === 'mentor' ? 'student' : 'student'}`}
                size={120}
                level="M"
                includeMargin={true}
                className="border-2 border-white rounded-lg shadow-sm"
              />
            </div>
            <button
              onClick={() => {
                const shareUrl = `${window.location.origin}?session=${sessionId}&role=${role === 'mentor' ? 'student' : 'student'}`;
                navigator.clipboard.writeText(shareUrl);
                // Show temporary success message
                const btn = event?.target as HTMLButtonElement;
                if (btn) {
                  const originalText = btn.textContent;
                  btn.textContent = 'Copied!';
                  btn.classList.add('bg-green-500', 'text-white');
                  setTimeout(() => {
                    btn.textContent = originalText;
                    btn.classList.remove('bg-green-500', 'text-white');
                  }, 2000);
                }
              }}
              className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Copy Share Link
            </button>
          </div>

          {/* Sync Instructions */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left">
            <p className="text-xs font-bold text-amber-700 mb-2">How to Sync Mentor &amp; Student:</p>
            <ol className="text-xs text-amber-600 space-y-1 list-decimal list-inside">
              <li>Both must use the <strong>same Session ID</strong></li>
              <li>Mentor clicks "Start Session" first</li>
              <li>Student clicks "Join Session" after</li>
              <li>Open separate browser windows to test</li>
            </ol>
          </div>

          {/* Camera preview for mentor */}
          {role === 'mentor' && (
            <div className="bg-slate-900 rounded-2xl aspect-video relative overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Video size={28} className="text-slate-400" />
                  </div>
                  <p className="text-slate-400 text-sm">Click Preview to test camera</p>
                </div>
              </div>
            </div>
          )}

          {/* Connection info */}
          <div className="flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <Wifi size={14} className="text-slate-400" />
              <span className="text-slate-500 font-medium">WebRTC P2P</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-emerald-500" />
              <span className="text-slate-500 font-medium">LAN Ready</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleJoinSession}
              disabled={!userName.trim()}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Phone size={18} />
              {role === 'mentor' ? 'Start Session' : 'Join Session'}
            </button>
            {role === 'mentor' && (
              <button
                onClick={async () => {
                  try {
                    const stream = await streamingService.startCapture({ video: true, audio: true, screen: false, resolution: '720p', codec: 'H264' });
                    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
                  } catch { /* permission denied */ }
                }}
                className="px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <Video size={18} />
                Preview
              </button>
            )}
          </div>

          {/* Pipeline */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Streaming Pipeline</p>
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 flex-wrap">
              {['Mentor Camera', '\u2192', 'H.264', '\u2192', 'WebRTC P2P', '\u2192', 'Student Browser'].map((s, i) => (
                <span key={i} className={s === '\u2192' ? 'text-indigo-400' : 'px-1.5 py-0.5 bg-slate-50 rounded font-medium'}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Active session UI ────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="h-auto md:h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col gap-3 min-h-[400px] md:min-h-0">
        {/* Status bar */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-2 h-2 bg-rose-500 rounded-full"
              />
              <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Live</span>
              <span className="text-xs text-slate-500 font-mono">{formatDuration(sessionDuration)}</span>
            </div>
            {isRecording && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 rounded-full">
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-1.5 h-1.5 bg-rose-500 rounded-full"
                />
                <span className="text-[10px] font-bold text-rose-600">REC</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
              <span className="text-[10px] font-bold text-slate-600 capitalize">
                {role === 'mentor' ? 'Mentor' : 'Student'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full">
              <Users size={12} className="text-slate-500" />
              <span className="text-[10px] font-bold text-slate-600">{participantCount}</span>
            </div>
            <button
              onClick={() => {
                const shareUrl = `${window.location.origin}?session=${sessionId}&role=student`;
                navigator.clipboard.writeText(shareUrl);
                // Could add a toast notification here
              }}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              title="Share Session"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16,6 12,2 8,6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </button>
            <button onClick={toggleFullscreen} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        {/* Video container */}
        <div className="flex-1 bg-slate-900 rounded-3xl relative overflow-hidden shadow-2xl">
          {/* Main video: remote stream for students, own camera for mentor */}
          {role === 'student' ? (
            remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"
                  />
                  <p className="text-slate-400 text-lg font-medium">Waiting for mentor to start streaming...</p>
                  <p className="text-slate-500 text-sm mt-2">Session: {sessionId}</p>
                </div>
              </div>
            )
          ) : (
            <>
              <video
                ref={(el) => {
                  localVideoRef.current = el;
                  if (el) {
                    const stream = streamingService.getLocalStream();
                    // Only set srcObject if it's different (prevents flickering)
                    if (stream && el.srcObject !== stream) {
                      el.srcObject = stream;
                    }
                  }
                }}
                autoPlay
                playsInline
                muted
                className={cn('w-full h-full object-cover', !isCamOn && 'hidden')}
              />
              {!isCamOn && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <VideoOff size={32} className="text-slate-400" />
                    </div>
                    <p className="text-slate-400 font-medium">Camera Off</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Mentor: show student count overlay */}
          {role === 'mentor' && (
            <div className="absolute top-4 right-4 px-3 py-2 bg-black/50 backdrop-blur-sm rounded-xl text-white text-xs font-bold">
              {peers.length} student{peers.length !== 1 ? 's' : ''} watching
            </div>
          )}

          {/* Raised hand */}
          {handRaised && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-4 left-4 px-3 py-2 bg-amber-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg"
            >
              <Hand size={16} /> Hand Raised
            </motion.div>
          )}

          {/* Control Bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full">
            {role === 'mentor' && (
              <>
                <CtrlButton active={isMicOn} danger={!isMicOn} onClick={toggleMic} tooltip={isMicOn ? 'Mute' : 'Unmute'}>
                  {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
                </CtrlButton>
                <CtrlButton active={isCamOn} danger={!isCamOn} onClick={toggleCam} tooltip={isCamOn ? 'Stop Camera' : 'Start Camera'}>
                  {isCamOn ? <Video size={18} /> : <VideoOff size={18} />}
                </CtrlButton>
                <CtrlDivider />
                <CtrlButton active={!isScreenSharing} onClick={toggleScreenShare} tooltip={isScreenSharing ? 'Stop Share' : 'Share Screen'}>
                  {isScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
                </CtrlButton>
                <CtrlButton active={!isRecording} danger={isRecording} onClick={toggleRecording} tooltip={isRecording ? 'Stop Recording' : 'Record'}>
                  <Disc size={18} />
                </CtrlButton>
                <CtrlDivider />
              </>
            )}
            {role === 'student' && (
              <>
                <CtrlButton active={!handRaised} onClick={toggleHandRaise} tooltip={handRaised ? 'Lower Hand' : 'Raise Hand'}>
                  <Hand size={18} />
                </CtrlButton>
                <CtrlDivider />
              </>
            )}
            <button
              onClick={handleEndSession}
              className="p-3 bg-rose-500 text-white hover:bg-rose-600 rounded-full transition-all shadow-lg shadow-rose-500/40"
              title="Leave Session"
            >
              <PhoneOff size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Panel */}
      <div className="w-full md:w-[380px] flex flex-col gap-3">
        <div className="glass-card flex-1 flex flex-col overflow-hidden min-h-[500px] md:min-h-0">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {([
              { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
              { id: 'qa' as const, label: 'Q&A', icon: Hand },
              { id: 'participants' as const, label: `People (${participantCount})`, icon: Users },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 py-3.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                  activeTab === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                    : 'text-slate-500 hover:bg-slate-50'
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* AI Summary button */}
          <div className="p-3 border-b border-slate-100 bg-indigo-50/30">
            <button
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Sparkles size={14} className={isSummarizing ? 'animate-pulse' : ''} />
              {isSummarizing ? 'Generating Summary...' : 'AI Session Summary'}
            </button>
            <AnimatePresence>
              {sessionSummary && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-3 p-3 bg-white rounded-xl border border-indigo-100 text-[11px] text-slate-600 leading-relaxed"
                >
                  <p className="font-bold text-indigo-600 mb-1">Key Takeaways:</p>
                  <div className="whitespace-pre-wrap">{sessionSummary}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => { if (sessionSummary) navigator.clipboard.writeText(sessionSummary); }}
                      className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Copy size={10} /> Copy
                    </button>
                    <button onClick={() => setSessionSummary(null)} className="text-slate-400 font-bold hover:underline">
                      Dismiss
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-8">No messages yet. Say hello!</p>
                )}
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{msg.senderName}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'p-3 rounded-2xl text-sm',
                        msg.senderId === signalingClient.peerId
                          ? 'bg-indigo-600 text-white rounded-tl-none'
                          : 'bg-slate-50 text-slate-600 rounded-tl-none'
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-3 border-t border-slate-100 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 pl-4 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-shadow shadow-lg shadow-indigo-100"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Q&A Tab */}
          {activeTab === 'qa' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {questions.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-8">No questions yet. Ask away!</p>
                )}
                {questions.map((q) => (
                  <div key={q.id} className={cn('p-3 rounded-xl border', q.answered ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100')}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-900">{q.userName}</p>
                        <p className="text-sm text-slate-600 mt-1">{q.text}</p>
                      </div>
                      <button
                        onClick={() => setQuestions((prev) => prev.map((qq) => qq.id === q.id ? { ...qq, votes: qq.votes + 1 } : qq).sort((a, b) => b.votes - a.votes))}
                        className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        <ChevronDown size={14} className="rotate-180 text-indigo-500" />
                        <span className="text-xs font-bold text-indigo-600">{q.votes}</span>
                      </button>
                    </div>
                    {q.answered && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                        Answered
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-slate-100 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                    placeholder="Ask a question..."
                    className="flex-1 pl-4 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    onClick={handleAskQuestion}
                    className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-shadow"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Participants Tab */}
          {activeTab === 'participants' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {/* Self */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50">
                <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{userName} (You)</p>
                  <p className="text-[10px] text-slate-400 capitalize">{role}</p>
                </div>
                {role === 'mentor' && (
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded-full">Host</span>
                )}
              </div>
              {/* Remote peers */}
              {peers.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-slate-300 flex items-center justify-center text-white font-bold text-sm">
                    {p.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{p.userName}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{p.role}</p>
                  </div>
                  {p.role === 'mentor' && (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded-full">Host</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Network info card */}
        <div className="glass-card p-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-[10px] font-medium opacity-80 uppercase tracking-wider">WebRTC Streaming</p>
                <p className="text-sm font-bold">
                  {role === 'mentor'
                    ? `Broadcasting to ${peers.length} student${peers.length !== 1 ? 's' : ''}`
                    : remoteStream ? 'Receiving mentor stream' : 'Waiting for stream...'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium opacity-80">Session</p>
              <p className="text-sm font-bold font-mono">{sessionId}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-1 text-[9px] opacity-70 flex-wrap">
            {['Mentor Cam', '\u2192', 'H.264', '\u2192', 'WebRTC P2P', '\u2192', 'Student Browser'].map((s, i) => (
              <span key={i} className={s === '\u2192' ? '' : 'px-1 py-0.5 bg-white/10 rounded font-medium'}>{s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Helper Components ────────────────────────────────────────────────────────

function CtrlButton({
  children,
  active = true,
  danger = false,
  onClick,
  tooltip,
}: {
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  tooltip?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={cn(
        'p-2.5 md:p-3 rounded-full transition-all',
        danger
          ? 'bg-rose-500 text-white hover:bg-rose-600'
          : active
          ? 'bg-white/20 text-white hover:bg-white/30'
          : 'bg-indigo-500 text-white hover:bg-indigo-600'
      )}
    >
      {children}
    </button>
  );
}

function CtrlDivider() {
  return <div className="w-px h-6 bg-white/20 mx-1" />;
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}