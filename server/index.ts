import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

import { getDb, closeDb } from './db.js';
import { SignalingServer } from './signaling.js';
import sessionsRouter from './routes/sessions.js';
import usersRouter from './routes/users.js';
import coursesRouter from './routes/courses.js';
import edgeHubsRouter from './routes/edgeHubs.js';
import aiRouter from './routes/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Initialize DB ────────────────────────────────────────────────────────────
getDb();
console.log('[DB] SQLite database initialized with demo data');

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/sessions', sessionsRouter);
app.use('/api/users', usersRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/edge-hubs', edgeHubsRouter);
app.use('/api/ai', aiRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: 'connected',
  });
});

// ─── Serve static frontend in production ──────────────────────────────────────
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ─── Create HTTP server & attach WebSocket ────────────────────────────────────
const httpServer = createServer(app);
const signaling = new SignalingServer(httpServer);

// ─── Start ────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ✅ EduBridge Backend Server`);
  console.log(`  ➜  API:        http://localhost:${PORT}/api`);
  console.log(`  ➜  WebSocket:  ws://localhost:${PORT}/ws`);
  console.log(`  ➜  Health:     http://localhost:${PORT}/api/health`);
  console.log(`  ➜  Frontend:   http://localhost:${PORT}\n`);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...');
  closeDb();
  httpServer.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDb();
  httpServer.close();
  process.exit(0);
});
