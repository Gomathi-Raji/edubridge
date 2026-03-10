import { VercelRequest, VercelResponse } from '@vercel/node';
import Database from 'better-sqlite3';
import path from 'path';

// Initialize database
const dbPath = path.join(process.cwd(), 'server', 'db.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const { id, role } = req.query;

      if (id) {
        // Get user by ID
        const user = db.prepare(`
          SELECT id, name, email, role, avatar, languages, created_at FROM users WHERE id = ?
        `).get(id);

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json(user);
      }

      if (role) {
        // Get users by role
        const users = db.prepare(`
          SELECT id, name, email, role, avatar, languages, created_at FROM users WHERE role = ?
        `).all(role);

        return res.status(200).json(users);
      }

      // List all users
      const users = db.prepare(`
        SELECT id, name, email, role, avatar, languages, created_at FROM users
      `).all();

      return res.status(200).json(users);

    } else if (req.method === 'POST') {
      const { email, role } = req.body;

      if (!req.url?.includes('/login')) {
        return res.status(404).json({ error: 'Endpoint not found' });
      }

      // Simple demo login
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

      return res.status(200).json(user);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}