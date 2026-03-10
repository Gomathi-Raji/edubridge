import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Initialize database for Vercel deployment
const dbPath = path.join(process.cwd(), 'server', 'db.sqlite');

// Ensure server directory exists
const serverDir = path.dirname(dbPath);
if (!fs.existsSync(serverDir)) {
  fs.mkdirSync(serverDir, { recursive: true });
}

// Create database
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'mentor', 'admin')),
    avatar TEXT,
    languages TEXT DEFAULT '["English"]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    mentor_id TEXT NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
    scheduled_at DATETIME,
    started_at DATETIME,
    ended_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS session_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(session_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    instructor_id TEXT NOT NULL,
    category TEXT,
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    duration_hours INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS edge_hubs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    bandwidth_mbps INTEGER,
    active_sessions INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed demo data
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

if (userCount.count === 0) {
  console.log('Seeding demo users...');

  // Insert demo users
  const users = [
    { id: 'mentor-1', name: 'Dr. Sarah Chen', email: 'sarah@edubridge.ai', role: 'mentor', avatar: 'mentor1', languages: '["English","Hindi","Tamil"]' },
    { id: 'mentor-2', name: 'Prof. Michael Johnson', email: 'michael@edubridge.ai', role: 'mentor', avatar: 'mentor2', languages: '["English","Spanish"]' },
    { id: 'student-1', name: 'John Doe', email: 'john@edubridge.ai', role: 'student', avatar: 'user123', languages: '["English"]' },
    { id: 'student-2', name: 'Maria Garcia', email: 'maria@edubridge.ai', role: 'student', avatar: 'user456', languages: '["Spanish","English"]' },
    { id: 'student-3', name: 'Ahmed Hassan', email: 'ahmed@edubridge.ai', role: 'student', avatar: 'user789', languages: '["Arabic","English"]' },
    { id: 'student-4', name: 'Priya Patel', email: 'priya@edubridge.ai', role: 'student', avatar: 'user101', languages: '["Hindi","English"]' },
    { id: 'student-5', name: 'Carlos Rodriguez', email: 'carlos@edubridge.ai', role: 'student', avatar: 'user202', languages: '["Spanish","English"]' },
    { id: 'admin-1', name: 'Admin User', email: 'admin@edubridge.ai', role: 'admin', avatar: 'admin1', languages: '["English"]' }
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, role, avatar, languages)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const user of users) {
    insertUser.run(user.id, user.name, user.email, user.role, user.avatar, user.languages);
  }

  // Insert demo sessions
  const sessions = [
    {
      id: 'session-1',
      title: 'Introduction to React Hooks',
      description: 'Learn the fundamentals of React Hooks with practical examples',
      mentor_id: 'mentor-1',
      status: 'scheduled',
      scheduled_at: '2026-03-15 14:00:00'
    },
    {
      id: 'session-2',
      title: 'Data Structures & Algorithms',
      description: 'Master DSA concepts with real-world applications',
      mentor_id: 'mentor-2',
      status: 'scheduled',
      scheduled_at: '2026-03-16 10:00:00'
    }
  ];

  const insertSession = db.prepare(`
    INSERT OR IGNORE INTO sessions (id, title, description, mentor_id, status, scheduled_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const session of sessions) {
    insertSession.run(session.id, session.title, session.description, session.mentor_id, session.status, session.scheduled_at);
  }

  console.log('Demo data seeded successfully!');
}

db.close();
console.log('Database initialized for Vercel deployment!');