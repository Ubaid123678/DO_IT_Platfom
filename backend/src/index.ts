import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { AppError } from './common/errors/AppError.js';
import { createErrorResponse } from './common/errors/errorResponse.js';
import config from './config/env.js';
import { connectDatabase } from './config/database.js';
import { authenticate } from './middleware/auth.middleware.js';
import { requireAdmin } from './middleware/authorization.middleware.js';
import apiRouter from './routes/index.js';
import { initializeVerificationWorker } from './modules/verification/verification.worker.js';
import { ensureAdminUser } from './modules/auth/auth.service.js';
import { socketService } from './modules/messaging/socket.service.js';

const app: Express = express();
const PORT = process.env.PORT || 8080;

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [config.web_origin];
    if (process.env.NODE_ENV !== 'production') {
      allowedOrigins.push('http://localhost:3001');
    }
    callback(null, !origin || allowedOrigins.includes(origin));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  skip: (req) => req.path === '/health' || req.path === '/api/v1/health',
});
app.use(limiter);

// Body Parser Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Do It Platform Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Version Check
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'API v1 is operational',
      timestamp: new Date().toISOString(),
    },
    meta: {
      version: 'v1',
    },
  });
});

// KYC images are only readable by administrators.
const uploadsRoot = path.resolve(process.cwd(), 'uploads');
const kycUploadsRoot = path.resolve(uploadsRoot, 'kyc');
const isWithinDirectory = (root: string, candidate: string): boolean => {
  const relativePath = path.relative(root, candidate);
  return relativePath === '' ||
    (relativePath !== '..' && !relativePath.startsWith(`..${path.sep}`) && !path.isAbsolute(relativePath));
};

app.use('/uploads', (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

app.use(
  '/uploads/kyc',
  authenticate,
  requireAdmin,
  express.static(kycUploadsRoot),
  (_req: Request, res: Response) => {
    res.status(404).json(createErrorResponse('NOT_FOUND', 'Upload not found'));
  },
);

// Keep non-KYC upload folders public while preventing alternate paths from exposing KYC files.
app.use('/uploads', (req: Request, _res: Response, next: NextFunction) => {
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(req.path);
  } catch {
    next(new AppError('Malformed upload path', 400, 'INVALID_PATH'));
    return;
  }

  const targetPath = path.resolve(uploadsRoot, `.${decodedPath}`);
  if (!isWithinDirectory(uploadsRoot, targetPath) || isWithinDirectory(kycUploadsRoot, targetPath)) {
    next(new AppError('Upload not found', 404, 'NOT_FOUND'));
    return;
  }

  next();
}, express.static(uploadsRoot));

// API routes
app.use('/api/v1', apiRouter);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json(createErrorResponse('NOT_FOUND', `Route ${req.method} ${req.path} not found`));
});

// Error Handler Middleware
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(createErrorResponse(err.code, err.message, err.details));
    return;
  }

  if (err && typeof err === 'object' && 'type' in err && (err as { type: string }).type === 'request.aborted') {
    res.status(499).json(
      createErrorResponse('REQUEST_ABORTED', 'The connection was lost while receiving the request body. Please try again.'),
    );
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred'));
});

const bootstrap = async (): Promise<void> => {
  try {
    await connectDatabase();
    await ensureAdminUser();
    console.log('[auth] Admin credentials are ready.');
  } catch (error) {
    console.error('[database] Connection failed. Backend will not start until MongoDB is reachable.', error);
    process.exit(1);
  }

  try {
    await initializeVerificationWorker();
  } catch (error) {
    console.warn('[verification-worker] Worker initialization skipped:', error);
  }

  const server = app.listen(PORT, () => {
    // Attach Socket.io to the same HTTP server (auth handshake + rooms wired
    // in socket.service). Realtime chat/notifications are live from here.
    try {
      socketService.initialize(server);
    } catch (error) {
      console.warn('[socket] Socket.io initialization failed (REST still works):', error);
    }
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         Do It Platform - Backend Server Started           ║
║                                                            ║
║  Environment: ${process.env.NODE_ENV?.padEnd(45)}║
║  Server: http://localhost:${PORT.toString().padEnd(41)}║
║  Health: http://localhost:${PORT}/health${' '.padEnd(31)}║
║  API v1: http://localhost:${PORT}/api/v1/health${' '.padEnd(22)}║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
  });

  server.requestTimeout = 600_000;
  server.headersTimeout = 610_000;
  server.timeout = 600_000;

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[server] Port ${PORT} is already in use. Stop the existing process or change PORT in backend/.env.`);
      process.exit(1);
    }

    console.error('[server] Failed to start HTTP server.', error);
    process.exit(1);
  });
};

if (process.env.NODE_ENV !== 'test') {
  void bootstrap();
}

export default app;
