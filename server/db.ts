import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'edubridge.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'mentor', 'admin')),
      avatar TEXT DEFAULT '',
      languages TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Sessions (live classrooms)
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      mentor_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'live', 'ended')),
      scheduled_at TEXT,
      started_at TEXT,
      ended_at TEXT,
      recording_url TEXT,
      max_participants INTEGER DEFAULT 100,
      edge_hub_enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Session participants
    CREATE TABLE IF NOT EXISTS session_participants (
      session_id TEXT NOT NULL REFERENCES sessions(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      joined_at TEXT DEFAULT (datetime('now')),
      left_at TEXT,
      role TEXT NOT NULL DEFAULT 'student',
      PRIMARY KEY (session_id, user_id)
    );

    -- Chat messages
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id),
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      content TEXT NOT NULL,
      is_ai INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Q&A questions
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id),
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      text TEXT NOT NULL,
      votes INTEGER DEFAULT 0,
      answered INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Courses
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      instructor_id TEXT NOT NULL REFERENCES users(id),
      thumbnail TEXT DEFAULT '',
      category TEXT DEFAULT '',
      difficulty TEXT DEFAULT 'beginner' CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Course enrollments
    CREATE TABLE IF NOT EXISTS enrollments (
      course_id TEXT NOT NULL REFERENCES courses(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      progress INTEGER DEFAULT 0,
      enrolled_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (course_id, user_id)
    );

    -- Mentor availability
    CREATE TABLE IF NOT EXISTS mentor_availability (
      mentor_id TEXT NOT NULL REFERENCES users(id),
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      PRIMARY KEY (mentor_id, day_of_week, start_time)
    );

    -- Session recordings
    CREATE TABLE IF NOT EXISTS recordings (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id),
      file_path TEXT NOT NULL,
      duration INTEGER DEFAULT 0,
      size_bytes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Edge Hub nodes
    CREATE TABLE IF NOT EXISTS edge_hubs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT DEFAULT '',
      ip_address TEXT,
      status TEXT DEFAULT 'offline' CHECK(status IN ('online', 'offline', 'relay')),
      connected_students INTEGER DEFAULT 0,
      bandwidth_saved_mb REAL DEFAULT 0,
      last_heartbeat TEXT
    );

    -- Student profiles (onboarding data)
    CREATE TABLE IF NOT EXISTS student_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      age_group TEXT DEFAULT '',
      education_level TEXT DEFAULT '',
      location TEXT DEFAULT '',
      learning_goals TEXT DEFAULT '[]',
      interests TEXT DEFAULT '[]',
      skills TEXT DEFAULT '[]',
      preferred_languages TEXT DEFAULT '[]',
      preferred_schedule TEXT DEFAULT '',
      experience_level TEXT DEFAULT 'beginner',
      daily_hours TEXT DEFAULT '1-2',
      onboarding_complete INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Mentor profiles (expertise & matching data)
    CREATE TABLE IF NOT EXISTS mentor_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      bio TEXT DEFAULT '',
      expertise TEXT DEFAULT '[]',
      experience_years INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0,
      total_sessions INTEGER DEFAULT 0,
      total_students INTEGER DEFAULT 0,
      availability TEXT DEFAULT '[]',
      teaching_style TEXT DEFAULT '',
      location TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Mentor recommendations for students
    CREATE TABLE IF NOT EXISTS mentor_recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL REFERENCES users(id),
      mentor_id TEXT NOT NULL REFERENCES users(id),
      match_score REAL DEFAULT 0,
      match_reasons TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(student_id, mentor_id)
    );
  `);

  // Seed demo data if empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  if (userCount.count === 0) {
    seedDemoData();
  }
}

function seedDemoData() {
  // demo password = "demo123" (in production, use bcrypt)
  const demoHash = '$demo$hash$not$real';

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, avatar, languages) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSession = db.prepare(`
    INSERT INTO sessions (id, title, description, mentor_id, status, scheduled_at) VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertCourse = db.prepare(`
    INSERT INTO courses (id, title, description, instructor_id, thumbnail, category, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertEnrollment = db.prepare(`
    INSERT INTO enrollments (course_id, user_id, progress) VALUES (?, ?, ?)
  `);

  const insertEdgeHub = db.prepare(`
    INSERT INTO edge_hubs (id, name, location, ip_address, status, connected_students, bandwidth_saved_mb) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  db.transaction(() => {
    // Users
    insertUser.run('mentor-1', 'Dr. Sarah Chen', 'sarah@edubridge.ai', demoHash, 'mentor', 'mentor1', '["English","Hindi","Tamil"]');
    insertUser.run('mentor-2', 'Prof. Raj Patel', 'raj@edubridge.ai', demoHash, 'mentor', 'mentor2', '["English","Hindi","Gujarati"]');
    insertUser.run('student-1', 'John Doe', 'john@edubridge.ai', demoHash, 'student', 'user123', '["English"]');
    insertUser.run('student-2', 'Alex Kumar', 'alex@edubridge.ai', demoHash, 'student', 'p1', '["English","Hindi"]');
    insertUser.run('student-3', 'Priya Sharma', 'priya@edubridge.ai', demoHash, 'student', 'p2', '["Hindi","English"]');
    insertUser.run('student-4', 'James Obi', 'james@edubridge.ai', demoHash, 'student', 'p3', '["English"]');
    insertUser.run('student-5', 'Maria Santos', 'maria@edubridge.ai', demoHash, 'student', 'p4', '["English","Spanish"]');
    insertUser.run('admin-1', 'Admin User', 'admin@edubridge.ai', demoHash, 'admin', 'admin1', '["English"]');

    // Sessions
    insertSession.run('session-1', 'React State Management Deep Dive', 'Learn about lifting state, context API, and useReducer', 'mentor-1', 'live', '2026-03-11T10:00:00Z');
    insertSession.run('session-2', 'AI & Machine Learning Basics', 'Introduction to neural networks and deep learning', 'mentor-2', 'scheduled', '2026-03-12T14:00:00Z');
    insertSession.run('session-3', 'Career Guidance: Tech Industry', 'Q&A session about breaking into tech from rural areas', 'mentor-1', 'scheduled', '2026-03-13T11:00:00Z');

    // Courses
    insertCourse.run('course-1', 'Advanced React Patterns', 'Master hooks, patterns, and performance', 'mentor-1', '', 'Web Development', 'advanced');
    insertCourse.run('course-2', 'UI/UX Design Systems', 'Build scalable design systems from scratch', 'mentor-2', '', 'Design', 'intermediate');
    insertCourse.run('course-3', 'Data Structures with AI', 'Learn DSA with AI-powered explanations', 'mentor-1', '', 'Computer Science', 'beginner');
    insertCourse.run('course-4', 'Python for Data Science', 'Intro to pandas, numpy, and matplotlib', 'mentor-2', '', 'Data Science', 'beginner');

    // Enrollments
    insertEnrollment.run('course-1', 'student-1', 75);
    insertEnrollment.run('course-2', 'student-1', 45);
    insertEnrollment.run('course-3', 'student-1', 90);
    insertEnrollment.run('course-1', 'student-2', 30);
    insertEnrollment.run('course-4', 'student-3', 60);

    // Edge Hubs
    insertEdgeHub.run('hub-1', 'Village Learning Center - Rajasthan', 'Rajasthan, India', '192.168.1.100', 'online', 12, 156.5);
    insertEdgeHub.run('hub-2', 'Community School Hub - Bihar', 'Bihar, India', '192.168.2.100', 'online', 8, 98.2);
    insertEdgeHub.run('hub-3', 'Rural Tech Center - Tamil Nadu', 'Tamil Nadu, India', '192.168.3.100', 'relay', 5, 45.7);

    // Mentor profiles
    const insertMentorProfile = db.prepare(`
      INSERT INTO mentor_profiles (user_id, bio, expertise, experience_years, rating, total_sessions, total_students, availability, teaching_style, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertMentorProfile.run('mentor-1', 'Passionate about making tech accessible to rural students. Specializes in web development and AI.', '["React","JavaScript","AI/ML","Web Development","Node.js","TypeScript"]', 12, 4.9, 156, 89, '["Mon","Wed","Fri"]', 'Interactive with hands-on projects', 'Chennai, India');
    insertMentorProfile.run('mentor-2', 'Experienced educator focused on data science and cloud computing. Believes in learning by doing.', '["Python","Data Science","Cloud Computing","AWS","Machine Learning","SQL"]', 10, 4.8, 120, 67, '["Tue","Thu","Sat"]', 'Structured with real-world examples', 'Mumbai, India');
  })();
}

export function closeDb() {
  if (db) db.close();
}
