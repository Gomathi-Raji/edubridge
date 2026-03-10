import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ─── GET /api/sessions ── List all sessions ────────────────────────────────
router.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const sessions = db.prepare(`
    SELECT s.*, u.name as mentor_name, u.avatar as mentor_avatar,
      (SELECT COUNT(*) FROM session_participants sp WHERE sp.session_id = s.id) as participant_count
    FROM sessions s
    JOIN users u ON s.mentor_id = u.id
    ORDER BY s.created_at DESC
  `).all();
  res.json(sessions);
});

// ─── GET /api/sessions/live ── Get currently live sessions ─────────────────
router.get('/live', (_req: Request, res: Response) => {
  const db = getDb();
  const sessions = db.prepare(`
    SELECT s.*, u.name as mentor_name, u.avatar as mentor_avatar,
      (SELECT COUNT(*) FROM session_participants sp WHERE sp.session_id = s.id) as participant_count
    FROM sessions s
    JOIN users u ON s.mentor_id = u.id
    WHERE s.status = 'live'
  `).all();
  res.json(sessions);
});

// ─── GET /api/sessions/:id ── Get session detail ───────────────────────────
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const session = db.prepare(`
    SELECT s.*, u.name as mentor_name, u.avatar as mentor_avatar
    FROM sessions s
    JOIN users u ON s.mentor_id = u.id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!session) return res.status(404).json({ error: 'Session not found' });

  const participants = db.prepare(`
    SELECT sp.*, u.name, u.avatar, u.role
    FROM session_participants sp
    JOIN users u ON sp.user_id = u.id
    WHERE sp.session_id = ?
  `).all(req.params.id);

  res.json({ ...(session as object), participants });
});

// ─── POST /api/sessions ── Create a new session ───────────────────────────
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { title, description, mentor_id, scheduled_at } = req.body;
  if (!title || !mentor_id) {
    return res.status(400).json({ error: 'title and mentor_id are required' });
  }
  const id = uuidv4();
  db.prepare(`
    INSERT INTO sessions (id, title, description, mentor_id, status, scheduled_at)
    VALUES (?, ?, ?, ?, 'scheduled', ?)
  `).run(id, title, description || '', mentor_id, scheduled_at || null);

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  res.status(201).json(session);
});

// ─── PATCH /api/sessions/:id/start ── Start a live session ────────────────
router.patch('/:id/start', (req: Request, res: Response) => {
  const db = getDb();
  db.prepare(`
    UPDATE sessions SET status = 'live', started_at = datetime('now') WHERE id = ?
  `).run(req.params.id);
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  res.json(session);
});

// ─── PATCH /api/sessions/:id/end ── End a live session ────────────────────
router.patch('/:id/end', (req: Request, res: Response) => {
  const db = getDb();
  db.prepare(`
    UPDATE sessions SET status = 'ended', ended_at = datetime('now') WHERE id = ?
  `).run(req.params.id);
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  res.json(session);
});

// ─── POST /api/sessions/:id/join ── Join a session ────────────────────────
router.post('/:id/join', (req: Request, res: Response) => {
  const db = getDb();
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  db.prepare(`
    INSERT OR REPLACE INTO session_participants (session_id, user_id, joined_at, role)
    VALUES (?, ?, datetime('now'), (SELECT role FROM users WHERE id = ?))
  `).run(req.params.id, user_id, user_id);

  res.json({ success: true });
});

// ─── POST /api/sessions/:id/leave ── Leave a session ──────────────────────
router.post('/:id/leave', (req: Request, res: Response) => {
  const db = getDb();
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  db.prepare(`
    UPDATE session_participants SET left_at = datetime('now')
    WHERE session_id = ? AND user_id = ?
  `).run(req.params.id, user_id);

  res.json({ success: true });
});

// ─── GET /api/sessions/:id/chat ── Get chat history ───────────────────────
router.get('/:id/chat', (req: Request, res: Response) => {
  const db = getDb();
  const messages = db.prepare(`
    SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC
  `).all(req.params.id);
  res.json(messages);
});

// ─── POST /api/sessions/:id/chat ── Send a chat message ──────────────────
router.post('/:id/chat', (req: Request, res: Response) => {
  const db = getDb();
  const { sender_id, sender_name, content, is_ai } = req.body;
  if (!content) return res.status(400).json({ error: 'content required' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO chat_messages (id, session_id, sender_id, sender_name, content, is_ai)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, sender_id || 'anonymous', sender_name || 'Anonymous', content, is_ai ? 1 : 0);

  const msg = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(id);
  res.status(201).json(msg);
});

// ─── GET /api/sessions/:id/questions ── Get Q&A ───────────────────────────
router.get('/:id/questions', (req: Request, res: Response) => {
  const db = getDb();
  const questions = db.prepare(`
    SELECT * FROM questions WHERE session_id = ? ORDER BY votes DESC, created_at ASC
  `).all(req.params.id);
  res.json(questions);
});

// ─── POST /api/sessions/:id/questions ── Ask a question ───────────────────
router.post('/:id/questions', (req: Request, res: Response) => {
  const db = getDb();
  const { user_id, user_name, text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO questions (id, session_id, user_id, user_name, text) VALUES (?, ?, ?, ?, ?)
  `).run(id, req.params.id, user_id || 'anonymous', user_name || 'Anonymous', text);

  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
  res.status(201).json(question);
});

// ─── POST /api/sessions/:id/questions/:qid/vote ── Upvote ────────────────
router.post('/:id/questions/:qid/vote', (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('UPDATE questions SET votes = votes + 1 WHERE id = ?').run(req.params.qid);
  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.qid);
  res.json(question);
});

export default router;
