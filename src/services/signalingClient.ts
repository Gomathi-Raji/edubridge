type MessageHandler = (msg: any) => void;

class SignalingClient {
  private ws: WebSocket | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _peerId: string | null = null;
  private _sessionId: string | null = null;

  get peerId() { return this._peerId; }
  get connected() { return this.ws?.readyState === WebSocket.OPEN; }

  connect(sessionId: string, userId: string, userName: string, role: 'mentor' | 'student') {
    this._sessionId = sessionId;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.send({
        type: 'join-session',
        sessionId,
        userId,
        userName,
        role,
      });
    };

    this.ws.onmessage = (event) => {
      let msg: any;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === 'joined') {
        this._peerId = msg.peerId;
      }

      const handlers = this.handlers.get(msg.type) || [];
      handlers.forEach((h) => h(msg));

      // Also emit to wildcard listeners
      const wildcardHandlers = this.handlers.get('*') || [];
      wildcardHandlers.forEach((h) => h(msg));
    };

    this.ws.onclose = () => {
      // Auto-reconnect after 3 seconds
      this.reconnectTimer = setTimeout(() => {
        if (this._sessionId) {
          this.connect(sessionId, userId, userName, role);
        }
      }, 3000);
    };

    this.ws.onerror = () => {
      // WebSocket errors are followed by close events
    };
  }

  disconnect() {
    this._sessionId = null;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._peerId = null;
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
    return () => {
      const arr = this.handlers.get(type);
      if (arr) {
        const idx = arr.indexOf(handler);
        if (idx >= 0) arr.splice(idx, 1);
      }
    };
  }

  off(type: string) {
    this.handlers.delete(type);
  }

  // ── WebRTC signaling ────────────────────────────────────────────────────

  sendOffer(targetId: string, offer: RTCSessionDescriptionInit) {
    this.send({ type: 'offer', targetId, offer });
  }

  sendAnswer(targetId: string, answer: RTCSessionDescriptionInit) {
    this.send({ type: 'answer', targetId, answer });
  }

  sendIceCandidate(targetId: string, candidate: RTCIceCandidateInit) {
    this.send({ type: 'ice-candidate', targetId, candidate });
  }

  // ── Chat ────────────────────────────────────────────────────────────────

  sendChat(content: string) {
    this.send({ type: 'chat', content });
  }

  // ── Q&A ─────────────────────────────────────────────────────────────────

  sendQuestion(text: string) {
    this.send({ type: 'question', text });
  }

  // ── Hand raise ──────────────────────────────────────────────────────────

  sendHandRaise(raised: boolean) {
    this.send({ type: 'hand-raise', raised });
  }

  private send(msg: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }
}

export const signalingClient = new SignalingClient();
