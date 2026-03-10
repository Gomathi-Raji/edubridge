import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';

const router = Router();

// ─── GET /api/users ── List all users ──────────────────────────────────────
router.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const users = db.prepare(`
    SELECT id, name, email, role, avatar, languages, created_at FROM users
  `).all();
  res.json(users);
});

// ─── GET /api/users/:id ── Get user by id ──────────────────────────────────
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const user = db.prepare(`
    SELECT id, name, email, role, avatar, languages, created_at FROM users WHERE id = ?
  `).get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ─── GET /api/users/role/:role ── Get users by role ────────────────────────
router.get('/role/:role', (req: Request, res: Response) => {
  const db = getDb();
  const users = db.prepare(`
    SELECT id, name, email, role, avatar, languages, created_at FROM users WHERE role = ?
  `).all(req.params.role);
  res.json(users);
});

// ─── POST /api/users/login ── Simple demo login ───────────────────────────
router.post('/login', (req: Request, res: Response) => {
  const db = getDb();
  const { email, role } = req.body;

  // For demo: find by email or find first user of given role
  let user;
  if (email) {
    user = db.prepare('SELECT id, name, email, role, avatar, languages FROM users WHERE email = ?').get(email);
  }
  if (!user && role) {
    user = db.prepare('SELECT id, name, email, role, avatar, languages FROM users WHERE role = ? LIMIT 1').get(role);
  }
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  res.json(user);
});

export default router;
