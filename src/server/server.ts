import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'node:path';
import http from 'node:http';
import { studentsRouter } from './routes/students.router';
import { stationsRouter } from './routes/stations.router';
import { resultsRouter } from './routes/results.router';
import { systemRouter } from './routes/system.router';
import { NetworkService } from './services/network.service';
import { getDatabaseManager } from './db/database';

const DEFAULT_PORT = 3000;

/**
 * Builds and configures the Express application with all routes and static handlers.
 */
export function createExpressApp(): Express {
  const app = express();

  // Initialize SQLite database
  getDatabaseManager();

  // Enable CORS for mobile web devices connecting across the local network
  app.use(cors());

  // Support JSON bodies including Base64 Excel payloads
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // API Routes
  app.use('/api/students', studentsRouter);
  app.use('/api/stations', stationsRouter);
  app.use('/api/results', resultsRouter);
  app.use('/api/system', systemRouter);

  // Serve helper client static files
  const helperDistCandidatePaths = [
    path.resolve(__dirname, '../helper-ui'),
    path.resolve(__dirname, '../../dist/helper-ui'),
    path.resolve(process.cwd(), 'dist/helper-ui')
  ];

  let helperDistPath = helperDistCandidatePaths[0];
  for (const candidate of helperDistCandidatePaths) {
    if (path.resolve(candidate, 'index.html')) {
      helperDistPath = candidate;
      break;
    }
  }

  app.use('/helper', express.static(helperDistPath));

  // Fallback for helper client routes (compatible with Express 5)
  app.use('/helper', (_req: Request, res: Response) => {
    const indexPath = path.join(helperDistPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        // In dev or before build, serve development message or fallback
        res.status(200).send(`
          <!DOCTYPE html>
          <html lang="de">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>GymScore Local — Helfer Station</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 24px; text-align: center; background: #0f172a; color: #f8fafc; }
              .card { max-width: 480px; margin: 40px auto; background: #1e293b; padding: 32px; border-radius: 12px; border: 1px solid #334155; }
              h1 { font-size: 24px; color: #38bdf8; }
              p { color: #94a3b8; font-size: 16px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>GymScore Local — Helfer Client</h1>
              <p>Der mobile Helfer-Client wird geladen oder der Entwicklungs-Server läuft auf Port 5174.</p>
              <p>API-Endpunkte sind aktiv und betriebsbereit.</p>
            </div>
          </body>
          </html>
        `);
      }
    });
  });

  // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Express Error:', err);
    res.status(500).json({
      success: false,
      message: 'Interner Serverfehler',
      error: err.message
    });
  });

  return app;
}

/**
 * Starts the HTTP server on the configured port and prints connection banner.
 */
export async function startServer(port: number = DEFAULT_PORT): Promise<http.Server> {
  const app = createExpressApp();

  return new Promise((resolve) => {
    const server = app.listen(port, '0.0.0.0', async () => {
      const networkInfo = await NetworkService.getNetworkInfo(port);

      console.log('\n======================================================');
      console.log(' 🏃 GymScore Local — Server erfolgreich gestartet');
      console.log('======================================================');
      console.log(` 📍 Lokale IP-Adresse: ${networkInfo.ipAddress}`);
      console.log(` 🌐 Helfer-Web-URL:    ${networkInfo.url}/helper`);
      console.log('------------------------------------------------------');
      console.log(' QR-Code für Helfer-Smartphones:');
      await NetworkService.printTerminalQr(`${networkInfo.url}/helper`);
      console.log('======================================================\n');

      resolve(server);
    });
  });
}

// Allow direct execution via ts-node or node
if (require.main === module) {
  const port = Number(process.env.PORT || DEFAULT_PORT);
  startServer(port).catch((err) => {
    console.error('Failed to start standalone server:', err);
  });
}
