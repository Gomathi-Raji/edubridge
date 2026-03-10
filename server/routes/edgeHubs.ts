import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';

const router = Router();

// ─── GET /api/edge-hubs ── List all edge learning hubs ────────────────────
router.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const hubs = db.prepare('SELECT * FROM edge_hubs ORDER BY name').all();
  res.json(hubs);
});

// ─── GET /api/edge-hubs/:id ── Get specific hub ──────────────────────────
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const hub = db.prepare('SELECT * FROM edge_hubs WHERE id = ?').get(req.params.id);
  if (!hub) return res.status(404).json({ error: 'Hub not found' });
  res.json(hub);
});

// ─── POST /api/edge-hubs/:id/heartbeat ── Hub heartbeat ──────────────────
router.post('/:id/heartbeat', (req: Request, res: Response) => {
  const db = getDb();
  const { connected_students, bandwidth_saved_mb } = req.body;
  db.prepare(`
    UPDATE edge_hubs
    SET status = 'online', last_heartbeat = datetime('now'),
        connected_students = COALESCE(?, connected_students),
        bandwidth_saved_mb = COALESCE(?, bandwidth_saved_mb)
    WHERE id = ?
  `).run(connected_students ?? null, bandwidth_saved_mb ?? null, req.params.id);
  res.json({ success: true });
});

// ─── GET /api/edge-hubs/stats/summary ── Aggregate stats ─────────────────
router.get('/stats/summary', (_req: Request, res: Response) => {
  const db = getDb();
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_hubs,
      SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online_hubs,
      SUM(connected_students) as total_students,
      SUM(bandwidth_saved_mb) as total_bandwidth_saved_mb
    FROM edge_hubs
  `).get();
  res.json(stats);
});

export default router;
