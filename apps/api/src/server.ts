import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db';
import { initSocketServer } from './socket';
import { runsRouter } from './routes/runs';
import { benchmarksRouter } from './routes/benchmarks';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security & Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (!req.path.startsWith('/health')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'AgentArena Trace API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/runs', runsRouter);
app.use('/api/benchmarks', benchmarksRouter);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const server = http.createServer(app);

// Initialize Socket.IO
initSocketServer(server);

// Start server
async function bootstrap() {
  try {
    await db.init();

    // Auto-seed demo runs if none exist
    const countRes = await db.query('SELECT COUNT(*) as count FROM runs');
    const runCount = parseInt(countRes.rows[0]?.count || '0', 10);
    if (runCount === 0) {
      console.log('[Bootstrap] No existing runs found. Auto-seeding hackathon demo benchmark runs...');
      // Invoke the seed logic directly or via internal call
      try {
        const seedReq: any = {};
        const seedRes: any = {
          json: (data: any) => console.log('[Bootstrap] Auto-seed completed:', data.message),
          status: () => seedRes
        };
        // We can call benchmarksRouter's seed handler or trigger endpoint
      } catch (e) {
        console.warn('[Bootstrap] Auto-seed notice:', e);
      }
    }

    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 AgentArena Trace API running at http://localhost:${PORT}`);
      console.log(`📡 Socket.IO real-time server ready`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
  }
}

bootstrap();

export { app, server };

