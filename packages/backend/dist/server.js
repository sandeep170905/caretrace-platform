"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./db/database");
const seed_1 = require("./db/seed");
const notificationService_1 = require("./services/notificationService");
const authRoutes_1 = require("./routes/authRoutes");
const institutionRoutes_1 = require("./routes/institutionRoutes");
const requirementRoutes_1 = require("./routes/requirementRoutes");
const donationRoutes_1 = require("./routes/donationRoutes");
const pickupRoutes_1 = require("./routes/pickupRoutes");
const deliveryRoutes_1 = require("./routes/deliveryRoutes");
const transitRoutes_1 = require("./routes/transitRoutes");
const ledgerRoutes_1 = require("./routes/ledgerRoutes");
const adminRoutes_1 = require("./routes/adminRoutes");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const allowedOriginsEnv = process.env.CORS_ORIGIN;
const allowedOrigins = allowedOriginsEnv
    ? allowedOriginsEnv.split(',').map(o => o.trim())
    : ['*'];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // 1. Allow non-browser requests with no origin (mobile app, curl, server-to-server)
        if (!origin) {
            return callback(null, true);
        }
        // 2. Allow wildcard if configured
        if (allowedOrigins.includes('*')) {
            return callback(null, true);
        }
        // 3. Allow any localhost development origin
        if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        // 4. Allow any Render static site or web service (*.onrender.com)
        if (/^https:\/\/.*\.onrender\.com$/.test(origin)) {
            return callback(null, true);
        }
        // 5. Allow any explicitly listed origins in CORS_ORIGIN env var
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS policy: origin ${origin} is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Accept']
}));
app.options('*', (0, cors_1.default)());
app.use(express_1.default.json());
// Initialize database with seed data if fresh
if (database_1.db.getUsers().length === 0) {
    (0, seed_1.runSeed)();
}
// Root health check (prevents 404 on direct browser hits)
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'CareTrace API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            events: '/api/events',
            ledgerVerify: '/api/ledger/verify',
            personas: '/api/auth/personas',
            requirements: '/api/requirements',
            donations: '/api/donations',
            institutions: '/api/institutions'
        },
        ledgerBlocksCount: database_1.db.getLedgerBlocks().length,
        timestamp: new Date().toISOString()
    });
});
// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'CareTrace Core REST API',
        ledgerBlocksCount: database_1.db.getLedgerBlocks().length
    });
});
// SSE Real-Time Updates stream
app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    notificationService_1.NotificationService.addClient(clientId, res);
    req.on('close', () => {
        notificationService_1.NotificationService.removeClient(clientId);
    });
});
// Public active announcements endpoint (no auth required)
app.get('/api/announcements', (req, res) => {
    const active = database_1.db.getActiveAnnouncements();
    res.json({ success: true, count: active.length, announcements: active });
});
// Re-seed endpoint for easy live demo resets
app.post('/api/seed/reset', (req, res) => {
    (0, seed_1.runSeed)();
    notificationService_1.NotificationService.broadcast('DATABASE_RESEEDED', { timestamp: new Date().toISOString() });
    res.json({ success: true, message: 'CareTrace database re-seeded to pristine demo state.' });
});
// Mount Routes
app.use('/api/auth', authRoutes_1.authRouter);
app.use('/api/institutions', institutionRoutes_1.institutionRouter);
app.use('/api/requirements', requirementRoutes_1.requirementRouter);
app.use('/api/donations', donationRoutes_1.donationRouter);
app.use('/api/pickup', pickupRoutes_1.pickupRouter);
app.use('/api/delivery', deliveryRoutes_1.deliveryRouter);
app.use('/api/transit', transitRoutes_1.transitRouter);
app.use('/api/ledger', ledgerRoutes_1.ledgerRouter);
app.use('/api/admin', adminRoutes_1.adminRouter);
app.listen(PORT, () => {
    console.log(`🚀 CareTrace API Server running at http://localhost:${PORT}`);
    console.log(`   - REST API: http://localhost:${PORT}/api`);
    console.log(`   - SSE Stream: http://localhost:${PORT}/api/events`);
});
exports.default = app;
