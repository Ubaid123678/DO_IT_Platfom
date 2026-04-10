import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { AppError } from './common/errors/AppError.js';
import { connectDatabase } from './config/database.js';
import apiRouter from './routes/index.js';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 8080;

// Security Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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

// API routes
app.use('/api/v1', apiRouter);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Error Handler Middleware
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});

const bootstrap = async (): Promise<void> => {
  try {
    await connectDatabase();
  } catch (error) {
    console.error('[database] Connection failed. Server will start, but DB features may fail.', error);
  }

  app.listen(PORT, () => {
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
};

if (process.env.NODE_ENV !== 'test') {
  void bootstrap();
}

export default app;
