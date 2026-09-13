import express, { Request, Response } from 'express';
import cors from 'cors';
import { db } from './db/database';
import { runSeed } from './db/seed';
import { NotificationService } from './services/notificationService';
import { authRouter } from './routes/authRoutes';
import { institutionRouter } from './routes/institutionRoutes';
import { requirementRouter } from './routes/requirementRoutes';
import { donationRouter } from './routes/donationRoutes';
import { pickupRouter } from './routes/pickupRoutes';
import { deliveryRouter } from './routes/deliveryRoutes';
import { transitRouter } from './routes/transitRoutes';
import { ledgerRouter } from './routes/ledgerRoutes';
import { adminRouter } from './routes/adminRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOriginsEnv = process.env.CORS_ORIGIN;
const allowedOrigins = allowedOriginsEnv
  ? allowedOriginsEnv.split(',').map(o => o.trim())
  : '*';

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins === '*' || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy: origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());
app.use(express.json());

// Initialize database with seed data if fresh
if (db.getUsers().length === 0) {
  runSeed();
}

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CareTrace Core REST API',
    ledgerBlocksCount: db.getLedgerBlocks().length
  });
});

// SSE Real-Time Updates stream
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  NotificationService.addClient(clientId, res);

  req.on('close', () => {
    NotificationService.removeClient(clientId);
  });
});

// Re-seed endpoint for easy live demo resets
app.post('/api/seed/reset', (req: Request, res: Response) => {
  runSeed();
  NotificationService.broadcast('DATABASE_RESEEDED', { timestamp: new Date().toISOString() });
  res.json({ success: true, message: 'CareTrace database re-seeded to pristine demo state.' });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/institutions', institutionRouter);
app.use('/api/requirements', requirementRouter);
app.use('/api/donations', donationRouter);
app.use('/api/pickup', pickupRouter);
app.use('/api/delivery', deliveryRouter);
app.use('/api/transit', transitRouter);
app.use('/api/ledger', ledgerRouter);
app.use('/api/admin', adminRouter);

app.listen(PORT, () => {
  console.log(`🚀 CareTrace API Server running at http://localhost:${PORT}`);
  console.log(`   - REST API: http://localhost:${PORT}/api`);
  console.log(`   - SSE Stream: http://localhost:${PORT}/api/events`);
});

export default app;

