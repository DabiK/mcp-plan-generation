import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { injectable } from 'tsyringe';
import { config } from '../config/env';
import { planRouter } from './routes/planRoutes';

@injectable()
export class HttpServer {
  private app: express.Application;
  private server?: ReturnType<typeof this.app.listen>;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // CORS
    this.app.use(
      cors({
        origin: config.http.corsOrigin,
        credentials: true,
      })
    );

    // JSON body parser
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.error(`${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'mcp-planflow',
      });
    });

    // API routes
    this.app.use('/api/plans', planRouter);

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Error:', err);

      res.status(500).json({
        error: 'Internal Server Error',
        message: config.app.nodeEnv === 'development' ? err.message : 'An error occurred',
        ...(config.app.nodeEnv === 'development' && { stack: err.stack }),
      });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(config.http.port, config.http.host, () => {
        console.error(
          `🚀 HTTP API server listening on http://${config.http.host}:${config.http.port}`
        );
        console.error(`📋 API Documentation: http://localhost:${config.http.port}/api/plans`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.error('HTTP server stopped');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}
