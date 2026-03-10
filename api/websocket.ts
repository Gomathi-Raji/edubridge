import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel doesn't support persistent WebSocket connections
  // For production, consider using WebSocket services like:
  // - Socket.io with Vercel
  // - Pusher
  // - SocketCluster
  // - AWS API Gateway WebSockets
  // - Or deploy backend separately

  res.status(200).json({
    message: 'WebSocket not supported in Vercel serverless functions',
    alternatives: [
      'Use Socket.io with Vercel',
      'Deploy backend separately on Railway/Heroku',
      'Use Pusher or similar service',
      'Use polling for demo purposes'
    ],
    note: 'For hackathon demo, consider using local development or separate backend deployment'
  });
}