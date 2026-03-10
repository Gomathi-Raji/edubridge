import { VercelRequest, VercelResponse } from '@vercel/node';
import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Initialize database
const dbPath = path.join(process.cwd(), 'server', 'db.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const { id } = req.query;
      const url = req.url || '';

      if (id && typeof id === 'string') {
        // Get session detail
        const session = db.prepare(`
          SELECT s.*, u.name as mentor_name, u.avatar as mentor_avatar
          FROM sessions s
          JOIN users u ON s.mentor_id = u.id
          WHERE s.id = ?
        `).get(id);

        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        const participants = db.prepare(`
          SELECT sp.*, u.name, u.avatar, u.role
          FROM session_participants sp
          JOIN users u ON sp.user_id = u.id
          WHERE sp.session_id = ?
        `).all(id);

        return res.status(200).json({ ...(session as object), participants });
      }

      if (url.includes('/live')) {
        // Get currently live sessions
        const sessions = db.prepare(`
          SELECT s.*, u.name as mentor_name, u.avatar as mentor_avatar,
            (SELECT COUNT(*) FROM session_participants sp WHERE sp.session_id = s.id) as participant_count
          FROM sessions s
          JOIN users u ON s.mentor_id = u.id
          WHERE s.status = 'live'
        `).all();

        return res.status(200).json(sessions);
      }

      // List all sessions
      const sessions = db.prepare(`
        SELECT s.*, u.name as mentor_name, u.avatar as mentor_avatar,
          (SELECT COUNT(*) FROM session_participants sp WHERE sp.session_id = s.id) as participant_count
        FROM sessions s
        JOIN users u ON s.mentor_id = u.id
        ORDER BY s.created_at DESC
      `).all();

      return res.status(200).json(sessions);

    } else if (req.method === 'POST') {
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
      return res.status(201).json(session);

    } else if (req.method === 'PATCH') {
      const { id } = req.query;
      const url = req.url || '';

      if (typeof id === 'string' && url.includes('/start')) {
        // Start a live session
        db.prepare(`
          UPDATE sessions SET status = 'live', started_at = datetime('now') WHERE id = ?
        `).run(id);

        const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
        return res.status(200).json(session);
      }

      return res.status(404).json({ error: 'Endpoint not found' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}