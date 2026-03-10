import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { v4 as uuidv4 } from 'uuid';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PeerInfo {
  id: string;
  ws: WebSocket;
  sessionId: string;
  userId: string;
  userName: string;
  role: 'mentor' | 'student';
}

interface SignalMessage {
  type: string;
  [key: string]: any;
}

// ─── Signaling Server ─────────────────────────────────────────────────────────

export class SignalingServer {
  private wss: WebSocketServer;
  // sessionId -> Map<peerId, PeerInfo>
  private sessions: Map<string, Map<string, PeerInfo>> = new Map();

  constructor(server: any) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req);
    });
    console.log('[WS] WebSocket signaling server ready on /ws');
  }

  private handleConnection(ws: WebSocket, _req: IncomingMessage) {
    const peerId = uuidv4();
    let peerInfo: PeerInfo | null = null;

    ws.on('message', (raw) => {
      let msg: SignalMessage;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      switch (msg.type) {
        // ── Join a session room ──────────────────────────────────────────
        case 'join-session': {
          const { sessionId, userId, userName, role } = msg;
          if (!sessionId) return;

          peerInfo = { id: peerId, ws, sessionId, userId: userId || peerId, userName: userName || 'Anonymous', role: role || 'student' };

          if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, new Map());
          }
          this.sessions.get(sessionId)!.set(peerId, peerInfo);

          // Tell the new peer about existing peers
          const existingPeers: any[] = [];
          this.sessions.get(sessionId)!.forEach((peer, id) => {
            if (id !== peerId) {
              existingPeers.push({ id: peer.id, userId: peer.userId, userName: peer.userName, role: peer.role });
            }
          });

          this.send(ws, { type: 'joined', peerId, peers: existingPeers });

          // Notify existing peers about the new peer
          this.broadcastToSession(sessionId, peerId, {
            type: 'peer-joined',
            peer: { id: peerId, userId: peerInfo.userId, userName: peerInfo.userName, role: peerInfo.role },
          });

          console.log(`[WS] ${peerInfo.userName} joined session ${sessionId} (${this.sessions.get(sessionId)!.size} peers)`);
          break;
        }

        // ── WebRTC Signaling: Offer ──────────────────────────────────────
        case 'offer': {
          const target = this.findPeer(peerInfo?.sessionId, msg.targetId);
          if (target) {
            this.send(target.ws, { type: 'offer', offer: msg.offer, fromId: peerId });
          }
          break;
        }

        // ── WebRTC Signaling: Answer ─────────────────────────────────────
        case 'answer': {
          const target = this.findPeer(peerInfo?.sessionId, msg.targetId);
          if (target) {
            this.send(target.ws, { type: 'answer', answer: msg.answer, fromId: peerId });
          }
          break;
        }

        // ── WebRTC Signaling: ICE Candidate ──────────────────────────────
        case 'ice-candidate': {
          const target = this.findPeer(peerInfo?.sessionId, msg.targetId);
          if (target) {
            this.send(target.ws, { type: 'ice-candidate', candidate: msg.candidate, fromId: peerId });
          }
          break;
        }

        // ── Chat message relay ───────────────────────────────────────────
        case 'chat': {
          if (!peerInfo) return;
          this.broadcastToSession(peerInfo.sessionId, null, {
            type: 'chat',
            message: {
              id: uuidv4(),
              senderId: peerInfo.userId,
              senderName: peerInfo.userName,
              content: msg.content,
              timestamp: new Date().toISOString(),
            },
          });
          break;
        }

        // ── Q&A question relay ───────────────────────────────────────────
        case 'question': {
          if (!peerInfo) return;
          this.broadcastToSession(peerInfo.sessionId, null, {
            type: 'question',
            question: {
              id: uuidv4(),
              userId: peerInfo.userId,
              userName: peerInfo.userName,
              text: msg.text,
              votes: 0,
              answered: false,
            },
          });
          break;
        }

        // ── Hand raise ───────────────────────────────────────────────────
        case 'hand-raise': {
          if (!peerInfo) return;
          this.broadcastToSession(peerInfo.sessionId, peerId, {
            type: 'hand-raise',
            peerId,
            userName: peerInfo.userName,
            raised: msg.raised,
          });
          break;
        }
      }
    });

    ws.on('close', () => {
      if (peerInfo) {
        const room = this.sessions.get(peerInfo.sessionId);
        if (room) {
          room.delete(peerId);
          this.broadcastToSession(peerInfo.sessionId, null, {
            type: 'peer-left',
            peerId,
            userId: peerInfo.userId,
            userName: peerInfo.userName,
          });
          console.log(`[WS] ${peerInfo.userName} left session ${peerInfo.sessionId} (${room.size} peers remain)`);
          if (room.size === 0) this.sessions.delete(peerInfo.sessionId);
        }
      }
    });

    ws.on('error', (err) => {
      console.error('[WS] peer error:', err.message);
    });
  }

  private findPeer(sessionId: string | undefined, peerId: string): PeerInfo | undefined {
    if (!sessionId) return undefined;
    return this.sessions.get(sessionId)?.get(peerId);
  }

  /** Broadcast to all peers in a session, optionally excluding one peer */
  private broadcastToSession(sessionId: string, excludeId: string | null, msg: any) {
    const room = this.sessions.get(sessionId);
    if (!room) return;
    const data = JSON.stringify(msg);
    room.forEach((peer) => {
      if (peer.id !== excludeId && peer.ws.readyState === WebSocket.OPEN) {
        peer.ws.send(data);
      }
    });
  }

  private send(ws: WebSocket, msg: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  getSessionCount() {
    return this.sessions.size;
  }

  getTotalPeers() {
    let count = 0;
    this.sessions.forEach((room) => (count += room.size));
    return count;
  }
}
