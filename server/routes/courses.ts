import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';

const router = Router();

// ─── GET /api/courses ── List all courses ──────────────────────────────────
router.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const courses = db.prepare(`
    SELECT c.*, u.name as instructor_name,
      (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as enrolled_count
    FROM courses c
    JOIN users u ON c.instructor_id = u.id
    ORDER BY c.created_at DESC
  `).all();
  res.json(courses);
});

// ─── GET /api/courses/:id ── Get course detail ─────────────────────────────
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const course = db.prepare(`
    SELECT c.*, u.name as instructor_name
    FROM courses c
    JOIN users u ON c.instructor_id = u.id
    WHERE c.id = ?
  `).get(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(course);
});

// ─── GET /api/courses/user/:userId ── Get enrolled courses with progress ──
router.get('/user/:userId', (req: Request, res: Response) => {
  const db = getDb();
  const courses = db.prepare(`
    SELECT c.*, e.progress, u.name as instructor_name
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    JOIN users u ON c.instructor_id = u.id
    WHERE e.user_id = ?
  `).all(req.params.userId);
  res.json(courses);
});

// ─── POST /api/courses/:id/enroll ── Enroll user ──────────────────────────
router.post('/:id/enroll', (req: Request, res: Response) => {
  const db = getDb();
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  db.prepare(`
    INSERT OR IGNORE INTO enrollments (course_id, user_id, progress) VALUES (?, ?, 0)
  `).run(req.params.id, user_id);
  res.json({ success: true });
});

// ─── PATCH /api/courses/:id/progress ── Update progress ───────────────────
router.patch('/:id/progress', (req: Request, res: Response) => {
  const db = getDb();
  const { user_id, progress } = req.body;
  if (!user_id || progress === undefined) {
    return res.status(400).json({ error: 'user_id and progress required' });
  }

  db.prepare(`
    UPDATE enrollments SET progress = ? WHERE course_id = ? AND user_id = ?
  `).run(progress, req.params.id, user_id);
  res.json({ success: true });
});

export default router;
