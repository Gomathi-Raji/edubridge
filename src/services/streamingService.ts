/**
 * WebRTC Streaming Service for EduBridge Live Mentorship
 *
 * Handles media capture (camera/mic/screen) and RTCPeerConnection management.
 * Signaling is coordinated externally via signalingClient.
 *
 * Flow:
 *   Mentor: capture → createPeerConnection per student → createOffer → send via signaling
 *   Student: receive offer → createPeerConnection → handleOffer → send answer via signaling
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreamConfig {
  video: boolean;
  audio: boolean;
  screen: boolean;
  resolution: '720p' | '1080p';
  codec: 'H264' | 'VP9';
}

const RESOLUTION_MAP: Record<string, { width: number; height: number }> = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
};

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// ─── Streaming Service ────────────────────────────────────────────────────────

class StreamingService {
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private _isRecording = false;

  // ── Media Capture ────────────────────────────────────────────────────────

  async startCapture(config: StreamConfig): Promise<MediaStream> {
    // Return existing stream if already capturing
    if (this.localStream && this.localStream.active) {
      return this.localStream;
    }

    // Check if mediaDevices is available (requires HTTPS or localhost)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        'Camera/microphone access requires HTTPS. ' +
        'Please access via https://localhost:3000 or https://<ip>:3000'
      );
    }

    const constraints: MediaStreamConstraints = {
      video: config.video
        ? {
            width: { ideal: RESOLUTION_MAP[config.resolution].width },
            height: { ideal: RESOLUTION_MAP[config.resolution].height },
            frameRate: { ideal: 30 },
          }
        : false,
      audio: config.audio
        ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        : false,
    };

    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    return this.localStream;
  }

  async startScreenShare(): Promise<MediaStream> {
    this.screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 30 } },
      audio: true,
    });
    this.screenStream.getVideoTracks()[0].onended = () => {
      this.stopScreenShare();
    };
    return this.screenStream;
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }
  }

  // ── Peer Connection Management ───────────────────────────────────────────

  createPeerConnection(
    peerId: string,
    callbacks: {
      onIceCandidate: (candidate: RTCIceCandidateInit) => void;
      onTrack: (stream: MediaStream) => void;
      onDisconnect: () => void;
    }
  ): RTCPeerConnection {
    this.closePeerConnection(peerId);

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add local tracks (mentor sends their camera/mic to students)
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        callbacks.onIceCandidate(event.candidate.toJSON());
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      callbacks.onTrack(remoteStream);
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        callbacks.onDisconnect();
      }
    };

    this.peerConnections.set(peerId, pc);
    return pc;
  }

  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    const pc = this.peerConnections.get(peerId);
    if (!pc) throw new Error(`No peer connection for ${peerId}`);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  }

  async handleOffer(peerId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const pc = this.peerConnections.get(peerId);
    if (!pc) throw new Error(`No peer connection for ${peerId}`);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.peerConnections.get(peerId);
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peerConnections.get(peerId);
    if (!pc) return;
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {
      // ICE candidate may arrive before remote description is set
    }
  }

  replaceVideoTrack(newTrack: MediaStreamTrack) {
    this.peerConnections.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) sender.replaceTrack(newTrack);
    });
  }

  closePeerConnection(peerId: string) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
  }

  // ── Recording ────────────────────────────────────────────────────────────

  startRecording() {
    if (!this.localStream) return;
    this.recordedChunks = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';
    this.mediaRecorder = new MediaRecorder(this.localStream, { mimeType });
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordedChunks.push(e.data);
    };
    this.mediaRecorder.start(1000);
    this._isRecording = true;
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this._isRecording = false;
    }
  }

  get isRecording() {
    return this._isRecording;
  }

  // ── Track Controls ───────────────────────────────────────────────────────

  toggleAudio(enabled: boolean) {
    this.localStream?.getAudioTracks().forEach((t) => { t.enabled = enabled; });
  }

  toggleVideo(enabled: boolean) {
    this.localStream?.getVideoTracks().forEach((t) => { t.enabled = enabled; });
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────

  stopAll() {
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    this.stopScreenShare();
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    if (this._isRecording) this.stopRecording();
  }

  getLocalStream() {
    return this.localStream;
  }

  getScreenStream() {
    return this.screenStream;
  }
}

export const streamingService = new StreamingService();
