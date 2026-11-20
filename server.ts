import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';

if (fs.existsSync('.env')) {
    process.loadEnvFile('.env');
}

import authRoutes from './server/routes/auth.js';
import dashboardRoutes from './server/routes/dashboard.js';
import gamificationRoutes from './server/routes/gamification.js';
import goalsRoutes from './server/routes/goals.js';
import trackerRoutes from './server/routes/tracker.js';
import splitRoutes from './server/routes/split.js';
import { store, todayIso, processGoalAutopay } from './server/store.js';

// ── Port discovery ────────────────────────────────────────────────────────────
// If PORT is explicitly set in the environment, honour it exactly and fail
// loudly if it is already in use — a silent port shift would break OAuth
// JavaScript Origins and any hardcoded URLs.
//
// If PORT is NOT set (pure local dev, no .env override), scan upward from
// the default (3000) to find the first free port automatically.
function findAvailablePort(preferred: number, strict: boolean): Promise<number> {
    return new Promise((resolve, reject) => {
        const tryPort = (port: number) => {
            const tester = net.createServer();
            tester.once('error', (err: NodeJS.ErrnoException) => {
                if (strict) {
                    reject(
                        new Error(
                            `Port ${preferred} is already in use.\n` +
                            `Because PORT=${preferred} is explicitly configured, the server will not\n` +
                            `move to another port — that would break Google OAuth JavaScript Origins.\n` +
                            `Stop whatever is running on port ${preferred} and try again.`
                        )
                    );
                } else {
                    console.warn(`Port ${port} in use — trying ${port + 1}…`);
                    tryPort(port + 1);
                }
            });
            tester.once('listening', () => tester.close(() => resolve(port)));
            tester.listen(port, '0.0.0.0');
        };
        tryPort(preferred);
    });
}

// ── CORS ──────────────────────────────────────────────────────────────────────
// In production set ALLOWED_ORIGINS in .env as a comma-separated list:
//   ALLOWED_ORIGINS=https://app.astraminds.com,https://astraminds.com
// Leave unset to allow all origins (fine for local dev).
const rawOrigins = process.env.ALLOWED_ORIGINS;
const corsOptions: cors.CorsOptions = rawOrigins
    ? {
          origin: (origin, cb) => {
              if (!origin || rawOrigins.split(',').map(o => o.trim()).includes(origin)) {
                  cb(null, true);
              } else {
                  cb(new Error(`CORS: origin '${origin}' not allowed`));
              }
          },
          credentials: true,
          methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization'],
      }
    : { origin: true, credentials: true };

async function startServer() {
    const app = express();
    const preferredPort = Number(process.env.PORT) || 3000;
    const isProduction = process.env.NODE_ENV === 'production';
    const workerId = process.env.pm_id ?? 'main';

    // ── Middleware ────────────────────────────────────────────────────────────
    app.set('trust proxy', 1);
    app.use(cors(corsOptions));
    app.options('/{*path}', cors(corsOptions));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // ── Health ────────────────────────────────────────────────────────────────
    app.get('/api/health', (_req: Request, res: Response) => {
        res.status(200).json({ status: 'ok', worker: workerId, uptime: process.uptime() });
    });

    // ── API Routes ────────────────────────────────────────────────────────────
    app.use('/api/auth', authRoutes);
    app.use('/api', dashboardRoutes);
    app.use('/api/gamification', gamificationRoutes);
    app.use('/api/goals', goalsRoutes);
    app.use('/api/tracker', trackerRoutes);
    app.use('/api/split', splitRoutes);

    // Guard: Guarantee all unhandled /api requests return JSON error and NEVER fall through to Vite SPA index.html
    app.all('/api/{*path}', (req: Request, res: Response) => {
        res.status(404).json({
            error: `API endpoint ${req.method} ${req.originalUrl} not found. Please restart your dev server if new routes were recently added.`,
        });
    });

    // ── Periodic AutoPay (every 6 h) ──────────────────────────────────────────
    // Only run in one worker to avoid duplicate runs in PM2 cluster mode.
    const shouldRunAutopay = !process.env.pm_id || process.env.pm_id === '0';
    if (shouldRunAutopay) {
        const runDueAutopay = () => {
            const today = todayIso();
            for (const autoSaving of store.goalAutoSavings) {
                if (!autoSaving.next_run_date || autoSaving.next_run_date <= today) {
                    const goal = store.goals.find(g => g.id === autoSaving.goal_id);
                    if (goal && goal.status === 'ACTIVE') {
                        try { processGoalAutopay(autoSaving, today); } catch { /* continue */ }
                    }
                }
            }
        };
        const autopayTimer = setInterval(runDueAutopay, 6 * 60 * 60 * 1000);
        autopayTimer.unref();
    }

    // ── Static / SPA ──────────────────────────────────────────────────────────
    if (isProduction) {
        const distDir = path.resolve(process.cwd(), 'dist');
        app.use(express.static(distDir, { maxAge: '7d', immutable: true }));
        app.use((req: Request, res: Response, next: NextFunction) => {
            if (req.path.startsWith('/api')) { next(); return; }
            res.sendFile(path.join(distDir, 'index.html'));
        });
    } else {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    }

    // ── Global error handler ──────────────────────────────────────────────────
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
        console.error(`[worker ${workerId}] Unhandled error:`, err.message);
        res.status(500).json({ error: 'Internal server error' });
    });

    // ── Listen on first available port ────────────────────────────────────────
    // strict=true when PORT is explicitly set — refuse to move, fail loudly.
    // strict=false when falling back to the default — scan for a free port.
    const portIsExplicit = !!process.env.PORT;
    const port = await findAvailablePort(preferredPort, portIsExplicit);
    if (port !== preferredPort) {
        console.warn(
            `[worker ${workerId}] Port ${preferredPort} in use — using port ${port} instead.`
        );
    }

    // Initialize cloud persistence (e.g. Firebase Firestore) if configured
    await store.initPersistence();

    const server = http.createServer(app);

    await new Promise<void>((resolve) => {
        server.listen(port, '0.0.0.0', () => resolve());
    });

    console.log(
        `[worker ${workerId}] AstraMinds listening on http://0.0.0.0:${port}` +
        ` (${isProduction ? 'production' : 'development'})`
    );

    // ── Graceful shutdown ─────────────────────────────────────────────────────
    const shutdown = (signal: string) => {
        console.log(`[worker ${workerId}] ${signal} received — draining connections…`);
        server.close(() => {
            console.log(`[worker ${workerId}] All connections closed. Exiting.`);
            process.exit(0);
        });
        setTimeout(() => {
            console.error(`[worker ${workerId}] Drain timeout — forcing exit.`);
            process.exit(1);
        }, 10_000).unref();
    };

    process.on('SIGINT',  () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
